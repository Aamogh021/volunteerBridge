# VolunteerBridge Full QA & Bug Audit

## Summary of Findings

| ID | Severity | Role Affected | Component | Issue Description | Root Cause |
|---|---|---|---|---|---|
| **001** | P0 (Critical) | ALL | Backend API (FastAPI) | Clicks/actions feel delayed, API requests take too long or timeout. | `async def` endpoints in `main.py` contain **blocking synchronous I/O** calls to Supabase (`client.table().execute()`) and Gemini API. This blocks the main asyncio event loop, crippling concurrency. |
| **002** | P1 (High) | ALL | Frontend Hooks (`useFirestore`) | UI freezes or realtime updates feel slow/delayed when data changes rapidly. | `postgres_changes` realtime listeners trigger full REST API refetches (`fetchNeeds()`, `fetchVolunteers()`) on *every* single database event, causing massive network spam instead of differential state updates. |
| **003** | P2 (Medium) | ADMIN | Frontend Hooks (`useAssignments`) | Dashboard loads increasingly slowly; potential cross-org data leakage if RLS is loose. | `useAssignments` calls `supabase.from("assignments").select("*")` without applying an `.eq("organization_id", orgId)` filter, pulling the entire table into memory. |
| **004** | P2 (Medium) | ALL | Frontend Realtime | Realtime updates stop appearing completely after prolonged usage or sleep. | Realtime channels are subscribed once in `useEffect` but lack connection state recovery. If the websocket drops and reconnects, missed events are not backfilled because a manual re-fetch isn't triggered on `SUBSCRIBED`. |

---

## Detailed Issue Traces

### Issue 001: Blocking I/O in Async Endpoints (FastAPI)
- **Trace**: Inspected `backend/main.py`. The endpoints (e.g., `@app.get("/needs/{org_id}")`, `@app.post("/match/explain")`) are defined using `async def`. However, the underlying database calls (`get_needs_by_org()`, `client.table(...).execute()`) and AI calls (`genai.GenerativeModel("...").generate_content()`) are entirely synchronous.
- **Impact**: In FastAPI, executing blocking code inside an `async def` function blocks the single worker thread. While one request waits for Supabase or Gemini (which can take 2-5 seconds), *all other incoming requests* to the backend are paused. This perfectly explains why users report "features feeling slow", "clicks feeling delayed", and "pages taking too long to load".
- **Fix Recommendation**: Either change the endpoints from `async def` to `def` (so FastAPI delegates them to a threadpool), or refactor `services/supabase.py` and Gemini calls to use `asyncio` compatible clients.

### Issue 002: Realtime API Spam (Frontend)
- **Trace**: Inspected `frontend/hooks/useFirestore.ts`. The `useNeeds`, `useVolunteers`, and `useAssignments` hooks register a `postgres_changes` listener. Inside the listener callback, they invoke `fetchNeeds()` (or equivalent).
- **Impact**: If 10 assignments are created in rapid succession, the frontend fires 10 simultaneous REST API requests to `/needs/{orgId}` and `/assignments`. This not only hammers the backend (which is already suffering from Issue 001) but causes React to re-render the entire list multiple times unnecessarily.
- **Fix Recommendation**: Implement differential updates. When an `INSERT` event arrives, append the payload to the local React state directly. When an `UPDATE` event arrives, map over the local state and replace the modified row. Only do a full refetch if the connection is lost and restored.

### Issue 003: Over-fetching Assignments (Frontend)
- **Trace**: In `frontend/hooks/useFirestore.ts`, `fetchAssignments` calls:
  `const { data, error } = await supabase.from("assignments").select("*");`
- **Impact**: This fetches every assignment in the database across all organizations. As the system scales, this will download megabytes of unneeded data.
- **Fix Recommendation**: Add `.eq("organization_id", orgId)` to the query. Note that `assignments` table currently lacks an `organization_id` column in the frontend types, though it is populated by the backend. The frontend should query it correctly, or fetch it via a backend endpoint.

### Issue 004: Stale Data on Websocket Drop (Frontend)
- **Trace**: The `useFirestore.ts` and `useNotifications.ts` hooks initialize Supabase channels. 
- **Impact**: If a user's laptop goes to sleep and wakes up, the WebSocket connection may drop. Supabase reconnects, but any database changes that occurred during the downtime are missed, resulting in "stale data".
- **Fix Recommendation**: Add a `.on("system", { event: "SUBSCRIBED" }, () => fetchNeeds())` callback to ensure a fresh data sync happens every time the channel successfully (re)connects.

---

## Human-Centric UX & Role-Based Issues (User Perspective Audit)

| ID | Severity | Role Affected | Component | Human-Troubling Issue | Root Cause & Impact |
|---|---|---|---|---|---|
| **005** | P1 (High) | ADMIN | Crisis Map (`/dashboard/map`) | Crisis Map displays a stark error message if Google Maps API key is missing/unconfigured. | `CrisisMap.tsx` renders a blank state with `Google Maps API key not configured.` without an interactive OpenStreetMap/Leaflet fallback or grid view, blocking admins from visualizing location data. |
| **006** | P2 (Medium) | USER | Need Reporting (`/user/report`) | Non-technical users cannot easily input GPS coordinates when reporting emergency needs. | The report form requires numeric latitude/longitude fields or defaults to `(0,0)`, making it confusing for community members to specify exact locations without an interactive map picker. |
| **007** | P2 (Medium) | USER / VOLUNTEER | Action Feedback (Forms/Buttons) | Submitting reports or updating assignment status lacks immediate feedback toasts/modals. | Buttons enter loading state but do not trigger a clear success banner/toast upon completion, leaving users uncertain if their action succeeded. |
| **008** | P2 (Medium) | ADMIN | AI Match Intelligence Modal | "Explain Match" modal shows a plain, blank screen during backend AI evaluation. | `MatchExplanationModal` lacks loading skeleton animations while waiting 3-5 seconds for Gemini API, making the UI feel frozen/unresponsive. |
| **009** | P3 (Low) | ALL | Shell / Navigation | Lack of current active role indicator or quick-profile preview on header. | Users navigating between roles or testing the system cannot easily tell which profile/role context they are currently acting as. |

---
**Status:** QA & Human UX Audit Complete. Awaiting user review before proceeding with fixes.


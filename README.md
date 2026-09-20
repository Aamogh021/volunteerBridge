# 🌉 VolunteerBridge

**AI-Powered Volunteer Coordination Platform for NGOs**

VolunteerBridge uses Google Gemini AI and Supabase PostgreSQL to intelligently match volunteers to community needs during crisis situations. It automates survey intake, performs smart skill-based matching, provides real-time crisis intelligence, and syncs updates via Supabase Realtime — enabling NGOs to deploy the right volunteer to the right place at the right time.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VolunteerBridge                          │
├───────────────┬──────────────────────┬──────────────────────────┤
│   Frontend    │      Backend         │     Mobile App           │
│   (Next.js)   │     (FastAPI)        │     (Flutter)            │
│               │                      │                          │
│  Dashboard    │  /ingest             │  Task Feed               │
│  Crisis Map   │  /match              │  Task Details            │
│  AI Reports   │  /assign             │  My Assignments          │
│  Survey Upload│  /crisis-report      │  Profile Setup           │
├───────────────┴──────────────────────┴──────────────────────────┤
│                     Shared Services                              │
│ Supabase Auth │ Supabase Postgres │ Supabase Realtime │ Gemini   │
│             Google Maps │ FCM (Notifications)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer       | Technology                          | Purpose                          |
|-------------|-------------------------------------|----------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS| NGO Admin Dashboard              |
| Backend     | Python 3.11, FastAPI, Pydantic v2   | API, AI Processing               |
| Mobile      | Flutter 3.22, Dart, Riverpod        | Volunteer Mobile App             |
| AI/ML       | Google Gemini                       | Survey extraction, matching, reports |
| Database    | Supabase PostgreSQL                 | Relational data store            |
| Realtime    | Supabase Realtime                   | Live updates for Needs & Volunteers |
| Auth        | Supabase Auth                       | Google OAuth & Session Management|
| Messaging   | Firebase Cloud Messaging (FCM)      | Push notifications               |
| Maps        | Google Maps Platform                | Crisis mapping, geolocation      |
| Hosting     | Google Cloud Run                    | Container deployment             |
| CI/CD       | GitHub Actions                      | Automated deployment             |

---

## 👥 Team Structure

| Member           | Role              | Branch             | Ownership                  |
|------------------|-------------------|---------------------|----------------------------|
| Member 1         | Frontend Lead     | `frontend/main`     | `frontend/`                |
| Member 2         | Backend Lead      | `backend/main`      | `backend/`                 |
| Member 3         | Mobile Lead       | `flutter/main`      | `flutter-app/`             |
| Member 4         | Integration Lead  | `integration/main`  | `.github/`, `README.md`    |

---

## 🚀 Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Flutter 3.22+
- A Supabase Project (PostgreSQL database & Auth enabled)
- A Google Cloud project with Gemini API enabled

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/volunteerbridge.git
cd volunteerbridge
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy environment file and fill in your values
cp .env.example .env

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local with your Supabase and API config:
cp .env.example .env.local

npm run dev
```

### 4. Flutter App Setup

```bash
cd flutter-app
flutter pub get

# Configure Firebase/Supabase credentials
flutter run
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable                        | Description                        |
|---------------------------------|------------------------------------|
| `GEMINI_API_KEY`                | Google Gemini API key              |
| `SUPABASE_URL`                  | Supabase project URL               |
| `SUPABASE_SERVICE_ROLE_KEY`      | Supabase service role secret key   |
| `GOOGLE_MAPS_API_KEY`          | Google Maps Platform API key       |
| `ENVIRONMENT`                   | `development` or `production`      |
| `FIREBASE_PROJECT_ID`          | (Optional) FCM Push Notifications   |
| `GOOGLE_APPLICATION_CREDENTIALS`| (Optional) Service account key path |

### Frontend (`frontend/.env.local`)

| Variable                              | Description                    |
|---------------------------------------|--------------------------------|
| `NEXT_PUBLIC_API_URL`                 | Backend API base URL           |
| `NEXT_PUBLIC_SUPABASE_URL`            | Supabase project URL           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Supabase anon public API key   |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`     | Google Maps JS API key         |

---

## 🌿 Branch Strategy

```
main                    ← production deployments
├── frontend/main       ← frontend stable
│   └── frontend/feat/* ← frontend feature branches
├── backend/main        ← backend stable
│   └── backend/feat/*  ← backend feature branches
├── flutter/main        ← mobile stable
│   └── flutter/feat/*  ← mobile feature branches
└── integration/main    ← CI/CD and shared config
```

**Rules:**
1. Never push directly to `main` — all changes via Pull Requests
2. Each member works in their service-specific branch
3. PRs require at least 1 approval before merge
4. Integration Lead merges service branches into `main`

---

## 📄 License

This project is built for the Google Solution Challenge 2026.

---

## 🔗 Live Demo

> **[Live Demo URL — Coming Soon](#)**

---

*Built with ❤️ using Google AI & Supabase*

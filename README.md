# 🌉 VolunteerBridge

**AI-Powered Volunteer Coordination Platform for NGOs & Crisis Management**

VolunteerBridge uses Google Gemini AI and Supabase PostgreSQL to intelligently match volunteers to community needs during crisis situations. It automates survey intake, performs smart skill-based matching, provides real-time crisis intelligence, and syncs updates via Supabase Realtime — enabling NGOs to deploy the right volunteer to the right place at the right time.

---

## ✨ Key Features

- **🛡️ Role-Based Views & Onboarding**: Custom dashboards for **NGO Admins**, **Volunteers**, and **Community Members** backed by Supabase Auth with Google OAuth integration.
- **📄 AI-Powered Intake Processing**: Instantly extracts structured crisis needs and urgency scores from raw survey uploads and unstructured reports using Google Gemini.
- **🗺️ Interactive Crisis Map**: Dynamic Leaflet map displaying real-time crisis markers, color-coded urgency levels, and location-based volunteer distance calculations.
- **🎯 Smart AI Matchmaker**: Automated scoring algorithm pairing volunteers to crisis assignments based on skills, location proximity, transport mode, and availability.
- **🔔 Real-Time Notification System**: Instant alerts and live updates via Supabase Realtime for urgent assignment dispatches and status changes.
- **📊 AI Predictive Intelligence & Reports**: Automated generation of emergency response summaries, resource shortage predictions, and situational briefings.
- **🤝 Buddy System & Micro-Teams**: Volunteer safety pairing and AI-assisted squad formation for complex or high-risk field operations.
- **📱 Cross-Platform Mobile App**: Dedicated Flutter mobile application allowing field volunteers to track assignments, update status, and manage skills on the go.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VolunteerBridge                          │
├───────────────┬──────────────────────┬──────────────────────────┤
│   Frontend    │      Backend         │     Mobile App           │
│   (Next.js)   │     (FastAPI)        │     (Flutter)            │
│               │                      │                          │
│  Admin Dash   │  /ingest             │  Task Feed               │
│  Crisis Map   │  /match              │  Task Details            │
│  AI Reports   │  /assign             │  My Assignments          │
│  Survey Intake│  /crisis-report      │  Profile Setup           │
├───────────────┴──────────────────────┴──────────────────────────┤
│                     Shared Services                              │
│ Supabase Auth │ Supabase Postgres │ Supabase Realtime │ Gemini   │
│             Google Maps / Leaflet │ FCM (Notifications)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer       | Technology                          | Purpose                               |
|-------------|-------------------------------------|---------------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS| Admin & User Dashboards               |
| Backend     | Python 3.11, FastAPI, Pydantic v2   | API, AI Matching & Intake Engine      |
| Mobile      | Flutter 3.22, Dart, Riverpod        | Volunteer Mobile App                  |
| AI/ML       | Google Gemini                       | Survey extraction, matching, analytics|
| Database    | Supabase PostgreSQL                 | Relational data & vector storage      |
| Realtime    | Supabase Realtime                   | Live updates for Needs & Assignments  |
| Auth        | Supabase Auth                       | Google OAuth & Session Management     |
| Messaging   | Firebase Cloud Messaging (FCM)      | Mobile push notifications             |
| Maps        | Leaflet & Google Maps API           | Geolocation & crisis mapping          |

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
git clone https://github.com/Aamogh021/volunteerBridge.git
cd volunteerBridge
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt

# Copy environment file and fill in your values
cp .env.example .env

# Start the FastAPI server
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

# Configure credentials and launch mobile app
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

Deployed Link will come soon!

---

*Built with ❤️ using Next.js, FastAPI, Flutter, Google Gemini AI & Supabase*

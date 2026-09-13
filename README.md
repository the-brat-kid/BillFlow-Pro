# 🧾 BillFlow Pro

**A production-ready, multi-vendor business management & invoicing platform.**

BillFlow Pro enables vendors to register their business, manage customers and products, generate GST-compliant invoices, track payments via Razorpay/UPI, monitor expenses, and get AI-powered business insights — all with strict data isolation per business.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Authentication** | Email/password with JWT (access + refresh tokens) |
| **Multi-Vendor** | Each user has a business profile; all data isolated by `business_profile_id` |
| **Dashboard** | Real-time stats, recent transactions, AI insight banner |
| **Customer Management** | Full CRUD with search, filter, CSV export |
| **Product Management** | CRUD with GST rates, HSN codes, low-stock alerts |
| **Invoice Generator** | Line items, auto GST calculation, discounts, unique numbering |
| **PDF Invoices** | Professional PDF generation with business branding |
| **Payments & QR** | Razorpay integration, dynamic UPI QR codes |
| **Expense Tracking** | Categories, receipt uploads, date filtering |
| **Reports** | Sales summaries, GST reports, aging receivables, CSV export |
| **AI Predictions** | Demand forecasting, restock recommendations (Gemini/Claude) |
| **Notifications** | Real-time via WebSocket, payment confirmations, overdue alerts |
| **Dark Mode** | System-preference respecting, toggleable light/dark theme |

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Frontend
        A[Next.js 14 - Port 3000]
    end
    subgraph Backend
        B[FastAPI - Port 8000]
        C[Node.js - Port 3001]
    end
    subgraph Databases
        D[(PostgreSQL - 5432)]
        E[(MongoDB - 27017)]
        F[(Redis - 6379)]
    end
    subgraph External
        G[Razorpay]
        H[Gemini API]
        I[Claude API]
    end

    A -->|REST API| B
    A -->|WebSocket| C
    B --> D
    B --> E
    B --> F
    C --> E
    C --> F
    B --> G
    C --> H
    C --> I
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, React Query |
| Backend API | FastAPI (Python 3.11+), SQLAlchemy, Pydantic |
| Microservice | Node.js (TypeScript), Express, WebSocket (ws) |
| Relational DB | PostgreSQL 16 |
| Document DB | MongoDB 7 |
| Cache/PubSub | Redis 7 |
| Auth | JWT (access + refresh tokens), bcrypt |
| Payments | Razorpay SDK |
| AI | Google Gemini, Anthropic Claude (with mock fallbacks) |
| PDF | ReportLab (backend), @react-pdf/renderer (frontend) |
| Deployment | Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone & Configure

```bash
git clone <repo-url> billflow-pro
cd billflow-pro
cp .env.example .env
```

### 2. Start All Services

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **MongoDB** on port 27017
- **Redis** on port 6379
- **FastAPI** on port 8000 (API docs at http://localhost:8000/docs)
- **Node.js** on port 3001 (WebSocket + AI)
- **Next.js** on port 3000 (Frontend)

### 3. Access the App

- **Frontend:** http://localhost:3000
- **API Documentation:** http://localhost:8000/docs
- **Node.js Health:** http://localhost:3001/health

### 4. Create Your Account

1. Go to http://localhost:3000/register
2. Fill in your business details (name, type, UPI ID, etc.)
3. You'll be redirected to your dashboard

---

## 📁 Project Structure

```
billflow-pro/
├── frontend/               # Next.js 14 App
│   ├── app/                # Pages (App Router)
│   │   ├── (auth)/         # Login & Register
│   │   └── (dashboard)/    # All dashboard pages
│   ├── components/         # UI components
│   ├── hooks/              # React Query hooks
│   ├── lib/                # Utilities, API client, auth
│   └── types/              # TypeScript interfaces
│
├── backend-fastapi/        # FastAPI REST API
│   ├── app/
│   │   ├── api/routes/     # API endpoints
│   │   ├── core/           # Config, security, database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   └── alembic/            # Database migrations
│
├── backend-node/           # Node.js Microservice
│   └── src/
│       ├── routes/         # REST endpoints
│       ├── services/       # AI, notifications
│       └── websocket/      # WebSocket handler
│
├── docker-compose.yml      # Container orchestration
├── .env.example            # Environment template
└── README.md               # This file
```

---

## 🔐 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://billflow:billflow_secret@localhost:5432/billflow` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://billflow:billflow_secret@localhost:27017/billflow?authSource=admin` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `JWT_SECRET` | Secret key for JWT tokens | (change in production!) |
| `RAZORPAY_KEY_ID` | Razorpay API key | (optional) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | (optional) |
| `GEMINI_API_KEY` | Google Gemini API key | (optional, mock fallback) |
| `CLAUDE_API_KEY` | Anthropic Claude API key | (optional, mock fallback) |

---

## 🧪 Development (Without Docker)

### Backend (FastAPI)
```bash
cd backend-fastapi
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Microservice (Node.js)
```bash
cd backend-node
npm install
npm run dev
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 License

MIT License — free for commercial and personal use.

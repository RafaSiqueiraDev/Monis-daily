# Monis Daily 

A modern, multi-tenant personal finance Progressive Web App (PWA) designed for seamless cross-border budgeting and multi-currency wealth tracking.

![Project Status](https://img.shields.io/badge/status-active_development-emerald)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)

---

## Core Features

- **Multi-Country & Multi-Currency Engine:** Real-time multi-tenant segmentation supporting wallets and financial records across distinct currencies (EUR, BRL, USD, GBP, CHF).
- **Unified Expenses & Recurring Bills:** Centralized cash outflow monitoring grouping recurring commitments and variable expenses into a synchronized, two-column interface.
- **Credit Card Billing Management:** Automated invoice tracking with installment scheduling, billing cycles, and country-based card segmentation.
- **PWA & Mobile-First Navigation:** Optimized for touch interactions with bottom navigation bars, quick-action dialogs, and offline caching readiness.
- **Defensive Data Layer:** Strict schema deserialization and defensive numeric fallbacks preventing runtime crashes and data corruption.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Modern Pastel Fintech UI)
- **Charts:** Recharts
- **State & Data Fetching:** TanStack React Query + Axios

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (Hosted on Neon Serverless)
- **ORM & Migrations:** SQLAlchemy + Alembic
- **Validation:** Pydantic V2 schemas
- **Auth:** JWT-based OAuth2 tokens with bcrypt password hashing

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- PostgreSQL instance (or Neon DB connection string)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

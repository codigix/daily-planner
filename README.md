# Daily Planner / Codigix Tracker

Full-stack productivity management system with decoupled **Frontend** (React + Vite + Tailwind CSS) and **Backend** (Node.js + Express + MySQL).

---

## 📂 Project Layout

```
daily-planner/
├── frontend/                   # React + Vite Frontend Application
│   ├── src/                    # React UI components, pages, context, and services
│   ├── public/                 # Web assets & icons
│   ├── index.html              # HTML entry point
│   ├── vite.config.js          # Vite config & API proxy settings
│   ├── tailwind.config.js      # Tailwind CSS styling configuration
│   └── package.json            # Frontend dependency manifest
│
├── backend/                    # Express + Node.js Backend Server
│   ├── routes/                 # API endpoint handlers
│   ├── services/               # Background services & integrations
│   ├── index.cjs               # Express server entry point (Port 5001)
│   ├── db_mysql.cjs            # Database connection pool
│   ├── setup_mysql.cjs         # Table setup script
│   └── package.json            # Backend dependency manifest
│
├── package.json                # Root orchestration scripts
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### 1. Installation
To install dependencies for both frontend and backend:
```bash
npm --prefix frontend install
npm --prefix backend install
```

### 2. Running Locally

#### Option A: Run Both Frontend & Backend Concurrently (Recommended)
```bash
npm run dev:all
```

#### Option B: Run Individually
* **Frontend only**:
  ```bash
  npm run dev:frontend
  ```
  *(Starts Vite dev server at http://localhost:5173)*

* **Backend only**:
  ```bash
  npm run dev:backend
  ```
  *(Starts Express server at http://localhost:5001)*

---

## 💾 Database Scripts

```bash
npm run db:setup    # Initialize MySQL database schema
npm run db:reset    # Reset tables & clear data
```

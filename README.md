# Avica

A web application built with Django (backend) and React (frontend).

---

## Prerequisites

- Python 3.8+
- Node.js 16+
- pip (Python package manager)
- npm or yarn

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Create Virtual Environment
```bash
python -m venv venv
```

### 3. Activate Virtual Environment
```bash
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate
```

### 4. Install Backend Dependencies
```bash
cd/backend
pip install -r requirements.txt
```

### 5. Apply Database Migrations
```bash
python manage.py migrate
```

### 6. Run Backend Server
```bash
python manage.py runserver
```

### 7. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 8. Run Frontend Development Server
```bash
npm run dev
```
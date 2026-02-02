# Project Name

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

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Apply migrations
python manage.py migrate

python manage.py runserver

cd frontend  # or your frontend directory name

npm install

npm run dev
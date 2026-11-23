# Library Management System

Academic Library Management System developed using:

- Python and Flask
- HTML, CSS and JavaScript
- SQLite and SQLAlchemy
- REST API architecture
- Object-oriented programming

## Project structure

- backend/: Flask application and business logic
- frontend/: independent JavaScript frontend
- docs/: architecture and technical documentation
- scripts/: development utilities

## Backend setup (Windows PowerShell)

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python run.py
```

Backend health endpoint:

http://127.0.0.1:5000/api/health

## Frontend setup

Open a second terminal from the project root:

```powershell
py -m http.server 5500 --directory frontend
```

Open:

http://127.0.0.1:5500

## Tests

From the backend directory:

```powershell
python -m pytest -v
```

## Development rules

See CLAUDE.md and docs/ for approved architecture and implementation requirements.

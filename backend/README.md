# Panini Backend

Backend FastAPI para sincronizar albumes por usuario usando SQLite local.

## Desarrollo

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

La API vive en `http://127.0.0.1:8000/api`.

## Tests

```bash
pytest
```

#!/bin/bash
set -e

# Run migrations
alembic upgrade head

# Start application.
# WEB_CONCURRENCY controls worker count (default 2) -- gunicorn with the
# uvicorn worker class gives proper multi-process handling in production,
# unlike a single bare `uvicorn` process.
exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers "${WEB_CONCURRENCY:-2}" \
    --bind 0.0.0.0:8000 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -

#!/bin/sh

WORKERS=4
PORT=8000  # Listen on an unprivileged port

gunicorn -k uvicorn.workers.UvicornWorker -b :$PORT -w 4 \
  --access-logfile=/var/www/Commonplaces/access.log \
  --error-logfile=/var/www/Commonplaces/error.log \
  --chdir /var/www/Commonplaces/  web_app:app

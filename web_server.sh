#!/bin/sh

WORKERS=4
PORT=443
KEYFILE=/etc/letsencrypt/live/marat.uchicago.edu/privkey.pem
CERTFILE=/etc/letsencrypt/live/marat.uchicago.edu/fullchain.pem
ADDRESS=172.17.0.3

gunicorn --keyfile=$KEYFILE --certfile=$CERTFILE -k uvicorn.workers.UvicornWorker -b :$PORT --bind=$ADDRESS -w 4 --access-logfile=/var/www/Commonplaces/access.log --error-logfile=/var/www/Commonplaces/error.log  web_app:app

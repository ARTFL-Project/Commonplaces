# syntax=docker/dockerfile:1
#
# commonplaces: the FastAPI application and the PostgreSQL database it owns, in one
# container, running as an unprivileged uid on a read-only root filesystem.
#
# The Vue frontend in public/ is built in its own stage; only public/dist reaches the image.

FROM node:26-trixie-slim AS web
WORKDIR /src
COPY public/package.json public/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY public/ ./
RUN npm run build && test -f dist/index.html

FROM ubuntu:26.04

# en_US.utf8 is not decoration. The live database collates under it, and a bare initdb in
# a minimal image inherits C - which means SQL_ASCII and a ctype where accented characters
# stop relating to their unaccented forms, silently changing what the trigram search
# matches. ubuntu:26.04 does not ship the locale, so it is generated here. (MIGRATION.md 3.4)
ENV DEBIAN_FRONTEND=noninteractive LANG=en_US.utf8 LC_ALL=en_US.utf8

# Busted weekly by the build arg, so `docker compose build --pull` actually applies
# security updates instead of reusing a cached layer.
# apt-get upgrade sits in this same layer, never a later one: a separate layer would keep every
# replaced file in the image twice. Without it, base-image packages that nothing reinstalls
# move only when Canonical rebuilds ubuntu:26.04.
ARG REBUILD_DATE=unset
RUN echo "rebuild: $REBUILD_DATE" \
 && apt-get update \
 && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends \
      postgresql postgresql-contrib locales ca-certificates \
 && locale-gen en_US.UTF-8 \
 && update-locale LANG=en_US.UTF-8 \
 && rm -rf /var/lib/apt/lists/* \
 # The Debian package runs initdb at install time and leaves a cluster behind that this
 # image never uses. The old image carried two postmasters for four years because of
 # exactly this; one of them was empty and nobody knew it was running.
 && rm -rf /var/lib/postgresql/18/main \
 # Canonical ships an OCI service manager in the stock base carrying HIGH CVEs. Nothing
 # here uses it: the entrypoint starts postgres and gunicorn directly.
 && rm -f /usr/bin/pebble \
 # A self-signed dummy key that the postgresql package pulls in. This cluster never speaks
 # TLS, so it is pure noise in the weekly scan - and a report people learn to ignore is
 # worse than no report.
 && rm -f /etc/ssl/private/ssl-cert-snakeoil.key /etc/ssl/certs/ssl-cert-snakeoil.pem

# initdb calls getpwuid(), so the runtime uid must exist here. 482 matches a real
# commonplaces account on the host, so `ps` and `ls -l` read correctly on both sides.
# Nothing in this image runs as root: there is no gosu and no privilege drop at runtime.
RUN groupadd -r -g 482 commonplaces \
 && useradd -r -u 482 -g 482 -M -d /nonexistent -s /usr/sbin/nologin commonplaces

# The application's interpreter comes from uv, not the distro: pinned here, bumped as its
# own decision, and immune to the base image moving under it.
ENV UV_PYTHON_INSTALL_DIR=/opt/python UV_LINK_MODE=copy
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY requirements.txt /tmp/requirements.txt
RUN uv venv /opt/venv --python 3.13 --managed-python \
 && VIRTUAL_ENV=/opt/venv uv pip install --no-cache -r /tmp/requirements.txt \
 && rm -rf /root/.cache \
 # uv's CPython ships pip, and pip vendors its own copies of setuptools and msgpack. The
 # weekly scan reports those as findings against this image even though nothing here
 # installs anything at runtime - the venv is built above, once. Removing pip removes two
 # of the six findings and they are the two that would never be actionable.
 && rm -rf /opt/python/cpython-*/lib/python3.13/site-packages/pip \
           /opt/python/cpython-*/lib/python3.13/site-packages/pip-*.dist-info

ENV PATH=/opt/venv/bin:/usr/lib/postgresql/18/bin:$PATH \
    PGDATA=/data/psql/18 \
    PGHOST=/tmp \
    PYTHONUNBUFFERED=1 \
    HOME=/tmp

# WORKDIR is the application root because web_app.py opens config.json and mounts
# public/dist/assets by relative path - and that StaticFiles mount must resolve at import
# time or the app will not start.
WORKDIR /var/www/Commonplaces
COPY web_app.py ./
COPY top_author.txt top_titles.txt ./
COPY --from=web /src/dist ./public/dist
COPY entrypoint.sh /entrypoint.sh

USER 482:482
EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]

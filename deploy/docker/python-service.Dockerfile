FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY src/services/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY src/services/ ./services/

ENV PYTHONUNBUFFERED=1
ENV PORT=7432
ENV SERVICE_MODULE=otio_service

# SERVICE_MODULE: otio_service | imf_service | shotgrid_service | exr_service
CMD gunicorn --chdir services --bind 0.0.0.0:${PORT} --workers 2 --timeout 300 ${SERVICE_MODULE}:app

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

COPY . .

RUN mkdir -p .cache/transcripts .cache/peaks .cache/media

EXPOSE 8080

# Use shell form to allow environment variable expansion for Render
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
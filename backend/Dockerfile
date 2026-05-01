FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project metadata to allow installing deps
COPY pyproject.toml /app/

RUN pip install --upgrade pip

# Install runtime dependencies (whisperx from git)
RUN pip install fastapi[all] uvicorn[standard] httpx pydantic yt-dlp numpy \
    torch==2.8.0 torchaudio==2.8.0 \
    git+https://github.com/m-bain/whisperx.git

# Copy backend code
COPY backend/ /app/backend/

EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]

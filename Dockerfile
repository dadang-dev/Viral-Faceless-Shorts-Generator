FROM python:3.10-slim

# Install ffmpeg for Whisper and rendering.
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set PYTHONPATH so the module imports work correctly
ENV PYTHONPATH=/app

# Preparation is non-blocking; rendering is invoked after manual clips arrive.
CMD ["python", "main.py", "status", "--days", "all"]

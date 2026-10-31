# Multi-stage or optimized Python image for ML Learning Platform
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    MPLCONFIGDIR=/tmp/matplotlib

# Set working directory
WORKDIR /app

# Install minimal system dependencies (curl for healthcheck, build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for optimal Docker layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . /app

# Create a non-privileged user and group for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /tmp/matplotlib /app/content/notebooks && \
    chown -R appuser:appuser /app /tmp/matplotlib

USER appuser

# Expose default port
EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/topics || exit 1

# Start FastAPI server using uvicorn
CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]


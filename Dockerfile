# Use Python 3.11 slim image as the base
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy application source files
COPY src /app/src

# Copy frontend files
COPY frontend /app/frontend

# Copy certificates
COPY cert /app/cert

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gcc libssl-dev && \
    pip install --no-cache-dir -r /app/src/requirements.txt && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Expose the application's port 
EXPOSE 8765

# Command to start the application
CMD ["python3", "/app/src/server.py"]

# Use Python 3.11 slim image as the base
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy application source files
COPY src /app

# Copy certificates to the container
COPY cert /app/cert

# Install required system packages and Python dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gcc libssl-dev mkcert && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Expose the application's port (8765 in this case)
EXPOSE 8765

# Command to start the application
CMD ["python3", "server.py"]

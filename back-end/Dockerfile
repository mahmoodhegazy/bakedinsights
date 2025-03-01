# Start with the Miniconda3 base image
FROM continuumio/miniconda3:latest

# Set working directory in container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy environment.yml file
COPY environment.yml .

# Create conda environment
RUN conda env create -f environment.yml

# Copy entrypoint script and ensure proper permissions
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh && \
    sed -i 's/\r$//' entrypoint.sh

# Copy application code with proper structure
COPY src/ .

# Add app directory to Python path
ENV PYTHONPATH=/app

# Set environment variables
ENV FLASK_APP=run.py
ENV FLASK_ENV=production

EXPOSE 5050

# Use the shell script as entrypoint
ENTRYPOINT ["./entrypoint.sh"]

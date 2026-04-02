FROM python:3.10-slim

WORKDIR /app

# Install dependencies required for parsing (like python3-dev if needed, but slim usually works)
# Copy the requirements file into the image
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 8000
EXPOSE 8000

# Command to run the application (Uses Cloud Run's PORT env variable, defaults to 8000 locally)
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"

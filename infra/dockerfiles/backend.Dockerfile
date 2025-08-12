FROM python:3.11-slim
WORKDIR /app
COPY apps/backend/requirements.txt /app/apps/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/apps/backend/requirements.txt
COPY . /app
WORKDIR /app/apps/backend
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


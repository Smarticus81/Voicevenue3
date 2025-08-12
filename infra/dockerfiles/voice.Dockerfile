FROM python:3.11-slim
WORKDIR /app
COPY apps/voice/requirements.txt /app/apps/voice/requirements.txt
RUN pip install --no-cache-dir -r /app/apps/voice/requirements.txt
COPY . /app
WORKDIR /app/apps/voice
ENV AGENT_ROOM_PREFIX=bevpro-
EXPOSE 7000
CMD ["python", "-m", "voice.app"]


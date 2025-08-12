import asyncio
import os

from dotenv import load_dotenv, find_dotenv


def main() -> None:
    # Avoid reading from stdin on Windows PowerShell redirections
    env_file = find_dotenv(usecwd=True)
    if env_file:
        load_dotenv(env_file)
    room_prefix = os.getenv("AGENT_ROOM_PREFIX", "bevpro-")
    print(f"agent online | room-prefix={room_prefix}")
    # Keep the worker alive
    if os.getenv("ONE_SHOT") == "1":
        return
    try:
        asyncio.run(asyncio.sleep(3600 * 24 * 365))
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()


import os
import sys
from pathlib import Path


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(repo_root / "apps" / "voice"))
    # Ensure env
    os.environ.setdefault("AGENT_ROOM_PREFIX", "bevpro-")
    from voice.app import main as run

    run()


if __name__ == "__main__":
    main()


import os
import sys
from pathlib import Path

# Prevent auto-loading arbitrary third-party pytest plugins that may be installed
# in the user environment, ensuring tests run reliably across machines.
os.environ.setdefault("PYTEST_DISABLE_PLUGIN_AUTOLOAD", "1")

# Ensure local app packages are importable when running from repo root
REPO_ROOT = Path(__file__).resolve().parent
BACKEND_PATH = REPO_ROOT / "apps" / "backend"
VOICE_PATH = REPO_ROOT / "apps" / "voice"
for p in (BACKEND_PATH, VOICE_PATH):
    sp = str(p)
    if sp not in sys.path:
        sys.path.insert(0, sp)


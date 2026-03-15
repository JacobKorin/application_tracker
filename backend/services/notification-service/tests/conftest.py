import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
SHARED_ROOT = SERVICE_ROOT.parents[2] / "shared" / "python"

sys.path.insert(0, str(SERVICE_ROOT))
sys.path.insert(0, str(SHARED_ROOT))

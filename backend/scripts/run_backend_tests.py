from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    backend_tests = repo_root / "backend" / "services" / "backend" / "tests"
    base_temp = Path(
        tempfile.mkdtemp(prefix=".pytest_run_temp_backend_", dir=repo_root)
    )

    try:
        return subprocess.call(
            [
                sys.executable,
                "-m",
                "pytest",
                "--basetemp",
                str(base_temp),
                str(backend_tests),
            ],
            cwd=repo_root,
        )
    finally:
        shutil.rmtree(base_temp, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())

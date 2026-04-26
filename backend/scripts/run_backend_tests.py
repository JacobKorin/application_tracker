from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


SERVICE_TEST_DIRS = (
    Path("backend/services/backend/tests"),
)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    base_temp = Path(
        tempfile.mkdtemp(prefix=".pytest_run_temp_backend_", dir=repo_root)
    )

    try:
        for index, test_dir in enumerate(SERVICE_TEST_DIRS, start=1):
            exit_code = subprocess.call(
                [
                    sys.executable,
                    "-m",
                    "pytest",
                    "--basetemp",
                    str(base_temp / f"suite_{index}"),
                    str(repo_root / test_dir),
                ],
                cwd=repo_root,
            )
            if exit_code != 0:
                return exit_code

        return 0
    finally:
        shutil.rmtree(base_temp, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())

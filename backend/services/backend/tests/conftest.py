import os
import sys
from pathlib import Path

import pytest

SERVICE_ROOT = Path(__file__).resolve().parents[1]
SHARED_ROOT = SERVICE_ROOT.parents[3] / "shared" / "python"

sys.path.insert(0, str(SERVICE_ROOT))
sys.path.insert(0, str(SHARED_ROOT))


@pytest.fixture(autouse=True)
def sqlite_database(tmp_path):
    os.environ["POSTGRES_URL"] = f"sqlite:///{tmp_path / 'test.db'}"

    from app import create_app
    from app.models import Base

    app = create_app()
    Base.metadata.create_all(bind=app.config["DB_ENGINE"])

    yield

    Base.metadata.drop_all(bind=app.config["DB_ENGINE"])

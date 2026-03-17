import os
import sys
from uuid import uuid4
from pathlib import Path

import pytest

SERVICE_ROOT = Path(__file__).resolve().parents[1]
SHARED_ROOT = SERVICE_ROOT.parents[3] / "shared" / "python"

sys.path.insert(0, str(SERVICE_ROOT))
sys.path.insert(0, str(SHARED_ROOT))


@pytest.fixture(autouse=True)
def sqlite_database():
    database_name = f"job-tracker-test-{uuid4().hex}"
    os.environ["POSTGRES_URL"] = f"sqlite+pysqlite:///file:{database_name}?mode=memory&cache=shared"

    from app import create_app
    from app.models import Base

    app = create_app()
    engine = app.config["DB_ENGINE"]
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)
    engine.dispose()

from __future__ import annotations

from collections.abc import Generator

from flask import current_app
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker


NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def init_db(app) -> None:
    database_url = app.config["SERVICE_CONFIG"].postgres_url
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, future=True, pool_pre_ping=True, connect_args=connect_args)
    session_factory = scoped_session(
        sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    )

    app.config["DB_ENGINE"] = engine
    app.config["DB_SESSION_FACTORY"] = session_factory

    @app.teardown_appcontext
    def shutdown_session(_exception=None):
        session_factory.remove()


def get_session():
    return current_app.config["DB_SESSION_FACTORY"]()


def session_scope() -> Generator:
    session = get_session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise


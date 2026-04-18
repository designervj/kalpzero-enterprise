from collections.abc import Generator
from functools import lru_cache

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import Settings, get_settings
from app.db.base import Base


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return "postgresql+psycopg://" + database_url[len("postgres://") :]
    if database_url.startswith("postgresql://") and "://" in database_url and "+psycopg" not in database_url.split("://", 1)[0]:
        return "postgresql+psycopg://" + database_url[len("postgresql://") :]
    return database_url


def _build_engine(database_url: str) -> Engine:
    database_url = _normalize_database_url(database_url)
    engine_kwargs: dict[str, object] = {"future": True}
    if database_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        if database_url.endswith(":memory:"):
            engine_kwargs["poolclass"] = StaticPool

    engine = create_engine(database_url, **engine_kwargs)
   
    return engine


@lru_cache
def get_engine(database_url: str) -> Engine:
    return _build_engine(database_url)


@lru_cache
def get_session_factory(database_url: str) -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(database_url), autoflush=False, autocommit=False)


def init_db(settings: Settings) -> None:
 
    database_url = _normalize_database_url(settings.database_url)
    engine = get_engine(database_url)
    
    Base.metadata.create_all(bind=engine)


def clear_db_caches() -> None:
    get_session_factory.cache_clear()
    get_engine.cache_clear()


def get_db_session(settings: Settings = Depends(get_settings)) -> Generator[Session, None, None]:
    session_factory = get_session_factory(settings.database_url)
    session = session_factory()

    try:
        yield session
    finally:
        session.close()

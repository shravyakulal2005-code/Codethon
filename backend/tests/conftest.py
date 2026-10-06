"""Shared pytest fixtures: in-memory SQLite DB + TestClient."""

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Point to an in-memory DB before importing app modules
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "pytest-secret"

from app.main import app
from app.database import Base, get_db

TEST_ENGINE = create_engine("sqlite://", connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture()
def client(setup_db):
    """Return a TestClient wired to the in-memory DB."""

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

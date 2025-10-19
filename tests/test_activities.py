from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Create a deep copy of initial activities to reset between tests
    # We'll reconstruct a small activities dict so tests are deterministic
    activities.clear()
    activities.update({
        "Test Club": {
            "description": "A test activity",
            "schedule": "Fridays",
            "max_participants": 5,
            "participants": [
                "alice@mergington.edu",
                "bob@mergington.edu",
            ],
        }
    })
    yield


def test_unregister_success():
    # Ensure alice is registered initially
    assert "alice@mergington.edu" in activities["Test Club"]["participants"]

    resp = client.post("/activities/Test%20Club/unregister?email=alice@mergington.edu")
    assert resp.status_code == 200
    data = resp.json()
    assert "Unregistered alice@mergington.edu" in data["message"]
    assert "alice@mergington.edu" not in activities["Test Club"]["participants"]


def test_unregister_not_signed_up():
    resp = client.post("/activities/Test%20Club/unregister?email=charlie@mergington.edu")
    assert resp.status_code == 400
    data = resp.json()
    assert data.get("detail") == "Student not signed up for this activity"


def test_unregister_activity_not_found():
    resp = client.post("/activities/NoSuchClub/unregister?email=alice@mergington.edu")
    assert resp.status_code == 404
    data = resp.json()
    assert data.get("detail") == "Activity not found"
    # Removed stray footer
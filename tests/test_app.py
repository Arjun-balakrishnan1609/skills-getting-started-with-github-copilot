from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities_returns_expected_structure():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # should be a dict mapping activity name to details
    assert isinstance(data, dict)
    assert "Basketball Team" in data
    activity = data["Basketball Team"]
    assert "description" in activity
    assert "participants" in activity


def test_signup_and_unregister_flow():
    activity = "Basketball Team"
    test_email = "test-user@example.com"

    # Ensure email is not present initially
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert test_email not in data[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert f"Signed up {test_email}" in resp.json().get("message", "")

    # Now email should be present
    resp = client.get("/activities")
    data = resp.json()
    assert test_email in data[activity]["participants"]

    # Sign up again should result in 400
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 400

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp.status_code == 200
    assert f"Removed {test_email}" in resp.json().get("message", "")

    # Ensure it's gone
    resp = client.get("/activities")
    data = resp.json()
    assert test_email not in data[activity]["participants"]

    # Removing again should return 400
    resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp.status_code == 400
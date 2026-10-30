from datetime import datetime, timezone


def get_mock_devices():
    updated_at = datetime.now(timezone.utc).isoformat()
    return [
        {
            "provider": "Mock Quantum Provider",
            "providerType": "mock",
            "name": "Mock-QPU-01",
            "qubits": 128,
            "status": "active",
            "operational": True,
            "pendingJobs": 4,
            "errorRate": 2.5,
            "lastUpdated": updated_at,
        },
        {
            "provider": "Mock Quantum Provider",
            "providerType": "mock",
            "name": "Mock-QPU-02",
            "qubits": 64,
            "status": "active",
            "operational": True,
            "pendingJobs": 1,
            "errorRate": 1.8,
            "lastUpdated": updated_at,
        },
        {
            "provider": "Mock Quantum Provider",
            "providerType": "mock",
            "name": "Mock-QPU-03",
            "qubits": 256,
            "status": "offline",
            "operational": False,
            "pendingJobs": 0,
            "errorRate": 3.1,
            "lastUpdated": updated_at,
        },
    ]

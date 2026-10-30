import logging
import os
import traceback
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def get_ibm_devices():
    """Retrieve backend metadata only; no circuits or jobs are submitted."""
    api_key = os.getenv("IBM_API_KEY")
    instance = os.getenv("IBM_INSTANCE_CRN")
    if not api_key or not instance:
        logger.info("IBM credentials are not configured; using mock data only")
        return [], "IBM credentials are not configured"
    if "POSTGRES_USER=" in instance:
        candidate = instance.split("POSTGRES_USER=", 1)[0].rstrip()
        if candidate.endswith("::"):
            logger.warning("Ignoring an accidental POSTGRES_USER suffix in IBM_INSTANCE_CRN")
            instance = candidate
    if not instance.startswith("crn:") or not instance.endswith("::") or "=" in instance or any(char.isspace() for char in instance):
        logger.warning("IBM_INSTANCE_CRN is malformed; using mock data only")
        return [], "IBM_INSTANCE_CRN looks malformed. Put its complete CRN on its own .env line, with no other setting after it."

    try:
        from qiskit_ibm_runtime import QiskitRuntimeService

        service = QiskitRuntimeService(
            channel="ibm_cloud",
            token=api_key,
            instance=instance,
        )
        updated_at = datetime.now(timezone.utc).isoformat()
        devices = []
        for backend in service.backends():
            status = backend.status()
            devices.append(
                {
                    "provider": "IBM Quantum",
                    "providerType": "real",
                    "name": backend.name,
                    "qubits": backend.num_qubits,
                    "status": status.status_msg,
                    "operational": bool(status.operational),
                    "pendingJobs": status.pending_jobs,
                    "errorRate": None,
                    "lastUpdated": updated_at,
                }
            )
        return devices, None
    except Exception as error:
        message = str(error).lower()
        if "not found" in message and "instance" in message:
            warning = "IBM Quantum instance was not found. Check that IBM_INSTANCE_CRN belongs to an active instance and matches its API key."
        elif "401" in message or "unauthorized" in message or "authentication" in message:
            warning = "IBM Quantum authentication failed. Check IBM_API_KEY and the instance access permissions."
        else:
            warning = "IBM Quantum data is unavailable. Check the credentials and network; simulated devices are still available."
        frames = traceback.extract_tb(error.__traceback__)
        location = " > ".join(f"{frame.name}:{frame.lineno}" for frame in frames[-4:])
        logger.warning("IBM Quantum refresh failed; continuing with simulated devices (%s at %s)", type(error).__name__, location)
        return [], warning

import os

from qiskit_ibm_runtime import QiskitRuntimeService

IBM_API_KEY = os.environ["zHZFaAMwzzHlBBnTzxOmtL6Ft7F-Yx-hCz23KvcouwZB"]
IBM_INSTANCE_CRN = os.environ["crn:v1:bluemix:public:quantum-computing:us-east:a/7490b42f167644a4a2f3f70adda891b3:2b1fdfa1-e3ac-4c46-9d9c-5b8e6f072a24::"]

service = QiskitRuntimeService(
    channel="ibm_quantum_platform",
    token=IBM_API_KEY,
    instance=IBM_INSTANCE_CRN,
)

print("Connected successfully!")
print("Instance:", service.active_instance())

backends = service.backends()

for backend in backends:
    status = backend.status()

    print("\n-------------------------")
    print("Name:", backend.name)
    print("Qubits:", backend.num_qubits)
    print("Status:", status.status_msg)
    print("Pending jobs:", status.pending_jobs)
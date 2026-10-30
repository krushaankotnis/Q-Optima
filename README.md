# Q-Optima

Q-Optima is a cloud-based quantum computing resource recommendation system. It monitors QPU metadata and queue signals, then recommends a suitable operational device for a workload without submitting jobs or executing circuits.

## Features

- Live IBM Quantum backend metadata through `qiskit-ibm-runtime`.
- Clearly labelled simulated devices for multi-provider demonstrations.
- PostgreSQL persistence for normalized devices and recommendation requests.
- Transparent scoring by lowest queue, highest capacity, or balanced priority.
- Responsive React dashboard with refresh, loading, and error states.
- Docker Compose setup suitable for a small EC2 deployment later.

## Architecture

The React/Vite frontend calls the Express REST API. The backend synchronizes normalized device data from the Python quantum service and stores it in PostgreSQL. The quantum service owns provider adapters: IBM retrieval and mock data. IBM credentials stay inside the quantum-service container and are never returned to the browser.

## Stack and structure

- `frontend/`: React, Vite, CSS, and Nginx production image.
- `backend/`: Node.js, Express, PostgreSQL client, and recommendation engine.
- `quantum-service/`: Python HTTP service and IBM SDK adapter.
- `database/init.sql`: simple PostgreSQL schema.
- `docker-compose.yml`: frontend, backend, quantum-service, and PostgreSQL.

## Environment and IBM setup

Copy `.env.example` to `.env`, then replace the placeholder values with credentials supplied by the developer. Set `IBM_API_KEY` and `IBM_INSTANCE_CRN` for live IBM data. Never commit `.env` or expose the key in frontend code. Revoke the credential if it has been exposed.

IBM Quantum is the current real provider. Other real providers can be added later by implementing another adapter that returns the same normalized fields.

## Run with Docker

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:3000`. The backend is available at `http://localhost:5000`. Stop with `docker compose down`; PostgreSQL data remains in the `postgres-data` volume.

## Run without Docker

Start PostgreSQL and apply `database/init.sql`. Then run the Python service:

```bash
cd quantum-service
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python app/main.py
```

In another terminal, install and start the backend with the PostgreSQL and `QUANTUM_SERVICE_URL=http://localhost:8000` environment variables. In a third terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite uses `/api` by default; for a separate backend origin set `VITE_API_URL=http://localhost:5000/api`.

## API endpoints

- `GET /api/health`: service and database status.
- `GET /api/devices`: normalized device list.
- `GET /api/devices/:id`: one device.
- `GET /api/providers`: provider names.
- `POST /api/recommend`: accepts `requiredQubits`, optional `maxErrorRate`, and `priority`.
- `POST /api/refresh`: retrieves fresh provider data.
- `GET /api/last-updated`: most recent refresh time.

## Recommendation algorithm

The backend removes non-operational devices, devices with insufficient qubits, and devices exceeding the optional error-rate limit when error data is available. Remaining devices receive a score from 0 to 100. Lowest-queue uses queue score, highest-capacity uses qubit capacity, and balanced combines queue (60%) with capacity (40%). The response includes the recommendation, alternatives, exclusions, score, and explanation.

## Mock data and error handling

Mock QPUs are always available so the dashboard remains demonstrable without IBM credentials. A missing credential, invalid key, expired instance, IBM outage, or service failure is shown as a warning/error while simulated data remains usable. No quantum circuits or jobs are executed.

## Security and future AWS plan

Do not hard-code secrets, commit `.env`, or place IBM credentials in React. The current design is intentionally small for local Docker use and can later run on an EC2 host. S3, IAM, and CloudWatch may be introduced where useful. Kubernetes, ECS/Fargate, queues, caches, load balancers, and WAF are deliberately out of scope until a real requirement exists.

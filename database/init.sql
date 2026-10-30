CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('real', 'mock'))
);

CREATE TABLE IF NOT EXISTS quantum_devices (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    qubits INTEGER NOT NULL CHECK (qubits > 0),
    status VARCHAR(80) NOT NULL,
    operational BOOLEAN NOT NULL DEFAULT FALSE,
    pending_jobs INTEGER NOT NULL DEFAULT 0 CHECK (pending_jobs >= 0),
    error_rate NUMERIC(8, 3),
    last_updated TIMESTAMPTZ NOT NULL,
    UNIQUE(provider_id, name)
);

CREATE TABLE IF NOT EXISTS recommendation_requests (
    id SERIAL PRIMARY KEY,
    required_qubits INTEGER NOT NULL CHECK (required_qubits > 0),
    max_error_rate NUMERIC(8, 3),
    priority VARCHAR(30) NOT NULL CHECK (priority IN ('lowest_queue', 'highest_capacity', 'balanced')),
    recommended_device_id INTEGER REFERENCES quantum_devices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

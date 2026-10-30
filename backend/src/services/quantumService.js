const serviceUrl = process.env.QUANTUM_SERVICE_URL || 'http://quantum-service:8000';

export async function fetchQuantumDevices(path = '/devices', options = {}) {
  const response = await fetch(`${serviceUrl}${path}`, options);
  if (!response.ok) throw new Error(`Quantum service returned ${response.status}`);
  return response.json();
}

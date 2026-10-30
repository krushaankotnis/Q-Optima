import pg from 'pg';

const { Pool } = pg;
export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'qoptima',
  connectionTimeoutMillis: 2000,
});

let memoryDevices = [];
let databaseAvailable = true;

export async function syncDevices(devices) {
  memoryDevices = devices.map((device, index) => ({ ...device, id: index + 1 }));
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const device of devices) {
        const provider = await client.query('INSERT INTO providers (name, type) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type RETURNING id', [device.provider, device.providerType]);
        await client.query(`INSERT INTO quantum_devices (provider_id, name, qubits, status, operational, pending_jobs, error_rate, last_updated)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (provider_id, name) DO UPDATE SET qubits=$3,status=$4,operational=$5,pending_jobs=$6,error_rate=$7,last_updated=$8`,
          [provider.rows[0].id, device.name, device.qubits, device.status, device.operational, device.pendingJobs, device.errorRate, device.lastUpdated]);
      }
      await client.query('COMMIT');
      databaseAvailable = true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  } catch (error) {
    databaseAvailable = false;
    console.warn(`Database unavailable; using memory data: ${error.message}`);
  }
  return memoryDevices;
}

export function getDevices() { return memoryDevices; }
export function isDatabaseAvailable() { return databaseAvailable; }

export async function saveRecommendation(request, recommendedId) {
  if (!databaseAvailable) return;
  await pool.query('INSERT INTO recommendation_requests (required_qubits, max_error_rate, priority, recommended_device_id) VALUES ($1,$2,$3,$4)', [request.requiredQubits, request.maxErrorRate, request.priority, recommendedId]);
}

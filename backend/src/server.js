import express from 'express';
import cors from 'cors';
import { fetchQuantumDevices } from './services/quantumService.js';
import { recommendDevice } from './services/recommendationService.js';
import { getDevices, isDatabaseAvailable, saveRecommendation, syncDevices } from './models/database.js';

const app = express();
const port = Number(process.env.BACKEND_PORT || 5000);
let lastUpdated = null;
let serviceWarning = null;

app.use(cors());
app.use(express.json());

async function refreshDevices(path = '/devices') {
  const payload = await fetchQuantumDevices(path, path === '/refresh' ? { method: 'POST' } : {});
  serviceWarning = payload.warning || null;
  await syncDevices(payload.devices || []);
  lastUpdated = new Date().toISOString();
  return getDevices();
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok', database: isDatabaseAvailable() ? 'connected' : 'fallback-memory', quantumService: 'configured' }));
app.get('/api/devices', (_request, response) => response.json({ devices: getDevices(), lastUpdated, warning: serviceWarning }));
app.get('/api/devices/:id', (request, response) => {
  const device = getDevices().find((item) => item.id === Number(request.params.id));
  if (!device) return response.status(404).json({ error: 'Device not found' });
  return response.json(device);
});
app.get('/api/providers', (_request, response) => response.json([...new Set(getDevices().map((device) => device.provider))]));
app.get('/api/last-updated', (_request, response) => response.json({ lastUpdated }));
app.post('/api/refresh', async (_request, response) => {
  try { return response.json({ devices: await refreshDevices('/refresh'), lastUpdated, warning: serviceWarning }); }
  catch (error) { return response.status(503).json({ error: `Unable to refresh quantum data: ${error.message}`, devices: getDevices(), lastUpdated }); }
});
app.post('/api/recommend', async (request, response) => {
  const requiredQubits = Number(request.body.requiredQubits);
  const maxErrorRate = request.body.maxErrorRate === '' || request.body.maxErrorRate === undefined || request.body.maxErrorRate === null ? null : Number(request.body.maxErrorRate);
  const priority = request.body.priority || 'balanced';
  if (!Number.isInteger(requiredQubits) || requiredQubits <= 0 || !['lowest_queue', 'highest_capacity', 'balanced'].includes(priority) || (maxErrorRate !== null && (Number.isNaN(maxErrorRate) || maxErrorRate < 0))) return response.status(400).json({ error: 'Provide valid qubits, error rate, and priority values.' });
  const result = recommendDevice(getDevices(), { requiredQubits, maxErrorRate, priority });
  try { await saveRecommendation({ requiredQubits, maxErrorRate, priority }, result.recommended?.id || null); } catch (error) { console.warn(`Could not save recommendation: ${error.message}`); }
  return response.json(result);
});

async function start() {
  try { await refreshDevices(); } catch (error) { serviceWarning = error.message; console.warn(`Initial quantum refresh failed: ${error.message}`); }
  app.listen(port, () => {
    console.log(`Q-Optima backend listening on port ${port}`);
    const refreshTimer = setInterval(async () => {
      try { await refreshDevices(); }
      catch (error) { serviceWarning = 'Quantum service is temporarily unavailable; showing the last available data.'; }
    }, 30000);
    refreshTimer.unref();
  });
}
start();

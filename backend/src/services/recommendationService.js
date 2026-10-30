export function recommendDevice(devices, request) {
  const { requiredQubits, maxErrorRate, priority } = request;
  const excluded = [];
  const suitable = [];

  for (const device of devices) {
    if (!device.operational) {
      excluded.push({ device, reason: 'Device is not operational.' });
    } else if (device.qubits < requiredQubits) {
      excluded.push({ device, reason: `Device has ${device.qubits} qubits; ${requiredQubits} are required.` });
    } else if (maxErrorRate !== null && device.errorRate !== null && device.errorRate > maxErrorRate) {
      excluded.push({ device, reason: `Error rate ${device.errorRate}% exceeds the ${maxErrorRate}% limit.` });
    } else {
      suitable.push({ ...device });
    }
  }

  if (!suitable.length) return { recommended: null, alternatives: [], excluded, reason: 'No operational QPU meets the requested requirements.' };

  const maxQubits = Math.max(...suitable.map((device) => device.qubits));
  const maxQueue = Math.max(...suitable.map((device) => device.pendingJobs), 1);
  const scored = suitable.map((device) => {
    const queueScore = 100 - (device.pendingJobs / maxQueue) * 100;
    const capacityScore = (device.qubits / maxQubits) * 100;
    const score = priority === 'lowest_queue'
      ? queueScore
      : priority === 'highest_capacity'
        ? capacityScore
        : queueScore * 0.6 + capacityScore * 0.4;
    return { ...device, score: Math.round(score) };
  }).sort((a, b) => b.score - a.score);

  const recommended = scored[0];
  const priorityText = priority === 'lowest_queue' ? 'lowest pending workload' : priority === 'highest_capacity' ? 'highest qubit capacity' : 'best balance of queue and capacity';
  return {
    recommended,
    alternatives: scored.slice(1),
    excluded,
    reason: `This QPU meets the required qubit count, is operational, and offers the ${priorityText} among suitable devices.`,
  };
}

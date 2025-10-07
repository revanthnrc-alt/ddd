export const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

async function post(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function runSimulation(scenario?: object) {
  return post("/simulate/run", scenario || {});
}

export async function generatePatch(attackLog: any, currentRule: any) {
  return post("/ai/blue_team", { attack_log: attackLog, current_rule: currentRule });
}

export async function applyPatch(patch: any) {
  return post("/simulate/apply_patch", patch);
}

export async function getLogs() {
  const res = await fetch(`${API_URL}/simulate/logs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

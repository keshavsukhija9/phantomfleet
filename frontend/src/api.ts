import type { AgentState } from './types';

const API_BASE =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '/api' : 'http://localhost:8000');

export async function fetchState(): Promise<AgentState> {
  const res = await fetch(`${API_BASE}/state`);
  if (!res.ok) throw new Error('Failed to fetch state');
  return res.json();
}

export async function runTick(): Promise<AgentState> {
  const res = await fetch(`${API_BASE}/tick`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run tick');
  return res.json();
}

export async function approveIntervention(
  interventionId: string,
  decision: 'approve' | 'reject'
): Promise<AgentState> {
  const res = await fetch(`${API_BASE}/approve/${interventionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  });
  if (!res.ok) throw new Error('Failed to submit decision');
  return res.json();
}

export function streamUrl(): string {
  return `${API_BASE}/stream`;
}

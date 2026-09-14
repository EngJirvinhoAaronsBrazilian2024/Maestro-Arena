import { Tip, TipCategory, TipStatus } from '../types/tips';

export async function getTips(date?: number, category?: TipCategory, status?: TipStatus): Promise<Tip[]> {
  try {
    const params = new URLSearchParams();
    if (date) params.append('date', String(date));
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    
    const res = await fetch(`/api/tips?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tips');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createTip(adminId: string, tip: Omit<Tip, 'id' | 'createdAt'>): Promise<Tip> {
  const res = await fetch('/api/tips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId, ...tip })
  });
  if (!res.ok) throw new Error('Failed to create tip');
  return await res.json();
}

export async function updateTip(adminId: string, id: string, updates: Partial<Tip>): Promise<void> {
  const res = await fetch(`/api/tips/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId, ...updates })
  });
  if (!res.ok) throw new Error('Failed to update tip');
}

export async function deleteTip(adminId: string, id: string): Promise<void> {
  const res = await fetch(`/api/tips/${id}?adminId=${adminId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete tip');
}

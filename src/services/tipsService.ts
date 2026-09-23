import { Tip, TipCategory, TipStatus } from '../types/tips';
import { insforge } from '../lib/insforge';
import { isSameDay } from '../lib/dateUtils';

export async function getTips(date?: number, category?: TipCategory, status?: TipStatus): Promise<Tip[]> {
  try {
    const params = new URLSearchParams();
    if (date) params.append('date', String(date));
    if (category) params.append('category', category);
    if (status) params.append('status', status);

    const res = await fetch(`/api/tips?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const seen = new Set<string>();
        return data.filter(t => {
          if (!t || !t.id || seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });
      }
    }
  } catch (err) {
    // fallback to direct insforge query
  }

  try {
    let query = insforge.database.from('tips').select('*').order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error("InsForge getTips query error:", error);
      throw error;
    }
    
    let tips: Tip[] = (data || []).map(t => ({
      id: t.id,
      category: t.category,
      matches: typeof t.matches === 'string' ? JSON.parse(t.matches) : (t.matches || []),
      odds: t.odds,
      analysis: t.analysis,
      status: t.status,
      bookingCode: t.booking_code || t.bookingCode || '',
      publishDate: Number(t.publish_date || t.publishDate || Date.now()),
      createdAt: Number(t.created_at || t.createdAt || Date.now())
    }));

    if (date) {
      tips = tips.filter(t => isSameDay(t.publishDate, date));
    }
    
    const seen = new Set<string>();
    return tips.filter(t => {
      if (!t || !t.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  } catch (error) {
    console.error("Error in getTips fallback:", error);
    return [];
  }
}

export async function createTip(adminId: string, tip: Omit<Tip, 'id' | 'createdAt'>): Promise<Tip> {
  const newId = 'tip_' + Date.now() + Math.random().toString(36).substring(2, 9);
  const now = Date.now();
  
  try {
    const res = await fetch('/api/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...tip, id: newId })
    });
    if (res.ok) {
      const created = await res.json();
      return created;
    }
  } catch (e) {
    // fallback below
  }

  const { data, error } = await insforge.database.from('tips').insert([{
    id: newId,
    category: tip.category,
    matches: tip.matches,
    odds: tip.odds,
    analysis: tip.analysis,
    status: tip.status,
    booking_code: tip.bookingCode,
    publish_date: tip.publishDate,
    created_at: now
  }]).select('*');
  
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Failed to create tip");
  
  return {
    id: data[0].id,
    category: data[0].category,
    matches: data[0].matches,
    odds: data[0].odds,
    analysis: data[0].analysis,
    status: data[0].status,
    bookingCode: data[0].booking_code,
    publishDate: data[0].publish_date,
    createdAt: data[0].created_at
  };
}

export async function updateTip(adminId: string, id: string, updates: Partial<Tip>): Promise<void> {
  try {
    const res = await fetch(`/api/tips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...updates })
    });
    if (res.ok) return;
  } catch (e) {
    // fallback below
  }

  const dbUpdates: any = {};
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.matches !== undefined) dbUpdates.matches = updates.matches;
  if (updates.odds !== undefined) dbUpdates.odds = updates.odds;
  if (updates.analysis !== undefined) dbUpdates.analysis = updates.analysis;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.bookingCode !== undefined) dbUpdates.booking_code = updates.bookingCode;
  if (updates.publishDate !== undefined) dbUpdates.publish_date = updates.publishDate;

  const { error } = await insforge.database.from('tips').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

export async function deleteTip(adminId: string, id: string): Promise<void> {
  try {
    const res = await fetch(`/api/tips/${id}?adminId=${adminId}`, {
      method: 'DELETE'
    });
    if (res.ok) return;
  } catch (e) {
    // fallback below
  }

  const { error } = await insforge.database.from('tips').delete().eq('id', id);
  if (error) throw error;
}

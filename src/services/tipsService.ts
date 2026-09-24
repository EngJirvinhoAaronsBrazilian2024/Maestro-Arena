import { Tip, TipCategory, TipStatus, normalizeCategory } from '../types/tips';
import { insforge } from '../lib/insforge';
import { isSameDay } from '../lib/dateUtils';

export async function getTips(
  date?: number, 
  category?: TipCategory | 'all', 
  status?: TipStatus
): Promise<Tip[]> {
  // 1. Try backend endpoint
  try {
    const params = new URLSearchParams();
    if (date) params.append('date', String(date));
    if (category && category !== 'all') params.append('category', category);
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
        }).map(t => ({
          ...t,
          category: normalizeCategory(t.category)
        }));
      }
    }
  } catch (err) {
    console.warn('Backend /api/tips fetch failed, falling back to direct InsForge query:', err);
  }

  // 2. Fallback to direct InsForge SDK query
  try {
    let query = insforge.database.from('tips').select('*').order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('InsForge getTips query error:', error);
      throw error;
    }
    
    let tips: Tip[] = (data || []).map(t => ({
      id: t.id,
      category: normalizeCategory(t.category),
      matches: typeof t.matches === 'string' ? JSON.parse(t.matches) : (t.matches || []),
      odds: t.odds ? Number(t.odds) : undefined,
      analysis: t.analysis || '',
      status: t.status || 'pending',
      bookingCode: t.booking_code || t.bookingCode || '',
      imageUrl: t.image_url || t.imageUrl || '',
      publishDate: Number(t.publish_date || t.publishDate || Date.now()),
      createdAt: Number(t.created_at || t.createdAt || Date.now())
    }));

    if (category && category !== 'all') {
      tips = tips.filter(t => t.category === category);
    }

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
    console.error('Error in getTips fallback:', error);
    return [];
  }
}

export async function createTip(adminId: string, tip: Omit<Tip, 'id' | 'createdAt'>): Promise<Tip> {
  const newId = 'tip_' + Date.now() + Math.random().toString(36).substring(2, 9);
  const now = Date.now();
  const normalizedCat = normalizeCategory(tip.category);

  // 1. Try backend route
  try {
    const res = await fetch('/api/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        adminId, 
        ...tip, 
        category: normalizedCat,
        id: newId 
      })
    });
    if (res.ok) {
      const created = await res.json();
      return {
        ...created,
        category: normalizeCategory(created.category)
      };
    }
  } catch (e) {
    console.warn('POST /api/tips failed, attempting direct insert:', e);
  }

  // 2. Direct insert fallback
  const { data, error } = await insforge.database.from('tips').insert([{
    id: newId,
    category: normalizedCat,
    matches: tip.matches,
    odds: tip.odds ? Number(tip.odds) : null,
    analysis: tip.analysis || '',
    status: tip.status || 'pending',
    booking_code: tip.bookingCode || null,
    image_url: tip.imageUrl || null,
    publish_date: tip.publishDate || now,
    created_at: now
  }]).select('*');
  
  if (error) {
    console.error('Direct InsForge insert failed:', error);
    throw error;
  }
  if (!data || data.length === 0) throw new Error('Failed to create tip: No response returned');
  
  const saved = data[0];
  return {
    id: saved.id,
    category: normalizeCategory(saved.category),
    matches: typeof saved.matches === 'string' ? JSON.parse(saved.matches) : (saved.matches || []),
    odds: saved.odds ? Number(saved.odds) : undefined,
    analysis: saved.analysis || '',
    status: saved.status,
    bookingCode: saved.booking_code || '',
    imageUrl: saved.image_url || '',
    publishDate: Number(saved.publish_date),
    createdAt: Number(saved.created_at)
  };
}

export async function updateTip(adminId: string, id: string, updates: Partial<Tip>): Promise<void> {
  // 1. Try backend route
  try {
    const res = await fetch(`/api/tips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...updates })
    });
    if (res.ok) return;
  } catch (e) {
    console.warn(`PUT /api/tips/${id} failed, attempting direct update:`, e);
  }

  // 2. Direct update fallback
  const dbUpdates: any = {};
  if (updates.category !== undefined) dbUpdates.category = normalizeCategory(updates.category);
  if (updates.matches !== undefined) dbUpdates.matches = updates.matches;
  if (updates.odds !== undefined) dbUpdates.odds = updates.odds ? Number(updates.odds) : null;
  if (updates.analysis !== undefined) dbUpdates.analysis = updates.analysis;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.bookingCode !== undefined) dbUpdates.booking_code = updates.bookingCode;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
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
    console.warn(`DELETE /api/tips/${id} failed, attempting direct delete:`, e);
  }

  const { error } = await insforge.database.from('tips').delete().eq('id', id);
  if (error) throw error;
}

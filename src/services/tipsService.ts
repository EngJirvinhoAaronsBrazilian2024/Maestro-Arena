import { Tip, TipCategory, TipStatus } from '../types/tips';
import { insforge } from '../lib/insforge';
import { isSameDay } from '../lib/dateUtils';

export async function getTips(date?: number, category?: TipCategory, status?: TipStatus): Promise<Tip[]> {
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
      matches: t.matches,
      odds: t.odds,
      analysis: t.analysis,
      status: t.status,
      bookingCode: t.booking_code,
      publishDate: t.publish_date,
      createdAt: t.created_at
    }));

    if (date) {
      tips = tips.filter(t => isSameDay(t.publishDate, date));
    }
    
    return tips;
  } catch (error) {
    console.error("Error in getTips:", error);
    return [];
  }
}

export async function createTip(adminId: string, tip: Omit<Tip, 'id' | 'createdAt'>): Promise<Tip> {
  const newId = 'tip_' + Date.now() + Math.random().toString(36).substring(2, 9);
  const now = Date.now();
  
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
  const { error } = await insforge.database.from('tips').delete().eq('id', id);
  if (error) throw error;
}

import { Router } from 'express';
import { getInsforgeAdmin } from '../insforgeAdmin.js';
import fs from 'fs';
import path from 'path';

const router = Router();
const TIPS_FILE = path.join(process.cwd(), 'src/server/data/tips.json');

function getFallbackTips() {
  try {
    if (!fs.existsSync(TIPS_FILE)) {
      fs.writeFileSync(TIPS_FILE, '[]');
    }
    const data = fs.readFileSync(TIPS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveFallbackTips(tips: any[]) {
  try {
    fs.writeFileSync(TIPS_FILE, JSON.stringify(tips, null, 2));
  } catch (e) {}
}

function normalizeTipFromDb(t: any) {
  return {
    id: t.id,
    category: t.category,
    matches: typeof t.matches === 'string' ? JSON.parse(t.matches) : (t.matches || []),
    odds: t.odds,
    analysis: t.analysis,
    status: t.status,
    bookingCode: t.booking_code || t.bookingCode || '',
    publishDate: Number(t.publish_date || t.publishDate || Date.now()),
    createdAt: Number(t.created_at || t.createdAt || Date.now())
  };
}

function isSameDayBackend(ts1: number | string, ts2: number | string): boolean {
  const d1 = new Date(Number(ts1));
  const d2 = new Date(Number(ts2));
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  const localYMD1 = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}-${String(d1.getDate()).padStart(2, '0')}`;
  const localYMD2 = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
  const utcYMD1 = d1.toISOString().slice(0, 10);
  const utcYMD2 = d2.toISOString().slice(0, 10);
  return localYMD1 === localYMD2 || utcYMD1 === utcYMD2 || localYMD1 === utcYMD2 || utcYMD1 === localYMD2;
}

router.get('/', async (req, res) => {
  try {
    const { date, category, status } = req.query;
    const admin = getInsforgeAdmin();
    
    let query = admin.database
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', String(category));
    }
    if (status) {
      query = query.eq('status', String(status));
    }

    const { data, error } = await query;
    if (error) {
      console.warn('InsForge tips query error, falling back to local file:', error);
      let local = getFallbackTips();
      if (category) local = local.filter((t: any) => t.category === category);
      if (status) local = local.filter((t: any) => t.status === status);
      if (date) local = local.filter((t: any) => isSameDayBackend(t.publishDate, Number(date)));
      return res.json(local);
    }

    let tips = (data || []).map(normalizeTipFromDb);

    if (date) {
      tips = tips.filter((t: any) => isSameDayBackend(t.publishDate, Number(date)));
    }

    res.json(tips);
  } catch (error: any) {
    console.error('Error in GET /api/tips:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { adminId, ...tipData } = req.body;
    const newId = tipData.id || 'tip_' + Date.now() + Math.random().toString(36).substring(2, 9);
    const now = Date.now();
    const admin = getInsforgeAdmin();

    const dbPayload = {
      id: newId,
      category: tipData.category || 'single',
      matches: tipData.matches || [],
      odds: tipData.odds ? Number(tipData.odds) : null,
      analysis: tipData.analysis || '',
      status: tipData.status || 'pending',
      booking_code: tipData.bookingCode || null,
      publish_date: tipData.publishDate ? Number(tipData.publishDate) : now,
      created_at: now
    };

    const { data, error } = await admin.database
      .from('tips')
      .insert([dbPayload])
      .select('*');

    if (error) {
      console.error('InsForge tips insert error:', error);
      // fallback to file
      const tips = getFallbackTips();
      const localTip = { id: newId, ...tipData, createdAt: now };
      tips.push(localTip);
      saveFallbackTips(tips);
      return res.json(localTip);
    }

    const created = data?.[0] ? normalizeTipFromDb(data[0]) : { id: newId, ...tipData, createdAt: now };
    res.json(created);
  } catch (error: any) {
    console.error('Error in POST /api/tips:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, ...updateData } = req.body;
    const admin = getInsforgeAdmin();

    const dbUpdates: any = {};
    if (updateData.category !== undefined) dbUpdates.category = updateData.category;
    if (updateData.matches !== undefined) dbUpdates.matches = updateData.matches;
    if (updateData.odds !== undefined) dbUpdates.odds = updateData.odds ? Number(updateData.odds) : null;
    if (updateData.analysis !== undefined) dbUpdates.analysis = updateData.analysis;
    if (updateData.status !== undefined) dbUpdates.status = updateData.status;
    if (updateData.bookingCode !== undefined) dbUpdates.booking_code = updateData.bookingCode;
    if (updateData.publishDate !== undefined) dbUpdates.publish_date = Number(updateData.publishDate);

    const { error } = await admin.database
      .from('tips')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('InsForge tips update error:', error);
      const tips = getFallbackTips();
      const index = tips.findIndex((t: any) => t.id === id);
      if (index !== -1) {
        tips[index] = { ...tips[index], ...updateData, id };
        saveFallbackTips(tips);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    const { error } = await admin.database.from('tips').delete().eq('id', id);
    if (error) {
      console.error('InsForge tips delete error:', error);
      let tips = getFallbackTips();
      tips = tips.filter((t: any) => t.id !== id);
      saveFallbackTips(tips);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

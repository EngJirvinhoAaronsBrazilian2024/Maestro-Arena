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

function normalizeCategory(cat: string | undefined): 'single' | 'maestro2+' | 'odd4+' {
  if (!cat) return 'single';
  const clean = String(cat).toLowerCase().trim().replace(/[\s_-]+/g, '');
  if (clean.includes('maestro') || clean.includes('2+')) return 'maestro2+';
  if (clean.includes('odd') || clean.includes('4+')) return 'odd4+';
  return 'single';
}

function normalizeTipFromDb(t: any) {
  return {
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

    // Category filter
    if (category && category !== 'all') {
      const normCat = normalizeCategory(String(category));
      query = query.or(`category.eq.${normCat},category.eq.${category}`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', String(status));
    }

    const { data, error } = await query;
    if (error) {
      console.warn('InsForge tips query error, checking local fallback:', error);
      let local = getFallbackTips().map(normalizeTipFromDb);
      if (category && category !== 'all') {
        const norm = normalizeCategory(String(category));
        local = local.filter((t: any) => t.category === norm);
      }
      if (status && status !== 'all') {
        local = local.filter((t: any) => t.status === status);
      }
      if (date && date !== 'all') {
        local = local.filter((t: any) => isSameDayBackend(t.publishDate, Number(date)));
      }
      return res.json(local);
    }

    let tips = (data || []).map(normalizeTipFromDb);

    if (category && category !== 'all') {
      const norm = normalizeCategory(String(category));
      tips = tips.filter((t: any) => t.category === norm);
    }

    if (date && date !== 'all') {
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

    const normalizedCategory = normalizeCategory(tipData.category || 'single');

    const dbPayload = {
      id: newId,
      category: normalizedCategory,
      matches: tipData.matches || [],
      odds: tipData.odds ? Number(tipData.odds) : null,
      analysis: tipData.analysis || '',
      status: tipData.status || 'pending',
      booking_code: tipData.bookingCode || null,
      image_url: tipData.imageUrl || tipData.image_url || null,
      publish_date: tipData.publishDate ? Number(tipData.publishDate) : now,
      created_at: now
    };

    const { data, error } = await admin.database
      .from('tips')
      .insert([dbPayload])
      .select('*');

    if (error) {
      console.error('InsForge tips insert error:', error);
      return res.status(500).json({ error: error.message || 'Failed to insert tip into database' });
    }

    const created = data?.[0] ? normalizeTipFromDb(data[0]) : normalizeTipFromDb(dbPayload);
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
    if (updateData.category !== undefined) dbUpdates.category = normalizeCategory(updateData.category);
    if (updateData.matches !== undefined) dbUpdates.matches = updateData.matches;
    if (updateData.odds !== undefined) dbUpdates.odds = updateData.odds ? Number(updateData.odds) : null;
    if (updateData.analysis !== undefined) dbUpdates.analysis = updateData.analysis;
    if (updateData.status !== undefined) dbUpdates.status = updateData.status;
    if (updateData.bookingCode !== undefined || updateData.booking_code !== undefined) {
      dbUpdates.booking_code = updateData.bookingCode !== undefined ? updateData.bookingCode : updateData.booking_code;
    }
    if (updateData.imageUrl !== undefined || updateData.image_url !== undefined) {
      dbUpdates.image_url = updateData.imageUrl || updateData.image_url || null;
    }
    if (updateData.publishDate !== undefined || updateData.publish_date !== undefined) {
      dbUpdates.publish_date = Number(updateData.publishDate || updateData.publish_date);
    }

    const { error } = await admin.database
      .from('tips')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('InsForge tips update error:', error);
      return res.status(500).json({ error: error.message || 'Failed to update tip in database' });
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
      return res.status(500).json({ error: error.message || 'Failed to delete tip from database' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

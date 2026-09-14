import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const TIPS_FILE = path.join(process.cwd(), 'src/server/data/tips.json');

function getTipsData() {
  try {
    if (!fs.existsSync(TIPS_FILE)) {
      fs.writeFileSync(TIPS_FILE, '[]');
    }
    const data = fs.readFileSync(TIPS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading tips:', err);
    return [];
  }
}

function saveTipsData(tips: any[]) {
  fs.writeFileSync(TIPS_FILE, JSON.stringify(tips, null, 2));
}

router.get('/', (req, res) => {
  try {
    const { date, category, status } = req.query;
    let tips = getTipsData();

    // Sort by createdAt desc
    tips.sort((a: any, b: any) => b.createdAt - a.createdAt);

    if (date) {
      const targetDate = Number(date);
      const startOfDay = new Date(targetDate).setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate).setHours(23, 59, 59, 999);
      tips = tips.filter((t: any) => t.publishDate >= startOfDay && t.publishDate <= endOfDay);
    }
    
    if (category) {
      tips = tips.filter((t: any) => t.category === category);
    }

    if (status) {
      tips = tips.filter((t: any) => t.status === status);
    }

    res.json(tips);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { adminId, ...tipData } = req.body;
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    const tips = getTipsData();
    const newTip = {
      id: 'tip_' + Date.now() + Math.random().toString(36).substring(2, 9),
      ...tipData,
      createdAt: Date.now()
    };
    
    tips.push(newTip);
    saveTipsData(tips);
    
    res.json(newTip);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, ...updateData } = req.body;
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    const tips = getTipsData();
    const index = tips.findIndex((t: any) => t.id === id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });

    tips[index] = { ...tips[index], ...updateData, id }; // Ensure ID remains
    saveTipsData(tips);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.query;
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    let tips = getTipsData();
    tips = tips.filter((t: any) => t.id !== id);
    saveTipsData(tips);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

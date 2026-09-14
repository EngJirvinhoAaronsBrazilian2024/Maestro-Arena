import { Router } from 'express';
import { getInsforgeAdmin } from '../insforgeAdmin.js';
import { generateQuizQuestions } from '../services/aiQuizService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { 
      category, 
      competition, 
      season, 
      difficulty, 
      count, 
      type, 
      dataSource, 
      language,
      adminId
    } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized: adminId required' });
    }

    const result = await generateQuizQuestions(
      category,
      competition,
      season,
      difficulty,
      Number(count) || 5,
      type,
      dataSource,
      language || 'English',
      adminId
    );

    res.json(result);
  } catch (error: any) {
    console.error('Quiz Generation Route Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Review Endpoints
router.post('/:id/published', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await getInsforgeAdmin().database.from('quiz_questions').update({
      status: 'PUBLISHED',
      updated_at: Date.now()
    }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, status: 'PUBLISHED' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/rejected', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await getInsforgeAdmin().database.from('quiz_questions').update({
      status: 'REJECTED',
      updated_at: Date.now()
    }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, status: 'REJECTED' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updated_at = Date.now();
    const { error } = await getInsforgeAdmin().database.from('quiz_questions').update(updateData).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await getInsforgeAdmin().database.from('quiz_questions').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

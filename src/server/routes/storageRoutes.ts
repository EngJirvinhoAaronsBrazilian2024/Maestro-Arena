import { Router } from 'express';
import { getInsforgeAdmin } from '../insforgeAdmin.js';

const router = Router();
const BUCKET_NAME = 'images';

// Ensure bucket exists helper
async function ensureBucket() {
  const admin: any = getInsforgeAdmin();
  try {
    const buckets = await admin.http.get('/api/storage/buckets');
    const exists = Array.isArray(buckets) && buckets.some((b: any) => b.name === BUCKET_NAME || b.bucketName === BUCKET_NAME);
    if (!exists) {
      await admin.http.post('/api/storage/buckets', {
        bucketName: BUCKET_NAME,
        public: true
      });
    }
  } catch (e) {
    // Ignore if already created
  }
}

// POST /api/storage/upload
// Accepts JSON with { filename, contentType, base64 (or data) }
router.post('/upload', async (req, res) => {
  try {
    await ensureBucket();
    const { filename, contentType, base64, data } = req.body;
    const rawData = base64 || data;

    if (!rawData) {
      return res.status(400).json({ error: 'Missing image data (base64 string required)' });
    }

    // Extract base64 payload if it includes data URL prefix
    let cleanBase64 = rawData;
    let mimeType = contentType || 'image/jpeg';

    if (rawData.includes(';base64,')) {
      const parts = rawData.split(';base64,');
      const mimeMatch = parts[0].match(/data:(.*?)$/);
      if (mimeMatch) mimeType = mimeMatch[1];
      cleanBase64 = parts[1];
    }

    const buffer = Buffer.from(cleanBase64, 'base64');
    const blob = new Blob([buffer], { type: mimeType });

    const sanitizedBase = (filename || 'upload.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeKey = `${Date.now()}-${sanitizedBase}`;

    const admin = getInsforgeAdmin();
    const uploadRes = await admin.storage.from(BUCKET_NAME).upload(safeKey, blob);

    if (uploadRes.error) {
      console.error('InsForge storage upload error:', uploadRes.error);
      return res.status(500).json({ error: uploadRes.error.message || 'Storage upload failed' });
    }

    const key = uploadRes.data?.key || safeKey;
    const pubUrlRes = admin.storage.from(BUCKET_NAME).getPublicUrl(key);
    const publicUrl = pubUrlRes.data?.publicUrl || uploadRes.data?.url;

    res.json({
      success: true,
      key,
      url: publicUrl,
      bucket: BUCKET_NAME
    });
  } catch (err: any) {
    console.error('Error in /api/storage/upload:', err);
    res.status(500).json({ error: err.message || 'Failed to upload image' });
  }
});

// GET /api/storage/url/:key
router.get('/url/:key(*)', async (req, res) => {
  try {
    const key = req.params.key;
    const admin = getInsforgeAdmin();
    const pubUrlRes = admin.storage.from(BUCKET_NAME).getPublicUrl(key);
    res.json({ url: pubUrlRes.data?.publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router } from 'express';
import { getInsforgeAdmin } from '../insforgeAdmin.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

router.post('/role', async (req, res) => {
  const { userId, newRole, adminId } = req.body;
  const insforgeAdmin = getInsforgeAdmin();

  
  if (!userId || !newRole || !adminId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Verify caller is actually an admin
    const { data: callerData, error: callerError } = await insforgeAdmin.database
        .from('users')
        .select('role')
        .eq('id', adminId)
        .single();
        
    if (callerError || !callerData || callerData.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Only admins can change roles.' });
    }

    // 2. Perform the update
    const { error: updateError } = await insforgeAdmin.database
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);
      
    if (updateError) {
        throw updateError;
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:userId', async (req, res) => {
  const { userId } = req.params;
  const adminId = req.query.adminId as string;
  const insforgeAdmin = getInsforgeAdmin();
  
  if (!userId || !adminId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Verify caller is actually an admin
    const { data: callerData, error: callerError } = await insforgeAdmin.database
        .from('users')
        .select('role')
        .eq('id', adminId)
        .single();
        
    if (callerError || !callerData || callerData.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Only admins can delete users.' });
    }

    // 2. Perform the deletion (deletes auth user and cascading users record if using proper SDK, but we'll just delete from 'users' table or auth API)
    const { error: updateError } = await insforgeAdmin.database
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (updateError) {
        throw updateError;
    }
    
    // Attempt to delete auth user as well
    try {
        // @ts-ignore
        if (insforgeAdmin.auth.admin && insforgeAdmin.auth.admin.deleteUser) {
           // @ts-ignore
           await insforgeAdmin.auth.admin.deleteUser(userId);
        }
    } catch (e) {
        console.warn("Could not delete from auth provider, or method doesn't exist:", e);
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

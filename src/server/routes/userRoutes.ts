import { Router } from 'express';
import { getInsforgeAdmin } from '../insforgeAdmin.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

const SPECIAL_ADMIN_ID = '2886ae6d-b563-44a3-b4b8-ae932cc188ad';

router.post('/role', async (req, res) => {
  const { userId, newRole, adminId } = req.body;
  const insforgeAdmin = getInsforgeAdmin();

  if (!userId || !newRole || !adminId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Prevent demoting primary superadmin
  if (userId === SPECIAL_ADMIN_ID && newRole !== 'admin') {
    return res.status(400).json({ error: 'Cannot alter role of primary administrator' });
  }

  try {
    // 1. Verify caller is actually an admin
    if (adminId !== SPECIAL_ADMIN_ID) {
      const { data: callerData, error: callerError } = await insforgeAdmin.database
          .from('users')
          .select('role')
          .eq('id', adminId)
          .single();
          
      if (callerError || !callerData || callerData.role !== 'admin') {
          return res.status(403).json({ error: 'Unauthorized. Only admins can change roles.' });
      }
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

  // Protect master administrator account from deletion
  if (userId === SPECIAL_ADMIN_ID) {
    return res.status(400).json({ error: 'Primary administrator account cannot be deleted' });
  }

  try {
    // 1. Verify caller is actually an admin
    if (adminId !== SPECIAL_ADMIN_ID) {
      const { data: callerData, error: callerError } = await insforgeAdmin.database
          .from('users')
          .select('role')
          .eq('id', adminId)
          .single();
          
      if (callerError || !callerData || callerData.role !== 'admin') {
          return res.status(403).json({ error: 'Unauthorized. Only admins can delete users.' });
      }
    }

    // Clean up user-related records
    try {
      await insforgeAdmin.database.from('bookmarks').delete().eq('user_id', userId);
      await insforgeAdmin.database.from('quiz_results').delete().eq('user_id', userId);
      await insforgeAdmin.database.from('quiz_stats').delete().eq('user_id', userId);
      await insforgeAdmin.database.from('poll_votes').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Notice cleaning up dependent records for user:', e);
    }

    // 2. Perform the deletion from users table
    const { error: deleteError } = await insforgeAdmin.database
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (deleteError) {
        throw deleteError;
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

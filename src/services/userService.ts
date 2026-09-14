import { insforge } from '../lib/insforge';

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'editor' | 'moderator' | 'admin';
  createdAt: number;
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const { data, error } = await insforge.database
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return (data || []).map(u => ({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      role: u.role,
      createdAt: u.created_at
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: string, adminId: string): Promise<void> {
  try {
    const res = await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newRole, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update role');
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

export async function deleteUserRecord(userId: string, adminId: string): Promise<void> {
  try {
    const res = await fetch(`/api/users/${userId}?adminId=${adminId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

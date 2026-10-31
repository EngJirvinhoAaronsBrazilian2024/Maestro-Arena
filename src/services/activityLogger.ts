/**
 * Client-side Activity Logger for Maestro Arena
 * Automatically dispatches user interactions to /api/activity/log
 */

export interface LogPayload {
  action: string;
  category: 'auth' | 'quiz' | 'tips' | 'matches' | 'news' | 'admin' | 'engagement';
  description: string;
  details?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export async function logActivity(payload: LogPayload) {
  try {
    // If user info not explicitly passed, try reading from localStorage/session
    let userId = payload.userId;
    let userEmail = payload.userEmail;
    let userName = payload.userName;

    if (!userEmail) {
      try {
        const storedUser = localStorage.getItem('insforge_user') || localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userId = userId || parsed.id;
          userEmail = userEmail || parsed.email;
          userName = userName || parsed.display_name || parsed.name || userEmail?.split('@')[0];
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    await fetch('/api/activity/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        userId: userId || 'anonymous',
        userEmail: userEmail || 'visitor@maestroarena.com',
        userName: userName || userEmail?.split('@')[0] || 'App Visitor'
      })
    });
  } catch (err) {
    // Silently ignore background logging errors to never disrupt the user experience
    console.debug('Activity log error:', err);
  }
}

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../services/news/hooks';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Bookmark, User, Mail, Shield, LogOut } from 'lucide-react';

export function UserProfile() {
  const { user, profile, logout } = useAuth();
  const { bookmarks } = useBookmarks(user?.uid);

  if (!user || !profile) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold">Please log in to view your profile</h2>
        <Link to="/login" className="mt-4 text-blue-600 hover:underline">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account and view saved content.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-blue-600">
              <User className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.displayName || 'Sports Fan'}</h2>
              <div className="flex items-center justify-center gap-2 mt-1 text-sm text-slate-500">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1 text-sm text-slate-500">
                <Shield className="h-4 w-4" />
                Role: <span className="capitalize">{profile.role}</span>
              </div>
            </div>

            <div className="w-full space-y-2 pt-4 border-t border-slate-200">
              {profile.role === 'admin' && (
                <Link to="/admin" className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-100 transition-colors">
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}
              {(profile.role === 'admin' || profile.role === 'editor') && (
                <Link to="/editor" className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-50 text-purple-700 px-4 py-2 text-sm font-medium hover:bg-purple-100 transition-colors">
                  <User className="h-4 w-4" />
                  Editor Dashboard
                </Link>
              )}
            </div>

            <button 
              onClick={() => logout()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-blue-500" />
              Saved Articles ({bookmarks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookmarks.length > 0 ? (
              <div className="space-y-3">
                {bookmarks.map((articleId) => (
                  <div key={articleId} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <Link to={`/news/${articleId}`} className="font-medium hover:text-blue-600 transition-colors">
                        View Saved Article
                      </Link>
                      <p className="text-xs text-slate-500 mt-1">ID: {articleId}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 p-8 text-center text-slate-500">
                You haven't saved any articles yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

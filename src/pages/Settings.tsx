import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Monitor, Bell, Shield } from 'lucide-react';

export function Settings() {
    const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your app preferences and settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-slate-500">Receive alerts for live matches and breaking news. (Coming soon)</p>
            </div>
            <button disabled className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200">
              <span className="inline-block h-4 w-4 transform translate-x-1 rounded-full bg-white" />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Email Address</p>
            <p className="text-sm text-slate-500">{user?.email || 'Not logged in'}</p>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <button className="text-sm font-medium text-blue-600 hover:underline">
              Change Password
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

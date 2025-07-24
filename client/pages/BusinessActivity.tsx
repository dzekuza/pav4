import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { SearchHeader } from '../components/SearchHeader';

interface ClickLog {
  id: number;
  affiliateId: string;
  productId: string;
  userId?: number;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  ip?: string;
}

export default function BusinessActivity() {
  const [logs, setLogs] = useState<ClickLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/business/activity', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else if (res.status === 401) {
        navigate('/business-login');
      } else {
        setError('Failed to fetch activity logs');
      }
    } catch {
      setError('Network error fetching activity logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader showBackButton={true} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Activity</h1>
          <Button variant="outline" onClick={() => navigate('/business-dashboard')}>Back to Dashboard</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>User Visits to Your Product URLs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Loading...</div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">{error}</div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No activity found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Product URL</th>
                      <th className="px-2 py-2 text-left">User ID</th>
                      <th className="px-2 py-2 text-left">Referrer</th>
                      <th className="px-2 py-2 text-left">UTM Params</th>
                      <th className="px-2 py-2 text-left">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      let utm = '';
                      try {
                        const u = new URL(log.productId);
                        utm = Array.from(u.searchParams.entries())
                          .filter(([k]) => k.startsWith('utm_'))
                          .map(([k, v]) => `${k}=${v}`)
                          .join('&');
                      } catch {}
                      return (
                        <tr key={log.id} className="border-b last:border-0">
                          <td className="px-2 py-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-2 py-2 max-w-xs truncate">
                            <a href={log.productId} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                              {log.productId}
                            </a>
                          </td>
                          <td className="px-2 py-2">{log.userId || '-'}</td>
                          <td className="px-2 py-2 max-w-xs truncate">{log.referrer || '-'}</td>
                          <td className="px-2 py-2 max-w-xs truncate">{utm || '-'}</td>
                          <td className="px-2 py-2">{log.ip || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
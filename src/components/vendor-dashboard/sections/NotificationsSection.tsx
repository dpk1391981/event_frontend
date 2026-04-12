'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Bell, CheckCheck, MessageSquare, Wallet, CreditCard,
  AlertCircle, Info, RefreshCw,
} from 'lucide-react';
import { vendorPanelApi } from '@/lib/api';

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  new_lead:             { icon: MessageSquare, color: 'text-blue-600',  bg: 'bg-blue-50' },
  lead_reminder:        { icon: AlertCircle,   color: 'text-red-600',   bg: 'bg-red-50' },
  token_low:            { icon: Wallet,        color: 'text-amber-600', bg: 'bg-amber-50' },
  subscription_expiry:  { icon: CreditCard,    color: 'text-purple-600', bg: 'bg-purple-50' },
  weekly_leads:         { icon: Bell,          color: 'text-green-600', bg: 'bg-green-50' },
  system:               { icon: Info,          color: 'text-gray-600',  bg: 'bg-gray-50' },
};

function fmtTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return 'Just now';
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function NotificationsSection({
  vendorId, onRead,
}: {
  vendorId?: number;
  onRead?: () => void;
}) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorPanelApi.getNotifications(page) as any;
      setNotifications(res.data ?? []);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: number) => {
    await vendorPanelApi.markNotifRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    onRead?.();
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await vendorPanelApi.markAllNotifsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      onRead?.();
    } finally {
      setMarkingAll(false);
    }
  };

  const unread = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100" />)}</div>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
          {unread > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unread} unread</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">No notifications</h3>
          <p className="text-sm text-gray-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-2xl border p-4 flex items-start gap-3 transition-all ${
                  !notif.isRead ? 'border-red-100 bg-red-50/20 shadow-sm' : 'border-gray-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{fmtTime(notif.createdAt)}</span>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shrink-0"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {notif.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">{notif.channel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 20 >= meta.total}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

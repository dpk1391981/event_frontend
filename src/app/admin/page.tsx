'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await adminApi.dashboard();
        setStats(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const CARDS = stats ? [
    { label: 'Total Vendors',     value: stats.totalVendors,         icon: '🏢', color: 'bg-blue-50 border-blue-200 text-blue-700',   href: '/admin/vendors' },
    { label: 'Pending Vendors',   value: stats.pendingVendors,       icon: '⏳', color: 'bg-amber-50 border-amber-200 text-amber-700', href: '/admin/vendors?status=pending' },
    { label: 'Total Leads',       value: stats.totalLeads,           icon: '📋', color: 'bg-purple-50 border-purple-200 text-purple-700', href: '/admin/leads' },
    { label: 'Token Requests',    value: stats.pendingTokenRequests, icon: '🪙', color: 'bg-rose-50 border-rose-200 text-rose-700',  href: '/admin/tokens' },
    { label: 'Total Users',       value: stats.totalUsers,           icon: '👥', color: 'bg-indigo-50 border-indigo-200 text-indigo-700', href: '#' },
    { label: 'Active Vendors',    value: stats.activeVendors ?? (stats.totalVendors - stats.pendingVendors), icon: '✅', color: 'bg-green-50 border-green-200 text-green-700', href: '/admin/vendors?status=active' },
  ] : [];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Platform-wide control and monitoring</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {CARDS.map((c) => (
              <Link key={c.label} href={c.href}
                className={`${c.color} border rounded-2xl p-5 hover:shadow-md transition`}>
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-2xl font-extrabold">{c.value ?? 0}</div>
                <div className="text-xs font-semibold mt-0.5 opacity-80">{c.label}</div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/vendors?status=pending"
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 transition">
            <span className="text-2xl">🏢</span>
            <div><p className="font-bold text-sm">Approve Vendors</p><p className="text-xs text-blue-200">{stats?.pendingVendors || 0} pending</p></div>
          </Link>
          <Link href="/admin/tokens"
            className="flex items-center gap-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-4 transition">
            <span className="text-2xl">🪙</span>
            <div><p className="font-bold text-sm">Token Requests</p><p className="text-xs text-amber-100">{stats?.pendingTokenRequests || 0} awaiting approval</p></div>
          </Link>
          <Link href="/admin/leads"
            className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl p-4 transition">
            <span className="text-2xl">📋</span>
            <div><p className="font-bold text-sm">All Leads</p><p className="text-xs text-purple-200">{stats?.totalLeads || 0} total leads</p></div>
          </Link>
        </div>

        {/* Recent vendors */}
        {stats?.recentVendors?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-gray-900">Recent Vendors</h2>
              <Link href="/admin/vendors" className="text-xs text-red-600 font-bold">View all →</Link>
            </div>
            <div className="space-y-2">
              {stats.recentVendors.slice(0, 5).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{v.businessName}</p>
                    <p className="text-xs text-gray-400">{v.city?.name} · {new Date(v.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    v.status === 'active' ? 'bg-green-100 text-green-700' :
                    v.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'}`}>{v.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

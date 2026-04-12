'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Bookmark, Activity, User, LogOut,
  Menu, X, Star, Bell, Package2, MessageSquare, Heart,
  CalendarDays, ChevronRight, MapPin, Phone, Clock,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { leadsApi, authApi, api } from '@/lib/api';

type UserSection = 'overview' | 'bookings' | 'saved' | 'activity' | 'profile';

const NAV: Array<{ id: UserSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview',     icon: LayoutDashboard },
  { id: 'bookings', label: 'My Bookings',  icon: CalendarDays },
  { id: 'saved',    label: 'Saved Packages', icon: Heart },
  { id: 'activity', label: 'My Activity',  icon: Activity },
  { id: 'profile',  label: 'Profile',      icon: User },
];

// ─── Overview ─────────────────────────────────────────────────────────────────

function UserOverview({ user, leads }: { user: any; leads: any[] }) {
  const bookedLeads = leads.filter(l => l.status === 'booked');
  const activeLeads = leads.filter(l => !['booked', 'closed', 'rejected'].includes(l.status));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
        <p className="text-red-200 text-sm">Welcome back,</p>
        <h2 className="text-2xl font-bold mt-1">{user?.name}</h2>
        <p className="text-red-100 text-sm mt-1">Plan your next event with ease</p>
        <a
          href="/plan"
          className="inline-flex items-center gap-2 mt-4 bg-white text-red-600 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-red-50 transition-all"
        >
          Plan an Event <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Inquiries', value: leads.length, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: activeLeads.length, icon: Activity, color: 'text-amber-600 bg-amber-50' },
          { label: 'Booked', value: bookedLeads.length, icon: CalendarDays, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {leads.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Inquiries</h3>
          <div className="space-y-3">
            {leads.slice(0, 3).map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{lead.eventType ?? 'Event Inquiry'}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {lead.city?.name ?? 'Not specified'}
                    <span className="mx-1">·</span>
                    <Clock className="w-3 h-3" /> {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  lead.status === 'booked' ? 'bg-green-100 text-green-700' :
                  lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                } capitalize`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

function MyBookings({ leads }: { leads: any[] }) {
  const bookings = leads.filter(l => l.status === 'booked' || l.status === 'contacted' || l.status === 'in_progress');

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 mb-1">No bookings yet</h3>
        <p className="text-sm text-gray-400 mb-4">Your confirmed bookings will appear here</p>
        <a href="/plan" className="inline-block px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
          Plan an Event
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">My Bookings</h2>
      {bookings.map((lead: any) => (
        <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900">{lead.eventType ?? 'Event'}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {lead.city?.name ?? 'Not specified'}
              </p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              lead.status === 'booked' ? 'bg-green-100 text-green-700' :
              lead.status === 'contacted' ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            } capitalize`}>
              {lead.status.replace('_', ' ')}
            </span>
          </div>
          {lead.vendor && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">{lead.vendor.businessName}</p>
                <p className="text-xs text-gray-500">Vendor</p>
              </div>
              {lead.vendor.phone && (
                <a
                  href={`tel:${lead.vendor.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700"
                >
                  <Phone className="w-3 h-3" /> Call
                </a>
              )}
            </div>
          )}
          {lead.eventDate && (
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              Event Date: {new Date(lead.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Activity ─────────────────────────────────────────────────────────────────

function MyActivity({ leads }: { leads: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">My Activity</h2>
      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Activity className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">No activity yet</h3>
          <p className="text-sm text-gray-400">Your lead inquiries and vendor interactions will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {leads.map((lead: any) => (
            <div key={lead.id} className="px-5 py-4 hover:bg-gray-50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Inquiry for <strong>{lead.eventType ?? 'Event'}</strong>
                    {lead.vendor && <span> → {lead.vendor.businessName}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {lead.city?.name ?? '—'}
                    {lead.budget && <span>· Budget: ₹{Number(lead.budget).toLocaleString('en-IN')}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    lead.status === 'booked' ? 'bg-green-100 text-green-700' :
                    lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    lead.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  } capitalize`}>
                    {lead.status.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function UserProfile({ user }: { user: any }) {
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({ name: form.name, phone: form.phone });
      setMsg('Profile updated!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      <h2 className="text-lg font-bold text-gray-900">Profile Settings</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </div>
        {msg && <p className={`text-sm ${msg.includes('Failed') ? 'text-red-600' : 'text-green-700'}`}>{msg}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 text-sm transition-all"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Account Info</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Member since</span>
            <span className="font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Account type</span>
            <span className="font-medium capitalize">{user?.role ?? 'User'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function UserDashboardShell() {
  const { user, logout } = useAppStore();
  const router = useRouter();
  const [active, setActive] = useState<UserSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leads/my', { params: { limit: 50 } })
      .then(res => setLeads(res.data?.data ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const navigate = (s: UserSection) => {
    setActive(s);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">PlanToday</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-400 font-medium uppercase tracking-wide">My Account</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === id ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 capitalize">
            {NAV.find(n => n.id === active)?.label ?? 'Dashboard'}
          </h1>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}
            </div>
          ) : (
            <>
              {active === 'overview' && <UserOverview user={user} leads={leads} />}
              {active === 'bookings' && <MyBookings leads={leads} />}
              {active === 'saved'    && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-700 mb-1">Saved Packages</h3>
                  <p className="text-sm text-gray-400 mb-4">Browse vendors and save packages you like</p>
                  <a href="/search" className="inline-block px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
                    Browse Vendors
                  </a>
                </div>
              )}
              {active === 'activity' && <MyActivity leads={leads} />}
              {active === 'profile'  && <UserProfile user={user} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

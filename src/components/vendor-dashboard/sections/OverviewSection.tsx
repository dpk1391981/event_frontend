'use client';

import {
  MessageSquare, TrendingUp, CheckCircle, Wallet,
  ArrowUpRight, ArrowRight, AlertCircle, Star, Package2, Wrench,
  ChevronRight, Users, Calendar,
} from 'lucide-react';
import type { DashboardSection } from '../VendorDashboardShell';

interface Props {
  data: any;
  onNavigate: (section: DashboardSection) => void;
}

function StatCard({
  label, value, sub, icon: Icon, color, onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'red' | 'blue' | 'green' | 'amber';
  onClick?: () => void;
}) {
  const colors = {
    red:   'bg-red-50 text-red-600 border-red-100',
    blue:  'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  const iconColors = {
    red:   'bg-red-100 text-red-600',
    blue:  'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:border-red-100 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function OverviewSection({ data, onNavigate }: Props) {
  if (!data) return null;

  const conversionRate = data.conversionRate ?? 0;
  const profileScore = data.profileScore ?? 0;

  return (
    <div className="space-y-6">
      {/* Alert: pending lead actions */}
      {data.newLeads > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">
                {data.newLeads} new lead{data.newLeads > 1 ? 's' : ''} waiting
              </p>
              <p className="text-xs text-red-500">Respond within 48 hours to avoid reminders</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('leads')}
            className="flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            View <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subscription banner for free users */}
      {!data.subscription?.isPaid && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 text-white">
          <div>
            <p className="font-bold text-lg">Upgrade to Pro Plan</p>
            <p className="text-red-100 text-sm mt-1">Get unlimited leads, featured placement, and 5 weekly auto-assigned leads</p>
          </div>
          <button
            onClick={() => onNavigate('subscription')}
            className="mt-3 sm:mt-0 shrink-0 bg-white text-red-600 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-red-50 transition-all"
          >
            Upgrade — ₹499/mo
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={data.totalLeads}
          sub={`${data.newLeads} new`}
          icon={MessageSquare}
          color="red"
          onClick={() => onNavigate('leads')}
        />
        <StatCard
          label="Active Leads"
          value={data.activeLeads ?? data.contactedLeads}
          sub="In progress"
          icon={TrendingUp}
          color="blue"
          onClick={() => onNavigate('leads')}
        />
        <StatCard
          label="Booked"
          value={data.bookedLeads ?? data.convertedLeads}
          sub="Confirmed bookings"
          icon={CheckCircle}
          color="green"
          onClick={() => onNavigate('leads')}
        />
        <StatCard
          label="Token Balance"
          value={data.tokenBalance?.toLocaleString('en-IN') ?? 0}
          sub={data.subscription?.isPaid ? 'Unlimited (Pro)' : 'Free plan'}
          icon={Wallet}
          color="amber"
          onClick={() => onNavigate('wallet')}
        />
      </div>

      {/* Performance row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversion rate */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Conversion Rate</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              conversionRate >= 20 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {conversionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, conversionRate)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {data.bookedLeads ?? data.convertedLeads} of {data.totalLeads} leads converted
          </p>
        </div>

        {/* Profile score */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Profile Score</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              profileScore >= 80 ? 'bg-green-100 text-green-700' :
              profileScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            }`}>
              {profileScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                profileScore >= 80 ? 'bg-green-500' : profileScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${profileScore}%` }}
            />
          </div>
          <button onClick={() => onNavigate('profile')} className="text-xs text-red-600 hover:underline mt-2 flex items-center gap-1">
            Improve profile <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Package stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Packages</p>
            <Package2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.packageStats?.active ?? 0}
            <span className="text-sm font-normal text-gray-400 ml-1">active</span>
          </p>
          <button onClick={() => onNavigate('packages')} className="text-xs text-red-600 hover:underline mt-2 flex items-center gap-1">
            Manage packages <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'View Leads', icon: MessageSquare, section: 'leads' as DashboardSection, color: 'text-red-600 bg-red-50' },
            { label: 'Add Package', icon: Package2, section: 'packages' as DashboardSection, color: 'text-blue-600 bg-blue-50' },
            { label: 'My Wallet', icon: Wallet, section: 'wallet' as DashboardSection, color: 'text-amber-600 bg-amber-50' },
            { label: 'Edit Profile', icon: Users, section: 'profile' as DashboardSection, color: 'text-green-600 bg-green-50' },
          ].map(({ label, icon: Icon, section, color }) => (
            <button
              key={section}
              onClick={() => onNavigate(section)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-red-100 hover:shadow-sm transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-red-600">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

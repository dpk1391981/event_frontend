'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle, XCircle, Star, Zap, Shield, TrendingUp,
  CreditCard, Calendar, AlertCircle, Crown,
} from 'lucide-react';
import { vendorPanelApi } from '@/lib/api';

interface Props {
  vendorId?: number;
  isPaid?: boolean;
  onUpgraded?: () => void;
}

export default function SubscriptionSection({ vendorId, isPaid: initialPaid, onUpgraded }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [message, setMessage] = useState('');

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorPanelApi.getSubscription() as any;
      setData(res);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSubscription(); }, [loadSubscription]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    setMessage('');
    try {
      // TODO: integrate Razorpay payment gateway
      // For now, show a placeholder message
      setMessage('Payment gateway integration coming soon! Contact support to upgrade manually.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return <div className="space-y-4 animate-pulse">{[1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-gray-100" />)}</div>;
  }

  const sub = data?.subscription;
  const plans = data?.plans;
  const isPaid = data?.isPaid ?? initialPaid;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Current status */}
      <div className={`rounded-2xl p-5 border ${isPaid ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isPaid ? <Crown className="w-5 h-5 text-yellow-300" /> : <Shield className="w-5 h-5 text-gray-400" />}
              <p className={`text-lg font-bold ${isPaid ? 'text-white' : 'text-gray-900'}`}>
                {isPaid ? 'Pro Plan — Active' : 'Free Plan'}
              </p>
            </div>
            {isPaid && sub?.expiryDate && (
              <p className="text-red-100 text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Expires {new Date(sub.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {data.daysLeft !== null && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${data.daysLeft <= 7 ? 'bg-yellow-300 text-yellow-900' : 'bg-white/20'}`}>
                    {data.daysLeft}d left
                  </span>
                )}
              </p>
            )}
            {!isPaid && (
              <p className="text-gray-500 text-sm mt-1">Upgrade to unlock unlimited leads and more</p>
            )}
          </div>
          {isPaid && <Crown className="w-12 h-12 text-yellow-300 opacity-50" />}
        </div>
      </div>

      {/* Warning for expiring soon */}
      {isPaid && data.daysLeft !== null && data.daysLeft <= 7 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Subscription expiring soon</p>
            <p className="text-xs text-amber-600 mt-0.5">Renew before {new Date(sub?.expiryDate).toLocaleDateString('en-IN')} to avoid losing Pro features.</p>
          </div>
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Free Plan */}
        <div className={`bg-white rounded-2xl border shadow-sm p-6 ${!isPaid ? 'border-gray-300 ring-2 ring-gray-200' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Current</p>
              <h3 className="text-xl font-bold text-gray-900">Free Plan</h3>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-gray-900">₹0</span>
              <p className="text-xs text-gray-400">forever</p>
            </div>
          </div>
          <ul className="space-y-2.5 mb-6">
            {plans?.free?.features?.map((f: string) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
            {plans?.free?.limitations?.map((f: string) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                <XCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {!isPaid && (
            <div className="flex items-center justify-center py-2 rounded-xl bg-gray-50 text-gray-500 text-sm font-medium border border-gray-200">
              Current Plan
            </div>
          )}
        </div>

        {/* Pro Plan */}
        <div className={`rounded-2xl border shadow-sm p-6 relative overflow-hidden ${isPaid ? 'bg-gradient-to-br from-red-600 to-red-700 border-red-500 text-white' : 'bg-white border-red-200 ring-2 ring-red-500'}`}>
          {!isPaid && (
            <div className="absolute top-4 right-4">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-xs uppercase tracking-wide font-medium ${isPaid ? 'text-red-200' : 'text-red-500'}`}>Best Value</p>
              <h3 className={`text-xl font-bold ${isPaid ? 'text-white' : 'text-gray-900'}`}>Pro Plan</h3>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-bold ${isPaid ? 'text-white' : 'text-gray-900'}`}>
                ₹{selectedCycle === 'monthly' ? plans?.paid?.monthlyPrice ?? 499 : Math.round((plans?.paid?.yearlyPrice ?? 4999) / 12)}
              </span>
              <p className={`text-xs ${isPaid ? 'text-red-200' : 'text-gray-400'}`}>/month</p>
            </div>
          </div>

          {/* Billing toggle */}
          {!isPaid && (
            <div className="flex gap-2 mb-4">
              {(['monthly', 'yearly'] as const).map(cycle => (
                <button
                  key={cycle}
                  onClick={() => setSelectedCycle(cycle)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedCycle === cycle
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                  {cycle === 'yearly' && plans?.paid?.yearlySavings && (
                    <span className="ml-1.5 text-xs">
                      ({selectedCycle === 'yearly' ? '✓' : `${plans.paid.yearlySavings}% off`})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <ul className="space-y-2.5 mb-6">
            {plans?.paid?.features?.map((f: string) => (
              <li key={f} className={`flex items-start gap-2 text-sm ${isPaid ? 'text-red-100' : 'text-gray-700'}`}>
                <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isPaid ? 'text-yellow-300' : 'text-red-600'}`} />
                {f}
              </li>
            ))}
          </ul>

          {!isPaid ? (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-200"
            >
              {upgrading ? 'Processing...' : `Upgrade — ₹${selectedCycle === 'monthly' ? plans?.paid?.monthlyPrice ?? 499 : plans?.paid?.yearlyPrice ?? 4999}/${selectedCycle === 'monthly' ? 'mo' : 'yr'}`}
            </button>
          ) : (
            <div className="flex items-center justify-center py-2 rounded-xl bg-white/20 text-white text-sm font-bold border border-white/30">
              <Crown className="w-4 h-4 mr-2 text-yellow-300" /> Active Plan
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          {message}
        </div>
      )}

      {/* Feature comparison table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Feature</th>
                <th className="text-center px-4 py-3 text-gray-700 font-semibold">Free</th>
                <th className="text-center px-4 py-3 text-red-600 font-bold">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { feature: 'Lead connections', free: 'Token-based', pro: 'Unlimited' },
                { feature: 'Tokens per lead', free: '50 tokens', pro: 'Free (₹0)' },
                { feature: 'Weekly auto-leads', free: '—', pro: '5 leads/week' },
                { feature: 'Featured placement', free: false, pro: true },
                { feature: 'Priority search ranking', free: false, pro: true },
                { feature: 'Verified badge', free: false, pro: true },
                { feature: 'Analytics dashboard', free: 'Basic', pro: 'Advanced' },
              ].map(({ feature, free, pro }) => (
                <tr key={feature}>
                  <td className="px-6 py-3 text-gray-700">{feature}</td>
                  <td className="px-4 py-3 text-center">
                    {typeof free === 'boolean' ? (
                      free ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                    ) : <span className="text-gray-500">{free}</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {typeof pro === 'boolean' ? (
                      pro ? <CheckCircle className="w-4 h-4 text-red-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                    ) : <span className="text-red-600 font-semibold">{pro}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

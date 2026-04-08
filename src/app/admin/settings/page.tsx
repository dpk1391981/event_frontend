'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi } from '@/lib/api';

const GROUP_INFO: Record<string, { label: string; icon: string; desc: string }> = {
  tokens:       { label: 'Token Rules',     icon: '🪙', desc: 'Configure token costs and grants' },
  monetization: { label: 'Monetization',    icon: '💰', desc: 'Token-to-money conversion rates' },
  general:      { label: 'General',         icon: '⚙️', desc: 'Platform-wide settings' },
};

const DATA_TYPE_INPUT: Record<string, string> = {
  number:  'number',
  string:  'text',
  boolean: 'checkbox',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    (async () => {
      try {
        const data: any = await adminApi.getSettings();
        setSettings(Array.isArray(data) ? data : []);
        const initial: Record<string, string> = {};
        (Array.isArray(data) ? data : []).forEach((s: any) => { initial[s.key] = s.value; });
        setEdits(initial);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(edits).map(([key, value]) => ({ key, value }));
      await adminApi.bulkUpdateSettings(updates);
      showToast('Settings saved successfully! ✅');
    } catch (e: any) { showToast(e?.message || 'Failed to save'); }
    setSaving(false);
  };

  const groups = [...new Set(settings.map(s => s.group))];

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Platform Settings ⚙️</h1>
            <p className="text-gray-500 text-sm mt-0.5">All token rules and platform configuration</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow">
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-32" />)}</div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => {
              const groupSettings = settings.filter(s => s.group === group);
              const info = GROUP_INFO[group] || { label: group, icon: '⚙️', desc: '' };
              return (
                <div key={group} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <span className="text-xl">{info.icon}</span>
                    <div>
                      <h2 className="font-extrabold text-gray-900 text-sm">{info.label}</h2>
                      <p className="text-xs text-gray-400">{info.desc}</p>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {groupSettings.map(s => (
                      <div key={s.key} className="px-6 py-4 flex items-center justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{s.label || s.key}</p>
                          {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                          <p className="text-[10px] text-gray-300 font-mono mt-0.5">{s.key}</p>
                        </div>
                        <div className="shrink-0">
                          {s.dataType === 'boolean' ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={edits[s.key] === 'true'}
                                onChange={e => setEdits({...edits, [s.key]: e.target.checked ? 'true' : 'false'})}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" />
                            </label>
                          ) : (
                            <input
                              type={DATA_TYPE_INPUT[s.dataType] || 'text'}
                              value={edits[s.key] ?? s.value}
                              onChange={e => setEdits({...edits, [s.key]: e.target.value})}
                              className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm text-right font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Token economics preview */}
        {!loading && (
          <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="font-extrabold text-amber-800 mb-3">Token Economics Preview</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Welcome bonus', key: 'tokens_on_signup', suffix: 'tokens' },
                { label: 'Monthly grant', key: 'tokens_monthly', suffix: 'tokens' },
                { label: 'Post event cost', key: 'tokens_cost_post_event', suffix: 'tokens' },
                { label: 'Boost cost', key: 'tokens_cost_boost_event', suffix: 'tokens' },
                { label: 'Featured cost', key: 'tokens_cost_featured', suffix: 'tokens' },
                { label: '1 token value', key: 'token_rupee_value', suffix: '₹' },
              ].map(item => (
                <div key={item.key} className="bg-white rounded-xl p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="font-extrabold text-amber-700">{edits[item.key] || '—'} {item.suffix}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

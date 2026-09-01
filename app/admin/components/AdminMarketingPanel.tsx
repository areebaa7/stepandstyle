'use client';

import { useEffect, useState } from 'react';
import { AdminEmptyState, AdminLoadingState, AdminNotice } from './AdminAsyncState';

interface MarketingEvent {
  id: string;
  eventName: string;
  eventData: Record<string, unknown> | null;
  url: string | null;
  createdAt: string;
}

interface EventIdentity {
  ip?: string;
  user?: 'anonymous' | {
    email?: string;
    role?: string;
  };
}

interface MarketingSettings {
  ga4MeasurementId: string | null;
  gtmContainerId: string | null;
  googleAdsConversionId: string | null;
  metaPixelId: string | null;
  metaPixelEnabled: boolean;
  metaCapiToken: string | null;
}

export default function AdminMarketingPanel() {
  const [settings, setSettings] = useState<MarketingSettings>({
    ga4MeasurementId: '',
    gtmContainerId: '',
    googleAdsConversionId: '',
    metaPixelId: '',
    metaPixelEnabled: false,
    metaCapiToken: '',
  });
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [res, eventsRes] = await Promise.all([
          fetch('/api/admin/settings/marketing'),
          fetch('/api/admin/marketing/events')
        ]);
        
        const json = await res.json();
        const eventsJson = await eventsRes.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load marketing settings.');
        if (!eventsRes.ok || !eventsJson.success) throw new Error(eventsJson.error || 'Failed to load tracking events.');

        if (json.data) {
          setSettings({
            ga4MeasurementId: json.data.ga4MeasurementId || '',
            gtmContainerId: json.data.gtmContainerId || '',
            googleAdsConversionId: json.data.googleAdsConversionId || '',
            metaPixelId: json.data.metaPixelId || '',
            metaPixelEnabled: json.data.metaPixelEnabled || false,
            metaCapiToken: json.data.metaCapiToken || '',
          });
        }
        setEvents(eventsJson.data || []);
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Failed to load marketing data.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ga4MeasurementId: settings.ga4MeasurementId,
          gtmContainerId: settings.gtmContainerId,
          googleAdsConversionId: settings.googleAdsConversionId,
          metaPixelId: settings.metaPixelId,
          metaPixelEnabled: settings.metaPixelEnabled,
          metaCapiToken: settings.metaCapiToken,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error('Failed to save settings');
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <AdminLoadingState label="Loading tracking settings and events..." />;
  }

  return (
    <div className="w-full">
      {message && (
        <div className="mb-5">
          <AdminNotice type={message.type} message={message.text} />
        </div>
      )}
      {/* Events Log Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Recent Tracking Events</h3>
            <p className="text-sm text-gray-500 mt-1">
              Live feed of advertising events captured directly on your storefront.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsConfigModalOpen(true)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Configure Tracking
            </button>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/admin/marketing/events');
                  if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data) setEvents(json.data);
                  }
                } catch (e) {
                  console.error('Failed to refresh logs', e);
                }
              }}
              className="px-4 py-2 text-sm text-purple-700 hover:text-purple-800 font-semibold active:scale-95 transition-all bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
            >
              Refresh Logs
            </button>
          </div>
        </div>
        <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Event</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Payload Data</th>
                  <th className="px-6 py-4 font-semibold">Page URL</th>
                  <th className="px-6 py-4 font-semibold">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-5">
                      <AdminEmptyState
                        title="No tracking events captured yet"
                        description="Enable the required tracking integration, then interact with the storefront to populate this feed."
                        compact
                      />
                    </td>
                  </tr>
                ) : (
                  events.map((event) => {
                    let pathOnly = event.url;
                    try {
                      if (event.url) {
                        const u = new URL(event.url);
                        pathOnly = u.pathname + u.search;
                      }
                    } catch {}
                    
                    const { _identity: rawIdentity, ...cleanPayload } = event.eventData || {};
                    const identity = rawIdentity as EventIdentity | undefined;
                    const isAnonymous = !identity?.user || identity.user === 'anonymous';
                    const identifiedUser = identity?.user && identity.user !== 'anonymous'
                      ? identity.user
                      : null;

                    return (
                      <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 align-top">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            {event.eventName}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top text-xs">
                          {isAnonymous ? (
                            <div className="text-gray-400">
                              Guest <br/><span className="text-[10px]">IP: {identity?.ip || 'Unknown'}</span>
                            </div>
                          ) : (
                            <div className="text-gray-900 font-medium">
                              {identifiedUser?.email || 'Signed-in customer'} <br/><span className="text-[10px] text-gray-500 font-normal">Role: {identifiedUser?.role || 'Customer'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <pre className="text-[10px] leading-relaxed text-gray-600 bg-gray-50/80 border border-gray-100 p-3 rounded-lg max-w-full overflow-x-auto">
                            {JSON.stringify(cleanPayload, null, 2)}
                          </pre>
                        </td>
                        <td className="px-6 py-4 max-w-[180px] truncate align-top" title={event.url || ''}>
                          {pathOnly ? (
                            <a href={event.url || '#'} target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-800 transition-colors">
                              {pathOnly}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-xs align-top">
                          {new Date(event.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                          <div className="text-[10px] mt-1">{new Date(event.createdAt).toLocaleDateString()}</div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Meta Pixel Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Analytics & Advertising Configuration</h3>
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-500 mb-6">
                Configure Google Analytics, Tag Manager, Google Ads, Meta Pixel and Conversions API.
              </p>

              {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">GA4 Measurement ID</label>
                    <input
                      type="text"
                      value={settings.ga4MeasurementId || ''}
                      onChange={(e) => setSettings({ ...settings, ga4MeasurementId: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-3 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Google Tag Manager</label>
                    <input
                      type="text"
                      value={settings.gtmContainerId || ''}
                      onChange={(e) => setSettings({ ...settings, gtmContainerId: e.target.value })}
                      placeholder="GTM-XXXXXXX"
                      className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-3 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Google Ads conversion destination</label>
                  <input
                    type="text"
                    value={settings.googleAdsConversionId || ''}
                    onChange={(e) => setSettings({ ...settings, googleAdsConversionId: e.target.value })}
                    placeholder="AW-123456789/ConversionLabel"
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-3 shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">Enter the complete conversion destination from Google Ads.</p>
                </div>

                <hr className="border-gray-100" />

                {/* Enable Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-gray-900">Enable Meta Pixel</label>
                    <p className="text-xs text-gray-500 mt-1">Toggle this to enable or disable tracking site-wide.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.metaPixelEnabled}
                      onChange={(e) => setSettings({ ...settings, metaPixelEnabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <hr className="border-gray-100" />

                {/* Meta Pixel ID */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Meta Pixel ID</label>
                  <input
                    type="text"
                    value={settings.metaPixelId || ''}
                    onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })}
                    placeholder="e.g. 123456789012345"
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-3 transition-colors shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Found in your Meta Events Manager under Settings.
                  </p>
                </div>

                {/* Meta CAPI Token */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Conversions API Access Token</label>
                  <textarea
                    value={settings.metaCapiToken || ''}
                    onChange={(e) => setSettings({ ...settings, metaCapiToken: e.target.value })}
                    placeholder="Paste your CAPI token here..."
                    rows={4}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-3 resize-none transition-colors shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Generate this in Meta Events Manager &gt; Settings &gt; Conversions API &gt; Generate access token. (Highly recommended for accurate tracking)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-6 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

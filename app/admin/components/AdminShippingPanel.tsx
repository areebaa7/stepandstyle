'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminEmptyState, AdminErrorState, AdminLoadingState, AdminNotice } from './AdminAsyncState';

interface ShippingCity {
  id: string;
  name: string;
}

interface ShippingRegion {
  id: string;
  name: string;
  shippingCost: number;
  cities: ShippingCity[];
}

export default function AdminShippingPanel() {
  const [regions, setRegions] = useState<ShippingRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [editingRegionCost, setEditingRegionCost] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState<number>(0);
  const [newCityName, setNewCityName] = useState('');
  const [addingToRegion, setAddingToRegion] = useState<string | null>(null);
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionCost, setNewRegionCost] = useState<number>(0);
  const [isAddingRegion, setIsAddingRegion] = useState(false);

  const fetchRegions = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await fetch('/api/shipping');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load shipping regions.');
      setRegions(data.data || []);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load shipping regions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial server synchronization for this admin panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRegions();
  }, [fetchRegions]);

  const handleAddRegion = async () => {
    if (!newRegionName.trim()) {
      setNotice({ type: 'error', message: 'Please enter a valid region name.' });
      return;
    }

    try {
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newRegionName,
          shippingCost: newRegionCost
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setNewRegionName('');
      setNewRegionCost(0);
      setIsAddingRegion(false);
      setNotice({ type: 'success', message: 'Shipping region created successfully.' });
      await fetchRegions();
    } catch (error) {
      console.error('Failed to add region:', error);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to add region.' });
    }
  };

  const handleUpdateRegionCost = async (regionId: string) => {
    try {
      const response = await fetch(`/api/shipping/${regionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingCost: tempCost,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setEditingRegionCost(null);
      setNotice({ type: 'success', message: 'Shipping cost updated.' });
      await fetchRegions();
    } catch (error) {
      console.error('Failed to update region cost:', error);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update shipping cost.' });
    }
  };

  const handleAddCity = async (regionId: string) => {
    if (!newCityName.trim()) {
      setNotice({ type: 'error', message: 'Please enter a valid city name.' });
      return;
    }

    try {
      const response = await fetch(`/api/shipping/${regionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCityName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setNewCityName('');
      setAddingToRegion(null);
      setNotice({ type: 'success', message: 'City added successfully.' });
      await fetchRegions();
    } catch (error) {
      console.error('Failed to add city:', error);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to add city.' });
    }
  };

  const handleDeleteRegion = async (regionId: string) => {
    if (!confirm('Are you sure you want to delete this entire region and all its cities?')) return;

    try {
      const response = await fetch(`/api/shipping/${regionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setNotice({ type: 'success', message: 'Shipping region deleted.' });
      await fetchRegions();
    } catch (error) {
      console.error('Failed to delete region:', error);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete region.' });
    }
  };

  const handleDeleteCity = async (regionId: string, cityId: string) => {
    if (!confirm('Are you sure you want to delete this city?')) return;

    try {
      const response = await fetch(`/api/shipping/${regionId}?cityId=${cityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setNotice({ type: 'success', message: 'City deleted.' });
      await fetchRegions();
    } catch (error) {
      console.error('Failed to delete city:', error);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete city.' });
    }
  };

  if (loading) {
    return <AdminLoadingState label="Loading shipping regions..." />;
  }

  if (loadError && regions.length === 0) {
    return <AdminErrorState message={loadError} onRetry={() => void fetchRegions()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Shipping Management</h2>
        <button
          onClick={() => setIsAddingRegion(!isAddingRegion)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold flex items-center gap-2"
        >
          {isAddingRegion ? 'Cancel' : '+ Add New Region'}
        </button>
      </div>

      {notice && <AdminNotice type={notice.type} message={notice.message} />}

      {/* Add Region Form */}
      {isAddingRegion && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Region Name</label>
              <input
                type="text"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="e.g. Punjab"
                className="w-full px-3 py-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Common Shipping Cost (Rs.)</label>
              <input
                type="number"
                value={newRegionCost}
                onChange={(e) => setNewRegionCost(Number(e.target.value))}
                placeholder="e.g. 300"
                className="w-full px-3 py-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              />
            </div>
          </div>
          <button
            onClick={handleAddRegion}
            className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold transition-colors"
          >
            Create Region
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {regions.length === 0 ? (
          <AdminEmptyState
            title="No shipping regions found"
            description="Add your first region and its cities to configure checkout rates."
            action={{ label: 'Add shipping region', onClick: () => setIsAddingRegion(true) }}
          />
        ) : (
          regions.map((region) => (
            <div key={region.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              {/* Region Header */}
              <div className="flex items-center bg-slate-50 border-b border-slate-200">
                <button
                  onClick={() =>
                    setExpandedRegion(expandedRegion === region.id ? null : region.id)
                  }
                  className="flex-1 p-4 flex items-center justify-between font-semibold text-slate-900"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">{region.name}</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                      Rs. {region.shippingCost}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedRegion === region.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                
                <div className="flex items-center border-l border-slate-200">
                  <button
                    onClick={() => {
                      setEditingRegionCost(region.id);
                      setTempCost(region.shippingCost);
                    }}
                    className="p-4 text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit Cost"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteRegion(region.id)}
                    className="p-4 text-red-500 hover:bg-red-50 transition-colors border-l border-slate-200"
                    title="Delete Region"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Inline Edit Cost Form */}
              {editingRegionCost === region.id && (
                <div className="p-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-900">Update Common Cost:</span>
                    <input
                      type="number"
                      value={tempCost}
                      onChange={(e) => setTempCost(Number(e.target.value))}
                      className="w-32 px-3 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateRegionCost(region.id)}
                      className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingRegionCost(null)}
                      className="px-4 py-1 bg-slate-400 text-white rounded hover:bg-slate-500 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Region Content */}
              {expandedRegion === region.id && (
                <div className="p-4 space-y-4">
                  {/* Cities List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {region.cities.map((city) => (
                      <div key={city.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                        <span className="font-medium text-slate-900">{city.name}</span>
                        <button
                          onClick={() => handleDeleteCity(region.id, city.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove City"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New City Form */}
                  {addingToRegion === region.id ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex gap-3">
                      <input
                        type="text"
                        value={newCityName}
                        onChange={(e) => setNewCityName(e.target.value)}
                        placeholder="Enter city name..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                      <button
                        onClick={() => handleAddCity(region.id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-600 font-medium transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setAddingToRegion(null);
                          setNewCityName('');
                        }}
                        className="px-4 py-2 bg-slate-400 text-white rounded hover:bg-slate-500 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToRegion(region.id)}
                      className="w-full px-4 py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                      + Add City to {region.name}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

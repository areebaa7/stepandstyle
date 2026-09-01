'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminEmptyState, AdminErrorState, AdminLoadingState, AdminNotice } from './AdminAsyncState';
import { AdminFilterSearch, AdminFilterSelect } from './AdminFilterControl';

interface AffiliateApplication {
  id: string;
  email: string;
  channelLink1: string;
  channelLink2: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AffiliateApplicationsPanel() {
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<AffiliateApplication | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return applications;
    return applications.filter((application) => [
      application.email,
      application.channelLink1,
      application.channelLink2,
    ].some((value) => value?.toLowerCase().includes(normalizedSearch)));
  }, [applications, search]);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = statusFilter === 'ALL' 
        ? '/api/affiliate/applications'
        : `/api/affiliate/applications?status=${statusFilter}`;
      
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fetch error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || `Failed to fetch applications (Status: ${response.status})`);
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setStatusMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to load applications' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(fetchApplications, 0);
    return () => window.clearTimeout(timer);
  }, [fetchApplications]);


  const handleApproveClick = (application: AffiliateApplication) => {
    setSelectedApplication(application);
    setShowApprovalModal(true);
  };

  const handleRejectClick = (application: AffiliateApplication) => {
    setSelectedApplication(application);
    setRejectionNotes('');
    setShowRejectionModal(true);
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    setStatusMessage({ type: 'idle', message: '' });

    try {
      const response = await fetch(`/api/affiliate/applications/${selectedApplication.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      setStatusMessage({ type: 'success', message: data.message || 'Application approved successfully.' });
      setShowApprovalModal(false);
      setSelectedApplication(null);
      fetchApplications();
    } catch (error) {
      setStatusMessage({ type: 'error', message: error instanceof Error ? error.message : 'Failed to approve application' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    setStatusMessage({ type: 'idle', message: '' });

    try {
      const response = await fetch(`/api/affiliate/applications/${selectedApplication.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rejectionNotes || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      setStatusMessage({ type: 'success', message: 'Application rejected successfully.' });
      setShowRejectionModal(false);
      setSelectedApplication(null);
      setRejectionNotes('');
      fetchApplications();
    } catch (error) {
      setStatusMessage({ type: 'error', message: error instanceof Error ? error.message : 'Failed to reject application' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Affiliate Applications</h2>
          <p className="text-sm text-gray-500">
            Review and manage affiliate program applications
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_180px]">
          <AdminFilterSearch label="Search applications" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Email or channel" />
          <AdminFilterSelect
            label="Application status"
            aria-label="Affiliate application status filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </AdminFilterSelect>
        </div>
      </div>

      {statusMessage.type !== 'idle' && (
        <AdminNotice type={statusMessage.type} message={statusMessage.message} />
      )}

      {isLoading ? (
        <AdminLoadingState label="Loading affiliate applications..." />
      ) : statusMessage.type === 'error' && applications.length === 0 ? (
        <AdminErrorState message={statusMessage.message} onRetry={() => void fetchApplications()} />
      ) : applications.length === 0 ? (
        <AdminEmptyState
          title="No affiliate applications found"
          description={statusFilter !== 'ALL' ? `No applications currently have ${statusFilter.toLowerCase()} status.` : 'New applications will appear here for review.'}
        />
      ) : filteredApplications.length === 0 ? (
        <AdminEmptyState title="No applications match this search" description="Clear or change the search to see more applications." action={{ label: 'Clear search', onClick: () => setSearch('') }} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="border-b border-gray-100 px-6 py-3 text-sm text-gray-500"><span className="font-semibold text-gray-900">{filteredApplications.length}</span> applications shown</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Channel Links</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Applied</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <a
                          href={app.channelLink1}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 text-xs block truncate max-w-xs"
                        >
                          {app.channelLink1}
                        </a>
                        {app.channelLink2 && (
                          <a
                            href={app.channelLink2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 text-xs block truncate max-w-xs"
                          >
                            {app.channelLink2}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          app.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : app.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {app.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveClick(app)}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(app)}
                            className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {app.status === 'APPROVED' && (
                        <span className="text-xs text-green-600 font-medium">Approved</span>
                      )}
                      {app.status === 'REJECTED' && (
                        <span className="text-xs text-red-600 font-medium">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Approve Application</h3>
            <p className="text-gray-600 mb-6">
              Approving application for <strong>{selectedApplication.email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Approval will create or activate the influencer account and email the applicant a secure password-setup link.
              Promo codes can then be assigned from the Promo Users tab.
            </p>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-60"
              >
                {isProcessing ? 'Processing...' : 'Approve Application'}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedApplication(null);
                }}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-6">
              Rejecting application for <strong>{selectedApplication.email}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Notes (Optional)
              </label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Optional notes about why this application was rejected..."
              />
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-60"
              >
                {isProcessing ? 'Processing...' : 'Reject Application'}
              </button>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setSelectedApplication(null);
                  setRejectionNotes('');
                }}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

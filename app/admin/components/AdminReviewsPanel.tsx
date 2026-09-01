'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from './AdminAsyncState';
import { AdminFilterSearch, AdminFilterSelect } from './AdminFilterControl';
import AdminPagination from './AdminPagination';

const REVIEWS_PAGE_SIZE = 20;

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userEmail: string | null;
  productId: string;
  isFeatured: boolean;
  isVerifiedPurchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNote?: string | null;
  images: unknown;
  createdAt: string;
  product: {
    title: string;
    slug: string;
  };
}

export default function AdminReviewsPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [reviewTypeFilter, setReviewTypeFilter] = useState('ALL');
  const [sort, setSort] = useState('NEWEST');
  const [page, setPage] = useState(1);
  const availableStatuses = useMemo(() => Array.from(new Set(reviews.map((review) => review.status))).sort(), [reviews]);
  const availableRatings = useMemo(() => Array.from(new Set(reviews.map((review) => review.rating))).sort((left, right) => right - left), [reviews]);
  const availableReviewTypes = useMemo(() => [
    ...(reviews.some((review) => review.isFeatured) ? [{ value: 'FEATURED', label: 'Featured' }] : []),
    ...(reviews.some((review) => review.isVerifiedPurchase) ? [{ value: 'VERIFIED', label: 'Verified purchases' }] : []),
    ...(reviews.some((review) => !review.isVerifiedPurchase) ? [{ value: 'UNVERIFIED', label: 'Unverified purchases' }] : []),
  ], [reviews]);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const list = reviews.filter((review) => {
      const matchesSearch = !normalizedSearch || [
        review.userName,
        review.userEmail,
        review.product?.title,
        review.comment,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
      const matchesStatus = statusFilter === 'ALL' || review.status === statusFilter;
      const matchesRating = ratingFilter === 'ALL' || review.rating === Number(ratingFilter);
      const matchesType = reviewTypeFilter === 'ALL'
        || (reviewTypeFilter === 'FEATURED' && review.isFeatured)
        || (reviewTypeFilter === 'VERIFIED' && review.isVerifiedPurchase)
        || (reviewTypeFilter === 'UNVERIFIED' && !review.isVerifiedPurchase);
      return matchesSearch && matchesStatus && matchesRating && matchesType;
    });
    return [...list].sort((left, right) => {
      if (sort === 'OLDEST') return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      if (sort === 'RATING_HIGH') return right.rating - left.rating;
      if (sort === 'RATING_LOW') return left.rating - right.rating;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [ratingFilter, reviewTypeFilter, reviews, search, sort, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * REVIEWS_PAGE_SIZE,
    currentPage * REVIEWS_PAGE_SIZE,
  );

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setRatingFilter('ALL');
    setReviewTypeFilter('ALL');
    setSort('NEWEST');
    setPage(1);
  };

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/reviews', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load reviews.');
      }
      setReviews(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial server synchronization for this admin panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete review.');
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred while deleting.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModeration = async (
    review: Review,
    update: { status?: Review['status']; isFeatured?: boolean; moderationNote?: string },
  ) => {
    try {
      setUpdatingId(review.id);
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id, ...update }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update review.');
      setReviews((current) => current.map((entry) => entry.id === review.id ? payload.data : entry));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update review.');
    } finally {
      setUpdatingId(null);
    }
  };

  const rejectReview = (review: Review) => {
    const reason = prompt('Why is this review being rejected?');
    if (!reason?.trim()) return;
    void handleModeration(review, { status: 'REJECTED', moderationNote: reason.trim() });
  };

  if (isLoading) {
    return <AdminLoadingState label="Loading customer reviews..." />;
  }

  if (error) {
    return <AdminErrorState message={error} onRetry={() => void loadReviews()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          <p className="text-sm text-gray-500 mt-1">Approve, reject, feature or remove customer reviews.</p>
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" aria-label="Review filters">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <AdminFilterSearch label="Search reviews" className="xl:col-span-2" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Reviewer, product or comment" />
            <AdminFilterSelect label="Moderation status" aria-label="Review status filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
              <option value="ALL">All statuses</option>
              {availableStatuses.map((status) => <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>)}
            </AdminFilterSelect>
            <AdminFilterSelect label="Rating" aria-label="Review rating filter" value={ratingFilter} onChange={(event) => { setRatingFilter(event.target.value); setPage(1); }}>
              <option value="ALL">All ratings</option>
              {availableRatings.map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </AdminFilterSelect>
            <AdminFilterSelect label="Review type" aria-label="Review type filter" value={reviewTypeFilter} onChange={(event) => { setReviewTypeFilter(event.target.value); setPage(1); }}>
              <option value="ALL">All review types</option>
              {availableReviewTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </AdminFilterSelect>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500"><span className="font-semibold text-gray-900">{filteredReviews.length}</span> of {reviews.length} reviews shown</p>
            <div className="flex items-center gap-3">
              <AdminFilterSelect label="Sort by" aria-label="Sort reviews" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="w-full sm:w-52">
                <option value="NEWEST">Newest first</option>
                <option value="OLDEST">Oldest first</option>
                <option value="RATING_HIGH">Highest rating</option>
                <option value="RATING_LOW">Lowest rating</option>
              </AdminFilterSelect>
              {(search || statusFilter !== 'ALL' || ratingFilter !== 'ALL' || reviewTypeFilter !== 'ALL' || sort !== 'NEWEST') && <button type="button" onClick={clearFilters} className="rounded-xl px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50">Clear filters</button>}
            </div>
          </div>
        </section>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {reviews.length === 0 ? (
          <AdminEmptyState
            title="No reviews found"
            description="Customer reviews will appear here after they are submitted."
            compact
          />
        ) : filteredReviews.length === 0 ? (
          <AdminEmptyState title="No reviews match these filters" description="Change or clear the filters to see more reviews." action={{ label: 'Clear filters', onClick: clearFilters }} compact />
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Reviewer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4 min-w-[300px]">Comment</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{review.userName}</p>
                      <p className="text-xs text-gray-500">{review.userEmail || 'No email'}</p>
                      {review.isVerifiedPurchase && <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Verified purchase</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/products/${review.product?.slug}`}
                        target="_blank"
                        className="text-purple-600 hover:text-purple-700 font-medium hover:underline line-clamp-2"
                      >
                        {review.product?.title || 'Unknown Product'}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        review.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : review.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>{review.status}</span>
                      {review.isFeatured && <p className="mt-1 text-[10px] font-bold text-purple-700">FEATURED</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200 fill-current'}`} 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700 line-clamp-3">{review.comment}</p>
                      {review.moderationNote && <p className="mt-1 text-xs text-gray-400">Note: {review.moderationNote}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {review.status !== 'APPROVED' && <button onClick={() => void handleModeration(review, { status: 'APPROVED' })} disabled={updatingId === review.id} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-50">Approve</button>}
                        {review.status !== 'REJECTED' && <button onClick={() => rejectReview(review)} disabled={updatingId === review.id} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 disabled:opacity-50">Reject</button>}
                        {review.status === 'APPROVED' && <button onClick={() => void handleModeration(review, { isFeatured: !review.isFeatured })} disabled={updatingId === review.id} className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 disabled:opacity-50">{review.isFeatured ? 'Unfeature' : 'Feature'}</button>}
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={deletingId === review.id || updatingId === review.id}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-50"
                        >
                          {deletingId === review.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination page={currentPage} pageSize={REVIEWS_PAGE_SIZE} totalItems={filteredReviews.length} itemLabel="reviews" onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

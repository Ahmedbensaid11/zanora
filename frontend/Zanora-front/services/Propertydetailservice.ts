import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:8080/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Safe fetch wrapper — handles:
 *  - 204 No Content
 *  - Empty 200 body (e.g. averageRating when no reviews exist)
 *  - Non-OK responses with a readable error message
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...authHeaders, // ✅ auth headers take priority
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(errorText || `Request failed: ${res.status}`);
  }

  const text = await res.text();

  if (!text || text.trim() === '') return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from ${path}: "${text.slice(0, 80)}"`);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export enum OfferType {
  BUY = 'BUY',
  RENT = 'RENT',
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export interface ReviewResponse {
  id: string;
  propertyId: number;
  userId: number;
  username?: string;        // ← new
  profileImg?: string;      // ← new (base64 string from backend)
  rating: number;
  comment: string;
  edited: boolean;
  createdAt: string;
  updatedAt?: string;
}
export interface ReviewRequest {
  propertyId: number;
  rating: number;
  comment: string;
}

export interface OfferRequest {
  propertyId: number;
  type: OfferType;
  proposedPrice: number;
  rentStartDate?: string;
  rentEndDate?: string;
  message?: string;
}

export interface OfferResponse {
  id: number;
  propertyId: number;
  propertyTitle: string;
  buyerId: number;
  buyerUsername: string;
  type: OfferType;
  proposedPrice: number;
  rentStartDate?: string;
  rentEndDate?: string;
  status: OfferStatus;
  message?: string;
  ownerNote?: string;
  createdAt: string;
  respondedAt?: string;
}
// Add to ReviewResponse interface:
export interface ReviewResponse {
  id: string;
  propertyId: number;
  userId: number;
  username?: string;       // populated by backend enrich()
  profileImg?: string;     // base64, populated by backend enrich()
  rating: number;
  comment: string;
  edited: boolean;
  createdAt: string;
  updatedAt?: string;
}


// ─── Review API ───────────────────────────────────────────────────────────────

export async function createReview(dto: ReviewRequest): Promise<ReviewResponse> {
  return request<ReviewResponse>('/reviews', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateReview(
  reviewId: string,
  dto: ReviewRequest
): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteReview(reviewId: string): Promise<void> {
  return request<void>(`/reviews/${reviewId}`, { method: 'DELETE' });
}

export async function getPropertyReviews(
  propertyId: number,
  sortBy: 'createdAt' | 'rating' = 'createdAt',
  direction: 'asc' | 'desc' = 'desc'
): Promise<ReviewResponse[]> {
  const result = await request<ReviewResponse[] | null>(
    `/reviews/property/${propertyId}?sortBy=${sortBy}&direction=${direction}`
  );
  return result ?? [];
}

/**
 * Returns 0 when the property has no reviews yet.
 * The backend returns an empty body in that case — handled safely here.
 */
export async function getAverageRating(propertyId: number): Promise<number> {
  const result = await request<number | null>(
    `/reviews/property/${propertyId}/rating`
  );
  return result ?? 0;
}

// ─── Offer API ────────────────────────────────────────────────────────────────

export async function createOffer(dto: OfferRequest): Promise<OfferResponse> {
  return request<OfferResponse>('/offers', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function cancelOffer(offerId: number): Promise<void> {
  return request<void>(`/offers/${offerId}`, { method: 'DELETE' });
}

export async function getMyOffers(): Promise<OfferResponse[]> {
  const result = await request<OfferResponse[] | null>('/offers/my-offers');
  return result ?? [];
}

export async function getOffersForProperty(
  propertyId: number
): Promise<OfferResponse[]> {
  const result = await request<OfferResponse[] | null>(
    `/offers/property/${propertyId}`
  );
  return result ?? [];
}

export async function getIncomingOffers(): Promise<OfferResponse[]> {
  const result = await request<OfferResponse[] | null>('/offers/incoming');
  return result ?? [];
}

export async function respondToOffer(
  offerId: number,
  decision: OfferStatus.ACCEPTED | OfferStatus.DECLINED,
  ownerNote?: string
): Promise<OfferResponse> {
  return request<OfferResponse>(`/offers/${offerId}/respond`, {
    method: 'PATCH',
    body: JSON.stringify({ decision, ownerNote }),
  });
}
export async function hasReviewed(propertyId: number): Promise<boolean> {
  const result = await request<boolean | null>(
    `/reviews/property/${propertyId}/has-reviewed`
  );
  return result ?? false;
}
export async function isReviewAuthor(reviewId: string): Promise<boolean> {
  const result = await request<boolean | null>(`/reviews/${reviewId}/is-author`);
  return result ?? false;
}
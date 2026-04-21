import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { PropertyStatus, PropertyType } from '../constants/Propertyenums ';

const BASE_URL = 'http://192.168.0.109:8080/api';

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SuggestionDTO {
  id: number;
  name: string;
  parentName?: string;
}

export interface PropertyResponseDTO {
  id: number;
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  type: PropertyType;
  address: string;
  cityName: string;
  stateName: string;
  area: number;
  pricePerMonth: number;
  status: PropertyStatus;
  createdAt: string;
  imageUrls: string[];
  averageRating?: number;
}

export interface PropertyPage {
  content: PropertyResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PropertyFilterParams {
  stateId?: number;
  cityId?: number;
  type?: PropertyType;
  status?: PropertyStatus;
  bathrooms?: number;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxRating?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

// ─── NEW: Offer interfaces ────────────────────────────────────────────────────

export interface OfferResponseDTO {
  id: number;
  propertyId: number;
  propertyTitle?: string;
  amount: number;
  currency?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt?: string;
}

export interface OfferPage {
  content: OfferResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface OfferFilterParams {
  page?: number;
  size?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildQueryString = (params: Record<string, any>): string => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `?${query}` : '';
};

// ─── Public properties ────────────────────────────────────────────────────────

export const fetchProperties = async (
  filters: PropertyFilterParams
): Promise<PropertyPage> => {
  const qs = buildQueryString(filters as Record<string, any>);
  const res = await fetch(`${BASE_URL}/properties${qs}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
};

// ─── NEW: My properties (authenticated user's own listings) ───────────────────

export const fetchMyProperties = async (
  filters: PropertyFilterParams
): Promise<PropertyPage> => {
  const qs = buildQueryString(filters as Record<string, any>);
  const res = await fetch(`${BASE_URL}/properties/my${qs}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch my properties');
  return res.json();
};

// ─── NEW: My offers (authenticated user's submitted offers) ───────────────────

export const fetchMyOffers = async (
  params: OfferFilterParams
): Promise<OfferPage> => {
  const qs = buildQueryString(params as Record<string, any>);
  const res = await fetch(`${BASE_URL}/offers/my${qs}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch my offers');
  return res.json();
};

// ─── Suggestions ──────────────────────────────────────────────────────────────

export const fetchStateSuggestions = async (
  query: string
): Promise<SuggestionDTO[]> => {
  if (!query.trim()) return [];
  const res = await fetch(
    `${BASE_URL}/properties/suggestions/states?query=${encodeURIComponent(query)}`,
    { headers: await authHeaders() }
  );
  if (!res.ok) throw new Error('Failed to fetch state suggestions');
  return res.json();
};

export const fetchCitySuggestions = async (
  query: string,
  stateId?: number
): Promise<SuggestionDTO[]> => {
  if (!query.trim()) return [];
  const params = buildQueryString({ query, stateId });
  const res = await fetch(`${BASE_URL}/properties/suggestions/cities${params}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch city suggestions');
  return res.json();
};

// ─── Owner check ──────────────────────────────────────────────────────────────

export async function isOwner(propertyId: number): Promise<boolean> {
  const { data } = await axios.get<boolean | null>(
    `${BASE_URL}/properties/${propertyId}/is-owner`,
    { headers: await authHeaders() }
  );
  console.log('isOwner response:', data);
  return data ?? false;
}

// 1. Fetch all offers received on your properties (owner view)
export const fetchIncomingOffers = async (): Promise<OfferResponseDTO[]> => {
  const res = await fetch(`${BASE_URL}/offers/incoming`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch incoming offers');
  return res.json();
};

// 2. Accept or decline an offer (owner action)
export interface OfferRespondRequest {
  decision: 'ACCEPTED' | 'DECLINED';
  ownerNote?: string;
}

export const respondToOffer = async (
  offerId: number,
  body: OfferRespondRequest
): Promise<OfferResponseDTO> => {
  const res = await fetch(`${BASE_URL}/offers/${offerId}/respond`, {
    method: 'PATCH',  // ← was POST, must be PATCH
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to respond to offer');
  return res.json();
};
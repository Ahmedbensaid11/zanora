import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { PropertyStatus, PropertyType } from '../constants/Propertyenums ';
const BASE_URL = 'http://localhost:8080/api';
const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
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

const buildQueryString = (params: Record<string, any>): string => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `?${query}` : '';
};

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
export async function isOwner(propertyId: number): Promise<boolean> {
  const { data } = await axios.get<boolean | null>(
    `${BASE_URL}/properties/${propertyId}/is-owner`,
    { headers: await authHeaders() }
  );
  console.log('isOwner response:', data);
  return data ?? false;
}
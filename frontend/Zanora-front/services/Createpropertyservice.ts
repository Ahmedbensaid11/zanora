import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropertyType } from '../constants/Propertyenums ';
import { Platform } from 'react-native';

const BASE_URL = 'http://192.168.0.109:8080/api';

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface CreatePropertyPayload {
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  type: PropertyType;
  address: string;
  cityId: number;
  area?: number;
  pricePerMonth: number;
  primaryImageIndex?: number;
  images: {
    uri: string;
    name: string;
    type: string;
  }[];
}



export const createProperty = async (
  payload: CreatePropertyPayload
): Promise<void> => {
  const headers = await authHeaders();
  const form = new FormData();

  form.append('title', payload.title);
  form.append('description', payload.description ?? '');
  form.append('bedrooms', String(payload.bedrooms));
  form.append('bathrooms', String(payload.bathrooms));
  form.append('type', payload.type);
  form.append('address', payload.address);
  form.append('cityId', String(payload.cityId));
  form.append('pricePerMonth', String(payload.pricePerMonth));
  form.append('primaryImageIndex', String(payload.primaryImageIndex ?? 0));
  if (payload.area) form.append('area', String(payload.area));

  for (let i = 0; i < payload.images.length; i++) {
    const img = payload.images[i];

    if (Platform.OS === 'web') {
      // Browser: must convert URI (blob: or data:) to a real Blob/File
      const response = await fetch(img.uri);
      const blob = await response.blob();
      const file = new File([blob], img.name ?? `image_${i}.jpg`, {
        type: img.type ?? 'image/jpeg',
      });
      form.append('images', file);
    } else {
      // iOS / Android: use RN's native { uri, name, type } shorthand
      form.append('images', {
        uri: img.uri,
        name: img.name ?? `image_${i}.jpg`,
        type: img.type ?? 'image/jpeg',
      } as any);
    }
  }

  const res = await fetch(`${BASE_URL}/properties`, {
    method: 'POST',
    headers, // No Content-Type — let fetch set multipart boundary
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed with status ${res.status}`);
  }
};
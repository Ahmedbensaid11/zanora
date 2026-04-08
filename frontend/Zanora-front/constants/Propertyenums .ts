export enum PropertyType {
  HOUSE = 'HOUSE',
  OFFICE = 'OFFICE',
  APARTMENT = 'APARTMENT',
  STUDIO = 'STUDIO',
  VILLA = "VILLA",
  LAND = "LAND",
}

export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  PENDING = 'PENDING',
  INACTIVE = 'INACTIVE',
}

export const PropertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.HOUSE]: '🏠 House',
  [PropertyType.OFFICE]: '🏢 Office',
  [PropertyType.APARTMENT]: '🏙️ Apartment',
  [PropertyType.STUDIO]: '🪟 Studio',
};

export const PropertyStatusLabels: Record<PropertyStatus, string> = {
  [PropertyStatus.AVAILABLE]: 'Available',
  [PropertyStatus.RENTED]: 'Rented',
  [PropertyStatus.PENDING]: 'Pending',
  [PropertyStatus.INACTIVE]: 'Inactive',
};

export const PropertyStatusColors: Record<PropertyStatus, string> = {
  [PropertyStatus.AVAILABLE]: '#27AE60',
  [PropertyStatus.RENTED]: '#E74C3C',
  [PropertyStatus.PENDING]: '#F39C12',
  [PropertyStatus.INACTIVE]: '#95A5A6',
};

export const SORT_OPTIONS = [
  { label: 'Newest', value: 'createdAt' },
  { label: 'Price', value: 'pricePerMonth' },
  { label: 'Bedrooms', value: 'bedrooms' },
  { label: 'Bathrooms', value: 'bathrooms' },
  { label: 'Rating', value: 'averageRating' },
  { label: 'Area', value: 'area' },
];
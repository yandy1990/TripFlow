export type User = {
  id: string;
  email: string;
};

export type Trip = {
  id: string;
  user_id: string;
  title: string;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  coverImage?: string;
  notes?: string;
};

export enum ActivityType {
  FLIGHT = 'FLIGHT',
  HOTEL = 'HOTEL',
  ACTIVITY = 'ACTIVITY',
  FOOD = 'FOOD',
  TRANSIT = 'TRANSIT',
  NOTE = 'NOTE',
  CUSTOM = 'CUSTOM',
}

export type ItineraryItem = {
  id: string;
  trip_id: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  time?: string; // HH:MM
  type: ActivityType;
  title: string;
  location?: string;
  notes?: string;
  cost?: number;
  currency?: string;
  is_booked?: boolean;
  details?: Record<string, any>; // Flexible field for type-specific data (flight #, etc)
};
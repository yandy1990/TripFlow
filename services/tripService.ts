import { supabase, isOfflineMode } from './supabaseClient';
import { Trip, ItineraryItem, User, ActivityType } from '../types';

// Mock Data for offline mode
const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    user_id: 'mock-user',
    title: 'Jordan Adventure',
    startDate: '2025-11-06',
    endDate: '2025-11-09',
    coverImage: 'https://picsum.photos/800/400',
    notes: 'Don\'t forget the Jordan Pass!',
  },
];

const MOCK_ITEMS: ItineraryItem[] = [
  // Day 1
  { 
    id: '101', 
    trip_id: '1', 
    date: '2025-11-06', 
    time: '07:00', 
    type: ActivityType.TRANSIT, 
    title: 'Head to RUH Airport', 
    location: 'Riyadh' 
  },
  { 
    id: '102', 
    trip_id: '1', 
    date: '2025-11-06', 
    time: '12:35', 
    type: ActivityType.FLIGHT, 
    title: 'Flight to Amman', 
    location: '',
    details: {
      flightNr: 'SV 123',
      from: 'RUH',
      to: 'AMM'
    }
  },
  { id: '103', trip_id: '1', date: '2025-11-06', time: '13:00', type: ActivityType.TRANSIT, title: 'Rental Car Pick-up', location: 'AMM Airport' },
  { id: '104', trip_id: '1', date: '2025-11-06', time: '15:30', type: ActivityType.HOTEL, title: 'Mövenpick Petra', location: 'Tourism St, Wadi Musa 71810' },
  // Day 2
  { id: '201', trip_id: '1', date: '2025-11-07', time: '07:30', type: ActivityType.ACTIVITY, title: 'Petra Exploration', location: 'Visitor Center' },
  { id: '202', trip_id: '1', date: '2025-11-07', time: '19:00', type: ActivityType.FOOD, title: 'Dinner @ Hotel', location: 'Mövenpick' },
];

export const tripService = {
  async getTrips(userId: string): Promise<Trip[]> {
    if (isOfflineMode) {
      const stored = localStorage.getItem('tf_trips');
      return stored ? JSON.parse(stored) : MOCK_TRIPS;
    }
    const { data, error } = await supabase.from('trips').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async createTrip(trip: Omit<Trip, 'id'>): Promise<Trip> {
    const newTrip = { ...trip, id: crypto.randomUUID() };
    if (isOfflineMode) {
      const trips = await this.getTrips(trip.user_id);
      trips.push(newTrip);
      localStorage.setItem('tf_trips', JSON.stringify(trips));
      return newTrip;
    }
    const { data, error } = await supabase.from('trips').insert(newTrip).select().single();
    if (error) throw error;
    return data;
  },

  async getItinerary(tripId: string): Promise<ItineraryItem[]> {
    if (isOfflineMode) {
      const stored = localStorage.getItem(`tf_itinerary_${tripId}`);
      if (stored) return JSON.parse(stored);
      // Return mock data if it matches mock trip
      return tripId === '1' ? MOCK_ITEMS : [];
    }
    const { data, error } = await supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('date', { ascending: true }).order('time', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addItineraryItem(item: Omit<ItineraryItem, 'id'>): Promise<ItineraryItem> {
    const newItem = { ...item, id: crypto.randomUUID() };
    if (isOfflineMode) {
      const items = await this.getItinerary(item.trip_id);
      items.push(newItem);
      localStorage.setItem(`tf_itinerary_${item.trip_id}`, JSON.stringify(items));
      return newItem;
    }
    const { data, error } = await supabase.from('itinerary_items').insert(newItem).select().single();
    if (error) throw error;
    return data;
  },

  async updateItineraryItem(itemId: string, tripId: string, updates: Partial<ItineraryItem>): Promise<void> {
    if (isOfflineMode) {
      const items = await this.getItinerary(tripId);
      const index = items.findIndex(i => i.id === itemId);
      if (index !== -1) {
        items[index] = { ...items[index], ...updates };
        localStorage.setItem(`tf_itinerary_${tripId}`, JSON.stringify(items));
      }
      return;
    }
    const { error } = await supabase.from('itinerary_items').update(updates).eq('id', itemId);
    if (error) throw error;
  },

  async deleteItineraryItem(itemId: string, tripId: string): Promise<void> {
     if (isOfflineMode) {
        const items = await this.getItinerary(tripId);
        const filtered = items.filter(i => i.id !== itemId);
        localStorage.setItem(`tf_itinerary_${tripId}`, JSON.stringify(filtered));
        return;
     }
     const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId);
     if (error) throw error;
  }
};
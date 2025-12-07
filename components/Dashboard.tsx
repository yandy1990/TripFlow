import React, { useEffect, useState } from 'react';
import { User, Trip } from '../types';
import { tripService } from '../services/tripService';
import { Plus, Calendar, MapPin, Loader2 } from 'lucide-react';

interface DashboardProps {
  user: User;
  onSelectTrip: (trip: Trip) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSelectTrip }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');

  useEffect(() => {
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    try {
      const data = await tripService.getTrips(user.id);
      setTrips(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle) return;
    try {
        const newTrip = await tripService.createTrip({
            user_id: user.id,
            title: newTripTitle,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            coverImage: `https://picsum.photos/seed/${newTripTitle}/800/400`,
        });
        setTrips([...trips, newTrip]);
        setIsCreating(false);
        setNewTripTitle('');
    } catch (e) {
        console.error(e);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-brand-600"><Loader2 className="animate-spin w-8 h-8"/></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Trips</h1>
            <p className="text-gray-500 mt-1">Manage your upcoming adventures.</p>
        </div>
        <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
            <Plus size={18} /> New Trip
        </button>
      </div>

      {isCreating && (
          <form onSubmit={handleCreate} className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-brand-100 flex gap-4 items-end animate-in fade-in slide-in-from-top-4">
              <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Where are you going?</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="e.g. Paris Summer 2025" 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    value={newTripTitle}
                    onChange={(e) => setNewTripTitle(e.target.value)}
                  />
              </div>
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Create</button>
          </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map(trip => (
          <div 
            key={trip.id} 
            onClick={() => onSelectTrip(trip)}
            className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full transform hover:-translate-y-1"
          >
            <div className="h-40 overflow-hidden relative bg-gray-200">
               {trip.coverImage && <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{trip.title}</h3>
              <div className="mt-4 space-y-2 flex-1">
                <div className="flex items-center text-sm text-gray-500">
                    <Calendar size={16} className="mr-2 text-brand-500" />
                    {new Date(trip.startDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                    <MapPin size={16} className="mr-2 text-brand-500" />
                    <span>View Itinerary</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-medium px-2 py-1 bg-brand-50 text-brand-700 rounded-full">Planning</span>
              </div>
            </div>
          </div>
        ))}
        
        {trips.length === 0 && !isCreating && (
             <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                 <div className="mx-auto h-12 w-12 text-gray-400">
                     <MapPin className="w-full h-full"/>
                 </div>
                 <h3 className="mt-2 text-sm font-medium text-gray-900">No trips yet</h3>
                 <p className="mt-1 text-sm text-gray-500">Get started by creating a new trip.</p>
             </div>
        )}
      </div>
    </div>
  );
};

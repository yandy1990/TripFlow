import React, { useState, useEffect } from 'react';
import { Trip, ItineraryItem, ActivityType } from '../types';
import { tripService } from '../services/tripService';
import { geminiService } from '../services/geminiService';
import { ArrowLeft, Plus, Plane, Hotel, Camera, Utensils, Train, StickyNote, Sparkles, Trash2, MapPin, Clock, ChevronDown, Tag, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TripPlannerProps {
  trip: Trip;
  onBack: () => void;
}

// Utility for class merging
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const ActivityIcon = ({ type }: { type: ActivityType }) => {
    switch (type) {
        case ActivityType.FLIGHT: return <Plane size={16} className="text-blue-500" />;
        case ActivityType.HOTEL: return <Hotel size={16} className="text-indigo-500" />;
        case ActivityType.ACTIVITY: return <Camera size={16} className="text-emerald-500" />;
        case ActivityType.FOOD: return <Utensils size={16} className="text-orange-500" />;
        case ActivityType.TRANSIT: return <Train size={16} className="text-gray-500" />;
        case ActivityType.CUSTOM: return <Tag size={16} className="text-purple-500" />;
        default: return <StickyNote size={16} className="text-yellow-500" />;
    }
};

export const TripPlanner: React.FC<TripPlannerProps> = ({ trip, onBack }) => {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [activeMenuDate, setActiveMenuDate] = useState<string | null>(null);

  // Group items by date
  const itemsByDate = items.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, ItineraryItem[]>);

  // Get range of dates
  const getDates = () => {
    const dates = [];
    let curr = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    while (curr <= end) {
      dates.push(new Date(curr).toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };
  const tripDates = getDates();

  useEffect(() => {
    loadItems();

    // Click outside to close menus
    const handleClickOutside = () => setActiveMenuDate(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [trip]);

  const loadItems = async () => {
    const data = await tripService.getItinerary(trip.id);
    setItems(data);
    setLoading(false);
  };

  const addItem = async (date: string, type: ActivityType = ActivityType.ACTIVITY) => {
    const newItem = await tripService.addItineraryItem({
        trip_id: trip.id,
        date,
        type,
        title: '',
        time: '09:00',
        location: '',
        notes: '',
        details: {}
    });
    setItems([...items, newItem]);
    setActiveMenuDate(null);
  };

  const updateItem = async (id: string, updates: Partial<ItineraryItem>) => {
      // Optimistic update
      setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
      
      // Save to persistence
      try {
          await tripService.updateItineraryItem(id, trip.id, updates);
      } catch (e) {
          console.error("Failed to save item", e);
      }
  };

  const updateItemDetails = async (id: string, detailsUpdate: any) => {
      const item = items.find(i => i.id === id);
      if (!item) return;
      const newDetails = { ...(item.details || {}), ...detailsUpdate };
      updateItem(id, { details: newDetails });
  };

  const deleteItem = async (id: string) => {
      await tripService.deleteItineraryItem(id, trip.id);
      setItems(items.filter(i => i.id !== id));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setGenerating(true);
    try {
        const newItems = await geminiService.generateItinerary(trip.id, aiPrompt, trip.startDate);
        // Save all generated items
        const savedItems = [];
        for (const item of newItems) {
            const saved = await tripService.addItineraryItem(item as any);
            savedItems.push(saved);
        }
        setItems([...items, ...savedItems]);
        setShowAiModal(false);
        setAiPrompt('');
    } catch (e) {
        alert('Failed to generate itinerary. Check API key or try again.');
    } finally {
        setGenerating(false);
    }
  };

  const MENU_OPTIONS = [
    { type: ActivityType.FLIGHT, label: 'Flight', icon: Plane, color: 'text-blue-500' },
    { type: ActivityType.HOTEL, label: 'Hotel', icon: Hotel, color: 'text-indigo-500' },
    { type: ActivityType.ACTIVITY, label: 'Activity', icon: Camera, color: 'text-emerald-500' },
    { type: ActivityType.FOOD, label: 'Food & Drink', icon: Utensils, color: 'text-orange-500' },
    { type: ActivityType.TRANSIT, label: 'Transit', icon: Train, color: 'text-gray-500' },
    { type: ActivityType.CUSTOM, label: 'Others', icon: Tag, color: 'text-purple-500' },
  ];

  // Render different inputs based on activity type
  const renderInputs = (item: ItineraryItem) => {
      // FLIGHT: Flight #, From, To
      if (item.type === ActivityType.FLIGHT) {
          return (
              <div className="flex-1 w-full space-y-2 sm:space-y-0 sm:flex sm:gap-4 items-center min-w-0">
                  <div className="flex gap-2 items-center flex-1">
                      <input 
                          className="w-24 text-gray-900 font-medium placeholder-gray-400 bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 transition-all outline-none uppercase"
                          placeholder="Flight #"
                          value={item.details?.flightNr || ''}
                          onChange={(e) => updateItemDetails(item.id, { flightNr: e.target.value })}
                      />
                      <div className="h-4 w-px bg-gray-300 mx-1 shrink-0"></div>
                      <input 
                          className="w-16 text-gray-900 font-medium placeholder-gray-400 bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 transition-all outline-none uppercase text-center"
                          placeholder="FROM"
                          value={item.details?.from || ''}
                          onChange={(e) => updateItemDetails(item.id, { from: e.target.value })}
                      />
                      <ArrowRight size={14} className="text-gray-400 shrink-0" />
                       <input 
                          className="w-16 text-gray-900 font-medium placeholder-gray-400 bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 transition-all outline-none uppercase text-center"
                          placeholder="TO"
                          value={item.details?.to || ''}
                          onChange={(e) => updateItemDetails(item.id, { to: e.target.value })}
                      />
                  </div>
                  
                  {/* Gate / Details */}
                  <div className="flex items-center gap-1 sm:w-1/3 text-gray-500">
                      <MapPin size={14} className="shrink-0" />
                      <input 
                          className="w-full text-sm bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 transition-all outline-none placeholder-gray-300"
                          placeholder="Gate / Terminal"
                          value={item.location || ''}
                          onChange={(e) => updateItem(item.id, { location: e.target.value })}
                      />
                  </div>
              </div>
          );
      }

      // HOTEL: Hotel Name, Address
      if (item.type === ActivityType.HOTEL) {
          return (
            <div className="flex-1 w-full space-y-1 sm:space-y-0 sm:flex sm:gap-4 items-center">
                <input 
                    className="flex-1 w-full text-gray-900 font-medium placeholder-gray-400 bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 -ml-2 transition-all outline-none"
                    placeholder="Hotel Name"
                    value={item.title}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                />
                
                <div className="flex items-center gap-1 sm:w-1/3 text-gray-500">
                    <MapPin size={14} className="shrink-0" />
                    <input 
                        className="w-full text-sm bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 transition-all outline-none placeholder-gray-300"
                        placeholder="Address"
                        value={item.location || ''}
                        onChange={(e) => updateItem(item.id, { location: e.target.value })}
                    />
                </div>
            </div>
          );
      }

      // FOOD: Restaurant Name, Address
      if (item.type === ActivityType.FOOD) {
        return (
          <div className="flex-1 w-full space-y-1 sm:space-y-0 sm:flex sm:gap-4 items-center">
              <input 
                  className="flex-1 w-full text-gray-900 font-medium placeholder-gray-400 bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 -ml-2 transition-all outline-none"
                  placeholder="Restaurant Name"
                  value={item.title}
                  onChange={(e) => updateItem(item.id, { title: e.target.value })}
              />
              
              <div className="flex items-center gap-1 sm:w-1/3 text-gray-500">
                  <MapPin size={14} className="shrink-0" />
                  <input 
                      className="w-full text-sm bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 transition-all outline-none placeholder-gray-300"
                      placeholder="Address"
                      value={item.location || ''}
                      onChange={(e) => updateItem(item.id, { location: e.target.value })}
                  />
              </div>
          </div>
        );
      }

      // GENERIC: Title, Location
      return (
        <div className="flex-1 w-full space-y-1 sm:space-y-0 sm:flex sm:gap-4 items-center">
            <input 
                className="flex-1 w-full text-gray-900 font-medium placeholder-gray-400 bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 -ml-2 transition-all outline-none"
                placeholder={item.type === ActivityType.CUSTOM ? "Custom Item Name" : "Activity Title"}
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
            />
            
            <div className="flex items-center gap-1 sm:w-1/3 text-gray-500">
                <MapPin size={14} className="shrink-0" />
                <input 
                    className="w-full text-sm bg-transparent focus:bg-white focus:ring-2 focus:ring-brand-100 rounded px-2 py-1 transition-all outline-none placeholder-gray-300"
                    placeholder="Location / Details"
                    value={item.location || ''}
                    onChange={(e) => updateItem(item.id, { location: e.target.value })}
                />
            </div>
        </div>
      );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
                <h1 className="text-xl font-bold text-gray-900">{trip.title}</h1>
                <p className="text-xs text-gray-500">{new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium border border-purple-200"
            >
                <Sparkles size={16} /> AI Assistant
            </button>
            <button className="hidden md:block px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
                Share Trip
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
            
            {/* AI Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles className="text-purple-500" /> AI Itinerary Generator</h3>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Describe what you want to do (e.g., "3 days in Petra focusing on hiking and local food").</p>
                        <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-32 resize-none"
                            placeholder="Type your request here..."
                        />
                        <div className="mt-4 flex justify-end gap-3">
                            <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                            <button 
                                onClick={handleAiGenerate}
                                disabled={generating || !aiPrompt}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {generating ? <><Clock className="animate-spin" size={16}/> Generating...</> : 'Generate Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tripDates.map((date, index) => {
                const dayItems = (itemsByDate[date] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
                const dayDate = new Date(date);
                const isToday = new Date().toDateString() === dayDate.toDateString();

                return (
                    <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
                        {/* Date Header */}
                        <div className={cn("px-6 py-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl", isToday ? "bg-blue-50/50" : "bg-white")}>
                            <div className="flex items-center gap-3">
                                <div className={cn("w-12 h-12 rounded-lg flex flex-col items-center justify-center border", isToday ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-700")}>
                                    <span className="text-xs font-semibold uppercase">{dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="text-lg font-bold leading-none">{dayDate.getDate()}</span>
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">Day {index + 1}</h2>
                                    <p className="text-xs text-gray-500">{dayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            
                            {/* Dropdown Menu for Adding Items */}
                            <div className="relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuDate(activeMenuDate === date ? null : date);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Plus size={16}/> Add Item <ChevronDown size={14}/>
                                </button>

                                {activeMenuDate === date && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/30 border-b border-gray-50">Select Type</div>
                                        {MENU_OPTIONS.map((option) => (
                                            <button 
                                                key={option.type}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addItem(date, option.type);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                            >
                                                <option.icon size={16} className={option.color} />
                                                <span>{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-gray-100">
                            {dayItems.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No activities planned. Click "Add Item" to start planning.
                                </div>
                            ) : (
                                dayItems.map(item => (
                                    <div key={item.id} className="group relative p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                        
                                        {/* Time & Type Column */}
                                        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                                            <div className="relative w-24">
                                                <input 
                                                    type="time" 
                                                    value={item.time || ''} 
                                                    onChange={(e) => updateItem(item.id, { time: e.target.value })}
                                                    className="w-full bg-transparent text-sm font-medium text-gray-600 focus:text-brand-600 outline-none"
                                                />
                                            </div>
                                            
                                            {/* Type Dropdown (Pull Down Menu) */}
                                            <div className="relative">
                                                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <ActivityIcon type={item.type} />
                                                </div>
                                                <select 
                                                    value={item.type}
                                                    onChange={(e) => updateItem(item.id, { type: e.target.value as ActivityType })}
                                                    className="appearance-none pl-8 pr-4 py-1.5 bg-gray-100 rounded-md text-xs font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                                >
                                                    {Object.values(ActivityType).map(t => (
                                                        <option key={t} value={t}>{t === ActivityType.CUSTOM ? 'OTHERS' : t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Dynamic Content Inputs */}
                                        {renderInputs(item)}

                                        {/* Delete Action - Z-index fix for mobile */}
                                        <div className="flex shrink-0 ml-auto sm:ml-2 relative z-10">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteItem(item.id);
                                                }}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                                                title="Delete item"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </main>
    </div>
  );
};
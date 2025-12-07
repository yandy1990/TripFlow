import React, { useState } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { TripPlanner } from './components/TripPlanner';
import { User, Trip } from './types';

const App: React.FC = () => {
  // Simple state-based routing for this SPA
  const [user, setUser] = useState<User | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  if (currentTrip) {
    return (
      <TripPlanner 
        trip={currentTrip} 
        onBack={() => setCurrentTrip(null)} 
      />
    );
  }

  return (
    <Dashboard 
        user={user} 
        onSelectTrip={setCurrentTrip} 
    />
  );
};

export default App;

import React, { useEffect, useState } from 'react';
import apiService, { Deal } from '../../services/api';

const EventDashboard: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: Add filter state

  useEffect(() => {
    apiService.getDeals()
      .then(res => setDeals(res.data))
      .catch(err => setError('Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading events...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Event Discovery</h2>
      {/* TODO: Add filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map(deal => (
          <div key={deal.id} className="border rounded p-4 bg-white shadow">
            <h3 className="font-semibold text-lg">{deal.name}</h3>
            <div>{deal.venue} - {deal.city}</div>
            <div>{deal.date}</div>
            <div>From ${deal.minPrice} ({deal.currency})</div>
            <div>Deal Score: {deal.dealScore}</div>
            <a href={`/event/${deal.id}`} className="text-blue-600 underline">View Details</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventDashboard;

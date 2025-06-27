import React, { useEffect, useState } from 'react';
import apiService, { Deal } from '../../services/api';

const TrackingDashboard: React.FC = () => {
  const [tracked, setTracked] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getTrackedDeals()
      .then(res => setTracked(res.data))
      .catch(() => setError('Failed to load tracked events'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading tracked events...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tracked Events</h2>
      <ul>
        {tracked.map(deal => (
          <li key={deal.id} className="border-b py-2">
            <a href={`/event/${deal.id}`} className="text-blue-600 underline">{deal.name}</a> - {deal.venue} - ${deal.minPrice}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrackingDashboard;

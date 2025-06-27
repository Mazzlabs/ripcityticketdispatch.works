import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiService, { Deal } from '../../services/api';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiService.getDealById(id)
      .then(res => setDeal(res.data[0]))
      .catch(() => setError('Failed to load event details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading event details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!deal) return <div>No event found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-2">{deal.name}</h2>
      <div>{deal.venue} - {deal.city}</div>
      <div>{deal.date}</div>
      <div>Price: ${deal.minPrice} - ${deal.maxPrice} ({deal.currency})</div>
      <div>Deal Score: {deal.dealScore}</div>
      <div>{deal.description}</div>
      {/* TODO: Show price history, tracking button */}
    </div>
  );
};

export default EventDetail;

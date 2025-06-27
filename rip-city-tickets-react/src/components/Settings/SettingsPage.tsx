import React, { useEffect, useState } from 'react';
import apiService from '../../services/api';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getUserSettings()
      .then(res => setSettings(res.data))
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-lg mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Notification & Subscription Settings</h2>
      {/* TODO: Add forms to update settings */}
      <pre>{JSON.stringify(settings, null, 2)}</pre>
    </div>
  );
};

export default SettingsPage;

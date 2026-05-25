import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import SdrDashboardHeader from '../components/sdr/SdrDashboardHeader';
import SdrDailyCounters from '../components/sdr/SdrDailyCounters';
import SdrActionQueue from '../components/sdr/SdrActionQueue';
import SdrChecklist from '../components/sdr/SdrChecklist';

export default function SdrDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <SdrDashboardHeader user={user} />
        <SdrDailyCounters user={user} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fila de ações - ocupa 2/3 */}
          <div className="lg:col-span-2">
            <SdrActionQueue user={user} />
          </div>

          {/* Checklist - ocupa 1/3 */}
          <div className="lg:col-span-1">
            <SdrChecklist user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
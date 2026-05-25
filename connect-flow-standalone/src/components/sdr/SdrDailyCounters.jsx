import React from 'react';
import { PhoneCall, UserCheck, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function SdrDailyCounters({ user }) {
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const { data: activities = [] } = useQuery({
    queryKey: ['sdrActivitiesToday', user?.email],
    queryFn: () => base44.entities.SdrActivity.filter({ sdr_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leadsConvertidosHoje', user?.email],
    queryFn: () => base44.entities.Lead.filter({ sdr: user?.email, status: 'convertido' }),
    enabled: !!user?.email
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospectsConvertidosHoje', user?.email],
    queryFn: () => base44.entities.Prospect.filter({ sdr: user?.email, status: 'convertido' }),
    enabled: !!user?.email
  });

  const contatosHoje = activities.filter(a => {
    const data = a.activity_date ? a.activity_date.slice(0, 10) : '';
    return data === hoje;
  }).length;

  const leadsConvertidosHoje = leads.filter(l => {
    const data = l.updated_date ? l.updated_date.slice(0, 10) : '';
    return data === hoje;
  }).length;

  const prospectsConvertidosHoje = prospects.filter(p => {
    const data = p.updated_date ? p.updated_date.slice(0, 10) : '';
    return data === hoje;
  }).length;

  const counters = [
    {
      label: 'Contatos hoje',
      value: contatosHoje,
      icon: PhoneCall,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Leads → Prospect',
      value: leadsConvertidosHoje,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Prospects → Oportunidade',
      value: prospectsConvertidosHoje,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {counters.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${c.bg}`}>
              <Icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
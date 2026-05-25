import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, Phone, Mail, Video, Users, Instagram, Linkedin, Calendar, TrendingUp } from 'lucide-react';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ActivitiesDashboard() {
  const [selectedSdr, setSelectedSdr] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.SdrActivity.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Get unique SDRs from activities
  const sdrs = useMemo(() => {
    const sdrEmails = [...new Set(activities.map(a => a.sdr_email))];
    return users.filter(u => sdrEmails.includes(u.email));
  }, [activities, users]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    const monthStart = startOfMonth(parseISO(selectedMonth + '-01'));
    const monthEnd = endOfMonth(parseISO(selectedMonth + '-01'));

    return activities.filter(activity => {
      const activityDate = parseISO(activity.activity_date);
      const matchesSdr = selectedSdr === 'all' || activity.sdr_email === selectedSdr;
      const matchesMonth = activityDate >= monthStart && activityDate <= monthEnd;
      return matchesSdr && matchesMonth;
    });
  }, [activities, selectedSdr, selectedMonth]);

  // Calculate statistics
  const stats = useMemo(() => {
    const typeCount = {};
    const outcomeCount = {};
    
    filteredActivities.forEach(activity => {
      typeCount[activity.activity_type] = (typeCount[activity.activity_type] || 0) + 1;
      outcomeCount[activity.outcome] = (outcomeCount[activity.outcome] || 0) + 1;
    });

    return { typeCount, outcomeCount, total: filteredActivities.length };
  }, [filteredActivities]);

  const activityIcons = {
    'WhatsApp': { icon: WhatsAppIcon, color: 'text-green-600', bg: 'bg-green-50' },
    'Ligação': { icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
    'E-mail': { icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
    'Reunião Online': { icon: Video, color: 'text-red-600', bg: 'bg-red-50' },
    'Reunião Presencial': { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    'Instagram': { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
    'LinkedIn': { icon: Linkedin, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    'Outro': { icon: BarChart3, color: 'text-gray-600', bg: 'bg-gray-50' }
  };

  const selectedSdrData = sdrs.find(s => s.email === selectedSdr);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Dashboard de Atividades</h2>
            <p className="text-sm text-gray-600">Análise de desempenho dos SDRs</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
          </div>

          {/* SDR Selector */}
          <Select value={selectedSdr} onValueChange={setSelectedSdr}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione um SDR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os SDRs</SelectItem>
              {sdrs.map(sdr => (
                <SelectItem key={sdr.email} value={sdr.email}>
                  {sdr.full_name || sdr.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total de Atividades</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Sucesso</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.outcomeCount['Sucesso'] || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Sem Contato</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.outcomeCount['Sem Contato'] || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Em Andamento</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{stats.outcomeCount['Em Andamento'] || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Activity Types Breakdown */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Atividades por Tipo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(activityIcons).map(([type, { icon: Icon, color, bg }]) => {
            const count = stats.typeCount[type] || 0;
            return (
              <div key={type} className={`${bg} rounded-lg p-3 border border-gray-200`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs font-medium text-gray-700">{type}</span>
                </div>
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      {filteredActivities.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Últimas Atividades</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredActivities.slice(0, 10).map((activity) => {
              const Icon = activityIcons[activity.activity_type]?.icon || BarChart3;
              const iconColor = activityIcons[activity.activity_type]?.color || 'text-gray-600';
              const iconBg = activityIcons[activity.activity_type]?.bg || 'bg-gray-50';
              
              return (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className={`p-2 ${iconBg} rounded-lg`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.empresa_nome}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.outcome === 'Sucesso' ? 'bg-green-100 text-green-700' :
                        activity.outcome === 'Falha' ? 'bg-red-100 text-red-700' :
                        activity.outcome === 'Sem Contato' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {activity.outcome}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{activity.description || 'Sem descrição'}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(parseISO(activity.activity_date), 'dd/MM HH:mm', { locale: ptBR })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
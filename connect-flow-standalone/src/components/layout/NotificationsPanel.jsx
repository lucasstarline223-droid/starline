import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, AlertCircle, LifeBuoy, Zap } from 'lucide-react';

const DISMISSED_KEY = 'dismissed_notification_ids';

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); } catch { return []; }
}

function saveDismissed(ids) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

export default function NotificationsPanel({ onCountChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const moduleIcons = {
    IssueToResolution: { icon: LifeBuoy, label: 'Chamados', color: 'text-orange-600' },
    Leads: { icon: AlertCircle, label: 'Leads', color: 'text-blue-600' },
    Prospects: { icon: Zap, label: 'Prospects', color: 'text-purple-600' },
    Dashboard: { icon: AlertCircle, label: 'Dashboard', color: 'text-green-600' },
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const chamados = await base44.entities.Chamado.filter(
        { status: 'Aberto' },
        '-created_date',
        10
      );
      const dismissed = getDismissed();
      const filtered = (chamados || []).filter(c => !dismissed.includes(c.id));
      setNotifications(filtered);
      onCountChange?.(filtered.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (chamado) => {
    navigate('/IssueToResolution', { state: { chamadoId: chamado.id } });
  };

  const handleClearAll = () => {
    const dismissed = getDismissed();
    const allIds = [...new Set([...dismissed, ...notifications.map(n => n.id)])];
    saveDismissed(allIds);
    setNotifications([]);
    onCountChange?.(0);
  };

  const removeNotification = (id) => {
    const dismissed = getDismissed();
    saveDismissed([...new Set([...dismissed, id])]);
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      onCountChange?.(updated.length);
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">Nenhuma notificação no momento</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="space-y-2 p-3">
        {notifications.map((notif) => {
          const config = moduleIcons.IssueToResolution;
          const Icon = config.icon;

          return (
            <button
              key={notif.id}
              onClick={() => handleNavigate(notif)}
              className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded flex-shrink-0 mt-0.5 ${config.color.replace('text-', 'bg-').replace('600', '100')}`}>
                  <Icon className={`w-3 h-3 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-600">
                    {notif.nome_conta}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {notif.descricao || notif.produto}
                  </p>
                  <span className="inline-block mt-1 px-2 py-1 bg-white rounded text-xs font-medium text-gray-600 border border-gray-200">
                    {config.label}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notif.id);
                  }}
                  className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </button>
          );
        })}
      </div>

      {notifications.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100">
          <button
            onClick={handleClearAll}
            className="w-full text-xs font-medium text-gray-600 hover:text-red-600 py-1.5 transition-colors"
          >
            Limpar Todos
          </button>
        </div>
      )}
    </div>
  );
}
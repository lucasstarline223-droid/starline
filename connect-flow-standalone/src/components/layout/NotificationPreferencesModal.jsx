import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, Volume2 } from 'lucide-react';

const MODULES = [
  { id: 'IssueToResolution', name: 'Gestão de Chamados' },
  { id: 'Dashboard', name: 'Dashboard Comercial' },
  { id: 'SdrDashboard', name: 'Painel SDR' },
  { id: 'Leads', name: 'Leads' },
  { id: 'Prospects', name: 'Prospects' },
  { id: 'Oportunidades', name: 'Oportunidades' },
  { id: 'Handoff', name: 'Handoff' },
  { id: 'OrderToActivation', name: 'Order-to-Activation' },
  { id: 'Cancelamentos', name: 'Cancelamentos' },
  { id: 'Estoque', name: 'Estoque' },
  { id: 'Clientes', name: 'Clientes' },
];

export default function NotificationPreferencesModal({ open, onOpenChange }) {
  const [preferences, setPreferences] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      loadUserPreferences();
    }
  }, [open]);

  const loadUserPreferences = async () => {
    try {
      const user = await base44.auth.me();
      setPreferences(user.notification_preferences || {});
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences) => {
      const user = await base44.auth.me();
      await base44.auth.updateMe({
        notification_preferences: newPreferences
      });
      return newPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onOpenChange(false);
    }
  });

  const togglePreference = (moduleId, type) => {
    setPreferences(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [type]: !prev[moduleId]?.[type]
      }
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Preferências de Notificação
          </DialogTitle>
          <DialogDescription>
            Escolha como deseja receber notificações para cada módulo do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-gray-50 rounded-lg font-medium text-sm">
              <span>Módulo</span>
              <span className="flex items-center gap-2 justify-center">
                <Volume2 className="w-4 h-4" />
                Sonora
              </span>
              <span className="flex items-center gap-2 justify-center">
                <Mail className="w-4 h-4" />
                E-mail
              </span>
            </div>

            {MODULES.map((module) => (
              <div
                key={module.id}
                className="grid grid-cols-3 gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium">{module.name}</span>
                <div className="flex justify-center">
                  <Switch
                    checked={preferences[module.id]?.audio || false}
                    onCheckedChange={() => togglePreference(module.id, 'audio')}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={preferences[module.id]?.email || false}
                    onCheckedChange={() => togglePreference(module.id, 'email')}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
            {updatePreferencesMutation.isPending ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, Video, Users, Instagram, Linkedin } from 'lucide-react';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ActivityModal({ isOpen, onClose, entityId, entityType, entityName, preSelectedType, user }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    activity_type: preSelectedType || '',
    description: '',
    outcome: 'Em Andamento',
    activity_date: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    if (preSelectedType) {
      setFormData(prev => ({ ...prev, activity_type: preSelectedType }));
    }
  }, [preSelectedType]);

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.SdrActivity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      onClose();
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const activityData = {
      related_entity_id: entityId,
      related_entity_type: entityType,
      empresa_nome: entityName,
      activity_type: formData.activity_type,
      description: formData.description,
      outcome: formData.outcome,
      activity_date: formData.activity_date,
      sdr_email: user?.email || ''
    };

    // Atualiza ultimo_contato no Lead ou Prospect
    if (entityType === 'Lead' && entityId) {
      try {
        await base44.entities.Lead.update(entityId, { ultimo_contato: formData.activity_date });
      } catch {}
    }

    createActivityMutation.mutate(activityData);
  };

  const activityIcons = {
    'WhatsApp': WhatsAppIcon,
    'Ligação': Phone,
    'E-mail': Mail,
    'Reunião Online': Video,
    'Reunião Presencial': Users,
    'Instagram': Instagram,
    'LinkedIn': Linkedin
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registrar Atividade</h2>
            <p className="text-sm text-gray-600 mt-1">{entityName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Atividade *
            </label>
            <Select
              value={formData.activity_type}
              onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">
                  <div className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4" />
                    WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="Ligação">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Ligação
                  </div>
                </SelectItem>
                <SelectItem value="E-mail">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </div>
                </SelectItem>
                <SelectItem value="Reunião Online">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Reunião Online
                  </div>
                </SelectItem>
                <SelectItem value="Reunião Presencial">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Reunião Presencial
                  </div>
                </SelectItem>
                <SelectItem value="Instagram">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </div>
                </SelectItem>
                <SelectItem value="LinkedIn">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </div>
                </SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Atividade
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o que aconteceu nesta interação..."
              className="h-32"
            />
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data e Hora *
            </label>
            <Input
              type="datetime-local"
              value={formData.activity_date}
              onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
              required
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resultado *
            </label>
            <Select
              value={formData.outcome}
              onValueChange={(value) => setFormData({ ...formData, outcome: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sucesso">Sucesso</SelectItem>
                <SelectItem value="Falha">Falha</SelectItem>
                <SelectItem value="Sem Contato">Sem Contato</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={createActivityMutation.isPending}
            >
              {createActivityMutation.isPending ? 'Salvando...' : 'Registrar Atividade'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
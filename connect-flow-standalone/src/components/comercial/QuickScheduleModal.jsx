import React, { useState } from 'react';
import { X, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function QuickScheduleModal({ isOpen, onClose, prospect }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    data_reuniao: '',
    horario: '',
    observacoes: ''
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      // Atualizar prospect com data da reunião
      await base44.entities.Prospect.update(prospect.id, {
        data_reuniao_ae: data.data_reuniao,
        status: 'qualificado'
      });

      // Criar tarefa para o AE
      const aeUsers = await base44.entities.User.filter({ role: 'admin' });
      if (aeUsers.length > 0) {
        await base44.entities.SdrTask.create({
          titulo: `Reunião: ${prospect.nome_empresa}`,
          descricao: `Reunião agendada para ${data.horario}.\n\n${data.observacoes || ''}`,
          tipo: 'Reunião',
          prioridade: 'Alta',
          status: 'Pendente',
          data_vencimento: data.data_reuniao,
          sdr_responsavel: aeUsers[0].email,
          prospect_id: prospect.id,
          prospect_nome: prospect.nome_empresa
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      queryClient.invalidateQueries(['sdrTasks']);
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    scheduleMutation.mutate(formData);
  };

  if (!isOpen || !prospect) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Agendar Reunião com AE
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Prospect:</strong> {prospect.nome_empresa}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              O prospect será marcado como SQL e o AE será notificado automaticamente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data da Reunião *
            </label>
            <Input
              type="date"
              value={formData.data_reuniao}
              onChange={(e) => setFormData({ ...formData, data_reuniao: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horário Sugerido
            </label>
            <Input
              type="time"
              value={formData.horario}
              onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
              placeholder="Ex: 10:00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações para o AE
            </label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Pontos importantes, necessidades identificadas..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={scheduleMutation.isPending}>
              {scheduleMutation.isPending ? 'Agendando...' : 'Agendar e Notificar AE'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
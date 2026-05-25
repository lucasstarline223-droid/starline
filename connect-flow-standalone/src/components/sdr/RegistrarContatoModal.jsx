import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function RegistrarContatoModal({ isOpen, onClose, item, itemType, user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    activity_type: 'Ligação',
    outcome: 'Sucesso',
    description: '',
    agendar_followup: false,
    data_followup: ''
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Registrar atividade
      await base44.entities.SdrActivity.create({
        related_entity_id: item.id,
        related_entity_type: itemType,
        activity_type: data.activity_type,
        outcome: data.outcome,
        description: data.description,
        activity_date: new Date().toISOString(),
        sdr_email: user.email,
        empresa_nome: item.nome_empresa || item.nome_empresa || ''
      });

      // Se for lead, atualizar status para em_prospeccao
      if (itemType === 'Lead' && item.status === 'novo') {
        await base44.entities.Lead.update(item.id, { status: 'em_prospeccao' });
      }

      // Agendar follow-up se solicitado
      if (data.agendar_followup && data.data_followup) {
        await base44.entities.SdrTask.create({
          titulo: `Follow-up: ${item.nome_empresa}`,
          tipo: 'Follow-up',
          status: 'Pendente',
          prioridade: 'Média',
          data_vencimento: data.data_followup,
          sdr_responsavel: user.email,
          prospect_nome: item.nome_empresa
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sdrActivities']);
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['sdrTasks']);
      queryClient.invalidateQueries(['sdrActivitiesToday']);
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Registrar Contato</h2>
            <p className="text-sm text-gray-500">{item?.nome_empresa}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de contato</label>
            <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ligação">Ligação</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="E-mail">E-mail</SelectItem>
                <SelectItem value="Reunião Online">Reunião Online</SelectItem>
                <SelectItem value="Reunião Presencial">Reunião Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
            <Select value={form.outcome} onValueChange={(v) => setForm({ ...form, outcome: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Sucesso">Atendeu</SelectItem>
                <SelectItem value="Sem Contato">Não atendeu</SelectItem>
                <SelectItem value="Agendado">Agendou retorno</SelectItem>
                <SelectItem value="Em Andamento">Em andamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="O que foi discutido?"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="agendar"
              checked={form.agendar_followup}
              onChange={(e) => setForm({ ...form, agendar_followup: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="agendar" className="text-sm text-gray-700">Agendar próximo follow-up</label>
          </div>

          {form.agendar_followup && (
            <Input
              type="date"
              value={form.data_followup}
              onChange={(e) => setForm({ ...form, data_followup: e.target.value })}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Registrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { X, Building2, Briefcase, Calendar, Users, Phone, Mail, Globe, Clock, MessageSquare, ListTodo, Lightbulb, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NextStepsPanel from './NextStepsPanel';
import ProspectSummaryPanel from './ProspectSummaryPanel';

export default function ProspectDetailModal({ prospect, isOpen, onClose }) {
  const [selectedContact, setSelectedContact] = useState(null);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', prospect?.nome_empresa],
    queryFn: () => base44.entities.Contact.filter({ empresa: prospect.nome_empresa }),
    enabled: isOpen && !!prospect?.nome_empresa
  });

  if (!isOpen || !prospect) return null;

  const getTamanhoIcon = (tamanho) => {
    const icons = {
      'Micro': '🏪',
      'Pequena': '🏢',
      'Média': '🏭',
      'Grande': '🌆',
      'Enterprise': '🏛️'
    };
    return icons[tamanho] || '🏢';
  };

  // Mock data for demonstration purposes
  const mockActivities = [
    { id: 1, type: 'Ligação', date: '2026-01-28', description: 'Primeiro contato, prospect demonstrou interesse em VoIP.' },
    { id: 2, type: 'Email', date: '2026-01-29', description: 'Envio de material sobre soluções de telefonia.' },
    { id: 3, type: 'Reunião', date: '2026-01-30', description: 'Reunião de qualificação com o gestor de TI. Necessidades levantadas.' },
  ];

  const lastContact = mockActivities.length > 0 ? mockActivities[mockActivities.length - 1] : null;

  const nextActionSuggestions = {
    'em_qualificacao': 'Agendar reunião de qualificação.',
    'em_contato': 'Enviar proposta inicial baseada nas necessidades levantadas.',
    'qualificado': 'Apresentar solução customizada e negociar termos.',
    'descartado': 'Arquivar prospect e registrar motivo.',
    'convertido': 'Iniciar processo de onboarding e acompanhar satisfação.'
  };

  const identifiedNeeds = prospect.notas_qualificacao || 'Nenhuma necessidade identificada ainda.';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Main Content - Left and Middle Columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between border-b pb-4 mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-7 h-7 text-blue-600" />
                {prospect.nome_empresa || 'Nome da Empresa'}
              </h2>
              {prospect.nome_contato && (
                <p className="text-lg text-gray-700 mt-1 flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-gray-500" />
                  {prospect.nome_contato} {prospect.cargo_contato && `(${prospect.cargo_contato})`}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </Button>
          </div>

          {/* Prospect Details */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <ListTodo className="w-5 h-5 text-purple-600" /> Detalhes do Prospect
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
              <p className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-500" /> Segmento: {prospect.segmento || 'N/A'}</p>
              <p className="flex items-center gap-2"><span className="text-xl">{getTamanhoIcon(prospect.tamanho_empresa)}</span> Tamanho: {prospect.tamanho_empresa || 'N/A'}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /> Telefone Empresa: {prospect.telefone_empresa || 'N/A'}</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" /> Email Empresa: {prospect.email_empresa || 'N/A'}</p>
              <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-gray-500" /> Site: {prospect.site_empresa || 'N/A'}</p>
              <p className="flex items-center gap-2"><UserRound className="w-4 h-4 text-gray-500" /> SDR Responsável: {prospect.sdr || 'N/A'}</p>
              {prospect.data_reuniao_ae && (
                <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /> Reunião AE: {format(new Date(prospect.data_reuniao_ae), 'dd/MM/yyyy')}</p>
              )}
              <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500" /> Status: <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">{prospect.status?.replace(/_/g, ' ')}</span></p>
            </div>
          </div>

          {/* Needs Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-600" /> Necessidades Identificadas
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm">
              {identifiedNeeds}
            </div>
          </div>

          {/* Contacts Section */}
          {contacts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-indigo-600" /> Contatos da Empresa
              </h3>
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="w-full bg-gray-50 hover:bg-gray-100 p-3 rounded-lg border border-gray-200 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{contact.nome}</p>
                        <p className="text-sm text-gray-600">{contact.cargo || 'Cargo não informado'}</p>
                      </div>
                      {contact.principal && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">Principal</span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {contact.email && (
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </p>
                      )}
                      {contact.telefone && (
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {contact.telefone}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="md:col-span-1 space-y-6">
          {/* AI-Powered Insights */}
          <NextStepsPanel prospectId={prospect.id} />
          <ProspectSummaryPanel prospectId={prospect.id} prospectName={prospect.nome_empresa} />

          {/* Last Contact */}
          {lastContact && (
            <div className="bg-green-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                <UserRound className="w-5 h-5 text-green-600" /> Último Contato
              </h3>
              <p className="text-green-700 text-sm"><Clock className="inline-block w-4 h-4 mr-1" /> {lastContact.date} - {lastContact.type}</p>
              <p className="text-green-700 text-sm mt-1">{lastContact.description}</p>
            </div>
          )}

          {/* Activity Log */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-orange-600" /> Registro de Atividades
            </h3>
            <div className="space-y-3">
              {mockActivities.length > 0 ? (
                mockActivities.map(activity => (
                  <div key={activity.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">{activity.date} - {activity.type}</p>
                    <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhuma atividade registrada.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Detail Popup */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={() => setSelectedContact(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedContact.nome}</h3>
                <p className="text-sm text-gray-600">{selectedContact.cargo || 'Cargo não informado'}</p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="text-sm text-gray-900">{selectedContact.email || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="text-sm text-gray-900">{selectedContact.telefone || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Empresa</p>
                  <p className="text-sm text-gray-900">{selectedContact.empresa || 'Não informado'}</p>
                </div>
              </div>

              {selectedContact.principal && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">✓ Contato Principal</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
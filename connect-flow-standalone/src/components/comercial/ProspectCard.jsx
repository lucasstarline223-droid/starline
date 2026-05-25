import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Briefcase, Users, Calendar, Trash2, UserPlus, Edit, Phone, Mail, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'react-router-dom';

export default function ProspectCard({ prospect, onDelete, onEdit, onAddContact, onRegisterActivity }) {
  const [showSdrInfo, setShowSdrInfo] = useState(false);
  
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', prospect.nome_empresa],
    queryFn: () => base44.entities.Contact.filter({ empresa: prospect.nome_empresa }),
    enabled: !!prospect.nome_empresa
  });

  const { data: sdrUser } = useQuery({
    queryKey: ['user', prospect.sdr],
    queryFn: async () => {
      if (!prospect.sdr) return null;
      const users = await base44.entities.User.filter({ email: prospect.sdr });
      return users[0] || null;
    },
    enabled: !!prospect.sdr,
    staleTime: 0,
    refetchInterval: 30000
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getTamanhoIconSize = (tamanho) => {
    const sizes = {
      'Micro': 'w-3 h-3',
      'Pequena': 'w-3.5 h-3.5',
      'Média': 'w-4 h-4',
      'Grande': 'w-4.5 h-4.5',
      'Enterprise': 'w-5 h-5'
    };
    return sizes[tamanho] || 'w-3.5 h-3.5';
  };

  const handleAddContact = () => {
    if (onAddContact) {
      onAddContact({
        empresa: prospect.nome_empresa || '',
        nome: prospect.nome_contato || '',
        email: prospect.email_contato || '',
        telefone: prospect.telefone_contato || '',
        cargo: prospect.cargo_contato || ''
      });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Prioridade Alta';
    if (score >= 60) return 'Prioridade Média';
    if (score >= 40) return 'Prioridade Baixa';
    return 'Qualificar';
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all hover:border-gray-300 relative group">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(prospect);
            }}
            className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Tem certeza que deseja excluir este prospect?')) {
                onDelete(prospect.id);
              }
            }}
            className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Badge oportunidade criada */}
      {prospect.deal_id && (
        <Link
          to="/Oportunidades"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <span>🏆</span>
          <span>Oportunidade criada</span>
          <ExternalLink className="w-3 h-3 ml-auto" />
        </Link>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 truncate">
              {prospect.nome_empresa || 'Sem nome'}
            </h4>
            {prospect.score_ia && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getScoreColor(prospect.score_ia)}`}>
                <TrendingUp className="w-3 h-3" />
                {Math.round(prospect.score_ia)}
              </div>
            )}
          </div>
          {prospect.nome_contato && (
            <p className="text-sm text-gray-600 truncate">{prospect.nome_contato}</p>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="space-y-2 mb-3">
        {prospect.segmento && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-gray-700">{prospect.segmento}</span>
          </div>
        )}
        
        {prospect.tamanho_empresa && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className={`${getTamanhoIconSize(prospect.tamanho_empresa)} text-purple-500`} />
            <span className="text-gray-700">{prospect.tamanho_empresa}</span>
          </div>
        )}
        
        {prospect.data_reuniao_ae && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-3.5 h-3.5 text-green-500" />
            <div className="flex-1">
              <span className="text-gray-700">
                Reunião AE: {format(new Date(prospect.data_reuniao_ae), 'dd/MM/yyyy')}
              </span>
              {prospect.status === 'qualificado' && (
                <span className="block text-xs text-green-600">
                  ✓ AE notificado
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contatos */}
      {contacts.length > 0 && (
        <div className="space-y-1 mb-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Contatos:</div>
          {contacts.slice(0, 2).map((contact) => (
            <div key={contact.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1">
              <Users className="w-3 h-3" />
              <span className="truncate">{contact.nome}</span>
              {contact.principal && (
                <span className="text-blue-600 font-medium">★</span>
              )}
            </div>
          ))}
          {contacts.length > 2 && (
            <div className="text-xs text-gray-400">+{contacts.length - 2} mais</div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegisterActivity?.(prospect, 'WhatsApp');
          }}
          className="flex-1 flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          title="Enviar WhatsApp"
        >
          <WhatsAppIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegisterActivity?.(prospect, 'Ligação');
          }}
          className="flex-1 flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="Fazer Ligação"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegisterActivity?.(prospect, 'E-mail');
          }}
          className="flex-1 flex items-center justify-center p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
          title="Enviar E-mail"
        >
          <Mail className="w-4 h-4" />
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 relative">
          {prospect.sdr && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSdrInfo(!showSdrInfo);
                }}
                className="hover:opacity-70 transition-opacity"
              >
                <Avatar className="w-7 h-7">
                  <AvatarImage src={sdrUser?.avatar_url} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                    {getInitials(sdrUser?.full_name || prospect.sdr)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {showSdrInfo && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSdrInfo(false);
                    }}
                  />
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px] z-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={sdrUser?.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(sdrUser?.full_name || prospect.sdr)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {sdrUser?.full_name || prospect.sdr}
                        </p>
                        <p className="text-xs text-gray-500">SDR</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
                      {sdrUser?.email || prospect.sdr}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddContact();
            }}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="Adicionar contato"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>

          {prospect.cargo_contato && (
            <div className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
              {prospect.cargo_contato}
            </div>
          )}
        </div>
      </div>
      </div>
  );
}
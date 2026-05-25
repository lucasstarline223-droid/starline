import React from 'react';
import { Building2, Mail, Phone, User, MapPin, Clock } from 'lucide-react';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function ContactIndicator({ ultimoContato }) {
  if (!ultimoContato) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        <span>Sem contato</span>
      </div>
    );
  }

  const dias = differenceInDays(new Date(), parseISO(ultimoContato));
  let color, label;
  if (dias <= 2) {
    color = 'text-green-600 bg-green-50';
    label = `${dias === 0 ? 'Hoje' : dias === 1 ? 'Ontem' : `${dias}d atrás`}`;
  } else if (dias <= 5) {
    color = 'text-yellow-600 bg-yellow-50';
    label = `${dias}d atrás`;
  } else {
    color = 'text-red-600 bg-red-50';
    label = `${dias}d atrás`;
  }

  return (
    <div className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${color}`}>
      <Clock className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}

const FONTE_COLORS = {
  'Site': 'bg-blue-50 text-blue-600',
  'Indicação': 'bg-green-50 text-green-600',
  'Cold Call': 'bg-cyan-50 text-cyan-600',
  'Lista Speedio': 'bg-purple-50 text-purple-600',
  'WhatsApp': 'bg-green-50 text-green-700',
  'Redes Sociais': 'bg-pink-50 text-pink-600',
  'Evento': 'bg-orange-50 text-orange-600',
  'Outro': 'bg-gray-50 text-gray-600',
};

export default function LeadCard({ lead, onRegisterActivity }) {
  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const numero = (lead.whatsapp || lead.telefone_contato || '').replace(/\D/g, '');
    if (!numero) {
      onRegisterActivity?.(lead, 'WhatsApp');
      return;
    }
    const nome = lead.nome_contato || lead.nome_empresa || '';
    const msg = encodeURIComponent(`Olá ${nome}, tudo bem? Sou da Starline, entramos em contato pois temos soluções em telefonia VoIP, PABX em nuvem e WhatsApp Oficial. Posso te apresentar?`);
    window.open(`https://wa.me/55${numero}?text=${msg}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all hover:border-gray-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <h4 className="font-semibold text-gray-900 truncate">{lead.nome_empresa || 'Sem nome'}</h4>
        </div>
        <ContactIndicator ultimoContato={lead.ultimo_contato} />
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 mb-3">
        {lead.nome_contato && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{lead.nome_contato}</span>
          </div>
        )}
        {lead.email_contato && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{lead.email_contato}</span>
          </div>
        )}
        {(lead.whatsapp || lead.telefone_contato) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>{lead.whatsapp || lead.telefone_contato}</span>
          </div>
        )}
        {(lead.cidade || lead.estado) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span>{[lead.cidade, lead.estado].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          title="Abrir WhatsApp"
        >
          <WhatsAppIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRegisterActivity?.(lead, 'Ligação'); }}
          className="flex-1 flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="Fazer Ligação"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRegisterActivity?.(lead, 'E-mail'); }}
          className="flex-1 flex items-center justify-center p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
          title="Enviar E-mail"
        >
          <Mail className="w-4 h-4" />
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
        {lead.fonte_lead && (
          <div className={`px-2 py-0.5 rounded-lg text-xs font-medium ${FONTE_COLORS[lead.fonte_lead] || 'bg-gray-50 text-gray-600'}`}>
            {lead.fonte_lead}
          </div>
        )}
        {(lead.sdr_nome || lead.sdr) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{lead.sdr_nome || lead.sdr}</span>
          </div>
        )}
      </div>
    </div>
  );
}
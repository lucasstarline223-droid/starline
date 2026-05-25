import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ChamadoCard from './ChamadoCard';

const NIVEIS = [
  { key: 'N1 - WhatsApp', label: 'N1', sublabel: 'WhatsApp' },
  { key: 'N2 - Avançado', label: 'N2', sublabel: 'Avançado' },
  { key: 'N3 - Especialista', label: 'N3', sublabel: 'Especialista' },
  { key: 'Visita Presencial', label: 'Visita', sublabel: 'Presencial' }
];

export default function SuporteWhatsAppTab({ viewMode = 'compact' }) {
  const [nivelAtivo, setNivelAtivo] = useState('N1 - WhatsApp');

  const { data: chamados = [], isLoading } = useQuery({
    queryKey: ['chamados'],
    queryFn: () => base44.entities.Chamado.list('-created_date')
  });

  // Um chamado pertence ao canal WhatsApp se seu nível N1 de origem foi "N1 - WhatsApp"
  const isWhatsApp = (c) => {
    if (c.tipo_suporte === 'N1 - WhatsApp') return true;
    // Para N2+, verifica o histórico: o primeiro nível registrado deve ser N1 - WhatsApp
    const historico = c.historico_acoes || [];
    const primeiroNivel = historico.length > 0 ? historico[0].nivel : null;
    if (primeiroNivel) return primeiroNivel === 'N1 - WhatsApp';
    return false;
  };

  const getCount = (nivel) => chamados.filter(c =>
    c.tipo_suporte === nivel && !['Resolvido', 'Fechado'].includes(c.status) && isWhatsApp(c)
  ).length;

  const chamadosFiltrados = chamados.filter(c =>
    c.tipo_suporte === nivelAtivo && !['Resolvido', 'Fechado'].includes(c.status) && isWhatsApp(c)
  );

  const nivelAtual = NIVEIS.find(n => n.key === nivelAtivo);

  return (
    <div>
      {/* Sub-abas de nível */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {NIVEIS.map((nivel) => {
          const count = getCount(nivel.key);
          const isActive = nivelAtivo === nivel.key;
          return (
            <button
              key={nivel.key}
              onClick={() => setNivelAtivo(nivel.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                isActive
                  ? 'bg-green-600 border-green-600 text-white shadow-sm'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
              }`}
            >
              <span>{nivel.label} · {nivel.sublabel}</span>
              {count > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold ${
                  isActive ? 'bg-white text-green-600' : 'bg-green-100 text-green-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Header do nível ativo */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">
          {nivelAtual?.label} · {nivelAtual?.sublabel?.toUpperCase()}
        </h2>
        <p className="text-sm text-gray-500">{chamadosFiltrados.length} chamado(s) ativo(s)</p>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Carregando chamados...</div>
      ) : chamadosFiltrados.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
          Nenhum chamado neste nível
        </div>
      ) : (
        <div className={viewMode === 'expanded' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3'}>
          {chamadosFiltrados.map((chamado) => (
            <ChamadoCard key={chamado.id} chamado={chamado} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
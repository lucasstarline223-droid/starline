import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ChamadoCard from './ChamadoCard';

const NIVEIS = [
  { key: 'N1 - Suporte', label: 'N1', sublabel: 'Suporte' },
  { key: 'N2 - Avançado', label: 'N2', sublabel: 'Avançado' },
  { key: 'N3 - Especialista', label: 'N3', sublabel: 'Especialista' },
  { key: 'Visita Presencial', label: 'Visita', sublabel: 'Presencial' }
];

export default function SuportePabxTab({ viewMode = 'compact' }) {
  const [nivelAtivo, setNivelAtivo] = useState('N1 - Suporte');

  const { data: chamados = [], isLoading } = useQuery({
    queryKey: ['chamados'],
    queryFn: () => base44.entities.Chamado.list('-created_date')
  });

  // Um chamado pertence ao canal PABX se em algum momento passou por N1 - Suporte
  const isPabx = (c) => {
    if (c.tipo_suporte === 'N1 - Suporte') return true;
    // Verifica se em alguma entrada do histórico houve N1 - Suporte
    const historico = c.historico_acoes || [];
    const passouPorN1Suporte = historico.some(h => h.nivel === 'N1 - Suporte');
    if (passouPorN1Suporte) return true;
    // Fallback: se não passou por N1 - WhatsApp, assume PABX
    const passouPorN1Wati = historico.some(h => h.nivel === 'N1 - WhatsApp');
    return !passouPorN1Wati && c.tipo_suporte !== 'N1 - WhatsApp';
  };

  const getCount = (nivel) => chamados.filter(c =>
    c.tipo_suporte === nivel && !['Resolvido', 'Fechado'].includes(c.status) && isPabx(c)
  ).length;

  const chamadosFiltrados = chamados.filter(c =>
    c.tipo_suporte === nivelAtivo && !['Resolvido', 'Fechado'].includes(c.status) && isPabx(c)
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
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              <span>{nivel.label} · {nivel.sublabel}</span>
              {count > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold ${
                  isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'
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
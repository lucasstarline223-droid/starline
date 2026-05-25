import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Navigation, Save, AlertTriangle, ExternalLink, Loader2, Package, ArrowLeftRight, Trash2 } from 'lucide-react';
import AlocarEquipamentoModal from '@/components/estoque/AlocarEquipamentoModal';

export default function VisitaPresencialPanel({ chamado }) {
  const [instrucoes, setInstrucoes] = useState(chamado.instrucoes_visita || '');
  const [enderecoAlt, setEnderecoAlt] = useState(chamado.endereco_alternativo_visita || '');
  const [enderecoAltSalvo, setEnderecoAltSalvo] = useState(chamado.endereco_alternativo_visita || '');
  const [editandoEndereco, setEditandoEndereco] = useState(false);
  const [resolvendoLink, setResolvendoLink] = useState(false);
  const [showAlocarModal, setShowAlocarModal] = useState(false);
  const [removendoId, setRemovendoId] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: equipamentosAlocados = [] } = useQuery({
    queryKey: ['equipamentos-alocados-chamado', chamado.id],
    queryFn: () => base44.entities.EquipamentoAlocado.filter({ chamado_id: chamado.id })
  });

  const { data: cliente } = useQuery({
    queryKey: ['client-visita', chamado.client_id],
    queryFn: () => base44.entities.Client.filter({ id: chamado.client_id }).then(r => r[0]),
    enabled: !!chamado.client_id
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Chamado.update(chamado.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chamados'] })
  });

  const salvarInstrucoes = () => {
    updateMutation.mutate({ ...chamado, instrucoes_visita: instrucoes });
  };

  const handleAlocarEquipamento = async (dados) => {
    // Subtrai do estoque do técnico
    const estoquesTecnico = await base44.entities.EstoqueTecnico.filter({
      tecnico_email: dados.tecnico_email,
      hardware_id: dados.hardware_id
    });
    if (estoquesTecnico.length > 0) {
      const et = estoquesTecnico[0];
      const novaQtd = (et.quantidade || 0) - dados.quantidade;
      if (novaQtd <= 0) {
        await base44.entities.EstoqueTecnico.delete(et.id);
      } else {
        await base44.entities.EstoqueTecnico.update(et.id, { ...et, quantidade: novaQtd });
      }
    }
    // Registra a alocação
    await base44.entities.EquipamentoAlocado.create({
      client_id: chamado.client_id || '',
      client_nome: chamado.nome_conta,
      hardware_id: dados.hardware_id,
      hardware_nome: dados.hardware_nome,
      hardware_fabricante: dados.hardware_fabricante,
      hardware_url_foto: dados.hardware_url_foto,
      chamado_id: chamado.id,
      chamado_descricao: chamado.descricao?.slice(0, 100) || '',
      tecnico_nome: dados.tecnico_nome,
      tecnico_email: dados.tecnico_email,
      quantidade: dados.quantidade,
      observacoes: dados.observacoes,
      data_alocacao: new Date().toISOString().split('T')[0]
    });
    queryClient.invalidateQueries({ queryKey: ['equipamentos-alocados-chamado', chamado.id] });
    queryClient.invalidateQueries({ queryKey: ['estoque-tecnico'] });
    queryClient.invalidateQueries({ queryKey: ['equipamentos-alocados'] });
    setShowAlocarModal(false);
  };

  // Busca todos equipamentos alocados ao cliente (não só deste chamado)
  const { data: equipamentosCliente = [] } = useQuery({
    queryKey: ['equipamentos-cliente', chamado.client_id],
    queryFn: () => base44.entities.EquipamentoAlocado.filter({ client_id: chamado.client_id }),
    enabled: !!chamado.client_id
  });

  const handleRemoverDoCliente = async (eq) => {
    if (!user) return;
    setRemovendoId(eq.id);
    try {
      // Devolve ao estoque do técnico que está fazendo a visita (usuário logado)
      const tecnicoNome = user.full_name;
      const tecnicoEmail = user.email;

      const estoqueExistente = await base44.entities.EstoqueTecnico.filter({
        tecnico_email: tecnicoEmail,
        hardware_id: eq.hardware_id
      });

      if (estoqueExistente.length > 0) {
        const et = estoqueExistente[0];
        await base44.entities.EstoqueTecnico.update(et.id, {
          ...et,
          quantidade: (et.quantidade || 0) + (eq.quantidade || 1)
        });
      } else {
        await base44.entities.EstoqueTecnico.create({
          tecnico_nome: tecnicoNome,
          tecnico_email: tecnicoEmail,
          hardware_id: eq.hardware_id,
          hardware_nome: eq.hardware_nome,
          hardware_fabricante: eq.hardware_fabricante,
          hardware_url_foto: eq.hardware_url_foto || '',
          quantidade: eq.quantidade || 1
        });
      }

      // Remove o registro de alocação do cliente
      await base44.entities.EquipamentoAlocado.delete(eq.id);

      queryClient.invalidateQueries({ queryKey: ['equipamentos-cliente', chamado.client_id] });
      queryClient.invalidateQueries({ queryKey: ['equipamentos-alocados-chamado', chamado.id] });
      queryClient.invalidateQueries({ queryKey: ['estoque-tecnico'] });
    } finally {
      setRemovendoId(null);
    }
  };

  const isGoogleMapsLink = (text) =>
    text && (text.includes('maps.app.goo.gl') || text.includes('google.com/maps') || text.includes('maps.google.com'));

  const salvarEnderecoAlt = async () => {
    let enderecoFinal = enderecoAlt;

    if (isGoogleMapsLink(enderecoAlt)) {
      setResolvendoLink(true);
      try {
        const resp = await base44.functions.invoke('resolverEnderecoMaps', { url: enderecoAlt });
        if (resp.data?.endereco) {
          enderecoFinal = resp.data.endereco;
          setEnderecoAlt(enderecoFinal);
        }
      } catch (e) {
        // mantém o link original se falhar
      }
      setResolvendoLink(false);
    }

    setEnderecoAltSalvo(enderecoFinal);
    updateMutation.mutate({ ...chamado, endereco_alternativo_visita: enderecoFinal });
    setEditandoEndereco(false);
  };

  // Endereço a exibir: prioridade ao alternativo (estado local atualizado), senão do cliente
  const enderecoCliente = cliente?.endereco_completo || cliente?.endereco;
  const linkGmaps = cliente?.localizacao_gm;
  const enderecoExibir = enderecoAltSalvo || enderecoCliente;
  const semEndereco = !enderecoExibir;

  const getGmapsUrl = (texto) => {
    if (!texto) return null;
    // Se já é uma URL, retorna direto
    if (texto.startsWith('http')) return texto;
    // Se parece coordenadas (ex: -23.5505,-46.6333)
    if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(texto.trim())) {
      const [lat, lng] = texto.split(',');
      return `https://www.google.com/maps?q=${lat.trim()},${lng.trim()}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
  };

  return (
    <div className="px-5 py-4 bg-purple-50 border-t border-purple-100 space-y-4">
      
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
          <Navigation className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm font-bold text-purple-800 uppercase tracking-wide">Painel de Visita Presencial</p>
      </div>

      {/* Endereço */}
      <div className="bg-white rounded-xl border border-purple-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Endereço do Cliente
          </p>
          <button
            onClick={() => setEditandoEndereco(!editandoEndereco)}
            className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline"
          >
            {editandoEndereco ? 'Cancelar' : 'Ajustar / Coordenadas'}
          </button>
        </div>

        {semEndereco && !editandoEndereco && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">Endereço não cadastrado. Clique em "Ajustar / Coordenadas" para adicionar.</span>
          </div>
        )}

        {!editandoEndereco && enderecoExibir && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 font-medium">{enderecoExibir}</p>
              {enderecoAltSalvo && (
                <p className="text-xs text-amber-600 mt-0.5">⚠ Endereço alternativo (sobrepõe cadastro do cliente)</p>
              )}
              {!enderecoAltSalvo && enderecoCliente && (
                <p className="text-xs text-gray-400 mt-0.5">Endereço do cadastro do cliente</p>
              )}
            </div>
            {getGmapsUrl(enderecoExibir) && (
              <a
                href={getGmapsUrl(enderecoExibir)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Maps
              </a>
            )}
          </div>
        )}

        {/* Link direto do Google Maps do cliente */}
        {!editandoEndereco && linkGmaps && !enderecoAltSalvo && (
          <a
            href={linkGmaps}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Link Google Maps do cliente
          </a>
        )}

        {editandoEndereco && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-500">
              Cole o endereço, link do Google Maps ou coordenadas (ex: -23.5505,-46.6333).
              Deixe em branco para usar o do cliente.
            </p>
            <textarea
              value={enderecoAlt}
              onChange={(e) => setEnderecoAlt(e.target.value)}
              placeholder="Ex: Rua das Acácias s/n, próx. à Igreja · ou · -29.1234,-51.4321 · ou · https://maps.app.goo.gl/..."
              rows={2}
              className="w-full text-sm border border-purple-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 placeholder:text-gray-400"
            />
            <button
              onClick={salvarEnderecoAlt}
              disabled={updateMutation.isPending || resolvendoLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {resolvendoLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {resolvendoLink ? 'Resolvendo link...' : 'Salvar endereço'}
            </button>
          </div>
        )}
      </div>

      {/* Equipamentos alocados */}
      <div className="bg-white rounded-xl border border-purple-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Equipamentos Alocados ao Cliente
          </p>
          <button
            onClick={() => setShowAlocarModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            Alocar Equipamento
          </button>
        </div>
        {equipamentosAlocados.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nenhum equipamento alocado neste chamado ainda</p>
        ) : (
          <div className="space-y-3">
            {equipamentosAlocados.map(eq => (
              <div key={eq.id} className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                {eq.hardware_url_foto ? (
                  <img src={eq.hardware_url_foto} alt="" className="w-16 h-16 object-contain rounded-xl bg-white border border-green-100 flex-shrink-0 p-1" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl border border-green-100 flex-shrink-0">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900">{eq.hardware_nome}</p>
                  <p className="text-sm text-gray-500">{eq.hardware_fabricante}</p>
                  {eq.observacoes && <p className="text-xs text-gray-500 mt-1 italic">{eq.observacoes}</p>}
                  <p className="text-xs text-gray-400 mt-1">Por {eq.tecnico_nome} · {eq.data_alocacao}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-2xl font-bold text-green-700">{eq.quantidade}</span>
                  <span className="text-xs text-green-600 font-semibold">unid.</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Ativo</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipamentos do cliente (para retirada) */}
      {chamado.client_id && (
        <div className="bg-white rounded-xl border border-orange-200 p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <ArrowLeftRight className="w-3.5 h-3.5 text-orange-500" />
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Equipamentos do Cliente
            </p>
            <span className="ml-auto text-xs text-gray-400">Remover devolve ao seu estoque</span>
          </div>

          {equipamentosCliente.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum equipamento registrado para este cliente</p>
          ) : (
            <div className="space-y-3">
              {equipamentosCliente.map(eq => (
                <div key={eq.id} className="flex items-center gap-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  {eq.hardware_url_foto ? (
                    <img src={eq.hardware_url_foto} alt="" className="w-16 h-16 object-contain rounded-xl bg-white border border-orange-100 flex-shrink-0 p-1" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl border border-orange-100 flex-shrink-0">📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900">{eq.hardware_nome}</p>
                    <p className="text-sm text-gray-500">{eq.hardware_fabricante}</p>
                    {eq.data_alocacao && <p className="text-xs text-gray-400 mt-1">Alocado em {eq.data_alocacao}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-2xl font-bold text-orange-600">{eq.quantidade}</span>
                    <span className="text-xs text-orange-500 font-semibold">unid.</span>
                    <button
                      onClick={() => handleRemoverDoCliente(eq)}
                      disabled={removendoId === eq.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      {removendoId === eq.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Retirar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instruções da visita */}
      <div className="bg-white rounded-xl border border-purple-200 p-4">
        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Instruções para o Técnico</p>
        <textarea
          value={instrucoes}
          onChange={(e) => setInstrucoes(e.target.value)}
          placeholder="Descreva o que o técnico deve fazer na visita: equipamento a substituir, acesso ao local, contato no local, etc."
          rows={3}
          className="w-full text-sm border border-purple-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 placeholder:text-gray-400"
        />
        <button
          onClick={salvarInstrucoes}
          disabled={!instrucoes.trim() || updateMutation.isPending}
          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Salvar instruções
        </button>

        {/* Exibe instruções já salvas como leitura rápida */}
        {chamado.instrucoes_visita && instrucoes === chamado.instrucoes_visita && (
          <div className="mt-2 flex items-start gap-2 bg-purple-50 rounded-lg px-3 py-2">
            <span className="text-purple-500 mt-0.5">✓</span>
            <p className="text-xs text-purple-700 leading-relaxed">{chamado.instrucoes_visita}</p>
          </div>
        )}
      </div>

      {showAlocarModal && (
        <AlocarEquipamentoModal
          chamado={chamado}
          onClose={() => setShowAlocarModal(false)}
          onAlocar={handleAlocarEquipamento}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
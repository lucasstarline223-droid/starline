import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Save, Building2, Paperclip, Image, FileText, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NovoChamadoModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    nome_conta: '',
    number_problem: '',
    produto: '',
    tipo_suporte: 'Triagem',
    canal_entrada: '',
    prioridade: '',
    nome_solicitante: '',
    contato_resposta: '',
    descricao: '',
    status: 'Aberto'
  });
  const [clienteSearch, setClienteSearch] = useState('');
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [didOptions, setDidOptions] = useState([]);
  const [anexosLocais, setAnexosLocais] = useState([]);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const fileInputRef = useRef(null);

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-chamado'],
    queryFn: () => base44.entities.Client.list(),
    enabled: isOpen
  });

  const sugestoes = clienteSearch.length >= 2
    ? clientes.filter(c =>
        (c.nome_fantasia || c.razao_social || '').toLowerCase().includes(clienteSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSelectCliente = async (cliente) => {
    const nome = cliente.nome_fantasia || cliente.razao_social;
    const telefoneCliente = cliente.telefone_contato || '';

    // Busca números DID vinculados ao cliente
    let didsEncontrados = [];
    try {
      const dids = await base44.entities.NumeroDID.filter({ client_id: cliente.id });
      didsEncontrados = (dids || []).filter(d => d.status !== 'Cancelado');
    } catch (_) {}

    setDidOptions(didsEncontrados);
    setFormData({
      ...formData,
      nome_conta: nome,
      client_id: cliente.id,
      number_problem: didsEncontrados.length === 1 ? didsEncontrados[0].numero : '',
      contato_resposta: formData.contato_resposta || telefoneCliente
    });
    setClienteSearch(nome);
    setShowSugestoes(false);
  };

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Chamado.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamados'] });
      onClose();
      setFormData({
        nome_conta: '', number_problem: '', produto: '', tipo_suporte: 'Triagem',
        canal_entrada: '', prioridade: '', nome_solicitante: '',
        contato_resposta: '', descricao: '', status: 'Aberto', client_id: ''
      });
      setAnexosLocais([]);
      setClienteSearch('');
    }
  });

  const handleAnexoFile = async (file) => {
    if (!file) return;
    const idx = anexosLocais.length;
    setAnexosLocais(prev => [...prev, { nome: file.name, tipo: file.type, url: null, loading: true }]);
    setUploadingIdx(idx);
    const file_url = URL.createObjectURL(file);
    setAnexosLocais(prev => prev.map((a, i) => i === idx ? { ...a, url: file_url, loading: false } : a));
    setUploadingIdx(null);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleAnexoFile(file);
    e.target.value = '';
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleAnexoFile(new File([file], `print_${Date.now()}.png`, { type: file.type }));
      }
    }
  };

  const removerAnexo = (idx) => {
    setAnexosLocais(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const anexosFinal = anexosLocais.filter(a => a.url).map(({ url, nome, tipo }) => ({ url, nome, tipo }));
    createMutation.mutate({ ...formData, anexos: anexosFinal.length > 0 ? anexosFinal : undefined });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Novo Chamado</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="relative">
            <Label>Nome da Conta *</Label>
            <p className="text-xs text-gray-500 mb-1">Para quem será realizado esse suporte?</p>
            <Input
              value={clienteSearch}
              onChange={(e) => {
                setClienteSearch(e.target.value);
                setFormData({ ...formData, nome_conta: e.target.value });
                setShowSugestoes(true);
              }}
              onFocus={() => clienteSearch.length >= 2 && setShowSugestoes(true)}
              onBlur={() => setTimeout(() => setShowSugestoes(false), 150)}
              placeholder="Digite o nome do cliente..."
              required
              autoComplete="off"
            />
            {showSugestoes && sugestoes.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {sugestoes.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    onMouseDown={() => handleSelectCliente(cliente)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cliente.nome_fantasia || cliente.razao_social}
                      </p>
                      {cliente.nome_fantasia && cliente.razao_social && (
                        <p className="text-xs text-gray-500">{cliente.razao_social}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Número com Problema *</Label>
            <p className="text-xs text-gray-500 mb-1">Qual número está enfrentando problemas?</p>
            {didOptions.length > 1 ? (
              <Select value={formData.number_problem} onValueChange={(v) => setFormData({ ...formData, number_problem: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar número DID/DDR..." /></SelectTrigger>
                <SelectContent>
                  {didOptions.map(d => (
                    <SelectItem key={d.id} value={d.numero}>
                      {d.numero} {d.tipo ? `(${d.tipo})` : ''}
                    </SelectItem>
                  ))}
                  <SelectItem value="__outro__">Outro (digitar manualmente)</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            {(didOptions.length <= 1 || formData.number_problem === '__outro__') && (
              <Input
                value={formData.number_problem === '__outro__' ? '' : formData.number_problem}
                onChange={(e) => setFormData({ ...formData, number_problem: e.target.value })}
                placeholder={didOptions.length === 0 ? 'Inserir número...' : 'Digitar número manualmente...'}
                className={didOptions.length > 1 ? 'mt-2' : ''}
              />
            )}
          </div>

          <div>
            <Label>Produto *</Label>
            <Select value={formData.produto} onValueChange={(v) => setFormData({ ...formData, produto: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar opção..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PABX">PABX</SelectItem>
                <SelectItem value="Telefonia">Telefonia</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Internet">Internet</SelectItem>
                <SelectItem value="DDR/DID">DDR/DID</SelectItem>
                <SelectItem value="0800">0800</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de Suporte</Label>
            <Select value={formData.tipo_suporte} onValueChange={(v) => setFormData({ ...formData, tipo_suporte: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar opção..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Triagem">Triagem (padrão)</SelectItem>
                <SelectItem value="N1 - Suporte">Suporte PABX/Voz</SelectItem>
                <SelectItem value="N1 - WhatsApp">API/WhatsApp</SelectItem>
                <SelectItem value="War Room">War Room (Massiva)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Canal de Entrada *</Label>
            <Select value={formData.canal_entrada} onValueChange={(v) => setFormData({ ...formData, canal_entrada: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar opção..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Telefone">Telefone</SelectItem>
                <SelectItem value="E-mail">E-mail</SelectItem>
                <SelectItem value="Portal">Portal</SelectItem>
                <SelectItem value="Presencial">Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Prioridade *</Label>
            <Select value={formData.prioridade} onValueChange={(v) => setFormData({ ...formData, prioridade: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nome Solicitante *</Label>
            <p className="text-xs text-gray-500 mb-1">Pessoa que esta solicitando suporte.</p>
            <Input
              value={formData.nome_solicitante}
              onChange={(e) => setFormData({ ...formData, nome_solicitante: e.target.value })}
              placeholder="Inserir texto"
            />
          </div>

          <div>
            <Label>Contato Resposta *</Label>
            <Input
              value={formData.contato_resposta}
              onChange={(e) => setFormData({ ...formData, contato_resposta: e.target.value })}
              placeholder="Inserir telefone"
            />
          </div>

          <div>
            <Label>Descrição *</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              onPaste={handlePaste}
              placeholder="Inserir texto... (Ctrl+V para colar print)"
              rows={3}
              required
            />
            {/* Anexos */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} accept="image/*,.pdf,.doc,.docx" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
                Anexar arquivo
              </button>
              {anexosLocais.map((anexo, idx) => (
                <div key={idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${anexo.loading ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                  {anexo.tipo?.startsWith('image/') ? <Image className="w-3.5 h-3.5 text-blue-400" /> : <FileText className="w-3.5 h-3.5 text-gray-400" />}
                  <span className="max-w-[120px] truncate">{anexo.nome}</span>
                  {anexo.loading ? (
                    <span className="text-blue-500 text-xs">Enviando...</span>
                  ) : (
                    <button type="button" onClick={() => removerAnexo(idx)} className="ml-1 text-gray-400 hover:text-red-500">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Dica: Cole uma captura de tela com Ctrl+V diretamente na descrição</p>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Salvando...' : 'Abrir Chamado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';

export default function ClientModal({ client, isOpen, onClose }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj_cpf: '',
    pj_ou_pf: 'Pessoa Jurídica',
    status: 'Em cadastro',
    account_id: '',
    conta_azul_id: '',
    site_cliente: '',
    email_financeiro: '',
    telefone_contato: '',
    endereco: '',
    endereco_completo: '',
    localizacao_gm: '',
    segmento: '',
    tamanho_empresa: '',
    csm_responsavel: '',
    owner_comercial: '',
    health_score: '',
    nps_last: '',
    sla_tier: '',
    contrato_ativo: true,
    observacoes: '',
    // Ficha Técnica
    provedor_internet: '',
    tipo_ambiente: '',
    ramais_provisionados: '',
    canais_provisionados: '',
    dominio_pabx: '',
    ip_registro_sip: '',
    id_wati: '',
    email_acesso_wati: '',
    credenciais_acesso: '',
    observacoes_tecnicas: '',
    destino_telefonia: ''
  });

  useEffect(() => {
    if (client) {
      setFormData(client);
    }
  }, [client]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (client) {
        return base44.entities.Client.update(client.id, data);
      }
      return base44.entities.Client.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Remove empty strings from number fields
    const cleanedData = { ...formData };
    const numberFields = ['health_score', 'nps_last', 'ramais_provisionados', 'canais_provisionados'];
    
    numberFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
        delete cleanedData[field];
      }
    });
    
    saveMutation.mutate(cleanedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <Tabs defaultValue="dados-gerais" className="w-full">
            <div className="px-6 pt-4 border-b border-gray-200">
              <TabsList>
                <TabsTrigger value="dados-gerais">Dados Gerais</TabsTrigger>
                <TabsTrigger value="comercial">Comercial & CS</TabsTrigger>
                <TabsTrigger value="ficha-tecnica">Ficha Técnica</TabsTrigger>
              </TabsList>
            </div>

            {/* Dados Gerais */}
            <TabsContent value="dados-gerais" className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>
                    {formData.pj_ou_pf === 'Pessoa Jurídica' ? 'Razão Social *' : 'Nome Completo *'}
                  </Label>
                  <Input
                    value={formData.razao_social}
                    onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                    required
                  />
                </div>

                {formData.pj_ou_pf === 'Pessoa Jurídica' && (
                  <div>
                    <Label>Nome Fantasia</Label>
                    <Input
                      value={formData.nome_fantasia}
                      onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                    />
                  </div>
                )}

                <div>
                  <Label>
                    {formData.pj_ou_pf === 'Pessoa Jurídica' ? 'CNPJ *' : 'CPF *'}
                  </Label>
                  <Input
                    value={formData.cnpj_cpf}
                    onChange={(e) => setFormData({...formData, cnpj_cpf: e.target.value})}
                    placeholder={formData.pj_ou_pf === 'Pessoa Jurídica' ? 'Digite o CNPJ' : 'Digite o CPF'}
                    required
                  />
                </div>

                <div>
                  <Label>Tipo de Pessoa</Label>
                  <Select
                    value={formData.pj_ou_pf}
                    onValueChange={(value) => setFormData({...formData, pj_ou_pf: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                      <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Em cadastro">Em cadastro</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Segmento</Label>
                  <Select
                    value={formData.segmento}
                    onValueChange={(value) => setFormData({...formData, segmento: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Saúde">Saúde</SelectItem>
                      <SelectItem value="Indústria">Indústria</SelectItem>
                      <SelectItem value="Comércio">Comércio</SelectItem>
                      <SelectItem value="Governamental">Governamental</SelectItem>
                      <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="Educação">Educação</SelectItem>
                      <SelectItem value="Serviços">Serviços</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tamanho da Empresa</Label>
                  <Select
                    value={formData.tamanho_empresa}
                    onValueChange={(value) => setFormData({...formData, tamanho_empresa: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Micro">Micro</SelectItem>
                      <SelectItem value="Pequena">Pequena</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Grande">Grande</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>E-mail Financeiro</Label>
                  <Input
                    type="email"
                    value={formData.email_financeiro}
                    onChange={(e) => setFormData({...formData, email_financeiro: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Telefone de Contato</Label>
                  <Input
                    value={formData.telefone_contato}
                    onChange={(e) => setFormData({...formData, telefone_contato: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Site</Label>
                  <Input
                    value={formData.site_cliente}
                    onChange={(e) => setFormData({...formData, site_cliente: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Endereço Completo</Label>
                  <Input
                    value={formData.endereco_completo}
                    onChange={(e) => setFormData({...formData, endereco_completo: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Localização Google Maps</Label>
                  <Input
                    value={formData.localizacao_gm}
                    onChange={(e) => setFormData({...formData, localizacao_gm: e.target.value})}
                    placeholder="Link do Google Maps"
                  />
                </div>

                <div>
                  <Label>Account ID</Label>
                  <Input
                    value={formData.account_id}
                    onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Conta Azul ID</Label>
                  <Input
                    value={formData.conta_azul_id}
                    onChange={(e) => setFormData({...formData, conta_azul_id: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Comercial & CS */}
            <TabsContent value="comercial" className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CSM Responsável</Label>
                  <Input
                    value={formData.csm_responsavel}
                    onChange={(e) => setFormData({...formData, csm_responsavel: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Owner Comercial</Label>
                  <Input
                    value={formData.owner_comercial}
                    onChange={(e) => setFormData({...formData, owner_comercial: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Health Score (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.health_score}
                    onChange={(e) => setFormData({...formData, health_score: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Último NPS</Label>
                  <Input
                    type="number"
                    value={formData.nps_last}
                    onChange={(e) => setFormData({...formData, nps_last: e.target.value})}
                  />
                </div>

                <div>
                  <Label>SLA Tier</Label>
                  <Select
                    value={formData.sla_tier}
                    onValueChange={(value) => setFormData({...formData, sla_tier: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Platina">Platina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Ficha Técnica */}
            <TabsContent value="ficha-tecnica" className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Provedor de Internet</Label>
                  <Select
                    value={formData.provedor_internet}
                    onValueChange={(value) => setFormData({...formData, provedor_internet: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vivo">Vivo</SelectItem>
                      <SelectItem value="Claro">Claro</SelectItem>
                      <SelectItem value="Oi">Oi</SelectItem>
                      <SelectItem value="Tim">Tim</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de Ambiente</Label>
                  <Select
                    value={formData.tipo_ambiente}
                    onValueChange={(value) => setFormData({...formData, tipo_ambiente: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Local">Local</SelectItem>
                      <SelectItem value="Nuvem">Nuvem</SelectItem>
                      <SelectItem value="Híbrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ramais Provisionados</Label>
                  <Input
                    type="number"
                    value={formData.ramais_provisionados}
                    onChange={(e) => setFormData({...formData, ramais_provisionados: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Canais Provisionados</Label>
                  <Input
                    type="number"
                    value={formData.canais_provisionados}
                    onChange={(e) => setFormData({...formData, canais_provisionados: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Domínio/PABX</Label>
                  <Input
                    value={formData.dominio_pabx}
                    onChange={(e) => setFormData({...formData, dominio_pabx: e.target.value})}
                  />
                </div>

                <div>
                  <Label>IP de Registro (SIP)</Label>
                  <Input
                    value={formData.ip_registro_sip}
                    onChange={(e) => setFormData({...formData, ip_registro_sip: e.target.value})}
                  />
                </div>

                <div>
                  <Label>ID Wati</Label>
                  <Input
                    value={formData.id_wati}
                    onChange={(e) => setFormData({...formData, id_wati: e.target.value})}
                  />
                </div>

                <div>
                  <Label>E-mail Acesso Wati</Label>
                  <Input
                    type="email"
                    value={formData.email_acesso_wati}
                    onChange={(e) => setFormData({...formData, email_acesso_wati: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Destino Telefonia</Label>
                  <Input
                    value={formData.destino_telefonia}
                    onChange={(e) => setFormData({...formData, destino_telefonia: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Credenciais de Acesso</Label>
                  <Textarea
                    value={formData.credenciais_acesso}
                    onChange={(e) => setFormData({...formData, credenciais_acesso: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Observações Técnicas</Label>
                  <Textarea
                    value={formData.observacoes_tecnicas}
                    onChange={(e) => setFormData({...formData, observacoes_tecnicas: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
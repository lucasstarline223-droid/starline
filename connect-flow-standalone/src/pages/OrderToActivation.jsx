import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rocket, GitFork, Settings } from 'lucide-react';
import PortabilidadeTab from '@/components/operacoes/PortabilidadeTab';
import OnboardingTab from '@/components/operacoes/OnboardingTab';

export default function OrderToActivation() {
  const [activeTab, setActiveTab] = useState('onboarding');

  return (
    <div className="p-6 bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ordem de Ativação</h1>
          <p className="text-gray-600 mt-1">Gestão do processo de ativação de clientes</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="onboarding" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Onboarding
            </TabsTrigger>
            <TabsTrigger value="portabilidade" className="flex items-center gap-2">
              <GitFork className="w-4 h-4" />
              Portabilidade
            </TabsTrigger>
            <TabsTrigger value="ordens" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Ordens de Serviço
            </TabsTrigger>
          </TabsList>

          <TabsContent value="onboarding" className="mt-6">
            <OnboardingTab />
          </TabsContent>

          <TabsContent value="portabilidade" className="mt-6">
            <PortabilidadeTab />
          </TabsContent>

          <TabsContent value="ordens" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ordens de Serviço</h2>
              <p className="text-gray-600">
                Conteúdo da página de Ordens de Serviço será desenvolvido aqui.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
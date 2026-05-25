import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XCircle } from 'lucide-react';

export default function ChurnOffboarding() {
  const [activeTab, setActiveTab] = useState('cancelamentos');

  return (
    <div className="p-6 bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Churn & Offboarding</h1>
          <p className="text-gray-600 mt-1">Gestão de cancelamentos e saída de clientes</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="cancelamentos" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Cancelamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cancelamentos" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cancelamentos</h2>
              <p className="text-gray-600">
                Conteúdo da página de Cancelamentos será desenvolvido aqui.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
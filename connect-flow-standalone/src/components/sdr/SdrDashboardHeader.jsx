import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SdrDashboardHeader({ user }) {
  const hora = new Date().getHours();
  let saudacao = 'Boa noite';
  if (hora >= 5 && hora < 12) saudacao = 'Bom dia';
  else if (hora >= 12 && hora < 18) saudacao = 'Boa tarde';

  const dataFormatada = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {saudacao}, {user?.full_name?.split(' ')[0] || 'SDR'}! 👋
      </h1>
      <p className="text-gray-500 mt-1 text-sm">{dataCapitalizada}</p>
    </div>
  );
}
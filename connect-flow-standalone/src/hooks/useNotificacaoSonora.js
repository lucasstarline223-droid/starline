import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';

/**
 * Hook que monitora novos chamados e emite um bip sonoro quando habilitado nas preferências do usuário.
 * Usa a Web Audio API para gerar o som sem precisar de arquivo externo.
 * Verifica as preferências de notificação do usuário para o módulo atual.
 */
export function useNotificacaoSonora() {
  const location = useLocation();
  const [habilitado, setHabilitado] = useState(false);
  const [contagemAbertos, setContagemAbertos] = useState(0);
  const ultimoIdRef = useRef(null);
  const audioCtxRef = useRef(null);
  const currentPageRef = useRef(null);

  // Mapeia rotas para IDs de módulo
  const getModuleIdFromPath = (pathname) => {
    const path = pathname.replace('/', '');
    const moduleMap = {
      'IssueToResolution': 'IssueToResolution',
      'Dashboard': 'Dashboard',
      'SdrDashboard': 'SdrDashboard',
      'Leads': 'Leads',
      'Prospects': 'Prospects',
      'Oportunidades': 'Oportunidades',
      'Handoff': 'Handoff',
      'OrderToActivation': 'OrderToActivation',
      'Cancelamentos': 'Cancelamentos',
      'Estoque': 'Estoque',
      'Clientes': 'Clientes',
    };
    return moduleMap[path] || null;
  };

  const tocarBip = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      // Bip duplo: dois tons curtos
      [0, 0.25].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) {
      console.warn('Audio não disponível:', e);
    }
  }, []);

  const verificarPreferencias = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      const moduleId = currentPageRef.current;
      
      if (!moduleId) {
        setHabilitado(false);
        return;
      }

      const preferences = user.notification_preferences?.[moduleId];
      const audioEnabled = preferences?.audio || false;
      setHabilitado(audioEnabled);
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      setHabilitado(false);
    }
  }, []);

  useEffect(() => {
    const moduleId = getModuleIdFromPath(location.pathname);
    currentPageRef.current = moduleId;
    
    if (moduleId) {
      verificarPreferencias();
    } else {
      setHabilitado(false);
    }
  }, [location.pathname, verificarPreferencias]);

  useEffect(() => {
    let isMounted = true;

    const verificar = async () => {
      try {
        const chamados = await base44.entities.Chamado.filter({ status: 'Aberto' }, '-created_date', 50);
        if (!isMounted) return;

        const abertos = chamados.filter(c => c.status === 'Aberto');
        setContagemAbertos(abertos.length);

        if (abertos.length > 0) {
          const maisRecente = abertos[0].id;
          if (ultimoIdRef.current === null) {
            // primeira carga — apenas registra, não bipa
            ultimoIdRef.current = maisRecente;
          } else if (maisRecente !== ultimoIdRef.current && habilitado) {
            tocarBip();
            ultimoIdRef.current = maisRecente;
          } else if (maisRecente !== ultimoIdRef.current) {
            ultimoIdRef.current = maisRecente;
          }
        }
      } catch (e) {
        // silencioso
      }
    };

    verificar();
    const intervalo = setInterval(verificar, 30000); // verifica a cada 30s

    return () => {
      isMounted = false;
      clearInterval(intervalo);
    };
  }, [habilitado, tocarBip]);

  return { habilitado, contagemAbertos, tocarBip };
}
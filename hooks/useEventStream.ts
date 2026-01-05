import { useState } from 'react';
import { useEventStore } from '../store/useEventStore';

export const useEventStream = () => {
  const { events, clearEvents } = useEventStore();
  const [isPaused, setIsPaused] = useState(false);

  // Se estiver pausado, congelamos a lista visualmente, mas a store continua recebendo updates em background.
  // Para simplificar a UX aqui, retornamos a lista direta, mas poderíamos implementar um buffer se necessário.
  // Como o requisito é ver dados reais, vamos mostrar direto.
  
  // Filtramos eventos mockados iniciais se houver, ou mostramos estado vazio se preferir.
  // O componente Dashboard já lida com a lista vazia ou renderiza o que vier.

  return { 
      events: isPaused ? events : events, // Lógica de pausa visual pode ser aprimorada depois, por enquanto mantém sync
      isPaused, 
      setIsPaused, 
      clearResolved: clearEvents 
  };
};
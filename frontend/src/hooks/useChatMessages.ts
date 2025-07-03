import { useState, useRef, useEffect, useCallback } from 'react';
import { Mensagem } from '../types'; // Ajuste o caminho conforme necessário

const formatHora = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const useChatMessages = (initialWelcomeMessage: string, isChatVisible: boolean) => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [temNovaMensagem, setTemNovaMensagem] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use useCallback para memorizar a função adicionarMensagem
  // Isso é importante para evitar loops de dependência em useEffects que a utilizam.
  const adicionarMensagem = useCallback((
    texto: string | null,
    origem: 'usuario' | 'agente',
    tipo: 'texto' | 'imagem' = 'texto',
    dataUrl: string | null = null,
  ) => {
    setMensagens((msgs) => {
      const newMsg: Mensagem = {
        texto: texto || '',
        origem,
        hora: formatHora(new Date()),
        id: crypto.randomUUID(),
        tipo,
        dataUrl,
      };
      return [...msgs, newMsg];
    });
    if (!isChatVisible && origem === 'agente') {
      setTemNovaMensagem((v) => v + 1);
    }
  }, [isChatVisible]); // isChatVisible é uma dependência porque afeta o comportamento do badge

  // Efeito para rolagem automática para a última mensagem
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [mensagens]);

  // Efeito para a mensagem de boas-vindas inicial e reset do contador de badges
  useEffect(() => {
    if (isChatVisible) {
      if (mensagens.length === 0) {
        adicionarMensagem(initialWelcomeMessage, 'agente');
      }
      setTemNovaMensagem(0); // Resetar o contador quando o chat é aberto
    }
  }, [isChatVisible, mensagens.length, initialWelcomeMessage, adicionarMensagem]);

  const loadHistory = useCallback((msgs: Mensagem[]) => setMensagens(msgs), []);
  const clearHistory = useCallback(() => setMensagens([]), []);
  const resetNewMessageCount = useCallback(() => setTemNovaMensagem(0), []);

  return {
    mensagens,
    adicionarMensagem,
    scrollRef,
    temNovaMensagem,
    loadHistory,
    clearHistory,
    resetNewMessageCount,
  };
};
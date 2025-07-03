import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { Mensagem } from '../types'; // Ajuste o caminho conforme necessário

type UseChatSocketProps = {
  socketUrl: string;
  onMessageReceived: (msg: string) => void;
  onImageReceived: (dataUrl: string) => void;
};

export const useChatSocket = ({ socketUrl, onMessageReceived, onImageReceived }: UseChatSocketProps) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('mensagem', onMessageReceived);
    socket.on('imagem', onImageReceived);

    return () => {
      socket.disconnect();
    };
  }, [socketUrl, onMessageReceived, onImageReceived]);

  const sendMessage = (msg: string) => {
    socketRef.current?.emit('mensagem', msg);
  };

  const sendImage = (dataUrl: string) => {
    socketRef.current?.emit('imagem', dataUrl);
  };

  return { sendMessage, sendImage };
};
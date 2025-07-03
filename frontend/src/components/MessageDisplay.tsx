import React from 'react';
import { Box, Paper, Typography, Avatar, useTheme } from '@mui/material';
import { Mensagem } from '../types'; // Ajuste o caminho

type MessageDisplayProps = {
  message: Mensagem;
  botAvatarUrl?: string;
  userAvatarUrl?: string;
};

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, botAvatarUrl, userAvatarUrl }) => {
  const { id, texto, hora, origem, tipo, dataUrl } = message;
  const theme = useTheme();

  const isUserMessage = origem === 'usuario';

  return (
    <Box
      key={id}
      sx={{
        display: 'flex',
        flexDirection: isUserMessage ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: 1.5,
        gap: 1,
        maxWidth: '90%',
        alignSelf: isUserMessage ? 'flex-end' : 'flex-start',
      }}
    >
      {(isUserMessage && userAvatarUrl) || (!isUserMessage && botAvatarUrl) ? (
        <Avatar src={isUserMessage ? userAvatarUrl : botAvatarUrl} sx={{ width: 36, height: 36 }} />
      ) : (
        <Avatar sx={{ width: 36, height: 36, bgcolor: isUserMessage ? theme.palette.primary.main : theme.palette.secondary.main }}>
          {isUserMessage ? 'U' : 'A'}
        </Avatar>
      )}
      <Paper
        sx={{
          p: 1.5,
          borderRadius: isUserMessage ? '18px 18px 2px 18px' : '2px 18px 18px 18px',
          backgroundColor: isUserMessage ? theme.palette.primary.main : theme.palette.background.paper,
          color: isUserMessage ? 'white' : theme.palette.text.primary,
          boxShadow: 1,
          maxWidth: '80%',
          wordBreak: 'break-word',
        }}
      >
        {tipo === 'texto' ? (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{texto}</Typography>
        ) : tipo === 'imagem' && dataUrl ? (
          <Box sx={{ maxWidth: '100%', borderRadius: 1 }}>
            <img src={dataUrl} alt="Imagem enviada" style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }} />
          </Box>
        ) : null}
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
          {hora}
        </Typography>
      </Paper>
    </Box>
  );
};

export default MessageDisplay;
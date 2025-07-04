import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import {
  Box,
  IconButton,
  InputBase,
  Paper,
  Typography,
  Badge,
  AppBar,
  Toolbar,
  CssBaseline,
  createTheme,
  ThemeProvider,
  styled,
  Tooltip,
  Fade,
  useMediaQuery,
  useTheme,
  Avatar,
  Button,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MenuIcon from '@mui/icons-material/Menu';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Mensagem, ChatLateralHandle, ChatLateralProps, PredefinedQuestion } from './types';
import chatBotTheme from './theme/chatBotTheme';
import theme from './theme/createTheme';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: 0,
    top: 0,
    padding: '0 0.4rem',
    height: '1rem',
    minWidth: '1rem',
  },
}));

const formatHora = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

interface ChatMessageProps {
  mensagem: Mensagem;
  origem: 'usuario' | 'agente';
  botAvatarUrl?: string;
  userAvatarUrl?: string;
  theme: ReturnType<typeof createTheme>;
  onSendMessage: (msg: string) => Promise<void>;
  buttonLayout: 'horizontal' | 'vertical';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ mensagem, origem, botAvatarUrl, userAvatarUrl, theme, onSendMessage, buttonLayout }) => {
  return (
    <Box sx={messageContainerStyle(origem)}>
      {renderAvatar(origem, botAvatarUrl, userAvatarUrl, theme)}
      <Paper sx={messagePaperStyle(origem, theme)}>
        {renderMessageContent(mensagem)}
        {renderMessageTime(mensagem.hora)}
        {renderMessageButtons(origem, mensagem.buttons, onSendMessage, buttonLayout)}
      </Paper>
    </Box>
  );
};

const messageContainerStyle = (origem: 'usuario' | 'agente') => ({
  display: 'flex',
  flexDirection: origem === 'usuario' ? 'row-reverse' : 'row',
  alignItems: 'flex-start',
  mb: 1.5,
  gap: 1,
  maxWidth: '90%',
  alignSelf: origem === 'usuario' ? 'flex-end' : 'flex-start',
});

const renderAvatar = (origem: 'usuario' | 'agente', botAvatarUrl?: string, userAvatarUrl?: string, theme?: ReturnType<typeof createTheme>) => (
  (origem === 'agente' && botAvatarUrl) || (origem === 'usuario' && userAvatarUrl) ? (
    <Avatar src={origem === 'agente' ? botAvatarUrl : userAvatarUrl} sx={{ width: 36, height: 36 }} />
  ) : (
    <Avatar sx={{ width: 36, height: 36, bgcolor: origem === 'agente' ? theme?.palette.secondary.main : theme?.palette.primary.main }}>
      {origem === 'agente' ? 'A' : 'U'}
    </Avatar>
  )
);

const messagePaperStyle = (origem: 'usuario' | 'agente', theme?: ReturnType<typeof createTheme>) => ({
  p: 1.5,
  borderRadius: origem === 'usuario' ? '18px 18px 2px 18px' : '2px 18px 18px 18px',
  backgroundColor: origem === 'usuario' ? theme?.palette.primary.main : theme?.palette.background.paper,
  color: origem === 'usuario' ? 'white' : theme?.palette.text.primary,
  boxShadow: 1,
  maxWidth: '80%',
  wordBreak: 'break-word',
});

const renderMessageContent = (mensagem: Mensagem) => (
  mensagem.tipo === 'texto' ? (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{mensagem.texto}</Typography>
  ) : mensagem.tipo === 'imagem' && mensagem.dataUrl ? (
    <Box sx={{ maxWidth: '100%', borderRadius: 1 }}>
      <img src={mensagem.dataUrl} alt="Imagem enviada" style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }} />
    </Box>
  ) : null
);

const renderMessageTime = (hora: string) => (
  <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
    {hora}
  </Typography>
);

const renderMessageButtons = (origem: 'usuario' | 'agente', buttons: { text: string; action: string }[] | null | undefined, onSendMessage: (msg: string) => void, buttonLayout: 'horizontal' | 'vertical') => (
  origem === 'agente' && buttons && buttons.length > 0 && (
    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: buttonLayout === 'vertical' ? 'column' : 'row' }}>
      {buttons.map((button) => (
        <Button
          key={button.text}
          variant="outlined"
          size="small"
          onClick={() => onSendMessage(button.action)}
          sx={buttonLayout === 'vertical' ? { width: '100%' } : {}}
        >
          {button.text}
        </Button>
      ))}
    </Box>
  )
);

const CHAT_STORAGE_KEY = 'chat-widget-messages';
const CUSTOM_RESPONSES_STORAGE_KEY = 'customResponses';

const ChatLateral = forwardRef<ChatLateralHandle, Omit<ChatLateralProps, 'socketUrl'>>(
  (
    {
      temaEscuroInicial = 'light',
      welcomeMessage = 'Olá! Como posso ajudar você hoje?',
      commandExecutor,
      botAvatarUrl,
      userAvatarUrl,
      chatTitle = 'Atendimento Online',
      predefinedQuestions: initialPredefinedQuestions = [],
      customResponses: initialCustomResponses = {},
    },
    ref,
  ) => {
    // State variables
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [visivel, setVisivel] = useState(false);
    const [modoEscuro, setModoEscuro] = useState(temaEscuroInicial === 'dark');
    const [temNovaMensagem, setTemNovaMensagem] = useState(0);
    const [position, setPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-right');
    const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 360, height: 480 });
    const [agentStatus, setAgentStatus] = useState<'online' | 'offline'>('online');
    const [predefinedQuestions, setPredefinedQuestions] = useState<PredefinedQuestion[]>(initialPredefinedQuestions);
    const [showPredefinedQuestions, setShowPredefinedQuestions] = useState(false);
    const [buttonLayout, setButtonLayout] = useState<'horizontal' | 'vertical'>('horizontal');
    const [customResponses, setCustomResponses] = useState<Record<string, any>>(initialCustomResponses);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // References
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Theme and media queries
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const isMedium = useMediaQuery(muiTheme.breakpoints.up('md'));
    const isLarge = useMediaQuery(muiTheme.breakpoints.up('lg'));

    // Function to determine styles based on the chat widget's position
    const getPositionStyles = (position: string) => {
      switch (position) {
        case 'bottom-right':
          return { bottom: isLarge ? 48 : 100, right: isLarge ? 48 : 24 };
        case 'bottom-left':
          return { bottom: isLarge ? 48 : 100, left: isLarge ? 48 : 24 };
        case 'top-right':
          return { top: isLarge ? 48 : 24, right: isLarge ? 48 : 24 };
        case 'top-left':
          return { top: isLarge ? 48 : 24, left: isLarge ? 48 : 24 };
        default:
          return { bottom: isLarge ? 48 : 100, right: isLarge ? 48 : 24 };
      }
    };

    // Function to add a new message to the chat
    const adicionarMensagem = useCallback(
      (texto: string | null, origem: 'usuario' | 'agente', tipo: 'texto' | 'imagem' = 'texto', dataUrl: string | null = null, buttons: { text: string; action: string }[] | null = null) => {
        setMensagens((msgs) => [
          ...msgs,
          { texto: texto || '', origem, hora: formatHora(new Date()), id: crypto.randomUUID(), tipo, dataUrl, buttons: buttons || undefined },
        ]);
        if (!visivel && origem === 'agente') setTemNovaMensagem((v) => v + 1);
      },
      [],
    );

    // Function to send a new message
    const enviarMensagem = useCallback(async (msg: string) => {
      const mensagemFormatada = msg.trim().toLowerCase();

      if (!mensagemFormatada) return;

      setNovaMensagem('');
      adicionarMensagem(mensagemFormatada, 'usuario');

      if (customResponses.hasOwnProperty(mensagemFormatada)) {
        const resposta = customResponses[mensagemFormatada];
        if (typeof resposta === 'object' && resposta && resposta.text) {
          adicionarMensagem(resposta.text, 'agente', 'texto', null, resposta.buttons);
        } else if (typeof resposta === 'string') {
          adicionarMensagem(resposta, 'agente');
        }
      } else {
        adicionarMensagem('Desculpe, não entendi sua pergunta.', 'agente');
      }
    }, [customResponses, adicionarMensagem]);

    // Handle click on the attachment button
    const handleAnexoClick = useCallback(() => {
      anchorEl ? setAnchorEl(null) : fileInputRef.current?.click();
    }, [anchorEl]);

    // Handle file selection for attachment
    const handleAnexoChange = useCallback(() => {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          adicionarMensagem(null, 'usuario', 'imagem', dataUrl);
        };
        reader.onerror = () => {
          console.error("Erro ao ler o arquivo.");
        };
        reader.readAsDataURL(file);
      }
    }, [adicionarMensagem]);

    // Handle click on a predefined question button
    const handlePredefinedQuestionClick = useCallback((question: string) => {
      enviarMensagem(question);
    }, [enviarMensagem]);

    // Imperative handle for external control of the chat widget
    useImperativeHandle(ref, () => ({
      open: () => setVisivel(true),
      close: () => setVisivel(false),
      sendMessage: (msg) => enviarMensagem(msg),
      toggleTheme: () => setModoEscuro((prev) => !prev),
      isOpen: () => visivel,
      setBadge: (count) => setTemNovaMensagem(count),
      setPosition: (pos) => setPosition(pos),
      setTheme: (tema) => setModoEscuro(tema === 'dark'),
      resize: (dim) => setDimensions(dim),
      loadHistory: (msgs) => setMensagens(msgs),
      clearHistory: () => setMensagens([]),
      setAgentStatus: (status) => setAgentStatus(status),
      show: () => setVisivel(true),
      hide: () => setVisivel(false),
      setLocale: (locale) => console.log('Locale definido para:', locale),
      setPredefinedQuestions: (questions) => setPredefinedQuestions(questions),
    }));

    // Load messages and custom responses from local storage on mount
    useEffect(() => {
      loadChatHistory();
      loadCustomResponses();
    }, []);

    // Save messages to local storage whenever messages update
    useEffect(() => {
      saveChatHistory();
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [mensagens]);

    // Save custom responses to local storage whenever custom responses update
    useEffect(() => {
      saveCustomResponses();
    }, [customResponses]);

    // Display welcome message on chat open if no messages exist
    useEffect(() => {
      if (visivel && mensagens.length === 0 && customResponses['olá']) {
        adicionarMensagem(welcomeMessage, 'agente', 'texto', null, customResponses['olá'].buttons);
      } else if (visivel && mensagens.length === 0) {
        adicionarMensagem(welcomeMessage, 'agente');
      }
      if (visivel) setTemNovaMensagem(0);
    }, [visivel, welcomeMessage, customResponses]);

    // Function to load chat history from local storage
    const loadChatHistory = useCallback(() => {
      try {
        const storedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
        if (storedMessages) setMensagens(JSON.parse(storedMessages));
      } catch (error) {
        console.error("Erro ao carregar histórico do chat:", error);
      }
    }, []);

    // Function to save chat history to local storage
    const saveChatHistory = useCallback(() => {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(mensagens));
      } catch (error) {
        console.error("Erro ao salvar histórico do chat:", error);
      }
    }, [mensagens]);

    // Function to load custom responses from local storage
    const loadCustomResponses = useCallback(() => {
      try {
        const storedResponses = localStorage.getItem(CUSTOM_RESPONSES_STORAGE_KEY);
        if (storedResponses) setCustomResponses(JSON.parse(storedResponses));
      } catch (error) {
        console.error("Erro ao carregar respostas customizadas:", error);
      }
    }, []);

    // Function to save custom responses to local storage
    const saveCustomResponses = useCallback(() => {
      try {
        localStorage.setItem(CUSTOM_RESPONSES_STORAGE_KEY, JSON.stringify(customResponses));
      } catch (error) {
        console.error("Erro ao salvar respostas customizadas:", error);
      }
    }, [customResponses]);

    // Render the chat widget
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ position: 'fixed', ...getPositionStyles(position), zIndex: 1300 }}>
          <StyledBadge
            color="secondary"
            badgeContent={temNovaMensagem}
            invisible={!temNovaMensagem}
          >
            <Tooltip title="Abrir Chat">
              <IconButton
                onClick={() => setVisivel((v) => !v)}
                sx={{ bgcolor: 'primary.main', color: 'white', width: 56, height: 56, boxShadow: 6 }}
              >
                <ChatIcon fontSize="large" />
              </IconButton>
            </Tooltip>
          </StyledBadge>
        </Box>

        <Fade in={visivel}>
          <Paper
            sx={{
              position: 'fixed',
              ...getPositionStyles(position),
              width: isMobile ? '95vw' : isMedium ? dimensions.width : isLarge ? dimensions.width : 360,
              height: isMobile ? '80vh' : isMedium ? dimensions.height : isLarge ? dimensions.height : 480,
              maxHeight: '95vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: 4,
              zIndex: 1400,
              backdropFilter: 'blur(8px)',
            }}
          >
            <AppBar position="static">
              <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Typography variant="h6">{chatTitle}</Typography>
                <Box display="flex" alignItems="center">
                  <Tooltip title="Alternar layout dos botões">
                    <IconButton onClick={() => setButtonLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')} color="inherit">
                      <SwapVertIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={modoEscuro ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}>
                    <IconButton onClick={() => setModoEscuro((v) => !v)} color="inherit">
                      {modoEscuro ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Fechar Chat">
                    <IconButton onClick={() => setVisivel(false)} color="inherit">
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Toolbar>
            </AppBar>

            <Box
              ref={scrollRef}
              sx={{
                flex: 1,
                p: 2,
                overflowY: 'auto',
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': { width: '0.5em' },
                '&::-webkit-scrollbar-track': {
                  background: modoEscuro ? '#333' : '#f1f1f1',
                  borderRadius: '0.25em',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: modoEscuro ? '#555' : '#888',
                  borderRadius: '0.25em',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: modoEscuro ? '#777' : '#555',
                },
              }}
            >
              {mensagens.map((mensagem) => (
                <ChatMessage
                  key={mensagem.id}
                  mensagem={mensagem}
                  origem={mensagem.origem || 'agente'}
                  botAvatarUrl={botAvatarUrl}
                  userAvatarUrl={userAvatarUrl}
                  theme={theme}
                  onSendMessage={enviarMensagem}
                  buttonLayout={buttonLayout}
                />
              ))}
            </Box>

            {showPredefinedQuestions && predefinedQuestions.length > 0 && (
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                {predefinedQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outlined"
                    size="small"
                    onClick={() => enviarMensagem(question)}
                  >
                    {question}
                  </Button>
                ))}
              </Box>
            )}

            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                enviarMensagem(novaMensagem);
              }}
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
              }}
            >
              <Tooltip title="Anexar Arquivo/Imagem">
                <IconButton onClick={handleAnexoClick}>
                  <AttachFileIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setShowPredefinedQuestions((prev) => !prev)}>
                <MenuIcon />
              </IconButton>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleAnexoChange}
              />

              <InputBase
                placeholder="Digite sua mensagem..."
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                sx={{
                  flex: 1,
                  px: 2,
                  py: 1,
                  fontSize: '0.9rem',
                  bgcolor: 'background.paper',
                  borderRadius: 4,
                  border: `1px solid ${theme.palette.divider}`,
                  minWidth: 0,
                }}
                inputProps={{ 'aria-label': 'Enviar mensagem' }}
              />
              <Tooltip title="Enviar Mensagem">
                <IconButton
                  type="submit"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: 4,
                    boxShadow: 2,
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Fade>
      </ThemeProvider>
    );
  },
);

export default ChatLateral;
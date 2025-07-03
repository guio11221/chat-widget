import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import io, { Socket } from 'socket.io-client';
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
  Menu,
  MenuItem,
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
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import MenuIcon from '@mui/icons-material/Menu'; // Import the menu icon

const chatBotTheme = createTheme({
  palette: {
    primary: {
      main: '#007bff',
    },
    secondary: {
      main: '#6c757d',
    },
    background: {
      default: '#f8f9fa',
      paper: '#fff',
    },
    text: {
      primary: '#212529',
      secondary: '#6c757d',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica", Arial, sans-serif',
    h6: {
      fontWeight: 500,
      fontSize: '1.1rem',
    },
    body2: {
      fontSize: '0.9rem',
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.75rem',
      color: '#868e96',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          elevation: 0,
          borderBottom: '1px solid #dee2e6',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,.075)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#495057',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: '#dc3545',
          color: '#fff',
          fontWeight: 500,
          fontSize: '0.8rem',
          padding: '0.3rem 0.5rem',
          borderRadius: '0.5rem',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.9rem',
          fontWeight: 500,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          marginRight: theme.spacing(1),
          marginBottom: theme.spacing(1),
        }),
      },
    },
  },
});


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

export type Mensagem = {
  texto: string;
  hora: string;
  id: string;
  origem?: 'usuario' | 'agente';
  tipo?: 'texto' | 'imagem';
  dataUrl?: string | null | undefined;  
};
export type PredefinedQuestion = string;

export type ChatLateralProps = {
  socketUrl: string;
  temaEscuroInicial?: 'light' | 'dark';
  welcomeMessage?: string;
  commandExecutor?: (cmd: string, args: string[]) => Promise<string> | string;
  botAvatarUrl?: string;
  userAvatarUrl?: string;
  chatTitle?: string;
  predefinedQuestions?: PredefinedQuestion[];
};

export type ChatLateralHandle = {
  open: () => void;
  close: () => void;
  sendMessage: (msg: string) => void;
  toggleTheme: () => void;
  isOpen: () => boolean;
  setBadge: (count: number) => void;
  setPosition: (position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right') => void;
  setTheme: (tema: 'light' | 'dark') => void;
  resize: (dimensions: { width: number; height: number }) => void;
  loadHistory: (messages: { texto: string; hora: string; id: string; origem?: 'usuario' | 'agente' }[]) => void;
  clearHistory: () => void;
  setAgentStatus: (status: 'online' | 'offline') => void;
  show: () => void;
  hide: () => void;
  setLocale: (locale: string) => void;
  setPredefinedQuestions: (questions: PredefinedQuestion[]) => void;
};

const ChatLateral = forwardRef<ChatLateralHandle, ChatLateralProps>(
  (
    {
      socketUrl,
      temaEscuroInicial = 'light',
      welcomeMessage = 'Olá! Como posso ajudar você hoje?',
      commandExecutor,
      botAvatarUrl,
      userAvatarUrl,
      chatTitle = 'Atendimento Online',
      predefinedQuestions: initialPredefinedQuestions = [],
    },
    ref,
  ) => {
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [visivel, setVisivel] = useState(false);
    const [modoEscuro, setModoEscuro] = useState(temaEscuroInicial === 'dark');
    const [temNovaMensagem, setTemNovaMensagem] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [badgeCount, setBadgeCount] = useState(0);
    const [position, setPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-right');
    const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 360, height: 480 });
    const [agentStatus, setAgentStatus] = useState<'online' | 'offline'>('online');
    const [predefinedQuestions, setPredefinedQuestions] = useState<PredefinedQuestion[]>(initialPredefinedQuestions);
    const [showPredefinedQuestions, setShowPredefinedQuestions] = useState(false); // State for button visibility
    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const theme = createTheme({
      palette: {
        mode: modoEscuro ? 'dark' : 'light',
        ...chatBotTheme.palette,
      },
      typography: {
        ...chatBotTheme.typography,
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              ...chatBotTheme.components?.MuiAppBar?.styleOverrides?.root,
              backgroundColor: modoEscuro ? '#303030' : chatBotTheme.palette.primary.main,
              color: modoEscuro ? '#fff' : '#fff',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              ...chatBotTheme.components?.MuiPaper?.styleOverrides?.root,
              backgroundColor: modoEscuro ? '#212121' : chatBotTheme.palette.background.paper,
              color: modoEscuro ? '#fff' : chatBotTheme.palette.text.primary,
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              ...chatBotTheme.components?.MuiIconButton?.styleOverrides?.root,
              color: modoEscuro ? '#fff' : chatBotTheme.palette.text.primary,
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              color: modoEscuro ? '#fff' : chatBotTheme.palette.text.primary,
              minWidth: 0, // Added this line
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: modoEscuro ? '#424242' : chatBotTheme.palette.background.paper,
              color: modoEscuro ? '#fff' : chatBotTheme.palette.text.primary,
              borderRadius: chatBotTheme.components?.MuiPaper?.styleOverrides?.root.borderRadius,
              boxShadow: modoEscuro ? 'none' : chatBotTheme.components?.MuiPaper?.styleOverrides?.root.boxShadow,
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              backgroundColor: modoEscuro ? '#303030' : chatBotTheme.palette.background.paper,
              color: modoEscuro ? '#fff' : chatBotTheme.palette.text.primary,
              borderRadius: chatBotTheme.components?.MuiPaper?.styleOverrides?.root.borderRadius,
              boxShadow: modoEscuro ? 'none' : chatBotTheme.components?.MuiPaper?.styleOverrides?.root.boxShadow,
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              '&:hover': {
                backgroundColor: modoEscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: ({ theme }) => ({
              marginRight: theme.spacing(1),
              marginBottom: theme.spacing(1),
            }),
          },
        },
      },
    });

    const getPositionStyles = () => {
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
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const isMedium = useMediaQuery(muiTheme.breakpoints.up('md'));
    const isLarge = useMediaQuery(muiTheme.breakpoints.up('lg'));

    useImperativeHandle(ref, () => ({
      open: () => setVisivel(true),
      close: () => setVisivel(false),
      sendMessage: (msg) => enviarMensagem(msg),
      toggleTheme: () => setModoEscuro((prev) => !prev),
      isOpen: () => visivel,
      setBadge: (count) => setBadgeCount(count),
      setPosition: (pos) => setPosition(pos),
      setTheme: (tema) => setModoEscuro(tema === 'dark'),
      resize: (dim) => setDimensions(dim),
      loadHistory: (msgs) => setMensagens(msgs),
      clearHistory: () => setMensagens([]),
      setAgentStatus: (status) => setAgentStatus(status),
      show: () => setVisivel(true),
      hide: () => setVisivel(false),
      setLocale: (locale) => {
        // Aqui você pode implementar a lógica para alterar o locale, se necessário
        console.log('Locale definido para:', locale);
      },
      setPredefinedQuestions: (questions) => setPredefinedQuestions(questions),
    }));

    useEffect(() => {
      const socket = io(socketUrl);
      socketRef.current = socket;
      socket.on('mensagem', (msg) => adicionarMensagem(msg, 'agente'));
      socket.on('imagem', (dataUrl) => adicionarMensagem(null, 'agente', 'imagem', dataUrl));
      return () => {
        socket.disconnect();
      };
    }, [socketUrl]);

    useEffect(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, [mensagens]);

    useEffect(() => {
      if (visivel && mensagens.length === 0) {
        adicionarMensagem(welcomeMessage, 'agente');
      }
      if (visivel) setTemNovaMensagem(0);
    }, [visivel]);

    const enviarMensagem = async (msg: string) => {
      if (!msg.trim() || !socketRef.current) return;
      if (msg.startsWith('/')) {
        const [cmd, ...args] = msg.slice(1).split(' ');
        const resposta = commandExecutor
          ? await commandExecutor(cmd, args)
          : `Comando /${cmd} não reconhecido.`;
        adicionarMensagem(resposta, 'agente');
      } else {
        socketRef.current.emit('mensagem', msg);
        adicionarMensagem(msg, 'usuario');
      }
      setNovaMensagem('');
    };

    const adicionarMensagem = (
      texto: string | null,
      origem: 'usuario' | 'agente',
      tipo: 'texto' | 'imagem' = 'texto',
      dataUrl: string | null = null,
    ) => {
      setMensagens((msgs) => [
        ...msgs,
        { texto: texto || '', origem, hora: formatHora(new Date()), id: crypto.randomUUID(), tipo, dataUrl },
      ]);
      if (!visivel && origem === 'agente') setTemNovaMensagem((v) => v + 1);
    };

    const handleAnexoClick = () => {
      setAnchorEl(null);
      fileInputRef.current?.click();
    };

    const handleAnexoChange = () => {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          socketRef.current?.emit('imagem', dataUrl);
          adicionarMensagem(null, 'usuario', 'imagem', dataUrl);
        };
        reader.readAsDataURL(file);
      }
    };

    const handlePredefinedQuestionClick = (question: string) => {
      enviarMensagem(question);
    };

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ position: 'fixed', ...getPositionStyles(), zIndex: 1300 }}>
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
              ...getPositionStyles(),
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
                <Box>
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
              {mensagens.map(({ id, texto, hora, origem, tipo, dataUrl }) => (
                <Box
                  key={id}
                  sx={{
                    display: 'flex',
                    flexDirection: origem === 'usuario' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    mb: 1.5,
                    gap: 1,
                    maxWidth: '90%',
                    alignSelf: origem === 'usuario' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {(origem === 'agente' && botAvatarUrl) || (origem === 'usuario' && userAvatarUrl) ? (
                    <Avatar src={origem === 'agente' ? botAvatarUrl : userAvatarUrl} sx={{ width: 36, height: 36 }} />
                  ) : (
                    <Avatar sx={{ width: 36, height: 36, bgcolor: origem === 'agente' ? theme.palette.secondary.main : theme.palette.primary.main }}>
                      {origem === 'agente' ? 'A' : 'U'}
                    </Avatar>
                  )}
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: origem === 'usuario'
                        ? '18px 18px 2px 18px'
                        : '2px 18px 18px 18px',
                      backgroundColor: origem === 'usuario' ? theme.palette.primary.main : theme.palette.background.paper,
                      color: origem === 'usuario' ? 'white' : theme.palette.text.primary,
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
              ))}
            </Box>

            {showPredefinedQuestions && predefinedQuestions.length > 0 && (
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                {predefinedQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outlined"
                    size="small"
                    onClick={() => handlePredefinedQuestionClick(question)}
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
              <IconButton onClick={() => setShowPredefinedQuestions((prev) => !prev)}> {/* Toggle visibility */}
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
                  minWidth: 0, // Added this line to allow shrinking
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
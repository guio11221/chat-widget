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
    loadHistory: (messages: Mensagem[]) => void;
    clearHistory: () => void;
    setAgentStatus: (status: 'online' | 'offline') => void;
    show: () => void;
    hide: () => void;
    setLocale: (locale: string) => void;
    setPredefinedQuestions: (questions: PredefinedQuestion[]) => void;
  };
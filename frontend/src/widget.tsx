import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ChatLateralHandle,
  ChatLateralProps,
  PredefinedQuestion,
  Position,  
} from './types';
import ChatLateral from './ChatLateral';

export type InitOptions = Omit<ChatLateralProps, 'ref' | 'commandExecutor'> & {
  tema?: 'dark' | 'light';
  locale?: string;
  position?: Position; // Use the imported Position type
  predefinedQuestions?: PredefinedQuestion[];
  customResponses?: Record<string, string>;
  chatTitle?: string; // Add chatTitle to InitOptions for more control
  welcomeMessage?: string; // Add welcomeMessage to InitOptions
  botAvatarUrl?: string; // Add botAvatarUrl to InitOptions
  userAvatarUrl?: string; // Add userAvatarUrl to InitOptions
};

type CommandFunction = (args: string[]) => string | Promise<string>;

type Dimensions = {
  width: number;
  height: number;
};

interface ChatWidgetState {
  position: Position;
  dimensions: Dimensions;
  locale: string;
  badgeCount: number;
  agentStatus: 'online' | 'offline';
  predefinedQuestions: PredefinedQuestion[];
  customResponses: Record<string, string>;
}

class ChatWidgetClass {
  private root?: ReactDOM.Root;
  private containerId = 'chat-widget-root';
  private ref = React.createRef<ChatLateralHandle>();
  private initPromise: Promise<void> | null = null;
  private newMsgCallbacks: ((msg: string) => void)[] = [];
  private commands: Record<string, CommandFunction> = {};
  private currentOptions: InitOptions = {};
  private state: ChatWidgetState = { // Centralized state
    position: 'bottom-right',
    dimensions: { width: 360, height: 480 },
    locale: 'pt-BR',
    badgeCount: 0,
    agentStatus: 'online',
    predefinedQuestions: [],
    customResponses: {},
  };

  /**
   * Mounts the ChatLateral React component into the DOM.
   * @param opts Initialization options for the chat widget.
   */
  private mountReact(opts: InitOptions) {
    const finalOpts = { ...opts, ...this.state }; // Combine initial options and state
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      document.body.appendChild(container);
    }
    this.root = ReactDOM.createRoot(container);
    this.root.render(
      <ChatLateral
        ref={this.ref}
        temaEscuroInicial={finalOpts.tema ?? 'light'}
        locale={finalOpts.locale}
        chatTitle={finalOpts.chatTitle}
        welcomeMessage={finalOpts.welcomeMessage}
        botAvatarUrl={finalOpts.botAvatarUrl}
        userAvatarUrl={finalOpts.userAvatarUrl}
        commandExecutor={this.executeCommand.bind(this)}
        predefinedQuestions={finalOpts.predefinedQuestions}
        customResponses={finalOpts.customResponses}
      />
    );
  }

  /**
   * Initializes the chat widget.
   * @param opts Initialization options.
   * @returns A Promise that resolves when the widget is initialized.
   */
  init(opts: InitOptions): Promise<void> {
    if (this.root) return Promise.resolve();
    if (!this.initPromise) {
      this.currentOptions = opts;
      this.state.predefinedQuestions = opts.predefinedQuestions ?? [];
      this.state.customResponses = opts.customResponses ?? {};
      this.state.position = opts.position ?? 'bottom-right'; // Set initial position in state
      this.state.locale = opts.locale ?? 'pt-BR'; // Set initial locale

      this.initPromise = new Promise((resolve) => {
        this.mountReact(opts);
        setTimeout(resolve, 100);
      });
    }
    return this.initPromise;
  }

  async unmount() {
    if (!this.root) return;
    await this.initPromise;
    this.root.unmount();
    const container = document.getElementById(this.containerId);
    if (container) {
      document.body.removeChild(container); // More robust removal
    }
    this.root = undefined;
    this.initPromise = null;
  }

  destroy() {
    this.unmount();
    delete (window as any).ChatWidget;
  }

  async open() {
    await this.initPromise;
    this.ref.current?.open();
  }

  async close() {
    await this.initPromise;
    this.ref.current?.close();
  }

  async sendMessage(msg: string) {
    await this.initPromise;
    this.ref.current?.sendMessage(msg);
  }

  async toggleTheme() {
    await this.initPromise;
    this.ref.current?.toggleTheme();
  }

  isOpen(): boolean {
    return this.ref.current?.isOpen() ?? false;
  }

  async setBadge(count: number) {
    this.state.badgeCount = count;
    await this.initPromise;
    this.ref.current?.setBadge(count);
  }

  onNewMessage(cb: (msg: string) => void) {
    this.newMsgCallbacks.push(cb);
  }

  async setPosition(position: Position) {
    if (this.state.position !== position) {
      this.state.position = position;
      this.ref.current?.setPosition(position);
      if (this.ref.current) {
        console.warn('Setting position after init is not directly supported. Consider unmounting and re-initializing.');
      }
    }
  }

  async setTheme(tema: 'light' | 'dark') {
    await this.initPromise;
    this.ref.current?.setTheme(tema);
  }

  async resize(dim: Dimensions) {
    this.state.dimensions = dim;
    await this.initPromise;
    this.ref.current?.resize(dim);
  }

  async loadHistory(messages: { texto: string; hora: string; id: string; origem?: 'usuario' | 'agente' }[]) {
    await this.initPromise;
    this.ref.current?.loadHistory(messages);
  }

  async clearHistory() {
    await this.initPromise;
    this.ref.current?.clearHistory();
  }

  async setAgentStatus(status: 'online' | 'offline') {
    this.state.agentStatus = status;
    // Consider how to reflect this in the UI if needed
    console.log('Agent status set to:', status);
  }

  async show() {
    await this.initPromise;
    this.ref.current?.show();
  }

  async hide() {
    await this.initPromise;
    this.ref.current?.hide();
  }

  registerCommand(cmd: string, fn: CommandFunction) {
    this.commands[cmd] = fn;
  }

  private async executeCommand(cmd: string, args: string[]) {
    const fn = this.commands[cmd];
    if (fn) return fn(args);
    return `Comando “/${cmd}” não reconhecido.`;
  }

  async setLocale(locale: string) {
    this.state.locale = locale;
    await this.initPromise;
    this.ref.current?.setLocale(locale);
  }

  async setPredefinedQuestions(questions: PredefinedQuestion[]) {
    this.state.predefinedQuestions = questions;
    await this.initPromise;
    this.ref.current?.setPredefinedQuestions(questions);
  }
}

const ChatWidget = new ChatWidgetClass();
(window as any).ChatWidget = ChatWidget;
export default ChatWidget;
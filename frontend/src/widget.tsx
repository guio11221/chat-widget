import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatLateral, { ChatLateralHandle, ChatLateralProps, PredefinedQuestion } from './ChatLateral';

export type InitOptions = Omit<ChatLateralProps, 'ref' | 'commandExecutor'> & {
  tema?: 'dark' | 'light';
  locale?: string;
  predefinedQuestions?: PredefinedQuestion[];
};

type CommandFunction = (args: string[]) => string | Promise<string>;

type Position = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

type Dimensions = {
  width: number;
  height: number;
};

class ChatWidgetClass {
  private root?: ReactDOM.Root;
  private containerId = 'chat-widget-root';
  private ref = React.createRef<ChatLateralHandle>();
  private initPromise: Promise<void> | null = null;
  private newMsgCallbacks: ((msg: string) => void)[] = [];
  private commands: Record<string, CommandFunction> = {};

  private currentOptions: InitOptions = { socketUrl: '' };

  private position: Position = 'bottom-right';
  private dimensions: Dimensions = { width: 360, height: 480 };
  private locale: string = 'pt-BR';
  private badgeCount: number = 0;
  private agentStatus: 'online' | 'offline' = 'online';
  private predefinedQuestions: PredefinedQuestion[] = [];

  private mountReact(opts: InitOptions) {
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
        socketUrl={opts.socketUrl}
        temaEscuroInicial={opts.tema ?? 'light'}
        locale={opts.locale ?? this.locale}
        chatTitle={opts.chatTitle}
        welcomeMessage={opts.welcomeMessage}
        botAvatarUrl={opts.botAvatarUrl}
        userAvatarUrl={opts.userAvatarUrl}
        commandExecutor={this.executeCommand.bind(this)}
        predefinedQuestions={this.predefinedQuestions}
      />
    );
  }

  init(opts: InitOptions): Promise<void> {
    if (this.root) return Promise.resolve();
    if (!this.initPromise) {
      this.currentOptions = opts;
      this.predefinedQuestions = opts.predefinedQuestions ?? [];
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
    document.getElementById(this.containerId)?.remove();
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
    this.badgeCount = count;
    await this.initPromise;
    this.ref.current?.setBadge(count);
  }

  onNewMessage(cb: (msg: string) => void) {
    this.newMsgCallbacks.push(cb);
  }

  async setPosition(position: Position) {
    this.position = (this.currentOptions.position || position);
    this.ref.current?.setPosition(this.position);
    if (this.ref.current) {
      // No direct method to set position after mount, might require re-mount or CSS update in ChatLateral
      console.warn('Setting position after init is not directly supported. Consider unmounting and re-initializing.');
    }
  }

  async setTheme(tema: 'light' | 'dark') {
    await this.initPromise;
    this.ref.current?.setTheme(tema);
  }

  async resize(dim: Dimensions) {
    this.dimensions = dim;
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
    this.agentStatus = status;
    // Consider how to reflect this in the UI if needed, maybe via a prop update on re-render
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
    this.locale = locale;
    await this.initPromise;
    this.ref.current?.setLocale(locale);
  }

  async setPredefinedQuestions(questions: PredefinedQuestion[]) {
    this.predefinedQuestions = questions;
    await this.initPromise;
    this.ref.current?.setPredefinedQuestions(questions);
  }
}

const ChatWidget = new ChatWidgetClass();
(window as any).ChatWidget = ChatWidget;
export default ChatWidget;
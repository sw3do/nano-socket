declare global {
  interface WebSocket {
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
    readonly readyState: number;
    readonly url: string;
    onopen: ((event: Event) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    send(data: string | ArrayBuffer | Blob): void;
    close(code?: number, reason?: string): void;
  }

  interface WebSocketConstructor {
    new (url: string, protocols?: string | string[]): WebSocket;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
  }

  const WebSocket: WebSocketConstructor;

  interface CloseEvent extends Event {
    readonly code: number;
    readonly reason: string;
    readonly wasClean: boolean;
  }

  interface MessageEvent extends Event {
    readonly data: any;
  }
}

export {};
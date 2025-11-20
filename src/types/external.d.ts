declare module 'tcp-port-used' {
  export function check(port: number, host?: string): Promise<boolean>;

  const tcpPortUsed: {
    check: typeof check;
  };

  export default tcpPortUsed;
}

declare module 'chrome-remote-interface' {
  export type Client = any;
  export interface ListTarget {
    description?: string;
    devtoolsFrontendUrl?: string;
    id?: string;
    title?: string;
    type?: string;
    url?: string;
    webSocketDebuggerUrl?: string;
  }

  interface ConnectOptions {
    port?: number;
    target?: ListTarget;
  }

  interface ListOptions {
    port?: number;
  }

  function CDP(options?: ConnectOptions): Promise<Client>;

  namespace CDP {
    function List(options?: ListOptions): Promise<ListTarget[]>;
  }

  export default CDP;
}


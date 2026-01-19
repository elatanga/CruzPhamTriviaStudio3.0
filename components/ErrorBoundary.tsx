import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "../services/loggerService";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('RENDER_FAILURE', error, { componentStack: errorInfo.componentStack });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-8 text-center border-4 border-red-900/50">
          <div className="max-w-md p-8 bg-zinc-900 border border-gold-600 rounded shadow-[0_0_50px_rgba(255,0,0,0.2)]">
            <h1 className="text-3xl font-serif text-gold-500 mb-4 tracking-widest">SYSTEM INTERRUPTION</h1>
            <p className="text-zinc-400 text-sm mb-6 font-sans">
              The studio has encountered a critical anomaly. Our engineers have been notified.
            </p>
            <div className="bg-black p-4 border border-zinc-800 text-left mb-6 overflow-auto max-h-32">
              <code className="text-red-500 font-mono text-xs">
                {this.state.error?.message || "Unknown Error"}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gold-600 text-black font-bold uppercase tracking-wider hover:bg-gold-500 transition-colors w-full"
            >
              Reinitialize System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

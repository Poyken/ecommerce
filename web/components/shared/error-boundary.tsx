"use client";

import { Link } from "@/i18n/routing";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}


export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary:${this.props.name || "Global"}] Error caught:`,
      error,
      errorInfo
    );

    // [P9 OPTIMIZATION] Gửi log lỗi về server analytics (TBD)
    // if (typeof window !== "undefined") {
    //   navigator.sendBeacon("/api/v1/analytics/error", JSON.stringify({
    //     name: error.name,
    //     message: error.message,
    //     stack: error.stack,
    //     component: this.props.name,
    //   }));
    // }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-muted/10 rounded-3xl border-2 border-dashed border-muted/20 my-8 animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle size={32} />
          </div>

          <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-2">
            Oops! Something went wrong
          </h2>

          <p className="text-muted-foreground text-sm max-w-md mb-8">
            {this.state.error?.message ||
              "An unexpected error occurred in this section of the store."}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={this.handleReset}
              className="group flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] rounded-full hover:scale-105 transition-all shadow-xl shadow-primary/20"
            >
              <RotateCcw
                size={14}
                className="group-hover:rotate-180 transition-transform duration-500"
              />
              Try Again
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-full hover:scale-105 transition-all shadow-xl border border-black/5"
            >
              Back to Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

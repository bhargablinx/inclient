import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught render error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = "/dashboard";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-6 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xl">
                            !
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
                        <p className="text-sm text-slate-600">
                            An unexpected rendering error occurred. You can return to the dashboard or refresh the application.
                        </p>
                        {this.state.error?.message && (
                            <div className="bg-slate-100 rounded p-3 text-xs text-slate-500 font-mono text-left overflow-auto max-h-24">
                                {this.state.error.message}
                            </div>
                        )}
                        <div className="flex justify-center gap-3 pt-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

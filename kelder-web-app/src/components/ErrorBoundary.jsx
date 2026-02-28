import { Component } from 'react';

export class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div className="rounded-xl p-4 text-red-400 text-sm border border-red-800/60 bg-red-950/20">
                    Panel unavailable
                </div>
            );
        }
        return this.props.children;
    }
}

import React from 'react';
import { Section } from '../types.ts';

interface WorkspaceErrorBoundaryProps {
  children: React.ReactNode;
  sectionName: string;
  onNavigate: (section: Section) => void;
}

interface WorkspaceErrorBoundaryState {
  hasError: boolean;
}

class WorkspaceErrorBoundary extends React.Component<
  WorkspaceErrorBoundaryProps,
  WorkspaceErrorBoundaryState
> {
  state: WorkspaceErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): WorkspaceErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`Workspace render failed for ${this.props.sectionName}:`, error);
  }

  componentDidUpdate(prevProps: WorkspaceErrorBoundaryProps) {
    if (prevProps.sectionName !== this.props.sectionName && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Workspace Recovery</div>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{this.props.sectionName} hit a rendering problem.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            The app kept the navigation surface alive so you can move to another workspace instead of losing your place.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Retry workspace
            </button>
            <button
              type="button"
              onClick={() => this.props.onNavigate(Section.DIDACTIC_LECTURES)}
              className="rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
            >
              Go to Didactics
            </button>
            <button
              type="button"
              onClick={() => this.props.onNavigate(Section.PATHOLOGY_CURRICULUM)}
              className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Open Curriculum
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WorkspaceErrorBoundary;

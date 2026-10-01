import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';

interface StatusMessageProps {
  kind: 'error' | 'success' | 'loading';
  children: string;
}

export function StatusMessage({ kind, children }: StatusMessageProps) {
  const Icon = kind === 'error' ? AlertCircle : kind === 'success' ? CheckCircle2 : LoaderCircle;
  return (
    <div className={`status-message ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon size={16} className={kind === 'loading' ? 'spin' : ''} />
      <span>{children}</span>
    </div>
  );
}

import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Inbox, LoaderCircle, X } from 'lucide-react';

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button ${className}`} {...props} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="empty-state"><Inbox aria-hidden="true" /><strong>{title}</strong><p>{message}</p></div>;
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span className="spinner" role="status"><LoaderCircle aria-hidden="true" />{label}</span>;
}

export function Toast({ children }: { children: ReactNode }) {
  return <div className="toast" role="status">{children}</div>;
}

type ModalProps = {
  open: boolean; title: string; description?: string; children: ReactNode; footer?: ReactNode;
  error?: string; busy?: boolean; size?: 'small' | 'medium' | 'large'; onClose: () => void;
};

export function Modal({ open, title, description, children, footer, error, busy = false, size = 'medium', onClose }: ModalProps) {
  const titleId = useId(); const descriptionId = useId(); const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const focusable = panel.current?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    focusable?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab' || !panel.current) return;
      const nodes = [...panel.current.querySelectorAll<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!nodes.length) return;
      const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, [busy, onClose, open]);
  if (!open) return null;
  return <div className="modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div ref={panel} className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}>
      <header className="modal-header"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" className="modal-close" aria-label={`Close ${title}`} disabled={busy} onClick={onClose}><X /></button></header>
      <div className="modal-body">{error && <div className="form-error" role="alert">{error}</div>}{children}</div>
      {footer && <footer className="modal-footer">{footer}</footer>}
    </div>
  </div>;
}

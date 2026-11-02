import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CarFront,
  Coffee,
  Ellipsis,
  HeartPulse,
  House,
  Plus,
  Wallet,
} from 'lucide-react';
import type { Category } from './domain';

export function CategoryIcon({
  category,
  small = false,
}: {
  category: Category;
  small?: boolean;
}) {
  const Icon = {
    home: House,
    food: Coffee,
    car: CarFront,
    heart: HeartPulse,
    book: BookOpen,
    coffee: Coffee,
    wallet: Wallet,
    briefcase: BriefcaseBusiness,
    plus: Plus,
    more: Ellipsis,
  }[category.icon];
  return (
    <span
      className={`category-icon ${small ? 'small' : ''}`}
      style={{ color: category.color, backgroundColor: `${category.color}16` }}
    >
      <Icon size={small ? 17 : 20} strokeWidth={1.8} />
    </span>
  );
}
export function DirectionIcon({ income }: { income: boolean }) {
  return income ? <ArrowDownLeft size={19} /> : <ArrowUpRight size={19} />;
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Wallet size={28} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  error,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  error?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    dialog
      .querySelector<HTMLElement>(
        'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea',
      )
      ?.focus();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      aria-describedby={subtitle ? 'dialog-subtitle' : undefined}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-content">
        <button
          className="icon-button modal-close"
          aria-label="Fechar janela"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <h2 id="dialog-title">{title}</h2>
        {subtitle && (
          <p id="dialog-subtitle" className="muted">
            {subtitle}
          </p>
        )}
        {children}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}

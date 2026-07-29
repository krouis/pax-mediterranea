import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  titleId: string;
  title: string;
  onClose?: () => void;
  role?: 'dialog' | 'alertdialog';
  className?: string;
  children: ReactNode;
  closeOnScrimClick?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog frame for Settings/History/combat-confirm/victory: consistent chrome plus a
 * real focus trap (Tab/Shift+Tab stay inside, Escape closes, focus returns to the opener on
 * unmount) — closes the gap docs/ACCESSIBILITY.md previously listed as "planned."
 */
export function PixelDialog({
  titleId,
  title,
  onClose,
  role = 'dialog',
  className = '',
  children,
  closeOnScrimClick = false,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = ref.current;
    const focusable = container
      ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      : [];
    (focusable[0] ?? container)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="scrim" onClick={closeOnScrimClick ? onClose : undefined}>
      <section
        ref={ref}
        className={`dialog stone-panel pixel-dialog ${className}`.trim()}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
      </section>
    </div>
  );
}

import type { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'aside';
}

export function PixelPanel({ as = 'div', className = '', ...rest }: Props) {
  const Tag = as;
  return <Tag className={`stone-panel pixel-panel ${className}`.trim()} {...rest} />;
}

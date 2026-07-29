import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary';
  size?: 'default' | 'large';
}

export function PixelButton({
  variant = 'default',
  size = 'default',
  className = '',
  ...rest
}: Props) {
  const classes = [
    'pixel-button',
    variant === 'primary' ? 'primary' : '',
    size === 'large' ? 'large' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <button className={classes} {...rest} />;
}


import React, { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'success' | 'warning' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-inverted)] focus:ring-[var(--color-primary)]',
    success: 'bg-[var(--color-success)] hover:opacity-90 text-[var(--color-text-inverted)] focus:ring-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)] hover:opacity-90 text-[var(--color-text-inverted)] focus:ring-[var(--color-warning)]',
    secondary: 'bg-[var(--color-text-muted)] hover:opacity-90 text-[var(--color-text-inverted)] focus:ring-[var(--color-text-muted)]',
    danger: 'bg-[var(--color-danger)] hover:opacity-90 text-[var(--color-text-inverted)] focus:ring-[var(--color-danger)]',
    ghost: 'bg-[var(--color-border-base)] hover:bg-[var(--color-border-input)] text-[var(--color-text-base)] focus:ring-[var(--color-primary)]'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'primary', icon, children, ...props }, ref) => {
    return (
        <button
            ref={ref}
            {...props}
            className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md [box-shadow:var(--shadow-sm)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] ${variantClasses[variant]} ${props.className || ''}`}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
});

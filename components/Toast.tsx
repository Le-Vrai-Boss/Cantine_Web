
import React, { useEffect } from 'react';
import { useToastState, useToast } from '../context/ToastContext';
import type { ToastMessage } from '../types';
import { CheckCircleIcon, XCircleIcon, InfoIcon, XIcon, AlertTriangleIcon } from './Icons';

const icons = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    error: <XCircleIcon className="h-6 w-6 text-red-500" />,
    info: <InfoIcon className="h-6 w-6 text-blue-500" />,
    warning: <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />,
};

const SingleToast: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
    const { removeToast } = useToast();

    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [toast.id, removeToast]);

    return (
        <div className="max-w-sm w-full bg-[var(--color-bg-card)] [box-shadow:var(--shadow-lg)] rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-fade-in-right">
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {icons[toast.type]}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-[var(--color-text-heading)]">{toast.message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="bg-transparent rounded-md inline-flex text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] focus:ring-[var(--color-primary)]"
                        >
                            <span className="sr-only">Fermer</span>
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const ToastContainer: React.FC = () => {
    const toasts = useToastState();

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <SingleToast key={toast.id} toast={toast} />
                ))}
            </div>
        </div>
    );
};

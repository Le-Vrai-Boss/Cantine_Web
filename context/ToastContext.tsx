/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { ToastMessage, ToastType } from '../types';

interface ToastContextActions {
     addToast: (message: string, type?: ToastType) => void;
     removeToast: (id: number) => void;
}

const ToastStateContext = createContext<ToastMessage[] | undefined>(undefined);
const ToastActionsContext = createContext<ToastContextActions | undefined>(undefined);


export const useToast = (): ToastContextActions => {
    const context = useContext(ToastActionsContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const useToastState = (): ToastMessage[] => {
    const context = useContext(ToastStateContext);
    if (!context) throw new Error('useToastState must be used within a ToastProvider');
    return context;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastStateContext.Provider value={toasts}>
            <ToastActionsContext.Provider value={{ addToast, removeToast }}>
                {children}
            </ToastActionsContext.Provider>
        </ToastStateContext.Provider>
    );
};
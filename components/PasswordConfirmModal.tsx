
import React, { useState } from 'react';
import { Button } from './Button';
import { LockIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

interface PasswordConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
}

export const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmation Requise",
    description = "Pour effectuer cette action, veuillez confirmer avec le mot de passe Principal (Niveau 1)."
}) => {
    const { appSettings } = useAppContext();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (password === appSettings.password) {
            onConfirm();
            onClose();
            setPassword('');
            setError('');
        } else {
            setError('Mot de passe incorrect.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-[var(--color-bg-card)] rounded-lg [box-shadow:var(--shadow-lg)] p-6 w-full max-w-sm">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[var(--color-primary-light)] mb-3">
                        <LockIcon className="h-6 w-6 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">{title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-2">{description}</p>
                </div>

                <div className="mt-4">
                    <label htmlFor="password-confirm" className="sr-only">Mot de passe</label>
                    <input
                        id="password-confirm"
                        type="password"
                        value={password}
                        onChange={e => {
                            setPassword(e.target.value);
                            if(error) setError('');
                        }}
                        onKeyDown={handleKeyDown}
                        className={`mt-1 block w-full px-3 py-2 text-center bg-[var(--color-bg-base)] border rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border-input)] focus:ring-[var(--color-primary)]'}`}
                        autoFocus
                    />
                     {error && <p className="mt-2 text-xs text-red-600 text-center">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button type="button" onClick={onClose} variant="ghost">Annuler</Button>
                    <Button type="button" onClick={handleConfirm} variant="primary">Confirmer</Button>
                </div>
            </div>
        </div>
    );
};

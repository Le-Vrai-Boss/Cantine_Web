
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { LockIcon, SaveIcon } from './Icons';
import { useToast } from '../context/ToastContext';

interface ForcedPasswordChangeScreenProps {
    onPasswordChanged: (newPassword: string) => void;
}

export const ForcedPasswordChangeScreen: React.FC<ForcedPasswordChangeScreenProps> = ({ onPasswordChanged }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { addToast } = useToast();

    const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            setError('Les champs ne peuvent pas être vides.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        onPasswordChanged(newPassword);
        addToast('Mot de passe mis à jour avec succès.', 'success');
    };

    const handleNewPasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmPasswordInputRef.current?.focus();
        }
    };

    const handleConfirmPasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitButtonRef.current?.click();
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-base)] p-4">
            <div className="w-full max-w-sm mx-auto">
                <form onSubmit={handleSubmit} className="bg-[var(--color-bg-card)] p-8 rounded-2xl [box-shadow:var(--shadow-lg)] border border-[var(--color-border-base)]">
                    <div className="text-center">
                         <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-primary-light)] mb-4">
                             <LockIcon className="h-8 w-8 text-[var(--color-primary)]" />
                         </div>
                        <h2 className="text-2xl font-bold text-[var(--color-text-heading)]">Mise à jour requise</h2>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Pour votre sécurité, veuillez définir un nouveau mot de passe pour l'application.</p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div>
                            <label htmlFor="new-password-input" className="block text-sm font-medium text-[var(--color-text-muted)]">Nouveau mot de passe</label>
                            <input
                                id="new-password-input"
                                type="password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (error) setError('');
                                }}
                                onKeyDown={handleNewPasswordKeyDown}
                                className="mt-1 w-full px-4 py-3 bg-[var(--color-bg-base)] border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] border-[var(--color-border-input)] focus:ring-[var(--color-primary)]"
                                autoFocus
                            />
                        </div>
                        <div>
                             <label htmlFor="confirm-password-input" className="block text-sm font-medium text-[var(--color-text-muted)]">Confirmer le mot de passe</label>
                            <input
                                id="confirm-password-input"
                                type="password"
                                ref={confirmPasswordInputRef}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (error) setError('');
                                }}
                                onKeyDown={handleConfirmPasswordKeyDown}
                                className="mt-1 w-full px-4 py-3 bg-[var(--color-bg-base)] border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] border-[var(--color-border-input)] focus:ring-[var(--color-primary)]"
                            />
                        </div>
                        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
                    </div>

                    <div className="mt-6">
                        <Button ref={submitButtonRef} type="submit" variant="primary" className="w-full py-3 text-base" icon={<SaveIcon className="h-5 w-5"/>}>
                            Confirmer et Continuer
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { LockIcon } from './Icons';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

export const ApprovalScreen: React.FC = () => {
    const { setAppSettings } = useAppContext();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { addToast } = useToast();
    const submitButtonRef = useRef<HTMLButtonElement>(null);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'TheBrain2010') {
            addToast("Application approuvée et activée.", "success");
            setAppSettings(prev => ({ ...prev, isApproved: true }));
        } else {
            setError("Code d'approbation incorrect.");
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
                        <h2 className="text-2xl font-bold text-[var(--color-text-heading)]">Approbation Requise</h2>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Veuillez entrer le code d'approbation du concepteur pour activer l'application.</p>
                    </div>

                    <div className="mt-8">
                        <label htmlFor="approval-password-input" className="sr-only">Code d'approbation</label>
                        <input
                            id="approval-password-input"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                            onKeyDown={handleInputKeyDown}
                            className={`w-full px-4 py-3 bg-[var(--color-bg-base)] border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] text-center ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border-input)] focus:ring-[var(--color-primary)]'}`}
                            placeholder="••••••••"
                            autoFocus
                        />
                        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
                    </div>

                    <div className="mt-6">
                        <Button ref={submitButtonRef} type="submit" variant="primary" className="w-full py-3 text-base">
                            Confirmer
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};



import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { LockIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

interface LockScreenProps {
    onUnlock: (level: number, recoveryUsed?: boolean) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
    const { appSettings } = useAppContext();
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);
    const submitButtonRef = useRef<HTMLButtonElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Designer Password
        if (input === "TheBrain2010") {
            onUnlock(0);
            return;
        }

        // Level 1 (Principal)
        if (appSettings.password && input === appSettings.password) {
            onUnlock(1);
            return;
        }
        
        // Level 2 (Secondaire)
        if (appSettings.level2Password && input === appSettings.level2Password) {
            onUnlock(2);
            return;
        }

        // Level 3
        if (appSettings.level3Password && input === appSettings.level3Password) {
            onUnlock(3);
            return;
        }
        
        // Level 4
        if (appSettings.level4Password && input === appSettings.level4Password) {
            onUnlock(4);
            return;
        }

        // Recovery option 1: User-defined hint
        if (appSettings.passwordHint && input.trim() !== '' && input === appSettings.passwordHint) {
            onUnlock(1, true); // Unlock as level 1, signal recovery
            return;
        }

        // Recovery option 2: Default master password
        if (input === "The Brain" && appSettings.password !== "The Brain") {
            onUnlock(1, true); // Unlock as level 1, signal recovery
            return;
        }

        setError('Mot de passe ou indice incorrect.');
        setInput('');
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
                        <h2 className="text-2xl font-bold text-[var(--color-text-heading)]">Application Verrouillée</h2>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Veuillez entrer votre mot de passe pour continuer.</p>
                    </div>

                    <div className="mt-8">
                        <label htmlFor="password-input" className="sr-only">Mot de passe</label>
                        <input
                            id="password-input"
                            type="password"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                if (error) setError('');
                            }}
                            onKeyDown={handleInputKeyDown}
                            className={`w-full px-4 py-3 bg-[var(--color-bg-base)] border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] text-center ${error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border-input)] focus:ring-[var(--color-primary)]'}`}
                            placeholder="••••••••"
                            autoFocus
                        />
                        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
                    </div>

                    <div className="text-center mt-4">
                        <button 
                            type="button" 
                            onClick={() => setShowRecoveryInfo(true)} 
                            className="text-sm text-[var(--color-primary)] hover:underline focus:outline-none"
                        >
                            Mot de passe oublié ?
                        </button>
                    </div>

                    {showRecoveryInfo && (
                        <div className="mt-4 p-4 bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] rounded-lg text-sm">
                            <h4 className="font-bold">Aide à la récupération</h4>
                            <p className="mt-1">
                                Pour déverrouiller, saisissez votre <strong>indice de récupération</strong> (défini dans les paramètres) ou le mot de passe maître dans le champ ci-dessus.
                            </p>
                            <div className="flex justify-end mt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRecoveryInfo(false)}
                                    className="px-3 py-1.5 text-xs font-semibold bg-white/50 hover:bg-white/80 rounded-md text-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-primary-light)] focus:ring-white"
                                >
                                    Retour
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-6">
                        <Button ref={submitButtonRef} type="submit" variant="primary" className="w-full py-3 text-base">
                            Déverrouiller
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

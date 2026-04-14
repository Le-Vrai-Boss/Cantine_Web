
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { HistoryIcon, TrashIcon } from '../components/Icons';
import { PasswordConfirmModal } from '../components/PasswordConfirmModal';

const HistoriquePage: React.FC<{ currentUserLevel: number | null }> = ({ currentUserLevel }) => {
    const { history, setHistory, logAction, appSettings } = useAppContext();
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const sortedHistory = useMemo(() => 
        [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [history]);

    const handleClearHistory = () => {
        // This action can only be initiated by Level 1, so we log it as such.
        logAction("L'historique des actions a été vidé.", 1);
        setHistory([]);
    };

    const handleClearClick = () => {
        if (!appSettings.password) {
             if (window.confirm("Aucun mot de passe principal n'est défini. Êtes-vous sûr de vouloir vider l'historique ? Cette action est irréversible.")) {
                handleClearHistory();
            }
        } else {
             setIsConfirmModalOpen(true);
        }
    };

    return (
        <>
            <PasswordConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleClearHistory}
                title="Vider l'Historique"
                description="Cette action est irréversible. Pour confirmer, veuillez entrer le mot de passe Principal (Niveau 1)."
            />
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
                <div className="flex justify-between items-center border-b border-[var(--color-border-base)] pb-4 mb-6">
                    <div className="flex items-center">
                        <HistoryIcon className="h-8 w-8 text-[var(--color-primary)] mr-3" />
                        <h3 className="text-xl font-bold text-[var(--color-text-heading)]">Historique des Actions</h3>
                    </div>
                    {currentUserLevel === 1 && (
                         <Button
                            variant="danger"
                            onClick={handleClearClick}
                            icon={<TrashIcon className="h-5 w-5" />}
                            disabled={history.length === 0}
                        >
                            Vider l'historique
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto max-h-[70vh]">
                     {sortedHistory.length > 0 ? (
                        <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                            <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)] sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3 w-1/3">Date & Heure</th>
                                    <th scope="col" className="px-6 py-3 w-1/6">Niveau Utilisateur</th>
                                    <th scope="col" className="px-6 py-3 w-1/2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border-base)]">
                                {sortedHistory.map(entry => (
                                    <tr key={entry.id} className="hover:bg-[var(--color-bg-muted)]">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(entry.timestamp).toLocaleString('fr-FR', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 font-semibold leading-tight text-xs rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
                                                Niveau {entry.userLevel || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--color-text-base)]">{entry.action}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     ) : (
                        <div className="text-center py-16">
                            <HistoryIcon className="h-12 w-12 mx-auto text-slate-300" />
                            <h4 className="mt-4 text-lg font-semibold text-slate-600">L'historique est vide</h4>
                            <p className="mt-1 text-slate-400">Les actions effectuées dans l'application apparaîtront ici.</p>
                        </div>
                     )}
                </div>
            </div>
        </>
    );
};

export default HistoriquePage;

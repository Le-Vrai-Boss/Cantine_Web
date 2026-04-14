import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { MessageSquareIcon, PlusCircleIcon, CloseIcon, SaveIcon, ChevronRightIcon, HistoryIcon, XIcon } from '../components/Icons';
import type { MessageTemplate, MessageRecipient, MessageHistoryEntry, Director, Gerant, CogesMember, Cantiniere } from '../types';

// Modal component for creating/editing message templates
const TemplateModal: React.FC<{
    onClose: () => void;
    onSave: (template: Omit<MessageTemplate, 'id'>) => void;
}> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');

    const handleSave = () => {
        if (!name.trim() || !content.trim()) {
            alert('Le nom et le contenu du message sont requis.');
            return;
        }
        onSave({ name, content });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-[var(--color-bg-card)] rounded-lg [box-shadow:var(--shadow-xl)] p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center border-b border-[var(--color-border-base)] pb-3 mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">Créer un nouveau message préinscrit</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-bg-muted)]"><CloseIcon className="h-6 w-6" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="template-name" className="block text-sm font-medium text-[var(--color-text-muted)]">Nom du message</label>
                        <input id="template-name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                    </div>
                    <div>
                        <label htmlFor="template-content" className="block text-sm font-medium text-[var(--color-text-muted)]">Contenu du message</label>
                        <textarea id="template-content" value={content} onChange={e => setContent(e.target.value)} rows={6} className="mt-1 block w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--color-border-base)] flex justify-end space-x-3">
                    <Button type="button" onClick={onClose} variant="ghost">Annuler</Button>
                    <Button type="button" onClick={handleSave} variant="primary" icon={<SaveIcon className="h-5 w-5" />}>Sauvegarder</Button>
                </div>
            </div>
        </div>
    );
};


const MessageHistory: React.FC = () => {
    const { messageHistory } = useAppContext();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const sortedHistory = useMemo(() => 
        [...messageHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [messageHistory]);

    if (sortedHistory.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] rounded-lg">
                <HistoryIcon className="h-8 w-8 mx-auto mb-2" />
                L'historique des envois est vide.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {sortedHistory.map(entry => (
                <div key={entry.id} className="border border-[var(--color-border-base)] rounded-lg">
                    <button 
                        className="w-full flex justify-between items-center p-3 text-left hover:bg-[var(--color-bg-muted)]"
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        aria-expanded={expandedId === entry.id}
                        aria-controls={`history-details-${entry.id}`}
                    >
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-sm text-[var(--color-text-base)] truncate">{entry.content}</p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {new Date(entry.timestamp).toLocaleString('fr-FR')} - Envoyé à {entry.recipients.length} destinataire(s)
                            </p>
                        </div>
                        <ChevronRightIcon className={`h-5 w-5 transition-transform shrink-0 ml-2 ${expandedId === entry.id ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedId === entry.id && (
                        <div id={`history-details-${entry.id}`} className="p-4 border-t border-[var(--color-border-base)] bg-[var(--color-bg-muted)]">
                            <h5 className="font-semibold text-sm mb-2">Message complet :</h5>
                            <p className="text-sm whitespace-pre-wrap bg-white p-2 rounded border">{entry.content}</p>
                            <h5 className="font-semibold text-sm mt-4 mb-2">Destinataires ({entry.recipients.length}) :</h5>
                            <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                                {entry.recipients.map((r, i) => (
                                    <li key={i} className="flex justify-between p-1 hover:bg-white rounded">
                                        <span>{r.name} ({r.role}, {r.schoolName})</span>
                                        <span className="font-mono">{r.contact}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const MessageriePage: React.FC = () => {
    const { schools, directors, gerants, cogesMembers, cantinieres, messageTemplates, setMessageTemplates, setMessageHistory } = useAppContext();
    const { addToast } = useToast();

    const [selectedSchoolId, setSelectedSchoolId] = useState('all');
    const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
    
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [countryCode, setCountryCode] = useState('225');

    const [roleFilters, setRoleFilters] = useState({
        directeur: true,
        gerant: true,
        coges: true,
        cantiniere: true,
    });

    const handleFilterChange = useCallback((role: keyof typeof roleFilters) => {
        setRoleFilters(prev => ({ ...prev, [role]: !prev[role] }));
    }, []);

    const areAllRolesSelected = useMemo(() => Object.values(roleFilters).every(Boolean), [roleFilters]);

    const handleSelectAllRoles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target;
        setRoleFilters({
            directeur: checked,
            gerant: checked,
            coges: checked,
            cantiniere: checked,
        });
    }, []);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedTemplateId(id);
        const template = messageTemplates.find(t => t.id === id);
        setMessageContent(template ? template.content : '');
    };

    const handleSaveTemplate = (template: Omit<MessageTemplate, 'id'>) => {
        const newTemplate = { ...template, id: `${Date.now()}` };
        setMessageTemplates(prev => [...prev, newTemplate]);
        addToast("Message préinscrit créé avec succès.", "success");
    };
    
    const potentialRecipients = useMemo(() => {
        const schoolMap = new Map<string, string>(schools.map(s => [s.id, s.name]));
        const allStaff: MessageRecipient[] = [];

        const addStaff = (staffList: (Director | Gerant | CogesMember | Cantiniere)[], role: string) => {
            if (!Array.isArray(staffList)) return;
            staffList.forEach(p => {
                if (p && p.name && p.contact && p.schoolId) {
                    allStaff.push({
                        name: p.name,
                        contact: p.contact,
                        role: role,
                        schoolId: p.schoolId,
                        schoolName: schoolMap.get(p.schoolId) || 'N/A',
                    });
                }
            });
        };
        
        addStaff(directors, 'Directeur');
        addStaff(gerants, 'Gérant');
        addStaff(cogesMembers, 'COGES');
        addStaff(cantinieres, 'Cantinière');
        
        const roleMap: Record<string, keyof typeof roleFilters> = {
            'Directeur': 'directeur',
            'Gérant': 'gerant',
            'COGES': 'coges',
            'Cantinière': 'cantiniere',
        };

        const filteredByRole = allStaff.filter(person => {
            const roleKey = roleMap[person.role];
            return roleKey ? roleFilters[roleKey] : false;
        });

        const filteredBySchool = selectedSchoolId === 'all'
            ? filteredByRole
            : filteredByRole.filter(person => String(person.schoolId) === String(selectedSchoolId));

        const recipientContacts = new Set(recipients.map(r => r.contact));
        
        const availableRecipients = filteredBySchool.filter(p => !recipientContacts.has(p.contact));
        
        return availableRecipients.sort((a, b) => a.name.localeCompare(b.name));
        
    }, [schools, directors, gerants, cogesMembers, cantinieres, selectedSchoolId, recipients, roleFilters]);
    
    const addRecipient = (person: MessageRecipient) => {
        setRecipients(prev => [...prev, person]);
    };
    
    const handleAddRecipient = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const contact = e.target.value;
        if (!contact) return;

        const personToAdd = potentialRecipients.find(p => p.contact === contact);
        if (personToAdd) {
            addRecipient(personToAdd);
        }
        e.target.value = ''; // Reset dropdown after selection
    };

    const removeRecipient = (contact: string) => {
        setRecipients(prev => prev.filter(p => p.contact !== contact));
    };

    const formatPhoneNumberForWhatsApp = (phoneNumber: string, countryCode: string): string => {
        const cleanedNumber = phoneNumber.replace(/\D/g, '');
        const cleanedCountryCode = countryCode.replace(/\D/g, '');
        if (cleanedNumber.startsWith(cleanedCountryCode)) {
            return cleanedNumber;
        }
        return `${cleanedCountryCode}${cleanedNumber}`;
    };

    const handleSend = () => {
        if (!messageContent.trim()) {
            addToast("Le message ne peut pas être vide.", "error");
            return;
        }
        if (recipients.length === 0) {
            addToast("Veuillez ajouter au moins un destinataire.", "error");
            return;
        }
        
        const encodedMessage = encodeURIComponent(messageContent);
        const phoneNumbers = recipients.map(c => c.contact).filter(Boolean);

        if (phoneNumbers.length > 5) {
            if (!window.confirm(`Vous êtes sur le point d'envoyer un message à ${phoneNumbers.length} personnes. Cela peut ouvrir plusieurs onglets dans votre navigateur. Voulez-vous continuer ?`)) {
                return;
            }
        }
        
        phoneNumbers.forEach(number => {
            const formattedNumber = formatPhoneNumberForWhatsApp(number, countryCode);
            const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
        });

        const newHistoryEntry: MessageHistoryEntry = {
            id: `${Date.now()}`,
            timestamp: new Date().toISOString(),
            content: messageContent,
            recipients: recipients,
        };
        setMessageHistory(prev => [newHistoryEntry, ...prev]);

        addToast(`Message envoyé à ${recipients.length} destinataire(s).`, "success");
        setRecipients([]);
        setMessageContent('');
        setSelectedTemplateId('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
                <div className="flex items-center gap-3 border-b border-[var(--color-border-base)] pb-4 mb-4">
                    <MessageSquareIcon className="h-8 w-8 text-[var(--color-primary)]" />
                    <h3 className="text-xl font-bold text-[var(--color-text-heading)]">Composer un Message</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="template-select" className="block text-sm font-medium text-[var(--color-text-muted)]">Utiliser un message préinscrit</label>
                        <select id="template-select" value={selectedTemplateId} onChange={handleTemplateChange} className="mt-1 block w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent">
                            <option value="">-- Choisir un message --</option>
                            {messageTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-transparent">.</label>
                        <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="w-full mt-1" icon={<PlusCircleIcon className="h-5 w-5" />}>
                            Créer un nouveau message
                        </Button>
                    </div>
                </div>

                <div>
                    <label htmlFor="message-content" className="block text-sm font-medium text-[var(--color-text-muted)]">Contenu du Message</label>
                    <textarea id="message-content" value={messageContent} onChange={e => setMessageContent(e.target.value)} rows={8} className="mt-1 block w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                </div>

                <div className="mt-6">
                    <h4 className="text-lg font-semibold text-[var(--color-text-heading)] mb-3">Destinataires ({recipients.length})</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border border-[var(--color-border-base)] rounded-lg bg-[var(--color-bg-muted)]">
                        <div>
                            <label htmlFor="school-filter" className="block text-sm font-medium text-[var(--color-text-muted)]">Filtrer par école</label>
                            <select id="school-filter" value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} className="mt-1 block w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent">
                                <option value="all">Toutes les écoles</option>
                                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)]">Filtrer par rôle</label>
                            <div className="mt-2 space-y-2">
                                <label className="flex items-center text-sm">
                                    <input type="checkbox" checked={areAllRolesSelected} onChange={handleSelectAllRoles} className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"/>
                                    <span className="ml-2 font-medium">Tous les rôles</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2 pl-6">
                                    {Object.entries(roleFilters).map(([role, checked]) => (
                                        <label key={role} className="flex items-center text-xs">
                                            <input type="checkbox" checked={checked} onChange={() => handleFilterChange(role as keyof typeof roleFilters)} className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"/>
                                            <span className="ml-2 capitalize">{role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative mb-4">
                         <select onChange={handleAddRecipient} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent appearance-none">
                            <option value="">-- Ajouter un destinataire depuis la liste filtrée ({potentialRecipients.length}) --</option>
                            {potentialRecipients.map(p => <option key={p.contact} value={p.contact}>{p.name} ({p.role}, {p.schoolName})</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronRightIcon className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {recipients.map(person => (
                            <div key={person.contact} className="flex justify-between items-center p-2 bg-[var(--color-bg-muted)] rounded">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-text-base)]">{person.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{person.role}, {person.schoolName}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono">{person.contact}</span>
                                    <button onClick={() => removeRecipient(person.contact)} className="text-red-500 hover:text-red-700"><XIcon className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-border-base)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <label htmlFor="country-code" className="text-sm font-medium text-[var(--color-text-muted)]">Indicatif:</label>
                         <input id="country-code" type="text" value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-16 p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                    </div>
                    <Button onClick={handleSend} variant="primary" disabled={recipients.length === 0 || !messageContent.trim()}>
                        Envoyer via WhatsApp
                    </Button>
                </div>

            </div>

            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] flex flex-col">
                <div className="flex items-center gap-3 border-b border-[var(--color-border-base)] pb-4 mb-4">
                    <HistoryIcon className="h-8 w-8 text-[var(--color-primary)]" />
                    <h3 className="text-xl font-bold text-[var(--color-text-heading)]">Historique des envois</h3>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                     <MessageHistory />
                </div>
            </div>

            {isModalOpen && <TemplateModal onClose={() => setIsModalOpen(false)} onSave={handleSaveTemplate} />}
        </div>
    );
};

export default MessageriePage;

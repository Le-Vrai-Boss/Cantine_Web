import React, { useState, useEffect } from 'react';
import type { CalendarEvent, EventType } from '../../types';
import { CloseIcon } from '../../components/Icons';
import { Button } from '../../components/Button';

const eventTypes: { id: EventType; label: string; color: string; dotColor: string }[] = [
    { id: 'holiday', label: 'Férié', color: 'bg-green-500', dotColor: 'bg-green-500' },
    { id: 'vacation', label: 'Congé', color: 'bg-orange-500', dotColor: 'bg-orange-500' },
    { id: 'activity', label: 'Activité', color: 'bg-purple-500', dotColor: 'bg-purple-500' },
    { id: 'special', label: 'Spécial', color: 'bg-yellow-500', dotColor: 'bg-yellow-500' },
    { id: 'preparation', label: 'Préparation', color: 'bg-blue-500', dotColor: 'bg-blue-500' },
];

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<CalendarEvent, 'id'>) => void;
    onDelete?: () => void;
    event: Partial<CalendarEvent> | null;
    date: Date;
    readOnly?: boolean;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, event, date, readOnly = false }) => {
    const [title, setTitle] = useState(event?.title || '');
    const [type, setType] = useState<EventType>(event?.type || 'activity');

    useEffect(() => {
        if (event) {
            setTitle(event.title || '');
            setType(event.type || 'activity');
        }
    }, [event]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        onSave({ date: date.toISOString().split('T')[0], title, type });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-[var(--color-bg-card)] rounded-lg [box-shadow:var(--shadow-lg)] p-6 w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center border-b border-[var(--color-border-base)] pb-3 mb-4">
                        <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">
                            {event?.id ? "Modifier l'événement" : 'Ajouter un événement'} du {date.toLocaleDateString('fr-FR')}
                        </h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-bg-muted)]"><CloseIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="event-title" className="block text-sm font-medium text-[var(--color-text-muted)]">Titre</label>
                            <input
                                id="event-title"
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                required
                                disabled={readOnly}
                            />
                        </div>
                        <div>
                            <label htmlFor="event-type" className="block text-sm font-medium text-[var(--color-text-muted)]">Type</label>
                            <select
                                id="event-type"
                                value={type}
                                onChange={e => setType(e.target.value as EventType)}
                                className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                disabled={readOnly || event?.type === 'preparation'}
                            >
                                {eventTypes.filter(et => et.id !== 'preparation').map(et => <option key={et.id} value={et.id}>{et.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                        <div>
                        {onDelete && event?.type !== 'preparation' && (
                            <Button type="button" onClick={onDelete} variant="danger" disabled={readOnly}>
                                Supprimer
                            </Button>
                        )}
                        </div>
                        <div className="flex space-x-3">
                            <Button type="button" onClick={onClose} variant="ghost">Annuler</Button>
                            <Button type="submit" variant="primary" disabled={readOnly || event?.type === 'preparation'}>
                                {event?.id ? 'Sauvegarder' : 'Ajouter'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default EventModal;

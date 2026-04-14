import React, { useMemo } from 'react';
import type { Activite, CalendarEvent } from '../../types';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, CheckCircleIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';


interface ActivitesTableProps { isReadOnly?: boolean; }
const ActivitesTable: React.FC<ActivitesTableProps> = ({ isReadOnly = false }) => {
    const { activites, setActivites, calendarEvents, setCalendarEvents } = useAppContext();
    const { addToast } = useToast();
    
    const sortedActivites = useMemo(() => 
        [...activites].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [activites]);

    const addRow = () => {
        const newRow: Activite = { id: `${Date.now()}`, date: new Date().toISOString().split('T')[0], designation: '' };
        setActivites([...activites, newRow]);
    };
    const removeRow = (id: string) => setActivites(activites.filter(a => a.id !== id));
    const handleInputChange = (id: string, field: keyof Omit<Activite, 'id'>, value: string) => {
        setActivites(activites.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handleSync = () => {
        let activitiesAdded = 0;
        let calendarEventsAdded = 0;

        // 1. Sync from Calendar to Activities list
        const calendarActivities = calendarEvents.filter(event => event.type === 'activity');
        const newActivities: Activite[] = [...activites];

        calendarActivities.forEach(calEvent => {
            const existsInActivites = activites.some(act => act.date === calEvent.date && act.designation === calEvent.title);
            if (!existsInActivites) {
                newActivities.push({
                    id: calEvent.id, // Use calendar event ID to link them
                    date: calEvent.date,
                    designation: calEvent.title,
                });
                activitiesAdded++;
            }
        });

        // 2. Sync from Activities list to Calendar
        const newCalendarEvents: CalendarEvent[] = [...calendarEvents];
        newActivities.forEach(activity => {
            const existsInCalendar = calendarEvents.some(event => event.type === 'activity' && event.date === activity.date && event.title === activity.designation);
            if (!existsInCalendar) {
                newCalendarEvents.push({
                    id: activity.id, // Use activity ID
                    date: activity.date,
                    title: activity.designation,
                    type: 'activity',
                });
                calendarEventsAdded++;
            }
        });
        
        setActivites(newActivities);
        setCalendarEvents(newCalendarEvents);

        addToast(`Synchronisation terminée. ${activitiesAdded} activité(s) ajoutée(s) depuis le calendrier. ${calendarEventsAdded} événement(s) ajouté(s) au calendrier.`, 'success');
    };

    const handleExport = () => {
        if (sortedActivites.length === 0) {
            addToast("Aucune activité à exporter.", 'info');
            return;
        }
        const dataToExport = sortedActivites.map((activite) => ({
            "Date": activite.date,
            "Désignation": activite.designation
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Activites");
        XLSX.writeFile(wb, "journal_activites.xlsx");
        addToast("Journal d'activités exporté avec succès.", 'success');
    };

    const handleImport = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

                const newActivites: Activite[] = json.map((item, index) => ({
                    id: `${Date.now()}-${index}`,
                    date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    designation: String(item.designation || ''),
                }));

                setActivites(prev => [...prev, ...newActivites]);
                addToast(`${newActivites.length} activités importées et ajoutées.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation des activités:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Journal des Activités</h3>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                 <Button onClick={addRow} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={isReadOnly}>
                    Ajouter une activité
                </Button>
                <Button onClick={handleSync} variant="primary" icon={<CheckCircleIcon className="h-5 w-5" />} disabled={isReadOnly}>
                    Synchro
                </Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter (Excel)
                </Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>
                    Importer (Excel)
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-1/4">Date</th>
                            <th scope="col" className="px-6 py-3 w-3/4">Désignation de l'Activité</th>
                            <th scope="col" className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedActivites.map(activite => (
                            <tr key={activite.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                <td className="px-6 py-2"><input type="date" value={activite.date} onChange={e => handleInputChange(activite.id, 'date', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="text" value={activite.designation} onChange={e => handleInputChange(activite.id, 'designation', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2 text-center"><button onClick={() => removeRow(activite.id)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActivitesTable;
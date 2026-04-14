import React, { useMemo } from 'react';
import { ExportIcon, ImportIcon, ResetIcon, TrashIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

interface StaffMember {
    id: string;
    schoolId: string;
    name: string;
    contact: string;
    trained: boolean;
    trainingYear: number | '';
    trainingType: string;
}

interface StaffTableProps<T extends StaffMember> {
    title: string;
    personLabel: string;
    items: T[];
    setItems: React.Dispatch<React.SetStateAction<T[]>>;
    isReadOnly?: boolean;
}

const StaffTable = <T extends StaffMember>({
    title,
    personLabel,
    items,
    setItems,
    isReadOnly = false,
}: StaffTableProps<T>) => {
    const { schools } = useAppContext();
    const { addToast } = useToast();

    const itemsMap = useMemo(() => new Map(items.map(p => [p.schoolId, p])), [items]);
    const schoolNameMap = useMemo(() => new Map(schools.map(s => [s.name, s.id])), [schools]);
    
    const sortedSchools = useMemo(() => [...schools].sort((a, b) => a.name.localeCompare(b.name)), [schools]);

    const handleStaffChange = (schoolId: string, field: keyof Omit<StaffMember, 'id' | 'schoolId'>, value: string | boolean) => {
        setItems(prev => {
            const existingPerson = prev.find(p => p.schoolId === schoolId);
            let processedValue: string | boolean | number = value;
            if (field === 'trainingYear') {
                processedValue = value === '' ? '' : parseInt(String(value), 10) || '';
            }
            if (existingPerson) {
                return prev.map(p => {
                    if (p.schoolId === schoolId) {
                        const updatedPerson = { ...p, [field]: processedValue };
                        if (field === 'trained' && value === false) { 
                            (updatedPerson as StaffMember).trainingYear = ''; 
                            (updatedPerson as StaffMember).trainingType = ''; 
                        }
                        return updatedPerson;
                    }
                    return p;
                });
            } else {
                if (value) {
                    const newPerson = { 
                        id: `${Date.now()}`, 
                        schoolId, 
                        name: '', 
                        contact: '', 
                        trained: false, 
                        trainingYear: '', 
                        trainingType: '', 
                        [field]: processedValue 
                    } as T;
                    return [...prev, newPerson];
                }
                return prev;
            }
        });
    };
    
    const clearStaff = (schoolId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir effacer les informations de cette personne ?")) {
            setItems(prev => prev.filter(p => p.schoolId !== schoolId));
        }
    };

    const handleReset = () => {
        if (window.confirm(`Êtes-vous sûr de vouloir effacer les informations de tous les ${title.toLowerCase().split(' ')[2]} ?`)) {
            setItems([]);
        }
    };

    const handleExport = () => {
        const dataToExport = sortedSchools.map((school, index) => {
            const person = itemsMap.get(school.id);
            return {
                "N°": index + 1, "Nom de l’Ecole": school.name, [personLabel]: person?.name || '',
                "Formé": person?.trained ? 'Oui' : 'Non', "Année de Formation": person?.trained ? person.trainingYear : '',
                "Type de formation": person?.trained ? person.trainingType : '', "Contact": person?.contact || ''
            };
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);
        XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s/g, '_')}.xlsx`);
        addToast(`${title} exportés avec succès.`, 'success');
    };

    const handleImport = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
                const updatedItems = [...items];
                let updatedCount = 0;

                json.forEach((item, index) => {
                    const schoolName = item["Nom de l’Ecole"];
                    const schoolId = schoolNameMap.get(schoolName);
                    if (!schoolId) { console.warn(`École '${schoolName}' non trouvée. Ligne ${index + 2} ignorée.`); return; }
                    const trained = String(item["Formé"]).toLowerCase() === 'oui';
                    const parsedYear = parseInt(item["Année de Formation"], 10);
                    const personData = {
                        name: String(item[personLabel] || ''), contact: String(item["Contact"] || ''), trained,
                        trainingYear: trained ? (isNaN(parsedYear) ? '' : parsedYear) : '', trainingType: trained ? String(item["Type de formation"] || '') : '',
                    };
                    const existingPersonIndex = updatedItems.findIndex(p => p.schoolId === schoolId);
                    updatedCount++;
                    if (existingPersonIndex !== -1) {
                        updatedItems[existingPersonIndex] = { ...updatedItems[existingPersonIndex], ...personData };
                    } else {
                        updatedItems.push({ id: `${Date.now()}-${index}`, schoolId, ...personData } as T);
                    }
                });
                setItems(updatedItems);
                addToast(`${updatedCount} fiches de personnel importées et fusionnées.`, 'success');
            } catch (error) {
                console.error(`Erreur d'importation pour ${title}:`, error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">{title}</h3>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                <Button onClick={handleReset} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>Réinitialiser</Button>
            </div>
            {schools.length === 0 && <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">Veuillez d'abord ajouter une école dans la section "Ecoles".</p>}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th scope="col" className="px-4 py-3">N°</th>
                            <th scope="col" className="px-6 py-3">Nom de l’Ecole</th>
                            <th scope="col" className="px-6 py-3">{personLabel}</th>
                            <th scope="col" className="px-6 py-3 text-center">Formé</th>
                            <th scope="col" className="px-6 py-3">Année de Formation</th>
                            <th scope="col" className="px-6 py-3">Type de formation</th>
                            <th scope="col" className="px-6 py-3">Contact</th>
                            <th scope="col" className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSchools.map((school, index) => {
                            const person = itemsMap.get(school.id);
                            return (
                                <tr key={school.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                    <td className="px-4 py-2 font-medium text-[var(--color-text-heading)]">{index + 1}</td>
                                    <td className="px-6 py-2 font-semibold text-[var(--color-text-heading)]">{school.name}</td>
                                    <td className="px-6 py-2"><input type="text" value={person?.name || ''} onChange={e => handleStaffChange(school.id, 'name', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                    <td className="px-6 py-2 text-center"><input type="checkbox" checked={person?.trained || false} onChange={e => handleStaffChange(school.id, 'trained', e.target.checked)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-[var(--color-border-input)]" /></td>
                                    <td className="px-6 py-2"><input type="number" value={person?.trainingYear || ''} onChange={e => handleStaffChange(school.id, 'trainingYear', e.target.value)} onKeyDown={handleEnterNavigation} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" disabled={!person?.trained || isReadOnly} /></td>
                                    <td className="px-6 py-2"><input type="text" value={person?.trainingType || ''} onChange={e => handleStaffChange(school.id, 'trainingType', e.target.value)} onKeyDown={handleEnterNavigation} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" disabled={!person?.trained || isReadOnly} /></td>
                                    <td className="px-6 py-2"><input type="text" value={person?.contact || ''} onChange={e => handleStaffChange(school.id, 'contact', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                    <td className="px-6 py-2 text-center">
                                        {!isReadOnly && (<button onClick={() => clearStaff(school.id)} className="text-red-500 hover:text-red-700 p-1" title="Effacer les informations de cette personne"><TrashIcon className="h-5 w-5" /></button>)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default StaffTable;
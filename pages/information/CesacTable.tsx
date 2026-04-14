import React from 'react';
import type { CesacMember } from '../../types';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

const CesacTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { cesacMembers, setCesacMembers } = useAppContext();
    const { addToast } = useToast();
    
    const addItem = () => {
        const newItem: CesacMember = {
            id: `${Date.now()}`, name: '', matricule: '', contact: '', email: '',
            entryDate: '', seniority: 0, retirementDate: ''
        };
        setCesacMembers([...cesacMembers, newItem]);
    };
    const removeItem = (id: string) => setCesacMembers(cesacMembers.filter(item => item.id !== id));
    const handleReset = () => { if(window.confirm("Êtes-vous sûr de vouloir réinitialiser les membres CESAC ?")) setCesacMembers([]); };
    const handleInputChange = (id: string, field: keyof Omit<CesacMember, 'id'>, value: string) => {
        const processedValue = field === 'seniority' ? parseInt(value, 10) || 0 : value;
        setCesacMembers(cesacMembers.map(item => item.id === id ? { ...item, [field]: processedValue } : item));
    };
    
    const handleExport = () => {
        const dataToExport = cesacMembers.map((item) => {
            const row: Record<string, string | number> = {};
            Object.entries(headers).forEach(([key, label]) => {
                row[label] = item[key as keyof CesacMember] as string | number;
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CESAC");
        XLSX.writeFile(wb, "liste_cesac.xlsx");
        addToast("Liste des membres CESAC exportée.", 'success');
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
                const newItems: CesacMember[] = json.map((item, index) => ({
                    id: `${Date.now()}-${index}`, name: String(item.name || ''), matricule: String(item.matricule || ''),
                    contact: String(item.contact || ''), email: String(item.email || ''),
                    entryDate: item.entryDate instanceof Date ? item.entryDate.toISOString().split('T')[0] : '',
                    seniority: Number(item.seniority || 0),
                    retirementDate: item.retirementDate instanceof Date ? item.retirementDate.toISOString().split('T')[0] : '',
                }));
                setCesacMembers(prev => [...prev, ...newItems]);
                addToast(`${newItems.length} membres CESAC importés et ajoutés.`, 'success');
            } catch (error) {
                console.error(`Erreur d'importation pour CESAC:`, error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const headers = { name: "Nom et Prénom", matricule: "Matricule", contact: "Contact", email: "E-mail", entryDate: "Date d'entrée", seniority: "Ancienneté (ans)", retirementDate: "Date de retraite" };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)] mr-auto">Gestion CESAC</h3>
                <Button onClick={addItem} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={isReadOnly}>Ajouter</Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                <Button onClick={handleReset} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>Réinitialiser</Button>
                <div className="flex items-baseline gap-2 bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">TOTAL MEMBRES CESAC:</span>
                    <span className="text-xl font-bold text-[var(--color-primary)]">{cesacMembers.length}</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            {Object.values(headers).map(h => <th key={h} scope="col" className="px-6 py-3">{h}</th>)}
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cesacMembers.map(item => (
                            <tr key={item.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                {Object.keys(headers).map(key => (
                                    <td key={key} className="px-6 py-2">
                                        <input type={key === 'seniority' ? 'number' : (key === 'entryDate' || key === 'retirementDate') ? 'date': 'text'}
                                            value={item[key as keyof typeof item]} onChange={e => handleInputChange(item.id, key as keyof Omit<CesacMember, 'id'>, e.target.value)}
                                            onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent"/>
                                    </td>
                                ))}
                                <td className="px-6 py-2 text-center">
                                    {!isReadOnly && <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default CesacTable;
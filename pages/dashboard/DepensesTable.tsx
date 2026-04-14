import React, { useMemo } from 'react';
import type { Depense } from '../../types';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { generatePdf } from '../../utils/pdfGenerator';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

interface DepensesTableProps { isReadOnly?: boolean; }
const DepensesTable: React.FC<DepensesTableProps> = ({ isReadOnly = false }) => {
    const { depenses, setDepenses, ieppData, appSettings } = useAppContext();
    const { addToast } = useToast();
    
    const addRow = () => {
        const newRow: Depense = { id: `${Date.now()}`, date: new Date().toISOString().split('T')[0], designation: '', montant: 0 };
        setDepenses([...depenses, newRow]);
    };
    const removeRow = (id: string) => setDepenses(depenses.filter(d => d.id !== id));
    const handleInputChange = (id: string, field: keyof Omit<Depense, 'id'>, value: string) => {
        const processedValue = field === 'montant' ? parseFloat(value) || 0 : value;
        setDepenses(depenses.map(d => d.id === id ? { ...d, [field]: processedValue } : d));
    };

    const totalDepenses = useMemo(() => 
        depenses.reduce((sum, depense) => sum + depense.montant, 0),
    [depenses]);

    const handleExport = () => {
        const dataToExport = depenses.map((depense) => ({
            "Date": depense.date,
            "Désignation": depense.designation,
            "Montant": depense.montant
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Depenses");
        XLSX.writeFile(wb, "depenses.xlsx");
        addToast("Dépenses exportées avec succès.", 'success');
    };

    const handlePdfExport = () => {
        const head = [['Date', 'Désignation', 'Montant']];
        const body = depenses.map(d => [d.date, d.designation, `${d.montant.toLocaleString('fr-FR')} ${appSettings.currencySymbol}`]);
        generatePdf(
            'LISTE DES DEPENSES',
            head,
            body,
            ieppData,
            { filename: 'liste_depenses' }
        );
        addToast("PDF généré avec succès.", 'success');
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
                
                const newDepenses: Depense[] = json.map((item, index) => ({
                    id: `${Date.now()}-${index}`,
                    date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    designation: String(item.designation || ''),
                    montant: Number(item.montant || 0),
                }));

                setDepenses(prev => [...prev, ...newDepenses]);
                addToast(`${newDepenses.length} lignes importées et ajoutées.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Gestion des Dépenses</h3>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                 <Button onClick={addRow} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={isReadOnly}>
                    Ajouter
                </Button>
                 <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter (Excel)
                </Button>
                <Button onClick={handlePdfExport} variant="secondary" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter (PDF)
                </Button>
                 <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>
                    Importer
                </Button>
                 <Button onClick={() => setDepenses([])} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>
                    Réinitialiser
                </Button>
                <div className="ml-auto flex items-baseline gap-2 bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">TOTAL DÉPENSES:</span>
                    <span className="text-xl font-bold text-[var(--color-primary)]">
                        {totalDepenses.toLocaleString('fr-FR')} {appSettings.currencySymbol}
                    </span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-1/5">Date</th>
                            <th scope="col" className="px-6 py-3 w-3/5">Désignation</th>
                            <th scope="col" className="px-6 py-3 w-1/5 text-right">Montant</th>
                            <th scope="col" className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {depenses.map(depense => (
                            <tr key={depense.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                <td className="px-6 py-2"><input type="date" value={depense.date} onChange={e => handleInputChange(depense.id, 'date', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="text" value={depense.designation} onChange={e => handleInputChange(depense.id, 'designation', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" value={depense.montant} onChange={e => handleInputChange(depense.id, 'montant', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent text-right" /></td>
                                <td className="px-6 py-2 text-center"><button onClick={() => removeRow(depense.id)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default DepensesTable;
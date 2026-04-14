import React from 'react';
import type { IEPPData } from '../../types';
import { ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

const ieppFieldLabels: Record<keyof IEPPData, string> = {
    ministry: "Ministère",
    regionalDirection: "Direction Régionale",
    iepp: "IEPP",
    schoolYear: "Année Scolaire",
    postalBox: "Boîte Postale",
    phone: "Téléphone",
    email: "E-mail",
    refIEPP: "N° Réf. IEPP",
    foodType: "Type de vivres",
    distributionPeriod: "Période de Distribution",
    distributionReportDate: "Date du Rapport de Distribution",
    firstPreparationDate: "Date de la première préparation",
    operatingDays: "Jours de fonctionnement",
    inspectorName: "Nom de l'Inspecteur",
    advisorName: "Nom du Conseiller",
    bankName: "Nom de la Banque",
    accountNumber: "Numéro de Compte",
    initialBalance: "Solde Initial du compte",
};

const IEPPForm: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { ieppData, setIeppData } = useAppContext();
    const { addToast } = useToast();

    const handleInputChange = (field: keyof IEPPData, value: string) => {
        const numericFields: (keyof IEPPData)[] = ['operatingDays', 'initialBalance'];
        const processedValue = numericFields.includes(field) ? Number(value) : value;
        setIeppData(prev => ({ ...prev, [field]: processedValue }));
    };
    
    const handleReset = () => {
        if (window.confirm("Êtes-vous sûr de vouloir réinitialiser toutes les informations de l'IEPP ?")) {
            const defaultIeppData: IEPPData = {
                ministry: '', regionalDirection: '', iepp: '', schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                postalBox: '', phone: '', email: '', refIEPP: '', foodType: 'GVT', distributionPeriod: '',
                distributionReportDate: '', firstPreparationDate: new Date().toISOString().split('T')[0], operatingDays: 0, inspectorName: '',
                advisorName: '', bankName: '', accountNumber: '', initialBalance: 0,
            };
            setIeppData(defaultIeppData);
            addToast("Informations IEPP réinitialisées.", 'info');
        }
    };
    
    const handleExport = () => {
        const dataToExport = [Object.fromEntries(Object.entries(ieppData).map(([key, value]) => [ieppFieldLabels[key as keyof IEPPData] || key, value]))];
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "IEPP");
        XLSX.writeFile(wb, "informations_iepp.xlsx");
        addToast("Informations IEPP exportées.", 'success');
    };

    const handleImport = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);

                if (json.length > 0) {
                    const importedRow = json[0];
                    const importedData: Partial<IEPPData> = {};
                    const labelsToFields = Object.fromEntries(Object.entries(ieppFieldLabels).map(([key, value]) => [value, key]));

                    for (const label in importedRow) {
                        const field = labelsToFields[label] as keyof IEPPData;
                        if (field) {
                            (importedData as Record<string, string | number>)[field] = importedRow[label];
                        }
                    }
                    
                    setIeppData(prev => ({ ...prev, ...importedData }));
                    addToast("Informations IEPP importées.", 'success');
                }
            } catch (error) {
                console.error("Erreur d'importation IEPP:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)] mr-auto">Informations de l'Inspection</h3>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                <Button onClick={handleReset} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>Réinitialiser</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.keys(ieppFieldLabels) as Array<keyof IEPPData>).map(field => (
                    <div key={field}>
                        <label htmlFor={field} className="block text-sm font-medium text-[var(--color-text-muted)]">{ieppFieldLabels[field]}</label>
                        {field === 'foodType' ? (
                            <select id={field} value={ieppData[field]} onChange={e => handleInputChange(field, e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md">
                                <option value="GVT">GVT</option>
                                <option value="Autres">Autres</option>
                            </select>
                        ) : (
                            <input 
                                type={(typeof ieppData[field] === 'number') ? 'number' : (field.toLowerCase().includes('date') ? 'date' : 'text')}
                                id={field}
                                value={ieppData[field] as string | number}
                                onChange={e => handleInputChange(field, e.target.value)}
                                onKeyDown={handleEnterNavigation}
                                disabled={isReadOnly}
                                className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IEPPForm;
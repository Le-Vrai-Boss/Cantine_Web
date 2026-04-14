import React, { useMemo } from 'react';
import type { CepeResult } from '../../types';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

const CepeResultsTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { cepeResults, setCepeResults, schools, ieppData, classEnrollments } = useAppContext();
    const { addToast } = useToast();
    const schoolMap = useMemo(() => new Map(schools.map(s => [s.id, s.name])), [schools]);
    const schoolNameMap = useMemo(() => new Map(schools.map(s => [s.name, s.id])), [schools]);
    const classEnrollmentMap = useMemo(() => new Map(classEnrollments.map(e => [e.schoolId, e])), [classEnrollments]);
    const currentSchoolYear = ieppData.schoolYear;

    const schoolYears = useMemo(() => {
        const years = new Set(cepeResults.map(r => r.schoolYear));
        if (ieppData.schoolYear) years.add(ieppData.schoolYear);
        return Array.from(years).sort().reverse();
    }, [cepeResults, ieppData.schoolYear]);
    
    const combinedData = useMemo(() => {
        const historicalData = cepeResults.filter(r => r.schoolYear !== currentSchoolYear);
        const currentYearData = schools.map(school => {
            const existingResult = cepeResults.find(r => r.schoolId === school.id && r.schoolYear === currentSchoolYear);
            const enrollment = classEnrollmentMap.get(school.id);
            const defaultCandidates = (enrollment?.cm2_filles || 0) + (enrollment?.cm2_garcons || 0);
            return {
                id: existingResult?.id || `synced-${school.id}`, schoolId: school.id, schoolYear: currentSchoolYear,
                candidates: existingResult ? existingResult.candidates : defaultCandidates, admitted: existingResult?.admitted || 0, isSynced: true,
            };
        });
        return [...historicalData, ...currentYearData].sort((a, b) => {
             if (b.schoolYear !== a.schoolYear) return b.schoolYear.localeCompare(a.schoolYear);
            return (schoolMap.get(a.schoolId) || '').localeCompare(schoolMap.get(b.schoolId) || '');
        });
    }, [cepeResults, schools, classEnrollmentMap, currentSchoolYear, schoolMap]);

    const addItem = () => {
        const previousYearPart1 = parseInt(currentSchoolYear.split('-')[0]) - 1;
        const previousYear = `${previousYearPart1}-${previousYearPart1 + 1}`;
        const newResult: CepeResult = { id: `${Date.now()}`, schoolId: schools.length > 0 ? schools[0].id : '', schoolYear: previousYear, candidates: 0, admitted: 0 };
        setCepeResults([...cepeResults, newResult]);
    };

    const removeItem = (id: string) => {
        if (id.startsWith('synced-')) return;
        setCepeResults(cepeResults.filter(item => item.id !== id));
    };

    const handleInputChange = (id: string, schoolId: string, schoolYear: string, field: keyof Omit<CepeResult, 'id'>, value: string) => {
        setCepeResults(prev => {
            const existingIndex = prev.findIndex(r => r.schoolId === schoolId && r.schoolYear === schoolYear);
            const numericFields: (keyof CepeResult)[] = ['candidates', 'admitted'];
            const processedValue = (numericFields as string[]).includes(field as string) ? parseInt(value, 10) || 0 : value;
            if (existingIndex > -1) {
                const updated = [...prev]; updated[existingIndex] = { ...updated[existingIndex], [field]: processedValue }; return updated;
            } else if (id.startsWith('synced-')) {
                const enrollment = classEnrollmentMap.get(schoolId);
                const defaultCandidates = (enrollment?.cm2_filles || 0) + (enrollment?.cm2_garcons || 0);
                const newEntry: CepeResult = { id: `${Date.now()}`, schoolId: schoolId, schoolYear: currentSchoolYear, candidates: defaultCandidates, admitted: 0, [field]: processedValue };
                return [...prev, newEntry];
            } else {
                 const updated = [...prev]; const itemIndex = updated.findIndex(item => item.id === id);
                 if (itemIndex !== -1) updated[itemIndex] = { ...updated[itemIndex], [field]: processedValue };
                 return updated;
            }
        });
    };
    
    const handleReset = () => { if (window.confirm("Êtes-vous sûr de vouloir réinitialiser tous les résultats du CEPE ?")) setCepeResults([]); };

    const handleExport = () => {
        const dataToExport = combinedData.map(r => ({ "Année Scolaire": r.schoolYear, "École": schoolMap.get(r.schoolId) || 'N/A', "Candidats": r.candidates, "Admis": r.admitted, "Taux de Réussite (%)": r.candidates > 0 ? ((r.admitted / r.candidates) * 100).toFixed(2) : '0.00' }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Resultats CEPE");
        XLSX.writeFile(wb, "resultats_cepe.xlsx");
        addToast("Résultats CEPE exportés.", 'success');
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
                const newItems: CepeResult[] = json.map((item, index) => {
                    const schoolId = schoolNameMap.get(item["École"]);
                    if (!schoolId) { console.warn(`École non trouvée: ${item["École"]}`); return null; }
                    return { id: `${Date.now()}-${index}`, schoolYear: String(item["Année Scolaire"] || ''), schoolId, candidates: Number(item["Candidats"] || 0), admitted: Number(item["Admis"] || 0) };
                }).filter((item): item is CepeResult => item !== null);
                setCepeResults(prev => [...prev, ...newItems]);
                addToast(`${newItems.length} résultats importés et ajoutés.`, 'success');
            } catch (error) {
                console.error(`Erreur d'importation pour les résultats CEPE:`, error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Gestion des Résultats au CEPE</h3>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={addItem} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={schools.length === 0 || isReadOnly}>Ajouter (Année Précédente)</Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                <Button onClick={handleReset} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>Réinitialiser</Button>
            </div>
            {schools.length === 0 && <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">Veuillez d'abord ajouter une école.</p>}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th scope="col" className="px-6 py-3">Année Scolaire</th><th scope="col" className="px-6 py-3">École</th>
                            <th scope="col" className="px-6 py-3">Candidats</th><th scope="col" className="px-6 py-3">Admis</th>
                            <th scope="col" className="px-6 py-3">Taux de réussite</th><th scope="col" className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {combinedData.map(item => {
                            const isSynced = (item as { isSynced?: boolean }).isSynced;
                            const isRowReadOnly = isReadOnly || isSynced;
                            return (
                                <tr key={item.id} className={`border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle ${isSynced ? 'bg-blue-50 text-[var(--color-text-muted)]' : ''}`}>
                                    <td className="px-6 py-2">
                                        <input type="text" list="school-years-cepe" value={item.schoolYear} onChange={e => handleInputChange(item.id, item.schoolId, item.schoolYear, 'schoolYear', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isRowReadOnly} className="w-32 p-1 border rounded-md bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed border-[var(--color-border-input)]"/>
                                        <datalist id="school-years-cepe">{schoolYears.map(year => <option key={year} value={year} />)}</datalist>
                                    </td>
                                    <td className="px-6 py-2">
                                        <select value={item.schoolId} onChange={e => handleInputChange(item.id, item.schoolId, item.schoolYear, 'schoolId', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isRowReadOnly} className="w-48 p-1.5 border rounded-md bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed border-[var(--color-border-input)]">
                                            {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-2"><input type="number" value={item.candidates} onChange={e => handleInputChange(item.id, item.schoolId, item.schoolYear, 'candidates', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border rounded-md bg-transparent disabled:bg-transparent disabled:border-slate-300 border-[var(--color-border-input)]" /></td>
                                    <td className="px-6 py-2"><input type="number" value={item.admitted} onChange={e => handleInputChange(item.id, item.schoolId, item.schoolYear, 'admitted', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border rounded-md bg-transparent disabled:bg-transparent disabled:border-slate-300 border-[var(--color-border-input)]" /></td>
                                    <td className="px-6 py-2 font-semibold">{item.candidates > 0 ? `${((item.admitted / item.candidates) * 100).toFixed(2)}%` : 'N/A'}</td>
                                    <td className="px-6 py-2 text-center">
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isRowReadOnly}><TrashIcon className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default CepeResultsTable;
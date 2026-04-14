import React, { useMemo } from 'react';
import type { HistoricalEnrollment } from '../../types';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

const HistoricalEnrollmentTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { historicalEnrollments, setHistoricalEnrollments, schools, ieppData } = useAppContext();
    const { addToast } = useToast();
    const schoolMap = useMemo(() => new Map(schools.map(s => [s.id, s.name])), [schools]);
    const schoolNameMap = useMemo(() => new Map(schools.map(s => [s.name, s.id])), [schools]);

    const currentSchoolYear = ieppData.schoolYear;

    type CombinedEnrollment = HistoricalEnrollment & { isSynced?: boolean };

    const combinedEnrollments: CombinedEnrollment[] = useMemo(() => {
        const syncedDataFromSchools: CombinedEnrollment[] = schools.map(school => ({
            id: `synced-${school.id}`, schoolId: school.id, schoolYear: currentSchoolYear,
            studentsGirls: school.studentsGirls, studentsBoys: school.studentsBoys,
            rationnaireGirls: school.rationnaireGirls, rationnaireBoys: school.rationnaireBoys, isSynced: true,
        }));
        const manualHistoricalData = historicalEnrollments.filter(h => h.schoolYear !== currentSchoolYear);
        return [...syncedDataFromSchools, ...manualHistoricalData].sort((a, b) => {
            if (b.schoolYear !== a.schoolYear) return b.schoolYear.localeCompare(a.schoolYear);
            return (schoolMap.get(a.schoolId) || '').localeCompare(schoolMap.get(b.schoolId) || '');
        });
    }, [schools, historicalEnrollments, currentSchoolYear, schoolMap]);
    
    const schoolYears = useMemo(() => {
        const years = new Set(historicalEnrollments.map(r => r.schoolYear));
        if (ieppData.schoolYear) years.add(ieppData.schoolYear);
        return Array.from(years).sort().reverse();
    }, [historicalEnrollments, ieppData.schoolYear]);

    const addItem = () => {
        const previousYearPart1 = parseInt(currentSchoolYear.split('-')[0]) - 1;
        const previousYear = `${previousYearPart1}-${previousYearPart1 + 1}`;
        const newItem: HistoricalEnrollment = {
            id: `${Date.now()}`, schoolId: schools.length > 0 ? schools[0].id : '', schoolYear: previousYear,
            studentsGirls: 0, studentsBoys: 0, rationnaireGirls: 0, rationnaireBoys: 0
        };
        setHistoricalEnrollments([...historicalEnrollments, newItem]);
    };

    const removeItem = (id: string) => {
        if (id.startsWith('synced-')) return;
        setHistoricalEnrollments(historicalEnrollments.filter(item => item.id !== id));
    };

    const handleInputChange = (id: string, field: keyof Omit<HistoricalEnrollment, 'id'>, value: string) => {
        const numericFields: (keyof HistoricalEnrollment)[] = ['studentsGirls', 'studentsBoys', 'rationnaireGirls', 'rationnaireBoys'];
        const processedValue = (numericFields as string[]).includes(field as string) ? parseInt(value, 10) || 0 : value;
        setHistoricalEnrollments(historicalEnrollments.map(item => item.id === id ? { ...item, [field]: processedValue } : item));
    };
    
    const handleReset = () => {
        if (window.confirm("Êtes-vous sûr de vouloir réinitialiser tous les effectifs historiques ?")) {
            setHistoricalEnrollments([]);
        }
    };

    const handleExport = () => {
        const dataToExport = combinedEnrollments.map(r => ({
            "Année Scolaire": r.schoolYear, "École": schoolMap.get(r.schoolId) || 'N/A',
            "Effectif École Filles": r.studentsGirls, "Effectif École Garçons": r.studentsBoys, "Effectif Total École": r.studentsGirls + r.studentsBoys,
            "Effectif Rationnaire Filles": r.rationnaireGirls, "Effectif Rationnaire Garçons": r.rationnaireBoys, "Effectif Total Rationnaire": r.rationnaireGirls + r.rationnaireBoys,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Effectifs Historique");
        XLSX.writeFile(wb, "effectifs_historique.xlsx");
        addToast("Effectifs historiques exportés.", 'success');
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
                const newItems: HistoricalEnrollment[] = json
                    .filter(item => String(item["Année Scolaire"] || '') !== currentSchoolYear)
                    .map((item, index) => {
                        const schoolId = schoolNameMap.get(item["École"]);
                        if (!schoolId) { console.warn(`École non trouvée: ${item["École"]}`); return null; }
                        return {
                            id: `${Date.now()}-${index}`, schoolYear: String(item["Année Scolaire"] || ''), schoolId,
                            studentsGirls: Number(item["Effectif École Filles"] || 0), studentsBoys: Number(item["Effectif École Garçons"] || 0),
                            rationnaireGirls: Number(item["Effectif Rationnaire Filles"] || 0), rationnaireBoys: Number(item["Effectif Rationnaire Garçons"] || 0),
                        };
                }).filter((item): item is HistoricalEnrollment => item !== null);
                setHistoricalEnrollments(prev => [...prev.filter(item => item.schoolYear !== currentSchoolYear), ...newItems]);
                addToast(`${newItems.length} enregistrements importés et ajoutés.`, 'success');
            } catch (error) {
                console.error(`Erreur d'importation des effectifs historiques:`, error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Gestion des Effectifs Historiques</h3>
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
                            <th scope="col" className="px-6 py-3">Élèves Filles</th><th scope="col" className="px-6 py-3">Élèves Garçons</th>
                            <th scope="col" className="px-6 py-3">Ration. Filles</th><th scope="col" className="px-6 py-3">Ration. Garçons</th>
                            <th scope="col" className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {combinedEnrollments.map(item => {
                            const isSynced = item.isSynced || item.schoolYear === currentSchoolYear;
                            const isRowReadOnly = isReadOnly || isSynced;
                            return (
                                <tr key={item.id} className={`border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle ${isSynced ? 'bg-blue-50 text-[var(--color-text-muted)]' : ''}`}>
                                    <td className="px-6 py-2">
                                        <input type="text" list="school-years-hist" value={item.schoolYear} onChange={e => handleInputChange(item.id, 'schoolYear', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isRowReadOnly} className="w-32 p-1 border rounded-md bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed border-[var(--color-border-input)]"/>
                                        <datalist id="school-years-hist">{schoolYears.map(year => <option key={year} value={year} />)}</datalist>
                                    </td>
                                    <td className="px-6 py-2">
                                        <select value={item.schoolId} onChange={e => handleInputChange(item.id, 'schoolId', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isRowReadOnly} className="w-48 p-1.5 border rounded-md bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed border-[var(--color-border-input)]">
                                            {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-2"><input type="number" value={item.studentsGirls} onChange={e => handleInputChange(item.id, 'studentsGirls', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isRowReadOnly} className="w-24 p-1 border rounded-md bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed border-[var(--color-border-input)]" /></td>
                                    <td className="px-6 py-2"><input type="number" value={item.studentsBoys} onChange={e => handleInputChange(item.id, 'studentsBoys', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isRowReadOnly} className="w-24 p-1 border rounded-md bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed border-[var(--color-border-input)]" /></td>
                                    <td className="px-6 py-2"><input type="number" value={item.rationnaireGirls} onChange={e => handleInputChange(item.id, 'rationnaireGirls', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isRowReadOnly} className="w-24 p-1 border rounded-md bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed border-[var(--color-border-input)]" /></td>
                                    <td className="px-6 py-2"><input type="number" value={item.rationnaireBoys} onChange={e => handleInputChange(item.id, 'rationnaireBoys', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isRowReadOnly} className="w-24 p-1 border rounded-md bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed border-[var(--color-border-input)]" /></td>
                                    <td className="px-6 py-2 text-center">
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isRowReadOnly}><TrashIcon className="h-5 w-5" /></button>
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
export default HistoricalEnrollmentTable;
import React, { useMemo } from 'react';
import type { School } from '../../types';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

const EcolesTable: React.FC<{ isReadOnly?: boolean; currentUserLevel: number | null }> = ({ isReadOnly = false, currentUserLevel }) => {
    const { 
        schools, setSchools,
        setDirectors, setGerants, setCantinieres, setCogesMembers,
        setClassEnrollments, setInfrastructures, setSchoolFoodSupplies,
        setSchoolPreparationDays, setVerificationData, setCepeResults,
        setHistoricalEnrollments, setAttendanceData,
        logAction
    } = useAppContext();
    const { addToast } = useToast();
    
    const sortedSchools = useMemo(() => [...schools].sort((a, b) => a.name.localeCompare(b.name)), [schools]);

    const addSchool = () => {
        const newSchoolName = `Nouvelle École ${schools.length + 1}`;
        const newSchool: School = {
            id: `${Date.now()}`, name: newSchoolName, code: '', openingYear: new Date().getFullYear(), canteenOpeningYear: new Date().getFullYear(), studentsGirls: 0, studentsBoys: 0, rationnaireGirls: 0, rationnaireBoys: 0,
        };
        setSchools([...schools, newSchool]);
        logAction(`Ajout de l'école : '${newSchoolName}'`, currentUserLevel);
    };

    const removeSchool = (idToRemove: string) => {
        const schoolToRemove = schools.find(s => s.id === idToRemove);
        if (!schoolToRemove) return;

        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'école "${schoolToRemove.name}" ? Toutes les données associées (personnel, effectifs, etc.) seront également supprimées de façon permanente.`)) {
            return;
        }
        
        logAction(`Suppression de l'école '${schoolToRemove.name}' et de toutes ses données.`, currentUserLevel);

        setSchools(prev => prev.filter(s => s.id !== idToRemove));
        setDirectors(prev => prev.filter(p => p.schoolId !== idToRemove));
        setGerants(prev => prev.filter(p => p.schoolId !== idToRemove));
        setCantinieres(prev => prev.filter(p => p.schoolId !== idToRemove));
        setCogesMembers(prev => prev.filter(p => p.schoolId !== idToRemove));
        setClassEnrollments(prev => prev.filter(e => e.schoolId !== idToRemove));
        setInfrastructures(prev => prev.filter(i => i.schoolId !== idToRemove));
        setSchoolFoodSupplies(prev => prev.filter(sfs => sfs.schoolId !== idToRemove));
        setCepeResults(prev => prev.filter(r => r.schoolId !== idToRemove));
        setHistoricalEnrollments(prev => prev.filter(h => h.schoolId !== idToRemove));
        setSchoolPreparationDays(prev => { const newState = { ...prev }; delete newState[idToRemove]; return newState; });
        setVerificationData(prev => { const newState = { ...prev }; delete newState[idToRemove]; return newState; });
        setAttendanceData(prev => { const newState = { ...prev }; delete newState[idToRemove]; return newState; });
        
        addToast("L'école et toutes ses données associées ont été supprimées.", 'info');
    };

    const handleInputChange = (id: string, field: keyof Omit<School, 'id'>, value: string) => {
        const numericFields: (keyof School)[] = ['openingYear', 'canteenOpeningYear', 'studentsGirls', 'studentsBoys', 'rationnaireGirls', 'rationnaireBoys'];
        const processedValue = (numericFields as string[]).includes(field as string) ? parseInt(value, 10) || 0 : value;
        setSchools(schools.map(school => school.id === id ? { ...school, [field]: processedValue } : school));
    };
    
    const handleReset = () => {
        if (window.confirm("Êtes-vous sûr de vouloir réinitialiser toutes les écoles et leurs données associées ?")) {
            setSchools([]);
            setDirectors([]);
            setGerants([]);
            setCantinieres([]);
            setCogesMembers([]);
            setClassEnrollments([]);
            setInfrastructures([]);
            setSchoolFoodSupplies([]);
            setSchoolPreparationDays({});
            setVerificationData({});
            setCepeResults([]);
            setHistoricalEnrollments([]);
            setAttendanceData({});
            addToast("Toutes les écoles et les données associées ont été réinitialisées.", 'info');
        }
    };

    const handleExport = () => {
        const dataToExport = sortedSchools.map((school, index) => ({
            "N°": index + 1, "Nom de l’Ecole": school.name, "Code Ecole": school.code, "Année d’ouverture de l’Ecole": school.openingYear, "Année d’ouverture de la cantine": school.canteenOpeningYear,
            "Effectif Ecole Filles": school.studentsGirls, "Effectif Ecole Garçons": school.studentsBoys, "Effectif Total Ecole": school.studentsGirls + school.studentsBoys,
            "Effectif Rationnaire Filles": school.rationnaireGirls, "Effectif Rationnaire Garçons": school.rationnaireBoys, "Effectif Total Rationnaire": school.rationnaireGirls + school.rationnaireBoys,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ecoles");
        XLSX.writeFile(wb, "liste_ecoles.xlsx");
        addToast("Liste des écoles exportée.", 'success');
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
                
                const newSchools: School[] = json.map((item, index) => ({
                    id: `${Date.now()}-${index}`, name: String(item["Nom de l’Ecole"] || ''), code: String(item["Code Ecole"] || ''),
                    openingYear: Number(item["Année d’ouverture de l’Ecole"] || new Date().getFullYear()), canteenOpeningYear: Number(item["Année d’ouverture de la cantine"] || new Date().getFullYear()),
                    studentsGirls: Number(item["Effectif Ecole Filles"] || 0), studentsBoys: Number(item["Effectif Ecole Garçons"] || 0),
                    rationnaireGirls: Number(item["Effectif Rationnaire Filles"] || 0), rationnaireBoys: Number(item["Effectif Rationnaire Garçons"] || 0),
                }));

                setSchools(prev => [...prev, ...newSchools]);
                addToast(`'${file.name}' importé. ${newSchools.length} écoles ajoutées.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation Ecoles:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                 <h3 className="text-xl font-bold text-[var(--color-text-heading)] mr-auto">Liste des Écoles</h3>
                 <Button onClick={addSchool} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={isReadOnly}>Ajouter</Button>
                 <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                 <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                 <Button onClick={handleReset} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>Réinitialiser</Button>
                 <div className="flex items-baseline gap-2 bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">TOTAL ÉCOLES:</span>
                    <span className="text-xl font-bold text-[var(--color-primary)]">{schools.length}</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1600px] text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th scope="col" className="px-4 py-3">N°</th>
                            <th scope="col" className="px-6 py-3">Nom de l’Ecole</th>
                            <th scope="col" className="px-6 py-3">Code Ecole</th>
                            <th scope="col" className="px-6 py-3">Année Ouverture Ecole</th>
                            <th scope="col" className="px-6 py-3">Année Ouverture Cantine</th>
                            <th scope="col" className="px-6 py-3">Élèves Filles</th>
                            <th scope="col" className="px-6 py-3">Élèves Garçons</th>
                            <th scope="col" className="px-6 py-3">Total Élèves</th>
                            <th scope="col" className="px-6 py-3">Rationnaires Filles</th>
                            <th scope="col" className="px-6 py-3">Rationnaires Garçons</th>
                            <th scope="col" className="px-6 py-3">Total Rationnaires</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSchools.map((school, index) => (
                            <tr key={school.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                <td className="px-4 py-2 font-medium text-[var(--color-text-heading)]">{index + 1}</td>
                                <td className="px-6 py-2"><input type="text" value={school.name} onChange={e => handleInputChange(school.id, 'name', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="text" value={school.code} onChange={e => handleInputChange(school.id, 'code', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" value={school.openingYear} onChange={e => handleInputChange(school.id, 'openingYear', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" value={school.canteenOpeningYear} onChange={e => handleInputChange(school.id, 'canteenOpeningYear', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" value={school.studentsGirls} onChange={e => handleInputChange(school.id, 'studentsGirls', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" value={school.studentsBoys} onChange={e => handleInputChange(school.id, 'studentsBoys', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2 font-semibold">{school.studentsGirls + school.studentsBoys}</td>
                                <td className="px-6 py-2"><input type="number" value={school.rationnaireGirls} onChange={e => handleInputChange(school.id, 'rationnaireGirls', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" value={school.rationnaireBoys} onChange={e => handleInputChange(school.id, 'rationnaireBoys', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2 font-semibold">{school.rationnaireGirls + school.rationnaireBoys}</td>
                                <td className="px-6 py-2">
                                    {!isReadOnly && (
                                        <button onClick={() => removeSchool(school.id)} className="text-red-500 hover:text-red-700 p-1">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EcolesTable;
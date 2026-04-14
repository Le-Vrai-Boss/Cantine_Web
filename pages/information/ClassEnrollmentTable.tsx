import React, { useMemo } from 'react';
import type { ClassEnrollment } from '../../types';
import { ExportIcon, ImportIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

export const ClassEnrollmentTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { schools, classEnrollments, setClassEnrollments } = useAppContext();
    const { addToast } = useToast();
    const sortedSchools = useMemo(() => [...schools].sort((a, b) => a.name.localeCompare(b.name)), [schools]);
    const enrollmentsMap = useMemo(() => new Map(classEnrollments.map(e => [e.schoolId, e])), [classEnrollments]);

    const levels = ['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2'];
    const levelLabels = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];

    const handleInputChange = (schoolId: string, field: keyof Omit<ClassEnrollment, 'schoolId'>, value: string) => {
        const numValue = parseInt(value, 10) || 0;
        setClassEnrollments(prev => {
            const existing = prev.find(e => e.schoolId === schoolId);
            if (existing) {
                return prev.map(e => e.schoolId === schoolId ? { ...e, [field]: numValue } : e);
            } else {
                const newEnrollment: ClassEnrollment = {
                    schoolId, cp1_filles: 0, cp1_garcons: 0, cp2_filles: 0, cp2_garcons: 0,
                    ce1_filles: 0, ce1_garcons: 0, ce2_filles: 0, ce2_garcons: 0, cm1_filles: 0, cm1_garcons: 0, cm2_filles: 0, cm2_garcons: 0, [field]: numValue
                };
                return [...prev, newEnrollment];
            }
        });
    };

    const handleExport = () => {
        const dataToExport = sortedSchools.map((school, index) => {
            const enrollment = enrollmentsMap.get(school.id) || { cp1_filles: 0, cp1_garcons: 0, cp2_filles: 0, cp2_garcons: 0, ce1_filles: 0, ce1_garcons: 0, ce2_filles: 0, ce2_garcons: 0, cm1_filles: 0, cm1_garcons: 0, cm2_filles: 0, cm2_garcons: 0 };
            return {
                "N°": index + 1, "Nom de l’Ecole": school.name,
                "Effectif Filles CP1": enrollment.cp1_filles, "Effectif Garçons CP1": enrollment.cp1_garcons, "Effectif Total CP1": enrollment.cp1_filles + enrollment.cp1_garcons,
                "Effectif Filles CP2": enrollment.cp2_filles, "Effectif Garçons CP2": enrollment.cp2_garcons, "Effectif Total CP2": enrollment.cp2_filles + enrollment.cp2_garcons,
                "Effectif Filles CE1": enrollment.ce1_filles, "Effectif Garçons CE1": enrollment.ce1_garcons, "Effectif Total CE1": enrollment.ce1_filles + enrollment.ce1_garcons,
                "Effectif Filles CE2": enrollment.ce2_filles, "Effectif Garçons CE2": enrollment.ce2_garcons, "Effectif Total CE2": enrollment.ce2_filles + enrollment.ce2_garcons,
                "Effectif Filles CM1": enrollment.cm1_filles, "Effectif Garçons CM1": enrollment.cm1_garcons, "Effectif Total CM1": enrollment.cm1_filles + enrollment.cm1_garcons,
                "Effectif Filles CM2": enrollment.cm2_filles, "Effectif Garçons CM2": enrollment.cm2_garcons, "Effectif Total CM2": enrollment.cm2_filles + enrollment.cm2_garcons,
            };
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Effectifs Classes");
        XLSX.writeFile(wb, "effectifs_classes.xlsx");
        addToast("Effectifs par classe exportés.", 'success');
    };

    const handleImport = (file: File) => {
        const schoolNameMap = new Map(schools.map(s => [s.name.toLowerCase(), s.id]));
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
                const updatedEnrollments = new Map(classEnrollments.map(item => [item.schoolId, {...item}]));
                let updatedCount = 0;

                json.forEach(item => {
                    const schoolName = String(item["Nom de l’Ecole"] || '').toLowerCase();
                    const schoolId = schoolNameMap.get(schoolName);
                    if (schoolId) {
                        updatedCount++;
                        // FIX: Provide a full default object to satisfy the ClassEnrollment type when an entry is not found.
                        const enrollment: ClassEnrollment = updatedEnrollments.get(schoolId) || { 
                            schoolId, cp1_filles: 0, cp1_garcons: 0, cp2_filles: 0, cp2_garcons: 0, 
                            ce1_filles: 0, ce1_garcons: 0, ce2_filles: 0, ce2_garcons: 0, cm1_filles: 0, cm1_garcons: 0, cm2_filles: 0, cm2_garcons: 0 
                        };
                        enrollment.cp1_filles = Number(item["Effectif Filles CP1"] || enrollment.cp1_filles);
                        enrollment.cp1_garcons = Number(item["Effectif Garçons CP1"] || enrollment.cp1_garcons);
                        enrollment.cp2_filles = Number(item["Effectif Filles CP2"] || enrollment.cp2_filles);
                        enrollment.cp2_garcons = Number(item["Effectif Garçons CP2"] || enrollment.cp2_garcons);
                        enrollment.ce1_filles = Number(item["Effectif Filles CE1"] || enrollment.ce1_filles);
                        enrollment.ce1_garcons = Number(item["Effectif Garçons CE1"] || enrollment.ce1_garcons);
                        enrollment.ce2_filles = Number(item["Effectif Filles CE2"] || enrollment.ce2_filles);
                        enrollment.ce2_garcons = Number(item["Effectif Garçons CE2"] || enrollment.ce2_garcons);
                        enrollment.cm1_filles = Number(item["Effectif Filles CM1"] || enrollment.cm1_filles);
                        enrollment.cm1_garcons = Number(item["Effectif Garçons CM1"] || enrollment.cm1_garcons);
                        enrollment.cm2_filles = Number(item["Effectif Filles CM2"] || enrollment.cm2_filles);
                        enrollment.cm2_garcons = Number(item["Effectif Garçons CM2"] || enrollment.cm2_garcons);
                        updatedEnrollments.set(schoolId, enrollment);
                    }
                });

                setClassEnrollments(Array.from(updatedEnrollments.values()));
                addToast(`'${file.name}' importé. ${updatedCount} fiches d'effectifs mises à jour.`, 'success');

            } catch (error) {
                console.error("Erreur d'importation Effectifs:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Effectifs par Classe</h3>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
            </div>
             {schools.length === 0 && <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">Veuillez d'abord ajouter une école.</p>}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th rowSpan={2} className="px-2 py-3 border-b border-[var(--color-border-base)] align-middle text-center sticky left-0 bg-[var(--color-bg-muted)] z-10">N°</th>
                            <th rowSpan={2} className="px-4 py-3 border-b border-[var(--color-border-base)] align-middle sticky left-10 bg-[var(--color-bg-muted)] z-10">Nom de l’Ecole</th>
                            {levelLabels.map(label => (<th key={label} colSpan={3} className="px-4 py-3 border-b border-[var(--color-border-base)] text-center">{label}</th>))}
                        </tr>
                        <tr>
                            {levels.map(level => (
                                <React.Fragment key={level}>
                                    <th className="px-2 py-3 border-b border-[var(--color-border-base)] bg-[var(--color-bg-muted)] text-center font-medium">Filles</th>
                                    <th className="px-2 py-3 border-b border-[var(--color-border-base)] bg-[var(--color-bg-muted)] text-center font-medium">Garçons</th>
                                    <th className="px-2 py-3 border-b border-[var(--color-border-base)] bg-[var(--color-bg-muted)] text-center font-medium">Total</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSchools.map((school, index) => {
                            const enrollment = enrollmentsMap.get(school.id);
                            return (
                            <tr key={school.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                <td className="px-2 py-2 font-medium text-[var(--color-text-heading)] text-center sticky left-0 z-10" style={{ backgroundColor: index % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-muted)' }}>{index + 1}</td>
                                <td className="px-4 py-2 font-semibold text-[var(--color-text-heading)] sticky left-10 z-10" style={{ backgroundColor: index % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-muted)' }}>{school.name}</td>
                                {levels.map(level => {
                                    // FIX: Cast the dynamically created key to the more specific 'Omit' type to match the handler's signature.
                                    const fillesField = `${level}_filles` as keyof Omit<ClassEnrollment, 'schoolId'>;
                                    const garconsField = `${level}_garcons` as keyof Omit<ClassEnrollment, 'schoolId'>;
                                    const filles = (enrollment?.[fillesField] as number) || 0;
                                    const garcons = (enrollment?.[garconsField] as number) || 0;
                                    return (
                                        <React.Fragment key={level}>
                                            <td className="px-2 py-1"><input type="number" value={filles} onChange={e => handleInputChange(school.id, fillesField, e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-20 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent text-center"/></td>
                                            <td className="px-2 py-1"><input type="number" value={garcons} onChange={e => handleInputChange(school.id, garconsField, e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-20 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent text-center"/></td>
                                            <td className="px-2 py-1 font-semibold text-center">{filles + garcons}</td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
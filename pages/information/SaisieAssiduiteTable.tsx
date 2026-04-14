import React, { useMemo, useState, useEffect } from 'react';
import { ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

const SaisieAssiduiteTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { schools, attendanceData, setAttendanceData } = useAppContext();
    const { addToast } = useToast();
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        Object.values(attendanceData).forEach(schoolData => { Object.keys(schoolData).forEach(month => months.add(month)); });
        const currentMonth = new Date().toISOString().substring(0, 7);
        if(!months.has(currentMonth)) months.add(currentMonth);
        return Array.from(months).sort().reverse();
    }, [attendanceData]);

    useEffect(() => {
        if (schools.length > 0 && !selectedSchoolId) setSelectedSchoolId(schools[0].id);
        if (availableMonths.length > 0 && !selectedMonth) setSelectedMonth(availableMonths[0]);
    }, [schools, availableMonths, selectedSchoolId, selectedMonth]);

    const selectedSchool = useMemo(() => schools.find(s => s.id === selectedSchoolId), [selectedSchoolId, schools]);
    const totalRationnaires = selectedSchool ? selectedSchool.rationnaireGirls + selectedSchool.rationnaireBoys : 0;

    const calendarGrid = useMemo(() => {
        if (!selectedMonth) return { grid: [], daysInMonth: 0 };
        const [year, month] = selectedMonth.split('-').map(Number);
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const grid: ({ day: number, date: Date } | null)[] = [];
        const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < startDay; i++) grid.push(null);
        for (let day = 1; day <= daysInMonth; day++) grid.push({ day, date: new Date(year, month - 1, day) });
        return { grid, daysInMonth };
    }, [selectedMonth]);

    const handleAttendanceChange = (day: string, value: string) => {
        if (!selectedSchoolId || !selectedMonth) return;
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;
        setAttendanceData(prev => {
            const newState = { ...prev };
            if (!newState[selectedSchoolId]) newState[selectedSchoolId] = {};
            if (!newState[selectedSchoolId][selectedMonth]) newState[selectedSchoolId][selectedMonth] = {};
            if(numValue > 0) { newState[selectedSchoolId][selectedMonth][day] = numValue; } else { delete newState[selectedSchoolId][selectedMonth][day]; }
            return newState;
        });
    };
    
    const handleResetMonth = () => {
         if (!selectedSchoolId || !selectedMonth || !window.confirm(`Voulez-vous vraiment effacer toutes les données d'assiduité pour cette école et ce mois ?`)) return;
         setAttendanceData(prev => { const newState = { ...prev }; if(newState[selectedSchoolId]?.[selectedMonth]) { delete newState[selectedSchoolId][selectedMonth]; } return newState; })
    }
    
    const handleExport = () => {
        if (!selectedSchoolId || !selectedMonth) return;
        const monthData = attendanceData[selectedSchoolId]?.[selectedMonth] || {};
        const dataToExport = Object.entries(monthData).map(([day, present]) => ({ Date: `${selectedMonth}-${day.padStart(2, '0')}`, Présents: present })).sort((a,b) => a.Date.localeCompare(b.Date));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Assiduité");
        XLSX.writeFile(wb, `assiduite_${selectedSchool?.name}_${selectedMonth}.xlsx`);
        addToast("Données d'assiduité exportées.", 'success');
    };

    const handleImport = (file: File) => {
        if (!selectedSchoolId || !selectedMonth) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
                setAttendanceData(prev => {
                    const newState = { ...prev };
                    if (!newState[selectedSchoolId]) newState[selectedSchoolId] = {};
                    if (!newState[selectedSchoolId][selectedMonth]) newState[selectedSchoolId][selectedMonth] = {};
                    json.forEach(row => {
                         const date = row.Date instanceof Date ? row.Date.toISOString().substring(0,10) : String(row.Date || '');
                         const present = Number(row['Présents'] || 0);
                         if(date && date.startsWith(selectedMonth) && !isNaN(present) && present > 0){
                            const day = date.substring(8,10);
                            newState[selectedSchoolId][selectedMonth][day] = present;
                         }
                    });
                    return newState;
                });
                addToast('Importation réussie !', 'success');
            } catch (error) {
                console.error("Erreur d'importation assiduité:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }
    
    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Saisie de l'Assiduité Journalière</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="school-select-assiduite" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">École</label>
                    <select id="school-select-assiduite" value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} disabled={isReadOnly} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)]">
                         {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="month-select-assiduite" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Mois</label>
                    <input type="month" id="month-select-assiduite" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} disabled={isReadOnly} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)]" />
                </div>
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                <Button onClick={handleResetMonth} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>Réinitialiser le mois</Button>
            </div>
            {selectedSchool && <p className="text-sm text-[var(--color-text-muted)] mb-4">Effectif total des rationnaires pour {selectedSchool.name}: <span className="font-bold text-[var(--color-text-base)]">{totalRationnaires}</span></p>}
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-[var(--color-text-muted)] mb-2">
                {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarGrid.grid.map((dayInfo, index) => {
                    if (!dayInfo) return <div key={`empty-${index}`} className="border rounded-md border-transparent"></div>;
                    const { day, date } = dayInfo;
                    const dayKey = String(day).padStart(2, '0');
                    const dayOfWeek = date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const value = attendanceData[selectedSchoolId]?.[selectedMonth]?.[dayKey] || '';
                    return (
                        <div key={day} className={`border border-[var(--color-border-base)] rounded-md p-2 ${isWeekend ? 'bg-[var(--color-bg-muted)]' : 'bg-[var(--color-bg-card)]'}`}>
                            <div className={`font-bold ${isWeekend ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-heading)]'}`}>{day}</div>
                            <input type="number" value={value} onChange={e => handleAttendanceChange(dayKey, e.target.value)} onKeyDown={handleEnterNavigation}
                                className={`w-full p-1 border rounded-md text-center mt-1 bg-transparent border-[var(--color-border-input)] ${isWeekend ? 'bg-[var(--color-bg-base)]' : ''}`}
                                disabled={isWeekend || isReadOnly} placeholder="0" min="0" max={totalRationnaires}/>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default SaisieAssiduiteTable;
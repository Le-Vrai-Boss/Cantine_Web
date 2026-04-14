import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { ExportIcon } from '../components/Icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '../context/ToastContext';
import { handleEnterNavigation } from '../utils/uiHelpers';

interface FichePrevisionRow {
    schoolId: string;
    schoolName: string;
    rationnaires: number;
    initials: Record<string, number>;
    jours: Record<string, number>;
    consommations: Record<string, number>;
    restantes: Record<string, number>;
    isForecastMode: boolean;
}

const FichePrevisionPage: React.FC = () => {
    const { 
        schools, 
        foodItems, 
        schoolPreparationDays, 
        schoolFoodSupplies,
        globalMonth
    } = useAppContext();
    const { addToast } = useToast();

    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [forecastDays, setForecastDays] = useState<Record<string, Record<string, number>>>({});

    const orderedFoodItems = useMemo(() => {
        const order = ['riz', 'huile', 'poisson', 'tsp', 'haricot'];
        return [...foodItems].sort((a, b) => {
            const nameA = a.name.toLowerCase().split(' ')[0].replace('(kg)', '').trim();
            const nameB = b.name.toLowerCase().split(' ')[0].replace('(kg)', '').trim();
            const indexA = order.indexOf(nameA);
            const indexB = order.indexOf(nameB);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [foodItems]);

    const availableMonths = useMemo(() => {
        const monthsWithData = new Set<string>();
        Object.values(schoolPreparationDays).forEach(schoolData => {
            Object.keys(schoolData).forEach(month => {
                if (Object.values(schoolData[month]).some(days => (days as number) > 0)) {
                    monthsWithData.add(month);
                }
            });
        });

        const sortedMonthsWithData = Array.from(monthsWithData).sort();

        let nextEmptyMonth: string | null = null;
        if (sortedMonthsWithData.length > 0) {
            const lastMonthKey = sortedMonthsWithData[sortedMonthsWithData.length - 1];
            const [year, month] = lastMonthKey.split('-').map(Number);
            const nextMonthDate = new Date(year, month, 1);
            const nextYear = nextMonthDate.getFullYear();
            const nextMonthStr = (nextMonthDate.getMonth() + 1).toString().padStart(2, '0');
            nextEmptyMonth = `${nextYear}-${nextMonthStr}`;
        } else {
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            nextEmptyMonth = `${year}-${month}`;
        }

        const finalMonths = new Set(sortedMonthsWithData);
        if (nextEmptyMonth) {
            finalMonths.add(nextEmptyMonth);
        }
        
        return Array.from(finalMonths).sort().reverse();
    }, [schoolPreparationDays]);

    useEffect(() => {
        const initialMonth = globalMonth && availableMonths.includes(globalMonth) 
            ? globalMonth 
            : availableMonths.length > 0 ? availableMonths[0] : '';
        setSelectedMonth(initialMonth);
    }, [globalMonth, availableMonths]);

    useEffect(() => {
        setForecastDays({}); // Reset forecast when month changes
    }, [selectedMonth]);
    
    const maxForecastDays = useMemo(() => {
        if (!selectedMonth) return {};

        const maxDays: Record<string, Record<string, number | typeof Infinity>> = {};
        schools.forEach(school => {
            maxDays[school.id] = {};
            orderedFoodItems.forEach(food => {
                if (food.operatingDays > 0) {
                    const totalUsedInOtherMonths = Object.keys(schoolPreparationDays[school.id] || {})
                        .filter(monthKey => monthKey !== selectedMonth)
                        .reduce((total, monthKey) => {
                            return total + (schoolPreparationDays[school.id][monthKey][food.id] || 0);
                        }, 0);
                    
                    const remaining = food.operatingDays - totalUsedInOtherMonths;
                    maxDays[school.id][food.id] = Math.max(0, remaining);
                } else {
                    maxDays[school.id][food.id] = Infinity;
                }
            });
        });
        return maxDays;
    }, [schools, orderedFoodItems, schoolPreparationDays, selectedMonth]);

    const reportData = useMemo(() => {
        if (!selectedMonth) return [];

        const data: FichePrevisionRow[] = schools.map(school => {
            const isForecastMode = !schoolPreparationDays[school.id]?.[selectedMonth] || Object.values(schoolPreparationDays[school.id][selectedMonth]).every(d => d === 0);

            const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
            const initials: Record<string, number> = {};
            const jours: Record<string, number> = {};
            const consommations: Record<string, number> = {};
            const restantes: Record<string, number> = {};

            orderedFoodItems.forEach(food => {
                const totalDotation = schoolFoodSupplies
                    .filter(s => s.schoolId === school.id)
                    .reduce((sum, s) => sum + (s.foodQuantities[food.id] || 0), 0);
                
                let consumedBefore = 0;
                Object.keys(schoolPreparationDays[school.id] || {}).forEach(monthKey => {
                    if (monthKey < selectedMonth) {
                        const days = schoolPreparationDays[school.id][monthKey][food.id] || 0;
                        consumedBefore += rationnaires * days * food.rationPerChild;
                    }
                });

                const stockInitialMois = totalDotation - consumedBefore;
                initials[food.id] = stockInitialMois;

                if (isForecastMode) {
                    jours[food.id] = forecastDays[school.id]?.[food.id] || 0;
                } else {
                    jours[food.id] = schoolPreparationDays[school.id]?.[selectedMonth]?.[food.id] || 0;
                }
                const currentDays = jours[food.id];

                let consommationMois = 0;

                if (currentDays > 0 && stockInitialMois > 0) {
                    const calculatedConsumption = rationnaires * currentDays * food.rationPerChild;

                    const totalUsedBefore = Object.keys(schoolPreparationDays[school.id] || {})
                        .filter(monthKey => monthKey < selectedMonth)
                        .reduce((total, monthKey) => total + (schoolPreparationDays[school.id][monthKey][food.id] || 0), 0);
    
                    const totalJoursUtilises = totalUsedBefore + currentDays;
                    const joursRestantsApresCeMois = food.operatingDays - totalJoursUtilises;
    
                    if (food.operatingDays > 0 && joursRestantsApresCeMois <= 0) {
                        consommationMois = stockInitialMois;
                    } else {
                        consommationMois = calculatedConsumption;
                    }
                }
                
                consommations[food.id] = consommationMois;
                restantes[food.id] = stockInitialMois - consommationMois;
            });

            return {
                schoolId: school.id, schoolName: school.name, rationnaires,
                initials, jours, consommations, restantes, isForecastMode
            };
        }).sort((a, b) => a.schoolName.localeCompare(b.schoolName));
        
        return data;
    }, [selectedMonth, schools, orderedFoodItems, schoolFoodSupplies, schoolPreparationDays, forecastDays]);

    const handleForecastDaysChange = (schoolId: string, foodId: string, value: string) => {
        let days = parseInt(value, 10) || 0;
        days = days < 0 ? 0 : days;

        const maxDays = maxForecastDays[schoolId]?.[foodId];
        if (maxDays !== undefined && maxDays !== Infinity && days > maxDays) {
            addToast(`Le nombre de jours ne peut pas dépasser ${maxDays} (jours restants planifiés).`, 'warning');
            days = maxDays as number;
        }

        setForecastDays(prev => {
            const newSchoolForecast = { ...(prev[schoolId] || {}) };
            newSchoolForecast[foodId] = days;
            return {
                ...prev,
                [schoolId]: newSchoolForecast,
            };
        });
    };

    const formatMonthForDisplay = (monthKey: string) => {
        if (!monthKey) return '';
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const formatted = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(14);
        doc.text(`FICHE PREVISIONNELLE DE REMPLISSAGE DES DENREES DU MOIS DE ${formatMonthForDisplay(selectedMonth).toUpperCase()}`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        
        const head = [
            [
                { content: 'Ecole', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
                { content: 'Rat.', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
                { content: 'DENREES INITIALES', colSpan: orderedFoodItems.length, styles: { halign: 'center' } },
                { content: 'DENREES CONSOMMEES', colSpan: orderedFoodItems.length * 2, styles: { halign: 'center' } },
                { content: 'DENREES RESTANTES', colSpan: orderedFoodItems.length, styles: { halign: 'center' } },
            ],
            [
                ...orderedFoodItems.map(f => ({ content: f.name.split(' ')[0].toUpperCase(), styles: { halign: 'center' } })),
                ...orderedFoodItems.map(f => ({ content: f.name.split(' ')[0].toUpperCase(), colSpan: 2, styles: { halign: 'center', fillColor: [255, 255, 255], textColor: 0 } })),
                ...orderedFoodItems.map(f => ({ content: f.name.split(' ')[0].toUpperCase(), styles: { halign: 'center' } })),
            ],
            [
                ...orderedFoodItems.map(() => ({ content: '', styles: { halign: 'center' } })),
                ...orderedFoodItems.flatMap(() => [{ content: 'Jours', styles: { halign: 'center' } }, { content: 'Conso.', styles: { halign: 'center' } }]),
                ...orderedFoodItems.map(() => ({ content: '', styles: { halign: 'center' } })),
            ]
        ];

        const body = reportData.map(row => [
            row.schoolName,
            row.rationnaires,
            ...orderedFoodItems.map(food => row.initials[food.id].toFixed(2)),
            ...orderedFoodItems.flatMap(food => [row.jours[food.id], row.consommations[food.id].toFixed(2)]),
            ...orderedFoodItems.map(food => row.restantes[food.id].toFixed(2)),
        ]);

        // @ts-expect-error - autoTable is added to jsPDF by jspdf-autotable
        doc.autoTable({
            head: head,
            body: body,
            startY: 25,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
        });

        doc.save(`fiche_prevision_${selectedMonth}.pdf`);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <div className="flex flex-wrap justify-between items-center border-b border-[var(--color-border-base)] pb-4 mb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)]">Fiche de Prévision de Remplissage</h3>
                <div className="flex items-center gap-4">
                    <div>
                        <label htmlFor="month-select" className="text-sm font-medium text-[var(--color-text-muted)] mr-2">Mois :</label>
                        <select id="month-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)]">
                            {availableMonths.map(m => <option key={m} value={m}>{formatMonthForDisplay(m)}</option>)}
                        </select>
                    </div>
                    <Button onClick={handleExportPdf} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                        Exporter PDF
                    </Button>
                </div>
            </div>

            {reportData.some(row => row.isForecastMode) && selectedMonth && (
                 <div className="p-3 mb-4 text-sm bg-blue-50 text-blue-800 border-l-4 border-blue-500 rounded-r-lg">
                    <span className="font-bold">Mode Prévisionnel Actif :</span> Vous pouvez saisir des jours de préparation estimés dans les cases bleues pour les écoles n'ayant pas de plan enregistré ce mois-ci.
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs uppercase bg-slate-100 text-slate-700">
                        <tr className="text-center">
                            <th rowSpan={3} className="px-2 py-2 border border-slate-300 align-middle sticky left-0 bg-slate-200 z-20 min-w-[150px]">Ecole</th>
                            <th rowSpan={3} className="px-2 py-2 border border-slate-300 align-middle sticky left-[150px] bg-slate-200 z-20">Rat.</th>
                            <th colSpan={orderedFoodItems.length} className="px-4 py-1 border border-slate-300">DENREES INITIALES</th>
                            <th colSpan={orderedFoodItems.length * 2} className="px-4 py-1 border border-slate-300">DENREES CONSOMMEES</th>
                            <th colSpan={orderedFoodItems.length} className="px-4 py-1 border border-slate-300">DENREES RESTANTES</th>
                        </tr>
                        <tr className="text-center font-semibold">
                            {orderedFoodItems.map(food => <th key={`init-head-${food.id}`} className="px-2 py-1 border border-slate-300 font-medium">{food.name.split(' ')[0]}</th>)}
                            {orderedFoodItems.map(food => <th key={`cons-head-${food.id}`} colSpan={2} className="px-2 py-1 border border-slate-300 bg-white text-black font-bold">{food.name.split(' ')[0]}</th>)}
                            {orderedFoodItems.map(food => <th key={`rest-head-${food.id}`} className="px-2 py-1 border border-slate-300 font-medium">{food.name.split(' ')[0]}</th>)}
                        </tr>
                        <tr className="text-center">
                            {orderedFoodItems.map(food => <th key={`init-unit-${food.id}`} className="px-2 py-1 border border-slate-300 font-normal">({food.unit})</th>)}
                            {orderedFoodItems.flatMap(food => [<th key={`cons-j-${food.id}`} className="px-2 py-1 border border-slate-300">Jours</th>, <th key={`cons-name-${food.id}`} className="px-2 py-1 border border-slate-300">Consommation</th>])}
                            {orderedFoodItems.map(food => <th key={`rest-unit-${food.id}`} className="px-2 py-1 border border-slate-300 font-normal">({food.unit})</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, index) => (
                            <tr key={row.schoolId} className="text-center even:bg-slate-50">
                                <td className="px-2 py-2 border border-slate-200 text-left font-semibold sticky left-0 z-10" style={{ backgroundColor: index % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-muted)' }}>{row.schoolName}</td>
                                <td className="px-2 py-2 border border-slate-200 font-semibold sticky left-[150px] z-10" style={{ backgroundColor: index % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-muted)' }}>{row.rationnaires}</td>
                                {orderedFoodItems.map(food => <td key={`init-val-${food.id}`} className="px-2 py-2 border border-slate-200">{row.initials[food.id].toLocaleString('fr-FR', {maximumFractionDigits: 2})}</td>)}
                                {orderedFoodItems.flatMap(food => {
                                    const maxDays = maxForecastDays[row.schoolId]?.[food.id];
                                    const maxDaysTitle = (maxDays !== undefined && maxDays !== Infinity) ? `Max: ${maxDays} jours` : 'Aucune limite de jours';
                                    
                                    return [
                                    <td key={`cons-j-val-${food.id}`} className={`px-1 py-1 border border-slate-200 ${row.isForecastMode ? 'bg-blue-50' : ''}`}>
                                        {row.isForecastMode ? (
                                            <input 
                                                type="number"
                                                value={row.jours[food.id]}
                                                onChange={e => handleForecastDaysChange(row.schoolId, food.id, e.target.value)}
                                                onKeyDown={handleEnterNavigation}
                                                className="w-16 p-1 border rounded-md text-center bg-white"
                                                min="0"
                                                max={maxDays !== Infinity ? maxDays as number : undefined}
                                                title={maxDaysTitle}
                                            />
                                        ) : (
                                            <span>{row.jours[food.id]}</span>
                                        )}
                                    </td>,
                                    <td key={`cons-val-${food.id}`} className="px-2 py-2 border border-slate-200">{row.consommations[food.id].toLocaleString('fr-FR', {maximumFractionDigits: 2})}</td>
                                ]})}
                                {orderedFoodItems.map(food => (
                                    <td key={`rest-val-${food.id}`} className={`px-2 py-2 border border-slate-200 font-bold ${row.restantes[food.id] < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                        {row.restantes[food.id].toLocaleString('fr-FR', {maximumFractionDigits: 2})}
                                    </td>
                                ))}
                            </tr>
                        ))}
                         {reportData.length === 0 && (
                            <tr>
                                <td colSpan={2 + (orderedFoodItems.length * 4)} className="text-center py-8 text-slate-500">
                                    Veuillez d'abord ajouter des écoles dans la section "Informations".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FichePrevisionPage;


import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ExportIcon } from '../components/Icons';
import { Button } from '../components/Button';
import * as XLSX from 'xlsx';

const BilanVivresPage: React.FC = () => {
    const { schools, foodItems, schoolPreparationDays, globalMonth } = useAppContext();
    const [selectedMonth, setSelectedMonth] = useState<string>(globalMonth);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        Object.values(schoolPreparationDays).forEach(schoolData => {
            Object.keys(schoolData).forEach(month => months.add(month));
        });
        return Array.from(months).sort().reverse();
    }, [schoolPreparationDays]);

    useEffect(() => {
        if (globalMonth && availableMonths.includes(globalMonth)) {
            setSelectedMonth(globalMonth);
        } else if (!availableMonths.some(m => m === selectedMonth) && availableMonths.length > 0) {
            setSelectedMonth(availableMonths[0]);
        } else if (availableMonths.length === 0) {
            setSelectedMonth('');
        }
    }, [globalMonth, availableMonths, selectedMonth]);

    const reportData = useMemo(() => {
        if (!selectedMonth) return { tableRows: [], totals: { total: 0 } };

        const foodTotals: Record<string, number> = {};
        foodItems.forEach(food => {
            foodTotals[food.id] = 0;
        });
        let grandTotal = 0;

        const tableRows = schools.map(school => {
            const totalRationnaires = school.rationnaireGirls + school.rationnaireBoys;
            const monthData = schoolPreparationDays[school.id]?.[selectedMonth] || {};
            
            let schoolTotal = 0;
            const consumptions: Record<string, number> = {};
            
            foodItems.forEach(foodItem => {
                const prepDays = monthData[foodItem.id] || 0;
                const consumption = totalRationnaires * prepDays * foodItem.rationPerChild;
                consumptions[foodItem.id] = consumption;
                schoolTotal += consumption;
                foodTotals[foodItem.id] += consumption;
            });
            grandTotal += schoolTotal;
            
            return {
                schoolId: school.id,
                schoolName: school.name,
                totalConsumption: schoolTotal,
                foodConsumptions: consumptions,
            };
        }).sort((a, b) => a.schoolName.localeCompare(b.schoolName));

        return { tableRows, totals: { total: grandTotal, ...foodTotals } };
    }, [selectedMonth, schools, foodItems, schoolPreparationDays]);
    
    const handleExport = () => {
        if (!reportData || reportData.tableRows.length === 0) return;
        
        const dataToExport = reportData.tableRows.map((row, index) => {
            const exportRow: Record<string, string | number> = {
                "N°": index + 1,
                "Nom Ecole": row.schoolName,
                "TOTAL": row.totalConsumption,
            };
            foodItems.forEach(food => {
                exportRow[food.name] = row.foodConsumptions[food.id] || 0;
            });
            return exportRow;
        });
        
        const totalsRow: Record<string, string | number> = {
            "N°": "",
            "Nom Ecole": "TOTAL",
            "TOTAL": reportData.totals.total,
        };
        foodItems.forEach(food => {
            totalsRow[food.name] = reportData.totals[food.id] || 0;
        });

        const ws = XLSX.utils.json_to_sheet([...dataToExport, totalsRow]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bilan Consommation Planifiée");
        XLSX.writeFile(wb, `bilan_consommation_planifiee_${selectedMonth}.xlsx`);
    };


    const formatMonth = (monthKey: string) => {
        if (!monthKey) return '';
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const formatted = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Bilan de Consommation Planifiée par École</h3>
            
            <div className="flex justify-between items-start mb-6">
                <div className="max-w-sm">
                    <label htmlFor="month-select" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Sélectionner un mois</label>
                    <select 
                        id="month-select" 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm"
                        disabled={availableMonths.length === 0}
                    >
                        <option value="" disabled>-- Choisir un mois --</option>
                        {availableMonths.map(month => (
                            <option key={month} value={month}>{formatMonth(month)}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                        Exporter
                    </Button>
                </div>
            </div>

            {selectedMonth && reportData ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                        <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                            <tr>
                                <th scope="col" className="px-2 py-3 sticky left-0 bg-[var(--color-bg-muted)] z-10">N°</th>
                                <th scope="col" className="px-4 py-3 sticky left-10 bg-[var(--color-bg-muted)] z-10">Nom Ecole</th>
                                <th scope="col" className="px-4 py-3 text-right bg-[var(--color-bg-base)] font-bold">TOTAL</th>
                                {foodItems.map(food => (
                                    <th key={food.id} scope="col" className="px-4 py-3 text-right">{food.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.tableRows.length === 0 ? (
                                <tr>
                                    <td colSpan={3 + foodItems.length} className="text-center py-12 text-[var(--color-text-muted)]">
                                        <p>Aucune consommation planifiée pour ce mois.</p>
                                    </td>
                                </tr>
                            ) : reportData.tableRows.map((row, index) => (
                                <tr key={row.schoolId} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)]">
                                    <td className="px-2 py-2 font-medium text-[var(--color-text-heading)] sticky left-0 bg-[var(--color-bg-card)] even:bg-[var(--color-bg-muted)]">{index + 1}</td>
                                    <td className="px-4 py-2 font-semibold text-[var(--color-text-heading)] sticky left-10 bg-[var(--color-bg-card)] even:bg-[var(--color-bg-muted)]">{row.schoolName}</td>
                                    <td className="px-4 py-2 text-right font-bold bg-[var(--color-bg-muted)]">
                                        {row.totalConsumption.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                                    </td>
                                    {foodItems.map(food => (
                                        <td key={food.id} className="px-4 py-2 text-right">
                                            {(row.foodConsumptions[food.id] || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="bg-[var(--color-bg-base)] font-bold text-[var(--color-text-heading)]">
                            <tr>
                                <td colSpan={2} className="px-4 py-3 text-right sticky left-0 bg-[var(--color-bg-base)]">TOTAL</td>
                                <td className="px-4 py-3 text-right">
                                    {(reportData.totals.total || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                                </td>
                                {foodItems.map(food => (
                                    <td key={food.id} className="px-4 py-3 text-right">
                                        {(reportData.totals[food.id] || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="text-center py-16 bg-[var(--color-bg-muted)] rounded-lg">
                    <p className="text-[var(--color-text-muted)]">
                        {availableMonths.length > 0
                            ? "Veuillez sélectionner un mois pour afficher le bilan."
                            : "Aucune donnée de consommation planifiée trouvée. Veuillez d'abord saisir des données dans 'Jours de préparation'."
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default BilanVivresPage;
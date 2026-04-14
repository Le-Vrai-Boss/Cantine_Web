import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ExportIcon } from '../components/Icons';
import { Button } from '../components/Button';
import * as XLSX from 'xlsx';

const CFCBilanPage: React.FC = () => {
    const { 
        appSettings, 
        schools, 
        schoolFoodSupplies, 
        schoolPreparationDays 
    } = useAppContext();

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        Object.values(schoolPreparationDays).forEach(schoolData => {
            Object.keys(schoolData).forEach(month => {
                if (Object.values(schoolData[month]).some((days: number) => Number(days) > 0)) {
                    months.add(month);
                }
            });
        });
        return Array.from(months).sort();
    }, [schoolPreparationDays]);

    const reportData = useMemo(() => {
        const inspectionPart = appSettings.inspectionPercentage / 100;

        return schools.map(school => {
            const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
            const mealPrice = schoolFoodSupplies
                .filter(sfs => sfs.schoolId === school.id)
                .sort((a, b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime())[0]?.mealPrice || appSettings.defaultMealPrice;
            
            const monthlyCFCs: Record<string, number> = {};
            let totalCFC = 0;

            availableMonths.forEach(monthKey => {
                const prepDaysForMonth = schoolPreparationDays[school.id]?.[monthKey] || {};
                const jourLePlusGrand = Object.values(prepDaysForMonth).length > 0 ? Math.max(0, ...Object.values(prepDaysForMonth).map(Number)) : 0;
                
                const cfcForMonth = rationnaires * mealPrice * jourLePlusGrand * inspectionPart;
                monthlyCFCs[monthKey] = cfcForMonth;
                totalCFC += cfcForMonth;
            });

            return {
                schoolId: school.id,
                schoolName: school.name,
                rationnaires: rationnaires,
                monthlyCFCs,
                totalCFC,
            };
        }).filter(d => d.totalCFC > 0).sort((a,b) => a.schoolName.localeCompare(b.schoolName));
    }, [schools, schoolFoodSupplies, schoolPreparationDays, appSettings, availableMonths]);
    
    const totals = useMemo(() => {
        const monthlyTotals: Record<string, number> = {};
        let grandTotal = 0;
        let totalRationnaires = 0;

        availableMonths.forEach(month => {
            monthlyTotals[month] = 0;
        });

        reportData.forEach(data => {
            grandTotal += data.totalCFC;
            totalRationnaires += data.rationnaires;
            availableMonths.forEach(month => {
                monthlyTotals[month] += data.monthlyCFCs[month] || 0;
            });
        });
        
        return {
            monthlyTotals,
            grandTotal,
            totalRationnaires,
        };
    }, [reportData, availableMonths]);

    const formatMonth = (monthKey: string) => {
        if (!monthKey) return '';
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const formatted = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const handleExport = () => {
        if (reportData.length === 0) return;
        const dataToExport = reportData.map((d, index) => {
            const row: { [key: string]: string | number } = {
                "N°": index + 1,
                "Nom Ecole": d.schoolName,
                "Rationnaires": d.rationnaires,
                "TOTAL CFC": d.totalCFC,
            };
            availableMonths.forEach(month => {
                row[formatMonth(month)] = d.monthlyCFCs[month] || 0;
            });
            return row;
        });

        const totalsRow: { [key: string]: string | number } = {
            "N°": "",
            "Nom Ecole": "Total",
            "Rationnaires": totals.totalRationnaires,
            "TOTAL CFC": totals.grandTotal,
        };
        availableMonths.forEach(month => {
            totalsRow[formatMonth(month)] = totals.monthlyTotals[month] || 0;
        });
        
        const finalData = [...dataToExport, totalsRow];

        const ws = XLSX.utils.json_to_sheet(finalData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bilan CFC");
        XLSX.writeFile(wb, "bilan_cfc_par_mois.xlsx");
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <div className="flex justify-between items-center border-b border-[var(--color-border-base)] pb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)]">Bilan des Contributions Financières Communautaires (CFC)</h3>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />} disabled={reportData.length === 0}>
                    Exporter
                </Button>
            </div>

            {availableMonths.length > 0 ? (
                <div className="overflow-x-auto mt-6">
                    <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                        <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                            <tr>
                                <th scope="col" className="px-4 py-3 sticky left-0 bg-[var(--color-bg-muted)] z-10">N°</th>
                                <th scope="col" className="px-6 py-3 sticky left-12 bg-[var(--color-bg-muted)] z-10">Nom Ecole</th>
                                <th scope="col" className="px-6 py-3 text-right">Rationnaires</th>
                                <th scope="col" className="px-6 py-3 text-right bg-[var(--color-bg-base)]">TOTAL CFC</th>
                                {availableMonths.map(month => (
                                    <th key={month} scope="col" className="px-6 py-3 text-right">{formatMonth(month)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((data, index) => (
                                <tr key={data.schoolId} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)]">
                                    <td className="px-4 py-4 sticky left-0 bg-[var(--color-bg-card)] even:bg-[var(--color-bg-muted)]">{index + 1}</td>
                                    <td className="px-6 py-4 font-semibold text-[var(--color-text-heading)] sticky left-12 bg-[var(--color-bg-card)] even:bg-[var(--color-bg-muted)]">{data.schoolName}</td>
                                    <td className="px-6 py-4 text-right">{data.rationnaires.toLocaleString('fr-FR')}</td>
                                    <td className="px-6 py-4 text-right font-bold text-[var(--color-text-heading)] bg-[var(--color-bg-muted)]">
                                        {data.totalCFC.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                    </td>
                                    {availableMonths.map(month => (
                                        <td key={month} className="px-6 py-4 text-right">
                                            {(data.monthlyCFCs[month] || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-[var(--color-bg-base)] font-bold text-[var(--color-text-heading)]">
                            <tr>
                                <td colSpan={2} className="px-6 py-3 text-right sticky left-0 bg-[var(--color-bg-base)]">Total</td>
                                <td className="px-6 py-3 text-right">{totals.totalRationnaires.toLocaleString('fr-FR')}</td>
                                <td className="px-6 py-3 text-right">{totals.grandTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {appSettings.currencySymbol}</td>
                                {availableMonths.map(month => (
                                    <td key={month} className="px-6 py-3 text-right">
                                        {(totals.monthlyTotals[month] || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="text-center py-16 bg-[var(--color-bg-muted)] rounded-lg mt-6">
                    <p className="text-[var(--color-text-muted)]">Aucune donnée de planification trouvée pour générer le bilan.</p>
                </div>
            )}
        </div>
    );
};

export default CFCBilanPage;
import React, { useMemo } from 'react';
import { MainMenuId, SubMenuId } from '../../constants';
import { ChevronLeftIcon, ExportIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';

const ResteDenreesTable: React.FC<{ returnTo: { mainMenu: MainMenuId; subMenu: SubMenuId | null } | null; onReturn: () => void; }> = ({ returnTo, onReturn }) => {
    const { schools, foodItems, schoolFoodSupplies, schoolPreparationDays } = useAppContext();
    const { addToast } = useToast();

    const sortedSchools = useMemo(() => [...schools].sort((a, b) => a.name.localeCompare(b.name)), [schools]);

    const reportData = useMemo(() => {
        return sortedSchools.map(school => {
            const schoolRemainders: Record<string, string | number | { value: number; isCritical: boolean }> = {
                schoolId: school.id,
                schoolName: school.name,
            };

            const schoolSupplies = schoolFoodSupplies.filter(sfs => sfs.schoolId === school.id);
            const initialQuantities: Record<string, number> = {};
            foodItems.forEach(food => {
                initialQuantities[food.id] = schoolSupplies.reduce((sum, supply) => sum + (supply.foodQuantities[food.id] || 0), 0);
            });
            
            const rationnaires = school.rationnaireGirls + school.rationnaireBoys;

            foodItems.forEach(food => {
                const initialQty = initialQuantities[food.id] || 0;
                
                const prepDaysForSchool = schoolPreparationDays[school.id] || {};

                let totalConsumed = 0;
                Object.values(prepDaysForSchool).forEach((monthData) => {
                    const prepDaysInMonth = (monthData as Record<string, number>)[food.id] || 0;
                    totalConsumed += rationnaires * prepDaysInMonth * food.rationPerChild;
                });

                const remainingQty = initialQty - totalConsumed;

                const dailyConsumption = rationnaires * food.rationPerChild;
                const isCritical = remainingQty < 0 || (remainingQty > 0 && dailyConsumption > 0 && remainingQty < dailyConsumption);

                schoolRemainders[food.id] = {
                    value: remainingQty,
                    isCritical: isCritical
                };
            });

            return schoolRemainders;
        });
    }, [sortedSchools, foodItems, schoolFoodSupplies, schoolPreparationDays]);
    
    const handleExport = () => {
        const dataToExport = reportData.map((schoolData, index) => {
            const row: Record<string, string | number> = {
                'N°': index + 1,
                "Nom de l'école": schoolData.schoolName as string,
            };
            foodItems.forEach(food => {
                 const remainderInfo = schoolData[food.id] as { value: number; isCritical: boolean };
                 const displayValue = remainderInfo.isCritical ? 0 : remainderInfo.value;
                row[`${food.name} (${food.unit})`] = displayValue;
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        
        foodItems.forEach((food, index) => {
            const colLetter = XLSX.utils.encode_col(index + 2);
            for (let i = 2; i <= dataToExport.length + 1; i++) {
                const cellRef = `${colLetter}${i}`;
                if (ws[cellRef]) {
                    ws[cellRef].t = 'n';
                    ws[cellRef].z = '#,##0.00';
                }
            }
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reste Denrees");
        XLSX.writeFile(wb, "reste_denrees.xlsx");
        addToast("Reste des denrées exporté avec succès.", 'success');
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            {returnTo && (
                <div className="mb-4">
                    <Button onClick={onReturn} variant="secondary" icon={<ChevronLeftIcon className="h-5 w-5" />}>
                        Retour à la page précédente
                    </Button>
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)]">Reste des Denrées par École</h3>
                 <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter (Excel)
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th scope="col" className="px-4 py-3 sticky left-0 bg-[var(--color-bg-muted)] z-10">N°</th>
                            <th scope="col" className="px-6 py-3 sticky left-12 bg-[var(--color-bg-muted)] z-10 whitespace-nowrap">Nom de l'école</th>
                            {foodItems.map(food => (
                                <th key={food.id} scope="col" className="px-6 py-3 text-center">{food.name} ({food.unit})</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((schoolData, index) => (
                            <tr key={schoolData.schoolId} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)]">
                                <td className="px-4 py-4 font-medium text-[var(--color-text-heading)] sticky left-0 bg-[var(--color-bg-card)] even:bg-[var(--color-bg-muted)] z-10">{index + 1}</td>
                                <td className="px-6 py-4 font-bold text-[var(--color-text-heading)] sticky left-12 bg-[var(--color-bg-card)] even:bg-[var(--color-bg-muted)] z-10 whitespace-nowrap">{schoolData.schoolName}</td>
                                {foodItems.map(food => {
                                    const remainderInfo = schoolData[food.id];
                                    const displayValue = remainderInfo.isCritical ? 0 : remainderInfo.value;
                                    const textColor = remainderInfo.isCritical ? 'text-red-600' : 'text-[var(--color-text-base)]';
                                    return (
                                        <td key={food.id} className={`px-6 py-4 text-center font-medium ${textColor}`}>
                                            {displayValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {reportData.length === 0 && (
                            <tr><td colSpan={2 + foodItems.length} className="text-center py-8 text-[var(--color-text-muted)]">Aucune donnée à afficher.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResteDenreesTable;
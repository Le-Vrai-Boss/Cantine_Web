import React, { useMemo } from 'react';
import { MainMenuId, SubMenuId } from '../../constants';
import { ChevronLeftIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../../components/Button';

interface ResteJoursTableProps {
    returnTo: { mainMenu: MainMenuId; subMenu: SubMenuId | null } | null;
    onReturn: () => void;
}
const ResteJoursTable: React.FC<ResteJoursTableProps> = ({ returnTo, onReturn }) => {
    const { schools, foodItems, schoolPreparationDays } = useAppContext();

    const sortedSchools = useMemo(() => [...schools].sort((a, b) => a.name.localeCompare(b.name)), [schools]);

    const reportData = useMemo(() => {
        return sortedSchools.map(school => {
            const remainingDaysData: Record<string, string | number> = {
                schoolId: school.id,
                schoolName: school.name,
            };

            foodItems.forEach(food => {
                const initialOperatingDays = food.operatingDays || 0;

                const prepDaysForSchool = schoolPreparationDays[school.id] || {};

                // FIX: Correctly type the parameters in the reduce function to resolve the arithmetic operation error.
                const totalPreparationDaysUsed = Object.values(prepDaysForSchool).reduce( 
                    (total: number, monthData: Record<string, number>) => total + (monthData[food.id] || 0), 
                    0
                );

                const remainingDays = initialOperatingDays - totalPreparationDaysUsed;
                
                remainingDaysData[food.id] = remainingDays;
            });

            return remainingDaysData;
        });
    }, [sortedSchools, foodItems, schoolPreparationDays]);


    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
             {returnTo && (
                <div className="mb-4">
                    <Button onClick={onReturn} variant="secondary" icon={<ChevronLeftIcon className="h-5 w-5" />}>
                        Retour à la page précédente
                    </Button>
                </div>
            )}
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Reste des Jours de Préparation par École et Denrée</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th scope="col" className="px-4 py-3 sticky left-0 bg-[var(--color-bg-muted)] z-10">N°</th>
                            <th scope="col" className="px-6 py-3 sticky left-12 bg-[var(--color-bg-muted)] z-10 whitespace-nowrap">Nom de l'école</th>
                            {foodItems.map(food => <th key={food.id} scope="col" className="px-6 py-3 text-center">{food.name}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((schoolData, index) => (
                            <tr key={schoolData.schoolId} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)]">
                                <td className="px-4 py-4 font-medium text-[var(--color-text-heading)] sticky left-0 bg-[var(--color-bg-card)] even:bg-[var(--color-bg-muted)] z-10">{index + 1}</td>
                                <td className="px-6 py-4 font-bold text-[var(--color-text-heading)] sticky left-12 bg-[var(--color-bg-card)] even:bg-[var(--color-bg-muted)] z-10 whitespace-nowrap">{schoolData.schoolName}</td>
                                {foodItems.map(food => (
                                    <td key={food.id} className="px-6 py-4 text-center font-medium">
                                        {schoolData[food.id]}
                                    </td>
                                ))}
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

export default ResteJoursTable;
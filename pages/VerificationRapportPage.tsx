import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { SaveIcon, CloseIcon, ChevronRightIcon, ResetIcon } from '../components/Icons';
import type { School, FoodItem } from '../types';
import type { VerificationData, SchoolPreparationDaysData } from '../types';
import { handleEnterNavigation } from '../utils/uiHelpers';

const FicheTasModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    school: School | undefined;
    month: string;
    foodItems: FoodItem[];
    prepDays: Record<string, number>;
    initialStocks: Record<string, number>;
}> = ({ isOpen, onClose, school, month, foodItems, prepDays, initialStocks }) => {
    const jourLePlusGrand = useMemo(() => Math.max(0, ...Object.values(prepDays).map(Number)), [prepDays]);
    const rationnaires = school ? school.studentsGirls + school.studentsBoys : 0;

    const tasData = useMemo(() => {
        if (!school) return {};
        const data: Record<string, { jour: number; magasin: number }[]> = {};
        foodItems.forEach(food => {
            data[food.id] = [];
            let currentStock = initialStocks[food.id] || 0;
            const dailyConsumption = rationnaires * food.rationPerChild;

            for (let day = 1; day <= jourLePlusGrand; day++) {
                const consumedToday = day <= (prepDays[food.id] || 0) ? dailyConsumption : 0;
                currentStock -= consumedToday;
                data[food.id].push({
                    jour: consumedToday,
                    magasin: currentStock,
                });
            }
        });
        return data;
    }, [foodItems, initialStocks, prepDays, jourLePlusGrand, rationnaires, school]);

    if (!isOpen || !school || !month) return null;

    const formatMonth = (monthKey: string) => {
        if (!monthKey) return '';
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const formatted = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-[var(--color-bg-card)] rounded-lg [box-shadow:var(--shadow-lg)] p-6 w-full max-w-7xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-[var(--color-border-base)] pb-3 mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">
                        Fiche de TAS - {school.name} - {formatMonth(month)}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-bg-muted)]">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-sm text-left text-[var(--color-text-muted)] border-collapse">
                        <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                            <tr>
                                <th rowSpan={2} className="px-2 py-2 border border-slate-300 align-middle sticky left-0 bg-slate-200 z-10">N°</th>
                                {foodItems.map(food => (
                                    <th key={food.id} colSpan={2} className="px-4 py-1 border border-slate-300 text-center">{food.name}</th>
                                ))}
                            </tr>
                            <tr className="text-center font-semibold">
                                {foodItems.flatMap(food => [
                                    <th key={`${food.id}-jour`} className="px-2 py-1 border border-slate-300">Jour</th>,
                                    <th key={`${food.id}-magasin`} className="px-2 py-1 border border-slate-300">Magasin</th>
                                ])}
                            </tr>
                        </thead>
                        <tbody>
                            {jourLePlusGrand > 0 ?
                                Array.from({ length: jourLePlusGrand }, (_, i) => i + 1).map(dayNum => (
                                    <tr key={dayNum} className="text-center even:bg-[var(--color-bg-muted)]">
                                        <td className="px-2 py-2 border border-slate-200 font-semibold sticky left-0 z-10" style={{ backgroundColor: dayNum % 2 !== 0 ? 'var(--color-bg-card)' : 'var(--color-bg-muted)' }}>{dayNum}</td>
                                        {foodItems.map(food => (
                                            <React.Fragment key={food.id}>
                                                <td className="px-2 py-2 border border-slate-200">{tasData[food.id][dayNum - 1].jour.toLocaleString('fr-FR', {maximumFractionDigits: 2})}</td>
                                                <td className={`px-2 py-2 border border-slate-200 font-medium ${tasData[food.id][dayNum - 1].magasin < 0 ? 'text-red-600' : 'text-[var(--color-text-base)]'}`}>
                                                    {tasData[food.id][dayNum - 1].magasin.toLocaleString('fr-FR', {maximumFractionDigits: 2})}
                                                </td>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={1 + foodItems.length * 2} className="text-center py-12 text-[var(--color-text-muted)]">
                                            Aucun jour de préparation saisi pour ce mois.
                                        </td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

interface VerificationRapportPageProps {
    isReadOnly?: boolean;
    onNavigateToRapportMensuel: () => void;
}

const VerificationRapportPage: React.FC<VerificationRapportPageProps> = ({ isReadOnly = false, onNavigateToRapportMensuel }) => {
    const { 
        appSettings,
        schools, 
        foodItems, 
        schoolFoodSupplies, 
        schoolPreparationDays,
        setSchoolPreparationDays,
        preparationValidationStatus,
        verificationData,
        setVerificationData,
        globalSchoolId,
    } = useAppContext();
    const { addToast } = useToast();

    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    
    const [newPrepDays, setNewPrepDays] = useState<Record<string, number>>({});
    const [cfcReellementVerse, setCfcReellementVerse] = useState<number>(0);
    const [isTasModalOpen, setIsTasModalOpen] = useState(false);
    const inputsContainerRef = useRef<HTMLTableSectionElement>(null);

    useEffect(() => {
        const isGlobalSchoolIdValid = schools.some(s => s.id === globalSchoolId);
        if (globalSchoolId !== 'all' && isGlobalSchoolIdValid) {
            setSelectedSchoolId(globalSchoolId);
        } else if (!schools.some(s => s.id === selectedSchoolId) && schools.length > 0) {
            setSelectedSchoolId(schools[0].id)
        }
    }, [globalSchoolId, schools, selectedSchoolId]);
    
    useEffect(() => {
        if (!selectedMonth) {
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            setSelectedMonth(`${year}-${month}`);
        }
    }, [selectedMonth]);

    const selectedSchool = useMemo(() => schools.find(s => s.id === selectedSchoolId), [selectedSchoolId, schools]);
    const rationnaires = selectedSchool ? selectedSchool.rationnaireGirls + selectedSchool.rationnaireBoys : 0;

    useEffect(() => {
        if (!selectedSchoolId || !selectedMonth) {
            setNewPrepDays({});
            setCfcReellementVerse(0);
            return;
        }
    
        const school = schools.find(s => s.id === selectedSchoolId);
        if (!school) return;
        const currentRationnaires = school.rationnaireGirls + school.rationnaireBoys;
    
        const existingVerification = verificationData[selectedSchoolId]?.[selectedMonth];
    
        if (existingVerification) {
            // Data has been saved before for this month, so load it.
            setNewPrepDays(existingVerification.prepDays);
            setCfcReellementVerse(existingVerification.cfcReellementVerse);
        } else {
            // No saved data for this month. Pre-fill from planned data.
            const plannedDaysForMonth = schoolPreparationDays[selectedSchoolId]?.[selectedMonth] || {};
            setNewPrepDays(plannedDaysForMonth);
            
            // Calculate the prospective CFC based on these planned days and pre-fill the input.
            const jourLePlusGrand = Object.values(plannedDaysForMonth).length > 0 
                ? Math.max(0, ...Object.values(plannedDaysForMonth).map(Number)) 
                : 0;
                
            const mealPrice = schoolFoodSupplies
                .filter(sfs => sfs.schoolId === selectedSchoolId && sfs.supplyDate <= `${selectedMonth}-31`)
                .sort((a,b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime())[0]?.mealPrice || appSettings.defaultMealPrice;
            
            const inspectionPart = appSettings.inspectionPercentage / 100;
            const partEcoleTotal = currentRationnaires * jourLePlusGrand * mealPrice;
            const prospectiveCfc = partEcoleTotal * inspectionPart;
    
            setCfcReellementVerse(Math.round(prospectiveCfc));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        selectedSchoolId,
        selectedMonth,
        // `verificationData` and `schoolPreparationDays` are intentionally omitted
        // to prevent re-running this effect after a save action within this component.
        // This effect should only re-run when the selected school or month changes.
        schools,
        schoolFoodSupplies,
        appSettings.defaultMealPrice,
        appSettings.inspectionPercentage,
    ]);

    useEffect(() => {
        if (inputsContainerRef.current) {
            const firstInput = inputsContainerRef.current.querySelector<HTMLInputElement>('input:not([disabled])');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }, [selectedSchoolId, selectedMonth]);
    
    const stockInitialDuMois = useMemo(() => {
        if (!selectedSchoolId || !selectedMonth) return {};

        const initialStocks: Record<string, number> = {};
        const school = schools.find(s => s.id === selectedSchoolId);
        if (!school) return {};
        const rationnaires = school.rationnaireGirls + school.rationnaireBoys;

        const schoolPlannedData = schoolPreparationDays[selectedSchoolId] || {};
        const previousMonths = Object.keys(schoolPlannedData).sort().filter(m => m < selectedMonth);

        foodItems.forEach(food => {
            const totalReceived = schoolFoodSupplies
                .filter(supply => supply.schoolId === selectedSchoolId)
                .reduce((sum, supply) => sum + (supply.foodQuantities[food.id] || 0), 0);

            let consumedBefore = 0;
            previousMonths.forEach(monthKey => {
                const monthData = schoolPlannedData[monthKey];
                if (monthData) {
                    const prepDays = monthData[food.id] || 0;
                    consumedBefore += rationnaires * prepDays * food.rationPerChild;
                }
            });

            initialStocks[food.id] = totalReceived - consumedBefore;
        });

        return initialStocks;
    }, [selectedSchoolId, selectedMonth, schoolPreparationDays, schoolFoodSupplies, foodItems, schools]);

    const calculationData = useMemo(() => {
        if (!selectedSchoolId || !selectedMonth) {
            return {
                reportRows: [],
                financial: {
                    rationnaires: 0, partCantiniereJour: 0, partCantiniereMois: 0, cfcAVerser: 0,
                    partEcoleJour: 0, partEcoleMois: 0, jourLePlusGrand: 0, solde: 0,
                },
            };
        }
        
        const schoolPrepData = schoolPreparationDays[selectedSchoolId] || {};
        
        const reportRows = foodItems.map(food => {
            // FIX: Correctly type monthData to resolve arithmetic operation error.
            const totalPlannedDaysUsedForAllMonths = Object.values(schoolPrepData)
                .reduce((total: number, monthData: Record<string, number>) => total + (monthData[food.id] || 0), 0);

            const stockInitial = stockInitialDuMois[food.id] || 0;
            
            const receivedThisMonth = schoolFoodSupplies
                .filter(s => s.schoolId === selectedSchoolId && s.supplyDate.startsWith(selectedMonth))
                .reduce((sum, supply) => sum + (supply.foodQuantities[food.id] || 0), 0);
            
            const stockDisponible = stockInitial + receivedThisMonth;
            const currentDays = newPrepDays[food.id] || 0;
            const calculatedConsumption = rationnaires * currentDays * food.rationPerChild;
            let consommationMois = calculatedConsumption;

            const totalPlannedDaysBefore = Object.keys(schoolPreparationDays[selectedSchoolId] || {})
                .filter(monthKey => monthKey < selectedMonth)
                .reduce((total, monthKey) => total + (schoolPreparationDays[selectedSchoolId]![monthKey][food.id] || 0), 0);
            
            const totalPlannedDaysWithCurrent = totalPlannedDaysBefore + currentDays;
            const joursRestantsApresCeMois = food.operatingDays - totalPlannedDaysWithCurrent;

            if (food.operatingDays > 0 && joursRestantsApresCeMois <= 0) {
                consommationMois = stockInitial;
            } else {
                consommationMois = calculatedConsumption;
            }
            if (stockDisponible <= 0) consommationMois = 0;
            
            const consumedBeforePlanned = Object.keys(schoolPreparationDays[selectedSchoolId] || {})
                .filter(m => m < selectedMonth)
                .reduce((sum, m) => {
                    const days = (schoolPreparationDays[selectedSchoolId] as Record<string, Record<string, number>>)[m][food.id] || 0;
                    return sum + (rationnaires * days * food.rationPerChild);
                }, 0);
            
            const consommationCumulative = consumedBeforePlanned + consommationMois;

            const totalDotation = schoolFoodSupplies
                .filter(supply => supply.schoolId === selectedSchoolId)
                .reduce((sum, supply) => sum + (supply.foodQuantities[food.id] || 0), 0);
            
            const stockFinalTheorique = totalDotation - consommationCumulative;

            return {
                foodId: food.id, foodName: food.name, unit: food.unit,
                daysRemaining: food.operatingDays - totalPlannedDaysUsedForAllMonths + Number(schoolPrepData[selectedMonth]?.[food.id] || 0),
                displayedRemainingDays: food.operatingDays - totalPlannedDaysUsedForAllMonths,
                stockInitial, consommationMois, consommationCumulative, stockFinalTheorique,
            };
        });

        const jourLePlusGrand = Math.max(0, ...Object.values(newPrepDays).map(Number));
        const mealPrice = schoolFoodSupplies
            .filter(sfs => sfs.schoolId === selectedSchoolId && sfs.supplyDate <= `${selectedMonth}-31`)
            .sort((a,b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime())[0]?.mealPrice || appSettings.defaultMealPrice;
        
        const inspectionPart = appSettings.inspectionPercentage / 100;
        const schoolPart = 1 - inspectionPart;
        const partCantiniereJour = rationnaires * 5;
        const partCantiniereMois = partCantiniereJour * jourLePlusGrand;
        const partEcoleTotal = rationnaires * jourLePlusGrand * mealPrice;
        
        const cfcAVerser = partEcoleTotal * inspectionPart;
        const partEcoleMois = partEcoleTotal * schoolPart;
        const partEcoleJour = rationnaires * mealPrice * schoolPart;
        const solde = cfcAVerser - cfcReellementVerse;
        
        const financial = {
            rationnaires, partCantiniereJour, partCantiniereMois, cfcAVerser,
            partEcoleJour, partEcoleMois, jourLePlusGrand, solde
        };

        return { reportRows, financial };

    }, [selectedSchoolId, selectedMonth, foodItems, schoolFoodSupplies, schoolPreparationDays, newPrepDays, appSettings, cfcReellementVerse, stockInitialDuMois, rationnaires]);

    const handleDaysChange = (foodId: string, value: string) => {
        const newDays = parseInt(value, 10) || 0;
        const foodRow = calculationData.reportRows.find(r => r.foodId === foodId);
        
        if (foodRow && newDays > foodRow.daysRemaining) {
            addToast(`Impossible de dépasser les ${foodRow.daysRemaining} jours de préparation planifiés restants.`, 'error');
            return;
        }
        setNewPrepDays(prev => ({ ...prev, [foodId]: newDays < 0 ? 0 : newDays }));
    };

    const handleResetPrepDays = () => {
        if (isReadOnly) return;
        if (window.confirm("Êtes-vous sûr de vouloir mettre à zéro tous les jours de préparation pour ce mois ? Cette action n'est pas sauvegardée tant que vous ne cliquez pas sur 'Sauvegarder'.")) {
            setNewPrepDays({});
            addToast("Jours de préparation remis à zéro.", 'info');
        }
    };
    
    const handleSave = () => {
        if (!selectedSchoolId || !selectedMonth) {
            addToast("Veuillez sélectionner une école et un mois.", "error");
            return;
        }
        // 1. Save verification data
        setVerificationData(prev => {
            const newState: VerificationData = JSON.parse(JSON.stringify(prev));
            if (!newState[selectedSchoolId]) newState[selectedSchoolId] = {};
            newState[selectedSchoolId][selectedMonth] = { prepDays: newPrepDays, cfcReellementVerse: cfcReellementVerse };
            return newState;
        });
        addToast("Données du rapport sauvegardées avec succès!", 'success');

        // 2. Synchronize with JoursPreparationPage if the month is not validated
        if (preparationValidationStatus[selectedMonth]) {
            addToast("Les jours de préparation n'ont pas été mis à jour car le mois est déjà finalisé.", 'info');
        } else {
            setSchoolPreparationDays(prev => {
                const newState: SchoolPreparationDaysData = JSON.parse(JSON.stringify(prev));
                if (!newState[selectedSchoolId]) {
                    newState[selectedSchoolId] = {};
                }
                // Update the specific month's data with the new prep days
                newState[selectedSchoolId][selectedMonth] = { ...newPrepDays };
                return newState;
            });
            addToast("Les jours de préparation ont également été mis à jour.", 'success');
        }
        
        // Refocus on the first input after saving
        if (inputsContainerRef.current) {
            const firstInput = inputsContainerRef.current.querySelector<HTMLInputElement>('input:not([disabled])');
            if (firstInput) {
                firstInput.focus();
            }
        }
    };
    
    return (
      <div className="space-y-6 enter-nav-container">
           <FicheTasModal
                isOpen={isTasModalOpen}
                onClose={() => setIsTasModalOpen(false)}
                school={selectedSchool}
                month={selectedMonth}
                foodItems={foodItems}
                prepDays={newPrepDays}
                initialStocks={stockInitialDuMois}
            />
          <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-bold text-slate-800">Vérification du Rapport Mensuel</h3>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsTasModalOpen(true)} disabled={!selectedSchool || !selectedMonth} variant="secondary">
                        Fiche de TAS
                    </Button>
                    <Button onClick={onNavigateToRapportMensuel} variant="primary" icon={<ChevronRightIcon className="h-5 w-5"/>}>
                        Saisie Rapport Mensuel
                    </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                      <label htmlFor="school-select-verif" className="block text-sm font-medium text-slate-700 mb-1">École</label>
                      <select id="school-select-verif" value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                           <option value="" disabled>-- Choisir une école --</option>
                           {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                      </select>
                  </div>
                   <div>
                        <label htmlFor="month-select-verif" className="block text-sm font-medium text-slate-700 mb-1">Mois du Rapport</label>
                        <input type="month" id="month-select-verif" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full p-1.5 border rounded-md bg-white" />
                  </div>
              </div>

              {selectedSchool && selectedMonth ? (
                  <>
                    <div className="overflow-x-auto mb-6">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3">Denrée</th>
                                    <th className="px-4 py-3 text-center">Jours Restants (Plan)</th>
                                    <th className="px-4 py-3 text-center">Stock Initial</th>
                                    <th className="px-4 py-3 text-center">Nvx Jours Prep.</th>
                                    <th className="px-4 py-3 text-center">Conso. du Mois</th>
                                    <th className="px-4 py-3 text-center">Conso. Cumulative</th>
                                    <th className="px-4 py-3 text-center">Stock Final Théorique</th>
                                </tr>
                            </thead>
                            <tbody ref={inputsContainerRef}>
                                {calculationData.reportRows.map(item => (
                                    <tr key={item.foodId} className="border-b even:bg-slate-50 hover:bg-slate-100">
                                        <td className="px-4 py-2 font-medium">{item.foodName} ({item.unit})</td>
                                        <td className="px-4 py-2 text-center font-semibold">{item.displayedRemainingDays}</td>
                                        <td className="px-4 py-2 text-center">{item.stockInitial.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-2 text-center">
                                            <input
                                                type="number"
                                                value={newPrepDays[item.foodId] || ''}
                                                onChange={e => handleDaysChange(item.foodId, e.target.value)}
                                                onKeyDown={handleEnterNavigation}
                                                className={`w-24 p-1 border rounded-md text-center transition-colors ${
                                                    item.daysRemaining <= 0 ? 'border-red-500 bg-red-50' : 'border-slate-300'
                                                }`}
                                                placeholder="0"
                                                min="0"
                                                max={item.daysRemaining}
                                                disabled={item.daysRemaining <= 0 || isReadOnly}
                                                aria-label={`Jours de préparation pour ${item.foodName}`}
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center text-red-600">
                                            {item.consommationMois.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-2 text-center text-orange-600">
                                            {item.consommationCumulative.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                                        </td>
                                        <td className={`px-4 py-2 text-center font-bold ${item.stockFinalTheorique < 0 ? 'text-red-600' : 'text-blue-700'}`}>{item.stockFinalTheorique.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg border">
                        <h4 className="text-lg font-semibold text-slate-700 mb-2 text-center">Panneau Financier</h4>
                        <p className="text-center text-xs text-slate-500 mb-6">
                            Basé sur <span className="font-bold">{calculationData.financial.rationnaires || 0}</span> rationnaires
                            et <span className="font-bold">{calculationData.financial.jourLePlusGrand}</span> jours de préparation (max)
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            
                            <div className="space-y-6">
                                <div>
                                    <h5 className="font-bold text-slate-600 border-b pb-1 mb-2">Part Inspection</h5>
                                    <div className="flex justify-between text-sm">
                                        <span>CFC à Verser ({appSettings.inspectionPercentage}%):</span>
                                        <span className="font-bold">{(calculationData.financial.cfcAVerser || 0).toLocaleString('fr-FR', {maximumFractionDigits: 0})} {appSettings.currencySymbol}</span>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-600 border-b pb-1 mb-2">Part École</h5>
                                    <div className="flex justify-between text-sm">
                                        <span>Contribution / Jour ({100 - appSettings.inspectionPercentage}%):</span>
                                        <span className="font-bold">{(calculationData.financial.partEcoleJour || 0).toLocaleString('fr-FR', {maximumFractionDigits: 0})} {appSettings.currencySymbol}</span>
                                    </div>
                                        <div className="flex justify-between text-sm mt-1">
                                        <span>Contribution / Mois ({100 - appSettings.inspectionPercentage}%):</span>
                                        <span className="font-bold">{(calculationData.financial.partEcoleMois || 0).toLocaleString('fr-FR', {maximumFractionDigits: 0})} {appSettings.currencySymbol}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h5 className="font-bold text-slate-600 border-b pb-1 mb-2">Part Cantinière</h5>
                                        <div className="flex justify-between text-sm">
                                        <span>Contribution / Jour:</span>
                                        <span className="font-bold">{(calculationData.financial.partCantiniereJour || 0).toLocaleString('fr-FR', {maximumFractionDigits: 0})} {appSettings.currencySymbol}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span>Contribution / Mois:</span>
                                        <span className="font-bold">{(calculationData.financial.partCantiniereMois || 0).toLocaleString('fr-FR', {maximumFractionDigits: 0})} {appSettings.currencySymbol}</span>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-600 border-b pb-1 mb-2">Contribution CFC</h5>
                                    <label htmlFor="cfcReellementVerse" className="block text-sm font-medium text-slate-700">Montant CFC Réellement Versé</label>
                                    <input
                                        id="cfcReellementVerse"
                                        type="number"
                                        value={cfcReellementVerse}
                                        onChange={e => setCfcReellementVerse(Number(e.target.value))}
                                        onKeyDown={handleEnterNavigation}
                                        disabled={isReadOnly}
                                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                                        placeholder="0"
                                    />
                                    <div className={`flex justify-between text-sm mt-2 font-semibold ${calculationData.financial.solde > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        <span>Solde:</span>
                                        <span>{(calculationData.financial.solde || 0).toLocaleString('fr-FR', {maximumFractionDigits: 0})} {appSettings.currencySymbol}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="warning" onClick={handleResetPrepDays} icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>
                            Mettre jours à 0
                        </Button>
                        <Button variant="primary" onClick={handleSave} icon={<SaveIcon className="h-5 w-5" />} disabled={isReadOnly}>
                            Sauvegarder les Données du Mois
                        </Button>
                    </div>

                  </>
              ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-lg">
                      <p className="text-slate-500">Veuillez sélectionner une école et un mois pour commencer.</p>
                  </div>
              )}
          </div>
      </div>
    );
};

export default VerificationRapportPage;
import React, { useMemo } from 'react';
import type { Alert } from '../../types';
import { ChartIcon, UsersIcon, GiftIcon, WalletIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import AlertsWidget from './AlertsWidget';
import StatCard from './StatCard';
import { MainMenuId } from '../../constants';


const DefaultDashboardContent: React.FC = () => {
    const { 
        appSettings,
        ieppData, 
        schools, 
        schoolFoodSupplies,
        depenses,
        foodItems,
        verificationData,
        schoolPreparationDays,
        calendarEvents,
        dons,
        donateurs,
        foodItemsDons,
        schoolPreparationDaysDons,
        schoolFoodSuppliesDons,
    } = useAppContext();
    
    const alerts = useMemo(() => {
        const generatedAlerts: Alert[] = [];
        const now = new Date();
        const alertSettings = appSettings.dashboardAlerts || { stock: true, verify: true, event: true };
    
        if (alertSettings.stock) {
            const allVerifiedMonths = Array.from(new Set(Object.values(verificationData).flatMap(schoolData => Object.keys(schoolData)))).sort();
            const latestVerifiedMonth = allVerifiedMonths.length > 0 ? allVerifiedMonths[allVerifiedMonths.length - 1] : null;
        
            if (latestVerifiedMonth) {
                const stockData = foodItems.map(food => {
                    const previousMonths = allVerifiedMonths.filter(m => m < latestVerifiedMonth);
                    
                    let receivedBefore = 0;
                    schoolFoodSupplies.forEach(supply => {
                        if (supply.supplyDate < `${latestVerifiedMonth}-01`) {
                            receivedBefore += supply.foodQuantities[food.id] || 0;
                        }
                    });
        
                    let consumedBefore = 0;
                    previousMonths.forEach(monthKey => {
                        schools.forEach(school => {
                            const monthData = verificationData[school.id]?.[monthKey];
                            if (monthData) {
                                const prepDays = monthData.prepDays[food.id] || 0;
                                const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
                                consumedBefore += rationnaires * prepDays * food.rationPerChild;
                            }
                        });
                    });
                    
                    const stockAtStartOfMonth = receivedBefore - consumedBefore;
        
                    const receivedThisMonth = schoolFoodSupplies
                        .filter(s => s.supplyDate.startsWith(latestVerifiedMonth))
                        .reduce((sum, supply) => sum + (supply.foodQuantities[food.id] || 0), 0);
                    
                    let consumedThisMonth = 0;
                    schools.forEach(school => {
                         const monthData = verificationData[school.id]?.[latestVerifiedMonth];
                         if (monthData) {
                            const prepDays = monthData.prepDays[food.id] || 0;
                            const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
                            consumedThisMonth += rationnaires * prepDays * food.rationPerChild;
                        }
                    });
        
                    const currentStock = stockAtStartOfMonth + receivedThisMonth - consumedThisMonth;
                    
                    const totalDailyConsumption = schools.reduce((sum, school) => {
                        const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
                        return sum + (rationnaires * food.rationPerChild);
                    }, 0);
        
                    const daysRemaining = totalDailyConsumption > 0 ? currentStock / totalDailyConsumption : Infinity;
        
                    return { ...food, daysRemaining };
                });
        
                stockData.forEach(food => {
                    if (food.lowStockThreshold > 0 && food.daysRemaining < food.lowStockThreshold && food.daysRemaining !== Infinity) {
                        generatedAlerts.push({
                            id: `stock-${food.id}`,
                            type: 'warning',
                            title: 'Stock Faible',
                            description: `Le stock de ${food.name} est bas. Il reste environ ${Math.floor(food.daysRemaining)} jours.`,
                        });
                    }
                });
            }
        }
    
        if (alertSettings.verify) {
            const allPlannedMonths = Array.from(new Set(Object.values(schoolPreparationDays).flatMap(schoolData => Object.keys(schoolData)))).sort();
            const latestPlannedMonth = allPlannedMonths.length > 0 ? allPlannedMonths[allPlannedMonths.length - 1] : null;
            
            if (latestPlannedMonth) {
                 schools.forEach(school => {
                    const hasPlan = Object.values(schoolPreparationDays[school.id]?.[latestPlannedMonth] || {}).some(days => Number(days) > 0);
                    const hasVerification = verificationData[school.id]?.[latestPlannedMonth] !== undefined;
                    if (hasPlan && !hasVerification) {
                         const monthName = new Date(`${latestPlannedMonth}-02`).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                         generatedAlerts.push({
                            id: `verify-${school.id}-${latestPlannedMonth}`,
                            type: 'info',
                            title: 'Rapport en Attente',
                            description: `Le rapport de vérification pour ${school.name} pour ${monthName} est en attente.`,
                        });
                    }
                 });
            }
        }
    
        if (alertSettings.event) {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(now.getDate() + 7);
        
            calendarEvents.forEach(event => {
                const eventDate = new Date(`${event.date}T00:00:00`);
                if(eventDate >= now && eventDate <= sevenDaysFromNow) {
                    generatedAlerts.push({
                        id: `event-${event.id}`,
                        type: 'info',
                        title: 'Événement à Venir',
                        description: `${event.title} le ${eventDate.toLocaleDateString('fr-FR')}.`,
                    });
                }
            });
        }
    
        return generatedAlerts;
    }, [appSettings.dashboardAlerts, foodItems, schools, schoolFoodSupplies, schoolPreparationDays, verificationData, calendarEvents]);

    const totalSchoolStudents = useMemo(() => schools.reduce((sum, school) => sum + school.studentsGirls + school.studentsBoys, 0), [schools]);
    const totalRationnaires = useMemo(() => schools.reduce((sum, school) => sum + school.rationnaireGirls + school.rationnaireBoys, 0), [schools]);
    const { schoolsWithDonsCount, studentsInDonsSchools, rationnairesInDonsSchools } = useMemo(() => {
        const schoolsWithDonsIds = new Set(dons.filter(don => don.schoolId).map(don => don.schoolId as string));
        const schoolsWithDons = schools.filter(school => schoolsWithDonsIds.has(school.id));
        const count = schoolsWithDons.length;
        const studentsCount = schoolsWithDons.reduce((sum, school) => sum + school.studentsGirls + school.studentsBoys, 0);
        const rationnairesCount = schoolsWithDons.reduce((sum, school) => sum + school.rationnaireGirls + school.rationnaireBoys, 0);
        return { schoolsWithDonsCount: count, studentsInDonsSchools: studentsCount, rationnairesInDonsSchools: rationnairesCount };
    }, [dons, schools]);

    const totalDepenses = useMemo(() => depenses.reduce((sum, depense) => sum + depense.montant, 0), [depenses]);
    
    const totalCFCVerse = useMemo(() => {
        const inspectionPart = appSettings.inspectionPercentage / 100;

        const cfcGVT = schools.reduce((schoolSum, school) => {
            const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
            if (rationnaires === 0) return schoolSum;

            const schoolPrepData = schoolPreparationDays[school.id] || {};
            
            const schoolTotalCFC = Object.keys(schoolPrepData).reduce((monthSum, monthKey) => {
                const mealPrice = schoolFoodSupplies
                    .filter(sfs => sfs.schoolId === school.id && sfs.supplyDate <= `${monthKey}-31`)
                    .sort((a, b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime())[0]?.mealPrice || appSettings.defaultMealPrice;

                const monthPrepData = schoolPrepData[monthKey] || {};
                const jourMax = Object.values(monthPrepData).length > 0 ? Math.max(0, ...Object.values(monthPrepData).map(Number)) : 0;
                
                const cfcForMonth = rationnaires * mealPrice * jourMax * inspectionPart;
                return monthSum + cfcForMonth;
            }, 0);
            
            return schoolSum + schoolTotalCFC;
        }, 0);

        const cfcDons = schools.reduce((schoolSum, school) => {
            const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
            if (rationnaires === 0) return schoolSum;
            
            const schoolPrepDataDons = schoolPreparationDaysDons[school.id] || {};
            
            const schoolTotalValue = Object.keys(schoolPrepDataDons).reduce((monthSum, monthKey) => {
                const mealPrice = schoolFoodSuppliesDons
                    .filter(sfs => sfs.schoolId === school.id && sfs.supplyDate <= `${monthKey}-31`)
                    .sort((a, b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime())[0]?.mealPrice || 25;

                const monthPrepData = schoolPrepDataDons[monthKey] || {};
                const jourMax = Object.values(monthPrepData).length > 0 ? Math.max(0, ...Object.values(monthPrepData).map(Number)) : 0;
                
                const valueForMonth = rationnaires * mealPrice * jourMax;
                return monthSum + valueForMonth;
            }, 0);

            return schoolSum + schoolTotalValue;
        }, 0);

        return cfcGVT + cfcDons;
    }, [
        appSettings.inspectionPercentage, appSettings.defaultMealPrice, schools,
        schoolPreparationDays, schoolFoodSupplies, schoolPreparationDaysDons, schoolFoodSuppliesDons
    ]);

    const totalDonateurs = useMemo(() => donateurs.length, [donateurs]);
    const totalValeurDons = useMemo(() => dons.reduce((sum, don) => sum + don.valeurEstimee, 0), [dons]);

    const stockGVT = useMemo(() => {
        return foodItems.map(food => {
            let totalRecuGlobal = 0;
            let stockRestantGlobal = 0;

            schools.forEach(school => {
                const denreeInitialeEcole = schoolFoodSupplies
                    .filter(supply => supply.schoolId === school.id)
                    .reduce((sum, supply) => sum + (supply.foodQuantities[food.id] || 0), 0);
                
                totalRecuGlobal += denreeInitialeEcole;

                const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
                const schoolPrepData = schoolPreparationDays[school.id] || {};
                // FIX: Correctly type the parameters in the reduce function to resolve the arithmetic operation error.
                const consommationTotaleEcole = Object.values(schoolPrepData).reduce<number>((monthSum, monthData: Record<string, number>) => { 
                    const prepDays = monthData[food.id] || 0;
                    const consommationMois = rationnaires * prepDays * food.rationPerChild;
                    return monthSum + consommationMois;
                }, 0); 
                
                const resteEcole = denreeInitialeEcole - consommationTotaleEcole;
                stockRestantGlobal += resteEcole;
            });
            
            return { ...food, totalRecu: totalRecuGlobal, stock: stockRestantGlobal };
        });
    }, [foodItems, schools, schoolFoodSupplies, schoolPreparationDays]);

    const stockDons = useMemo(() => {
        return foodItemsDons.map(food => {
            let totalRecuGlobal = 0;
            let stockRestantGlobal = 0;

            const donsGeneraux = dons
                .filter(d => d.type === 'Vivres' && d.foodQuantities && !d.schoolId)
                .reduce((sum, d) => sum + (d.foodQuantities![food.id] || 0), 0);
            
            totalRecuGlobal += donsGeneraux;
            stockRestantGlobal += donsGeneraux;

            schools.forEach(school => {
                const denreeInitialeEcole = dons
                    .filter(d => d.type === 'Vivres' && d.foodQuantities && d.schoolId === school.id)
                    .reduce((sum, d) => sum + (d.foodQuantities![food.id] || 0), 0);

                totalRecuGlobal += denreeInitialeEcole;

                const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
                const schoolPrepDataDons = schoolPreparationDaysDons[school.id] || {};
                // FIX: Correctly type the parameters in the reduce function to resolve the arithmetic operation error.
                const consommationTotaleEcole = Object.values(schoolPrepDataDons).reduce<number>((monthSum, monthData: Record<string, number>) => { 
                    const prepDays = monthData[food.id] || 0;
                    const consommationMois = rationnaires * prepDays * food.rationPerChild;
                    return monthSum + consommationMois;
                }, 0); 
                
                const resteEcole = denreeInitialeEcole - consommationTotaleEcole;
                stockRestantGlobal += resteEcole;
            });
            
            return { ...food, totalRecu: totalRecuGlobal, stock: stockRestantGlobal };
        });
    }, [foodItemsDons, dons, schoolPreparationDaysDons, schools]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-[var(--color-bg-card)] p-4 md:p-6 rounded-lg [box-shadow:var(--shadow-md)]">
                    <h3 className="text-lg font-semibold text-[var(--color-text-heading)] mb-4">Informations Générales</h3>
                    <div className="space-y-3 text-sm">
                        {ieppData.schoolYear && (
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--color-text-muted)]">Année Scolaire:</span>
                                <span className="font-semibold text-[var(--color-text-base)]">{ieppData.schoolYear}</span>
                            </div>
                        )}
                        {ieppData.iepp && (
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--color-text-muted)]">Nom de l’Inspection:</span>
                                <span className="font-semibold text-[var(--color-text-base)]">{ieppData.iepp}</span>
                            </div>
                        )}
                        {ieppData.inspectorName && (
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--color-text-muted)]">Nom de l’Inspecteur:</span>
                                <span className="font-semibold text-[var(--color-text-base)]">{ieppData.inspectorName}</span>
                            </div>
                        )}
                        {(!ieppData.schoolYear && !ieppData.iepp && !ieppData.inspectorName) && (
                            <p className="text-xs text-center text-[var(--color-text-muted)] py-2">Aucune information IEPP saisie.</p>
                        )}

                        <div className="pt-3 mt-3 border-t border-[var(--color-border-base)]">
                            {schools.length > 0 ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--color-text-muted)]">Nombre d’écoles inscrites:</span>
                                        <span className="font-semibold text-[var(--color-text-base)]">{schools.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--color-text-muted)]">Effectif des Écoles:</span>
                                        <span className="font-semibold text-[var(--color-text-base)]">{totalSchoolStudents.toLocaleString('fr-FR')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--color-text-muted)]">Effectif des Rationnaires:</span>
                                        <span className="font-semibold text-[var(--color-text-base)]">{totalRationnaires.toLocaleString('fr-FR')}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-center text-[var(--color-text-muted)] py-2">Aucune école inscrite.</p>
                            )}
                        </div>

                        {appSettings.optionalModules?.[MainMenuId.GestionDons] && (
                            <div className="pt-3 mt-3 border-t border-[var(--color-border-base)]">
                                {schoolsWithDonsCount > 0 ? (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--color-text-muted)]">Nombre d'écoles (Dons):</span>
                                            <span className="font-semibold text-[var(--color-text-base)]">{schoolsWithDonsCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--color-text-muted)]">Effectif École (Dons):</span>
                                            <span className="font-semibold text-[var(--color-text-base)]">{studentsInDonsSchools.toLocaleString('fr-FR')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--color-text-muted)]">Effectif Rationnaire (Dons):</span>
                                            <span className="font-semibold text-[var(--color-text-base)]">{rationnairesInDonsSchools.toLocaleString('fr-FR')}</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-center text-[var(--color-text-muted)] py-2">Aucune donnée de don disponible.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <AlertsWidget alerts={alerts} />
            </div>

            <div className="lg:col-span-3 space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard title="Total CFC Versé" value={`${totalCFCVerse.toLocaleString('fr-FR', {maximumFractionDigits: 0})} ${appSettings.currencySymbol}`} icon={<ChartIcon className="h-7 w-7 text-white"/>} colorClass="bg-green-500" />
                    <StatCard title="Dépenses Cumulées" value={`${totalDepenses.toLocaleString('fr-FR')} ${appSettings.currencySymbol}`} icon={<WalletIcon className="h-7 w-7 text-white"/>} colorClass="bg-red-500" />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard title="Donateurs Actifs" value={totalDonateurs.toLocaleString('fr-FR')} icon={<UsersIcon className="h-7 w-7 text-white"/>} colorClass="bg-purple-500" />
                    <StatCard title="Valeur Totale des Dons" value={`${totalValeurDons.toLocaleString('fr-FR')} ${appSettings.currencySymbol}`} icon={<GiftIcon className="h-7 w-7 text-white"/>} colorClass="bg-pink-500" />
                </div>

                <div className="bg-[var(--color-bg-card)] p-4 md:p-6 rounded-lg [box-shadow:var(--shadow-md)]">
                    <h3 className="text-lg font-semibold text-[var(--color-text-heading)] mb-4">État Détaillé des Stocks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold text-[var(--color-text-base)] mb-2 border-b pb-2">Vivres (GVT)</h4>
                            <div className="space-y-3">
                                {stockGVT.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-sm font-medium">
                                            <span className="text-[var(--color-text-muted)] text-left">Denrée</span>
                                            <span className="text-[var(--color-text-muted)] text-right">Reçu</span>
                                            <span className="text-[var(--color-text-muted)] text-right">Restant</span>
                                        </div>
                                        {stockGVT.map(food => (
                                            <div key={food.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-sm items-center border-b border-dashed border-[var(--color-border-base)] last:border-b-0 py-1">
                                                <span className="truncate">{food.name} ({food.unit})</span>
                                                <span className="text-right">{food.totalRecu.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span>
                                                <span className={`font-semibold text-right ${food.stock < 0 ? 'text-red-500' : 'text-[var(--color-text-base)]'}`}>{food.stock.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <p className="text-xs text-center text-[var(--color-text-muted)] py-2">Aucune denrée GVT configurée.</p>
                                )}
                            </div>
                        </div>

                        <div>
                             <h4 className="font-semibold text-[var(--color-text-base)] mb-2 border-b pb-2">Vivres (Dons)</h4>
                             <div className="space-y-3">
                                {stockDons.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-sm font-medium">
                                            <span className="text-[var(--color-text-muted)] text-left">Denrée</span>
                                            <span className="text-[var(--color-text-muted)] text-right">Reçu</span>
                                            <span className="text-[var(--color-text-muted)] text-right">Restant</span>
                                        </div>
                                        {stockDons.map(food => (
                                            <div key={food.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-sm items-center border-b border-dashed border-[var(--color-border-base)] last:border-b-0 py-1">
                                                <span className="truncate">{food.name} ({food.unit})</span>
                                                <span className="text-right">{food.totalRecu.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span>
                                                <span className={`font-semibold text-right ${food.stock < 0 ? 'text-red-500' : 'text-[var(--color-text-base)]'}`}>{food.stock.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <p className="text-xs text-center text-[var(--color-text-muted)] py-2">Aucune denrée de don configurée.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DefaultDashboardContent;
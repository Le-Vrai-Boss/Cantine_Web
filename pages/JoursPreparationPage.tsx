import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ExportIcon, ImportIcon, ResetIcon, LockIcon, CheckIcon, SearchIcon } from '../components/Icons';
import { Button } from '../components/Button';
import * as XLSX from 'xlsx';
import { PasswordConfirmModal } from '../components/PasswordConfirmModal';
import { SchoolPreparationDaysData } from '../types';
import { handleEnterNavigation, openImportDialog } from '../utils/uiHelpers';


const JoursPreparationPage: React.FC<{ isReadOnly?: boolean, currentUserLevel: number | null }> = ({ isReadOnly = false, currentUserLevel }) => {
    const { 
        appSettings,
        ieppData, 
        schools,
        foodItems, 
        schoolPreparationDays, 
        setSchoolPreparationDays,
        globalMonth,
        preparationValidationStatus,
        setPreparationValidationStatus,
        logAction
    } = useAppContext();
    const { addToast } = useToast();
    const [activeMonth, setActiveMonth] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'reset' | 'unlock' | null>(null);
    const [highlightedSchools, setHighlightedSchools] = useState<string[]>([]);

    const isMonthValidated = useMemo(() => !!preparationValidationStatus[activeMonth], [preparationValidationStatus, activeMonth]);
    
    const sortedSchools = useMemo(() => [...schools].sort((a,b) => a.name.localeCompare(b.name)), [schools]);

    const totalPrepDaysPerFoodPerSchool = useMemo(() => {
        const totals: Record<string, Record<string, number>> = {};
        schools.forEach(school => {
            totals[school.id] = {};
            const prepDaysForSchool = schoolPreparationDays[school.id] || {};
            foodItems.forEach(food => {
                // FIX: Correctly type the accumulator and current value in the reduce function to resolve the 'unknown' type error.
                const totalDaysForFood = Object.values(prepDaysForSchool).reduce(
                    (total: number, monthData: Record<string, number>) => total + (monthData[food.id] || 0),
                    0
                );
                totals[school.id][food.id] = totalDaysForFood;
            });
        });
        return totals;
    }, [schoolPreparationDays, foodItems, schools]);

    const availableMonths = useMemo(() => {
        const monthsToShow: { key: string, name: string }[] = [];
        const firstPrepDateStr = ieppData.firstPreparationDate || new Date().toISOString();
        
        let currentDate = new Date(firstPrepDateStr);
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        for (let i = 0; i < 12 * 5; i++) { 
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const monthKey = `${year}-${month}`;

            const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
            monthsToShow.push({ key: monthKey, name: monthName.charAt(0).toUpperCase() + monthName.slice(1) });
            
            const hasDataForThisMonth = Object.values(schoolPreparationDays).some(schoolData => 
                schoolData[monthKey] && Object.values(schoolData[monthKey]).some(days => Number(days) > 0)
            );

            if (!hasDataForThisMonth) {
                break;
            }

            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return monthsToShow; 

    }, [ieppData.firstPreparationDate, schoolPreparationDays]);

    useEffect(() => {
        if (globalMonth && availableMonths.some(m => m.key === globalMonth)) {
            setActiveMonth(globalMonth);
        } else if (!activeMonth && availableMonths.length > 0) {
            setActiveMonth(availableMonths[availableMonths.length - 1].key);
        } else if (activeMonth && !availableMonths.some(m => m.key === activeMonth) && availableMonths.length > 0) {
            setActiveMonth(availableMonths[availableMonths.length - 1].key);
        }
        setHighlightedSchools([]);
    }, [globalMonth, availableMonths, activeMonth]);

    const handleInputChange = (schoolId: string, foodId: string, value: string) => {
        const dayCount = Math.max(0, parseInt(value, 10) || 0);

        const foodItem = foodItems.find(item => item.id === foodId);
        if (!foodItem) return;
        
        const limit = foodItem.operatingDays;
        const currentValueInMonth = schoolPreparationDays[schoolId]?.[activeMonth]?.[foodId] || 0;
        const totalUsedForSchool = totalPrepDaysPerFoodPerSchool[schoolId]?.[foodId] || 0;
        
        const newTotalUsed = totalUsedForSchool - currentValueInMonth + dayCount;
        
        if (dayCount > currentValueInMonth && limit > 0 && newTotalUsed > limit) {
            addToast(`Limite de ${limit} jours atteinte. Augmentation impossible.`, 'error');
            return;
        }

        setSchoolPreparationDays(prev => {
            const newState: SchoolPreparationDaysData = JSON.parse(JSON.stringify(prev));
            if (!newState[schoolId]) {
                newState[schoolId] = {};
            }
            if (!newState[schoolId][activeMonth]) {
                newState[schoolId][activeMonth] = {};
            }
            newState[schoolId][activeMonth][foodId] = dayCount;
            return newState;
        });
    };
    
    const performResetMonth = () => {
        if (!activeMonth) return;
        setSchoolPreparationDays(prev => {
            const newState: SchoolPreparationDaysData = JSON.parse(JSON.stringify(prev));
            schools.forEach(school => {
                if (!newState[school.id]) newState[school.id] = {};
                const newMonthData: Record<string, number> = {};
                foodItems.forEach(foodItem => { newMonthData[foodItem.id] = 0; });
                newState[school.id][activeMonth] = newMonthData;
            });
            return newState;
        });
        addToast(`Les jours de préparation pour ${activeMonth} ont été réinitialisés.`, 'info');
    };

    const handleActionRequiringPassword = (action: 'reset' | 'unlock') => {
        setActionToConfirm(action);
        if (!appSettings.password || currentUserLevel !== 1) {
            const message = action === 'reset'
                ? `Êtes-vous sûr de vouloir réinitialiser les jours pour ${activeMonth} ?`
                : `Êtes-vous sûr de vouloir déverrouiller le mois ${activeMonth} ?`;
            
            if (window.confirm(message)) {
                handleConfirmSuccess();
            } else {
                setActionToConfirm(null);
            }
        } else {
            setIsConfirmModalOpen(true);
        }
    };
    
    const handleConfirmSuccess = () => {
        if (actionToConfirm === 'unlock') {
            setPreparationValidationStatus(prev => ({ ...prev, [activeMonth]: false }));
            addToast(`Le mois ${activeMonth} est déverrouillé.`, 'info');
            logAction(`Déverrouillage des jours de préparation pour le mois ${activeMonth}.`, currentUserLevel);
        } else if (actionToConfirm === 'reset') {
            performResetMonth();
            setPreparationValidationStatus(prev => ({ ...prev, [activeMonth]: false })); // Also unlock
            logAction(`Réinitialisation des jours de préparation pour le mois validé ${activeMonth}.`, currentUserLevel);
        }
        setActionToConfirm(null);
    };

    const handleValidateMonth = () => {
        if (!activeMonth) return;
        setPreparationValidationStatus(prev => ({ ...prev, [activeMonth]: true }));
        addToast(`Les données pour ${activeMonth} ont été finalisées.`, 'success');
        logAction(`Validation des jours de préparation pour le mois ${activeMonth}.`, currentUserLevel);
    };

    const handleExport = () => {
        if (!activeMonth) return;
        
        const dataToExport = sortedSchools.map(school => {
            const row: Record<string, string | number> = { 'École': school.name };
            const monthData = schoolPreparationDays[school.id]?.[activeMonth] || {};
            foodItems.forEach(food => {
                row[food.name] = monthData[food.id] || 0;
            });
            return row;
        });
        
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Jours Prep ${activeMonth}`);
        XLSX.writeFile(wb, `jours_preparation_ecoles_${activeMonth}.xlsx`);
        addToast(`Jours de préparation pour ${activeMonth} exportés.`, 'success');
    };

    const handleImport = (file: File) => {
        if (!activeMonth) return;
        const schoolNameMap = new Map(schools.map(s => [s.name.toLowerCase(), s.id]));
        const foodNameMap = new Map(foodItems.map(f => [f.name.toLowerCase(), f.id]));
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

                setSchoolPreparationDays(prev => {
                    const newState = JSON.parse(JSON.stringify(prev)) as SchoolPreparationDaysData;
                    json.forEach((row: Record<string, unknown>) => {
                        const schoolName = String(row['École'] || '').toLowerCase();
                        const schoolId = schoolNameMap.get(schoolName);

                        // FIX: Correctly create nested objects to avoid indexing errors by ensuring parent objects exist before assigning to child properties.
                        if (schoolId) {
                            if (!newState[schoolId]) {
                                newState[schoolId] = {};
                            }
                            const schoolData = newState[schoolId];
                            if (!schoolData[activeMonth]) {
                                schoolData[activeMonth] = {};
                            }
                            const monthData = schoolData[activeMonth];

                            Object.keys(row).forEach(colName => {
                                const foodId = foodNameMap.get(colName.toLowerCase());
                                if (foodId) {
                                    const days = Number(row[colName]);
                                    if (!isNaN(days)) {
                                        monthData[foodId] = days;
                                    }
                                }
                            });
                        }
                    });
                    return newState;
                });

                addToast(`Données pour ${activeMonth} importées avec succès.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation Jours Préparation:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleIdentifyEmptySchools = () => {
        if (highlightedSchools.length > 0) {
            setHighlightedSchools([]);
            addToast("Mise en évidence effacée.", 'info');
            return;
        }

        if (!activeMonth) return;

        const emptySchools = sortedSchools
            .filter(school => {
                const monthData = schoolPreparationDays[school.id]?.[activeMonth];
                if (!monthData || Object.keys(monthData).length === 0) {
                    return true;
                }
                return foodItems.every(food => (monthData[food.id] || 0) === 0);
            })
            .map(school => school.id);

        if (emptySchools.length > 0) {
            setHighlightedSchools(emptySchools);
            addToast(`${emptySchools.length} école(s) sans jours de préparation identifiée(s).`, 'success');
        } else {
            addToast("Toutes les écoles ont des jours de préparation inscrits pour ce mois.", 'info');
        }
    };

    return (
        <>
            <PasswordConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSuccess}
                title={actionToConfirm === 'reset' ? 'Confirmer la Réinitialisation' : 'Confirmer le Déverrouillage'}
                description={
                    actionToConfirm === 'reset'
                        ? `Pour réinitialiser les données de ce mois finalisé, veuillez entrer le mot de passe Principal (Niveau 1).`
                        : `Pour modifier les données de ce mois finalisé, veuillez entrer le mot de passe Principal (Niveau 1).`
                }
            />
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4 border-b border-[var(--color-border-base)] pb-2">Inscription des Jours de Préparation par École</h3>
                
                <div className="flex items-center border-b border-[var(--color-border-base)] mb-6 overflow-x-auto">
                    {availableMonths.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveMonth(tab.key)}
                            disabled={isReadOnly}
                            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeMonth === tab.key
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary-dark)]'
                                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:border-[var(--color-border-base)]'
                            }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>

                {activeMonth ? (
                    <div>
                         <div className="flex flex-wrap items-center gap-3 mb-4">
                            <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                                Exporter
                            </Button>
                            <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly || isMonthValidated}>
                                Importer
                            </Button>
                            <Button onClick={() => handleActionRequiringPassword('reset')} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>
                                Mettre tout à 0
                            </Button>
                            <div className="flex-grow"></div>
                            <Button 
                                onClick={handleIdentifyEmptySchools}
                                variant="secondary" 
                                icon={<SearchIcon className="h-5 w-5" />}
                            >
                                {highlightedSchools.length > 0 ? "Effacer la sélection" : "Identifier écoles sans jours"}
                            </Button>
                            {currentUserLevel === 1 && (
                                isMonthValidated ? (
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                                            <CheckIcon className="h-5 w-5" />
                                            Données Finalisées
                                        </span>
                                        <Button onClick={() => handleActionRequiringPassword('unlock')} variant="secondary" icon={<LockIcon className="h-5 w-5" />}>
                                            Déverrouiller
                                        </Button>
                                    </div>
                                ) : (
                                    <Button onClick={handleValidateMonth} variant="primary" icon={<CheckIcon className="h-5 w-5" />}>
                                        Finaliser les données du mois
                                    </Button>
                                )
                            )}
                        </div>
                        {sortedSchools.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 sticky left-0 bg-[var(--color-bg-muted)] z-10">École</th>
                                            {foodItems.map(item => (
                                                <th key={item.id} scope="col" className="px-6 py-3 text-center">{item.name}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedSchools.map(school => (
                                            <tr key={school.id} className={`border-b border-[var(--color-border-base)] align-middle transition-colors ${highlightedSchools.includes(school.id) ? 'bg-yellow-100 hover:bg-yellow-200' : 'even:bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-muted)]'}`}>
                                                <td className={`px-6 py-4 font-bold text-[var(--color-text-heading)] sticky left-0 z-10 ${highlightedSchools.includes(school.id) ? 'bg-yellow-100' : 'bg-[var(--color-bg-card)] even:bg-[var(--color-bg-base)]'}`}>{school.name}</td>
                                                {foodItems.map(item => {
                                                    const totalUsedForSchool = totalPrepDaysPerFoodPerSchool[school.id]?.[item.id] || 0;
                                                    const limit = item.operatingDays || 0;
                                                    const isExhausted = limit > 0 && totalUsedForSchool >= limit;

                                                    return (
                                                        <td key={item.id} className="px-6 py-2 text-center">
                                                            <input
                                                                type="number"
                                                                value={schoolPreparationDays[school.id]?.[activeMonth]?.[item.id] || 0}
                                                                onChange={(e) => handleInputChange(school.id, item.id, e.target.value)}
                                                                onKeyDown={handleEnterNavigation}
                                                                disabled={isReadOnly || isMonthValidated}
                                                                className={`w-24 p-1 border rounded-md text-center transition-colors bg-transparent ${
                                                                    isExhausted ? 'border-red-500 bg-red-50' : 'border-[var(--color-border-input)]'
                                                                } disabled:bg-slate-100 disabled:cursor-not-allowed`}
                                                                min="0"
                                                            />
                                                             {isExhausted && (
                                                                <div 
                                                                    className="text-xs text-red-600 mt-1 whitespace-nowrap"
                                                                    title={`Limite de ${limit} jours atteinte. Total utilisé : ${totalUsedForSchool} jours.`}
                                                                >
                                                                    Jours épuisés
                                                                </div>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] rounded-lg">
                                <p>Aucune école n'a été ajoutée.</p>
                                <p className="text-xs mt-1">Veuillez d'abord ajouter des écoles dans la section "Informations".</p>
                            </div>
                        )}
                    </div>
                ) : (
                     <div className="text-center py-16 bg-[var(--color-bg-muted)] rounded-lg">
                        <p className="text-[var(--color-text-muted)]">
                            {availableMonths.length > 0 
                                ? "Veuillez sélectionner un mois pour commencer."
                                : "Aucun mois de préparation disponible. Vérifiez la 'Date de la première préparation' dans la section Informations > IEPP."
                            }
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default JoursPreparationPage;
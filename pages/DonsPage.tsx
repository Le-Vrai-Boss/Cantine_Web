import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SubMenuId } from '../constants';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { Donateur, Don, FoodItem, SchoolFoodSupply, LetterTemplate, SchoolPreparationDaysData } from '../types';
import { Button } from '../components/Button';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, SaveIcon, CloseIcon, CheckCircleIcon, SearchIcon, FileTextIcon, PlusIcon, EditIcon, PrinterIcon } from '../components/Icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { openImportDialog } from '../utils/uiHelpers';


// --- COPIED FROM Information.tsx AND ADAPTED ---
const DenreesDonsTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { 
        foodItemsDons, setFoodItemsDons,
        setDons,
        setSchoolPreparationDaysDons,
        setVerificationDataDons,
    } = useAppContext();
    const { addToast } = useToast();
    
    const addFoodItem = () => {
        const newFoodItem: FoodItem = {
            id: `${Date.now()}`, name: '', netWeight: 0, grossWeight: 0,
            boxPerPackage: 0, packaging: '', unit: '', rationPerChild: 0, operatingDays: 0, lowStockThreshold: 7
        };
        setFoodItemsDons(prev => [...prev, newFoodItem]);
    };

    const removeFoodItem = (idToRemove: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette denrée de don ? Toutes les données de dons et de préparation associées seront également supprimées.")) {
            return;
        }

        setFoodItemsDons(prev => prev.filter(item => item.id !== idToRemove));
        
        setDons(prev => prev.map(don => {
            if (don.type === 'Vivres' && don.foodQuantities) {
                const newQuantities = { ...don.foodQuantities };
                delete newQuantities[idToRemove];
                return { ...don, foodQuantities: newQuantities };
            }
            return don;
        }));

        setSchoolPreparationDaysDons(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            for (const schoolId in newState) {
                for (const monthKey in newState[schoolId]) {
                    if (newState[schoolId][monthKey][idToRemove] !== undefined) {
                         delete newState[schoolId][monthKey][idToRemove];
                    }
                }
            }
            return newState;
        });

        setVerificationDataDons(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            for (const schoolId in newState) {
                for (const monthKey in newState[schoolId]) {
                    if (newState[schoolId][monthKey].prepDays[idToRemove] !== undefined) {
                        delete newState[schoolId][monthKey].prepDays[idToRemove];
                    }
                }
            }
            return newState;
        });
        
        addToast("La denrée de don et toutes ses données associées ont été supprimées.", 'info');
    };


    const handleInputChange = (id: string, field: keyof Omit<FoodItem, 'id'>, value: string) => {
        setFoodItemsDons(prev => prev.map(item => {
            if (item.id !== id) {
                return item;
            }
    
            const newItem = { ...item };
            
            const numericFields: (keyof FoodItem)[] = ['netWeight', 'grossWeight', 'boxPerPackage', 'rationPerChild', 'operatingDays', 'lowStockThreshold'];
            const floatFields: (keyof FoodItem)[] = ['netWeight', 'grossWeight', 'rationPerChild'];
    
            if (numericFields.includes(field)) {
                const numValue = floatFields.includes(field) ? parseFloat(value) || 0 : parseInt(value, 10) || 0;
                Object.assign(newItem, { [field]: numValue });
            } else {
                Object.assign(newItem, { [field]: value });
            }
    
            return newItem;
        }));
    };

    const handleExport = () => {
        const dataToExport = foodItemsDons.map((item) => ({
            "Nom de la Denrée": item.name,
            "Unité": item.unit,
            "Ration par Enfant": item.rationPerChild,
            "Jours de fonctionnement": item.operatingDays,
            "Seuil d'alerte": item.lowStockThreshold
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Denrees Dons");
        XLSX.writeFile(wb, "liste_denrees_dons.xlsx");
        addToast("Liste des denrées (dons) exportée.", 'success');
    };

    const handleImport = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
                
                const newFoodItems: FoodItem[] = json.map((item, index) => ({
                    id: `${Date.now()}-${index}`,
                    name: String(item.name || ''),
                    netWeight: 0,
                    grossWeight: 0,
                    boxPerPackage: 0,
                    packaging: '',
                    unit: String(item.unit || ''),
                    rationPerChild: Number(item.rationPerChild || 0),
                    operatingDays: Number(item.operatingDays || 0),
                    lowStockThreshold: Number(item.lowStockThreshold || 7),
                }));
    
                setFoodItemsDons(prev => [...prev, ...newFoodItems]);
                addToast(`${newFoodItems.length} denrées (dons) importées et ajoutées.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation Denrées (Dons):", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Gestion des Denrées (Dons)</h3>
            <p className="text-sm text-slate-500 mb-4">Gérez ici la liste des denrées spécifiquement reçues en don. Cette liste est indépendante des denrées achetées.</p>
             <div className="flex items-center space-x-2 mb-4">
                 <Button onClick={addFoodItem} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={isReadOnly}>
                    Ajouter
                </Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter
                </Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>
                    Importer
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-4 py-3">N°</th>
                            <th scope="col" className="px-6 py-3 w-2/5">Nom de la Denrée</th>
                            <th scope="col" className="px-6 py-3">Unité</th>
                            <th scope="col" className="px-6 py-3">Ration/Enfant</th>
                            <th scope="col" className="px-6 py-3">Jours de fonct.</th>
                            <th scope="col" className="px-6 py-3">Seuil Alerte (j)</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {foodItemsDons.map((item, index) => (
                            <tr key={item.id} className="border-b even:bg-slate-50 hover:bg-slate-100 align-middle">
                                <td className="px-4 py-2 font-medium text-slate-900">{index + 1}</td>
                                <td className="px-6 py-2"><input type="text" value={item.name} onChange={e => handleInputChange(item.id, 'name', e.target.value)} disabled={isReadOnly} className="w-full p-1 border rounded-md" /></td>
                                <td className="px-6 py-2"><input type="text" value={item.unit} onChange={e => handleInputChange(item.id, 'unit', e.target.value)} disabled={isReadOnly} className="w-20 p-1 border rounded-md" /></td>
                                <td className="px-6 py-2"><input type="number" step="0.001" value={item.rationPerChild} onChange={e => handleInputChange(item.id, 'rationPerChild', e.target.value)} disabled={isReadOnly} className="w-24 p-1 border rounded-md" /></td>
                                <td className="px-6 py-2"><input type="number" value={item.operatingDays} onChange={e => handleInputChange(item.id, 'operatingDays', e.target.value)} disabled={isReadOnly} className="w-24 p-1 border rounded-md" /></td>
                                <td className="px-6 py-2"><input type="number" value={item.lowStockThreshold} onChange={e => handleInputChange(item.id, 'lowStockThreshold', e.target.value)} disabled={isReadOnly} className="w-24 p-1 border rounded-md" /></td>
                                <td className="px-6 py-2">
                                    <button onClick={() => removeFoodItem(item.id)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const DenreesEcoleDonsTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { schoolFoodSuppliesDons, setSchoolFoodSuppliesDons, schools, foodItemsDons, dons } = useAppContext();
    const { addToast } = useToast();

    const participatingSchoolIds = useMemo(() => {
        const schoolIds = new Set<string>();
        dons.forEach(don => {
            if (don.schoolId) {
                schoolIds.add(don.schoolId);
            }
        });
        return schoolIds;
    }, [dons]);

    const sortedSchools = useMemo(() =>
        [...schools]
            .filter(s => participatingSchoolIds.has(s.id))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [schools, participatingSchoolIds]
    );

    const suppliesMap = useMemo(() => new Map(schoolFoodSuppliesDons.map(s => [s.schoolId, s])), [schoolFoodSuppliesDons]);

    const updateSupply = (schoolId: string, updatedFields: Partial<Omit<SchoolFoodSupply, 'id' | 'schoolId'>>) => {
        setSchoolFoodSuppliesDons(prev => {
            const existingSupply = prev.find(s => s.schoolId === schoolId);
            if (existingSupply) {
                return prev.map(s => s.schoolId === schoolId ? { ...s, ...updatedFields } : s);
            } else {
                const newSupply: SchoolFoodSupply = {
                    id: `${Date.now()}`,
                    schoolId: schoolId,
                    foodQuantities: {},
                    supplyDate: new Date().toISOString().split('T')[0],
                    mealPrice: 25, // default for dons
                    ...updatedFields,
                };
                return [...prev, newSupply];
            }
        });
    };

    const handleMealPriceChange = (schoolId: string, price: string) => {
        const numPrice = parseInt(price, 10);
        if(isNaN(numPrice) || numPrice < 0) return;
        updateSupply(schoolId, { mealPrice: numPrice });
    };

    const handleOperatingDaysChange = (schoolId: string, foodId: string, days: string) => {
        const numDays = parseInt(days, 10);
        if (isNaN(numDays) || numDays < 0) return;

        const existingSupply = suppliesMap.get(schoolId);
        const newOperatingDays = { ...existingSupply?.operatingDays, [foodId]: numDays };
        updateSupply(schoolId, { operatingDays: newOperatingDays });
    };

    const handleExport = () => {
        const dataToExport = sortedSchools.map((school, index) => {
            const supply = suppliesMap.get(school.id);
            const row: Record<string, string | number> = {
                "N°": index + 1,
                "Nom de l’Ecole": school.name,
                "Prix du repas (Don)": supply?.mealPrice ?? 25,
            };
            foodItemsDons.forEach(food => {
                row[`${food.name} (${food.unit}) - Quantité Reçue`] = supply?.foodQuantities[food.id] || 0;
                row[`Jours de fonct. ${food.name}`] = supply?.operatingDays?.[food.id] ?? food.operatingDays;
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Approvisionnement Dons");
        XLSX.writeFile(wb, "approvisionnement_dons_ecole.xlsx");
        addToast("Approvisionnements (Dons) exportés.", 'success');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Gestion des Approvisionnements par École (Dons)</h3>
            <p className="text-sm text-slate-500 mb-4">Ce tableau récapitule les dons en vivres reçus par chaque école. Les quantités sont calculées automatiquement à partir de la "Liste des Dons". Vous pouvez ici ajuster le prix du repas estimé pour les dons et surcharger les jours de fonctionnement par denrée pour une école spécifique.</p>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter
                </Button>
            </div>
            {sortedSchools.length === 0 && <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">Aucune école bénéficiaire de dons en vivres pour le moment.</p>}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th className="px-2 py-3 sticky left-0 bg-slate-100 z-20">N°</th>
                            <th className="px-4 py-3 sticky left-10 bg-slate-100 z-20">Nom de l’Ecole</th>
                            <th className="px-4 py-3">Prix du repas (Don)</th>
                            {foodItemsDons.map(food => (
                                <th key={food.id} className="px-2 py-3 text-center" style={{ minWidth: '200px' }}>
                                   {food.name} ({food.unit})
                                   <div className="font-normal normal-case text-slate-500">Qté Reçue / Jours Fonct.</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSchools.map((school, index) => {
                            const supply = suppliesMap.get(school.id);
                            return (
                                <tr key={school.id} className="border-b even:bg-slate-50 hover:bg-slate-100 align-middle">
                                    <td className="px-2 py-2 font-medium text-slate-900 sticky left-0 bg-white even:bg-slate-50 z-10">{index + 1}</td>
                                    <td className="px-4 py-2 font-semibold sticky left-10 bg-white even:bg-slate-50 z-10">
                                        {school.name}
                                    </td>
                                    <td className="px-4 py-2">
                                        <input type="number" value={supply?.mealPrice ?? ''} onChange={e => handleMealPriceChange(school.id, e.target.value)} disabled={isReadOnly} className="w-24 p-1 border rounded-md" placeholder="25" />
                                    </td>
                                    {foodItemsDons.map(food => (
                                        <td key={food.id} className="px-2 py-2 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={supply?.foodQuantities[food.id] || '0'}
                                                    readOnly
                                                    className="w-24 p-1 border-0 rounded-md bg-slate-100 text-slate-500 cursor-not-allowed"
                                                />
                                                <span className="text-slate-400">/</span>
                                                 <input
                                                    type="number"
                                                    value={supply?.operatingDays?.[food.id] ?? ''}
                                                    onChange={(e) => handleOperatingDaysChange(school.id, food.id, e.target.value)}
                                                    disabled={isReadOnly}
                                                    className="w-24 p-1 border rounded-md"
                                                    placeholder={`Défaut: ${food.operatingDays}`}
                                                />
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- COPIED FROM Dashboard.tsx AND ADAPTED ---
const ResteJoursDonsTable: React.FC = () => {
    const { schools, foodItemsDons, schoolPreparationDaysDons, dons, schoolFoodSuppliesDons } = useAppContext();
    
    const participatingSchoolIds = useMemo(() => {
        const schoolIds = new Set<string>();
        dons.forEach(don => {
            if (don.schoolId) {
                schoolIds.add(don.schoolId);
            }
        });
        return schoolIds;
    }, [dons]);

    const sortedSchools = useMemo(() => 
        [...schools]
            .filter(s => participatingSchoolIds.has(s.id))
            .sort((a, b) => a.name.localeCompare(b.name)), 
    [schools, participatingSchoolIds]);

    const suppliesMap = useMemo(() => new Map(schoolFoodSuppliesDons.map(s => [s.schoolId, s])), [schoolFoodSuppliesDons]);

    const reportData = useMemo(() => {
        return sortedSchools.map(school => {
            const remainingDaysData: Record<string, string | number> = { schoolId: school.id, schoolName: school.name };
            const supply = suppliesMap.get(school.id);

            foodItemsDons.forEach(food => {
                const schoolSpecificOperatingDays = supply?.operatingDays?.[food.id];
                const initialOperatingDays = schoolSpecificOperatingDays !== undefined ? schoolSpecificOperatingDays : (food.operatingDays || 0);
                
                const prepDaysForSchool = schoolPreparationDaysDons[school.id] || {};
                // FIX: Correctly type the accumulator and current value in the reduce function to resolve the 'unknown' type error.
                const totalPreparationDaysUsed = Object.values(prepDaysForSchool).reduce(
                    (total: number, monthData: Record<string, number>) => total + (Number(monthData[food.id]) || 0), 0
                );
                const remainingDays = initialOperatingDays - totalPreparationDaysUsed;
                remainingDaysData[food.id] = remainingDays;
            });
            return remainingDaysData;
        });
    }, [sortedSchools, foodItemsDons, schoolPreparationDaysDons, suppliesMap]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Reste des Jours de Préparation (Dons)</h3>
            <p className="text-sm text-slate-500 mb-4">Ce tableau n'affiche que les écoles ayant été désignées comme bénéficiaires dans la "Liste des Dons".</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-4 py-3 sticky left-0 bg-slate-100 z-10">N°</th>
                            <th scope="col" className="px-6 py-3 sticky left-12 bg-slate-100 z-10 whitespace-nowrap">Nom de l'école</th>
                            {foodItemsDons.map(food => <th key={food.id} scope="col" className="px-6 py-3 text-center">{food.name}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((schoolData, index) => (
                            <tr key={schoolData.schoolId} className="border-b even:bg-slate-50 hover:bg-slate-100">
                                <td className="px-4 py-4 font-medium text-slate-900 sticky left-0 bg-white even:bg-slate-50 z-10">{index + 1}</td>
                                <td className="px-6 py-4 font-bold text-slate-900 sticky left-12 bg-white even:bg-slate-50 z-10 whitespace-nowrap">{schoolData.schoolName}</td>
                                {foodItemsDons.map(food => (
                                    <td key={food.id} className="px-6 py-4 text-center font-medium">{schoolData[food.id]}</td>
                                ))}
                            </tr>
                        ))}
                         {reportData.length === 0 && (
                            <tr><td colSpan={2 + foodItemsDons.length} className="text-center py-8 text-slate-500">Aucune école participante aux dons à afficher.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- COPIED FROM JoursPreparationPage.tsx AND ADAPTED ---
const JoursPreparationDonsPage: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { schools, foodItemsDons, schoolPreparationDaysDons, setSchoolPreparationDaysDons, globalMonth, firstPreparationDateDons, dons } = useAppContext();
    const { addToast } = useToast();
    const [activeMonth, setActiveMonth] = useState('');
    
    const participatingSchoolIds = useMemo(() => {
        const schoolIds = new Set<string>();
        dons.forEach(don => {
            if (don.schoolId) {
                schoolIds.add(don.schoolId);
            }
        });
        return schoolIds;
    }, [dons]);

    const sortedSchools = useMemo(() => 
        [...schools]
            .filter(s => participatingSchoolIds.has(s.id))
            .sort((a,b) => a.name.localeCompare(b.name)),
    [schools, participatingSchoolIds]);

    const availableMonths = useMemo(() => {
        const monthsToShow: { key: string, name: string }[] = [];
        const firstPrepDateStr = firstPreparationDateDons || new Date().toISOString();
        
        let currentDate = new Date(firstPrepDateStr);
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        for (let i = 0; i < 12 * 5; i++) { // Loop for a max of 5 years
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const monthKey = `${year}-${month}`;

            const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
            monthsToShow.push({ key: monthKey, name: monthName.charAt(0).toUpperCase() + monthName.slice(1) });
            
            // FIX: Correctly type the 'schoolData' parameter in the 'some' callback to resolve the 'unknown' type error.
            const hasDataForThisMonth = Object.values(schoolPreparationDaysDons).some((schoolData: Record<string, Record<string, number>>) => {
                const monthData = schoolData[monthKey];
                return monthData && Object.values(monthData).some((days: number) => Number(days) > 0);
            });

            if (!hasDataForThisMonth) {
                break;
            }

            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return monthsToShow;

    }, [firstPreparationDateDons, schoolPreparationDaysDons]);

    useEffect(() => {
        if (globalMonth && availableMonths.some(m => m.key === globalMonth)) {
            setActiveMonth(globalMonth);
        } else if (!activeMonth && availableMonths.length > 0) {
            setActiveMonth(availableMonths[availableMonths.length - 1].key);
        } else if (activeMonth && !availableMonths.some(m => m.key === activeMonth) && availableMonths.length > 0) {
            setActiveMonth(availableMonths[availableMonths.length - 1].key);
        } else if (availableMonths.length === 0) {
            setActiveMonth('');
        }
    }, [globalMonth, availableMonths, activeMonth]);

    const handleInputChange = (schoolId: string, foodId: string, value: string) => {
        const dayCount = Math.max(0, parseInt(value, 10) || 0);
        setSchoolPreparationDaysDons(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            if (!newState[schoolId]) newState[schoolId] = {};
            if (!newState[schoolId][activeMonth]) newState[schoolId][activeMonth] = {};
            newState[schoolId][activeMonth][foodId] = dayCount;
            return newState;
        });
    };

    const handleExport = () => {
        if (!activeMonth) return;
        
        const dataToExport = sortedSchools.map(school => {
            const row: Record<string, string | number> = { 'École': school.name };
            const monthData = schoolPreparationDaysDons[school.id]?.[activeMonth] || {};
            foodItemsDons.forEach(food => {
                row[food.name] = monthData[food.id] || 0;
            });
            return row;
        });
        
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Jours Prep Dons ${activeMonth}`);
        XLSX.writeFile(wb, `jours_preparation_dons_${activeMonth}.xlsx`);
        addToast(`Jours de préparation (dons) pour ${activeMonth} exportés.`, 'success');
    };

    const handleImport = (file: File) => {
        if (!activeMonth) return;
        const schoolNameMap = new Map(schools.map(s => [s.name.toLowerCase(), s.id]));
        const foodNameMap = new Map(foodItemsDons.map(f => [f.name.toLowerCase(), f.id]));
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

                setSchoolPreparationDaysDons(prev => {
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

                addToast(`Données (dons) pour ${activeMonth} importées avec succès.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation Jours Préparation (Dons):", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Jours de Préparation (Dons)</h3>
             <div className="flex items-center border-b border-slate-200 mb-6 overflow-x-auto">
                {availableMonths.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveMonth(tab.key)}
                        disabled={isReadOnly}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            activeMonth === tab.key
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        {tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}
                    </button>
                ))}
            </div>
             {activeMonth && (
                <div>
                    <p className="text-sm text-slate-500 mb-4">Ce tableau n'affiche que les écoles ayant été désignées comme bénéficiaires dans la "Liste des Dons".</p>
                    <div className="flex items-center space-x-3 mb-4">
                        <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                            Exporter
                        </Button>
                        <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>
                            Importer
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 sticky left-0 bg-slate-100 z-10">École</th>
                                    {foodItemsDons.map(item => (
                                        <th key={item.id} scope="col" className="px-6 py-3 text-center">{item.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedSchools.map(school => (
                                    <tr key={school.id} className="border-b even:bg-slate-50 hover:bg-slate-100 align-middle">
                                        <td className="px-6 py-4 font-bold text-slate-900 sticky left-0 bg-white even:bg-slate-50 z-10">{school.name}</td>
                                        {foodItemsDons.map(item => (
                                            <td key={item.id} className="px-6 py-2 text-center">
                                                <input
                                                    type="number"
                                                    value={schoolPreparationDaysDons[school.id]?.[activeMonth]?.[item.id] || 0}
                                                    onChange={(e) => handleInputChange(school.id, item.id, e.target.value)}
                                                    disabled={isReadOnly}
                                                    className="w-24 p-1 border rounded-md text-center"
                                                    min="0"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                 {sortedSchools.length === 0 && (
                                    <tr><td colSpan={1 + foodItemsDons.length} className="text-center py-8 text-slate-500">Aucune école participante aux dons à afficher.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COPIED FROM VerificationRapportPage.tsx AND ADAPTED ---
const VerificationRapportDonsPage: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { 
        appSettings, schools, foodItemsDons, schoolFoodSuppliesDons, 
        verificationDataDons, setVerificationDataDons, globalSchoolId, dons
    } = useAppContext();
    const { addToast } = useToast();

    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [newPrepDays, setNewPrepDays] = useState<Record<string, number>>({});
    const [cfcReellementVerse, setCfcReellementVerse] = useState<number>(0);

    const participatingSchools = useMemo(() => {
        const schoolIds = new Set<string>();
        dons.forEach(don => {
            if (don.schoolId) {
                schoolIds.add(don.schoolId);
            }
        });
        return schools.filter(school => schoolIds.has(school.id));
    }, [dons, schools]);

    useEffect(() => {
        const isGlobalSchoolIdValid = participatingSchools.some(s => s.id === globalSchoolId);
        if (globalSchoolId !== 'all' && isGlobalSchoolIdValid) {
            setSelectedSchoolId(globalSchoolId);
        } else if (!participatingSchools.some(s => s.id === selectedSchoolId) && participatingSchools.length > 0) {
            setSelectedSchoolId(participatingSchools[0].id)
        }
    }, [globalSchoolId, participatingSchools, selectedSchoolId]);

    useEffect(() => {
        if (!selectedMonth) {
            const now = new Date();
            setSelectedMonth(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);
        }
    }, [selectedMonth]);

    useEffect(() => {
        if (selectedSchoolId && selectedMonth) {
            const monthData = verificationDataDons[selectedSchoolId]?.[selectedMonth];
            setNewPrepDays(monthData?.prepDays || {});
            setCfcReellementVerse(monthData?.cfcReellementVerse || 0);
        } else {
            setNewPrepDays({});
            setCfcReellementVerse(0);
        }
    }, [selectedSchoolId, selectedMonth, verificationDataDons]);

    const selectedSchool = useMemo(() => schools.find(s => s.id === selectedSchoolId), [selectedSchoolId, schools]);
    const rationnaires = selectedSchool ? selectedSchool.rationnaireGirls + selectedSchool.rationnaireBoys : 0;

    const calculationData = useMemo(() => {
        if (!selectedSchoolId || !selectedMonth) {
            return { reportRows: [], financial: { cfcAVerser: 0, solde: 0 } };
        }
        
        const school = schools.find(s => s.id === selectedSchoolId);
        if (!school) {
            return { reportRows: [], financial: { cfcAVerser: 0, solde: 0 } };
        }
    
        const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
    
        const allVerifiedMonths = Object.keys(verificationDataDons[school.id] || {}).sort();
    
        const reportRows = foodItemsDons.map(food => {
             const totalDonated = dons
                .filter(d => d.type === 'Vivres' && d.foodQuantities && d.schoolId === selectedSchoolId)
                .reduce((sum, d) => sum + (d.foodQuantities![food.id] || 0), 0);

            let consumedBeforeThisMonth = 0;
            const previousMonths = allVerifiedMonths.filter(m => m < selectedMonth);
            previousMonths.forEach(monthKey => {
                const monthData = verificationDataDons[school.id]?.[monthKey];
                if (monthData) {
                    const prepDays = monthData.prepDays[food.id] || 0;
                    consumedBeforeThisMonth += rationnaires * prepDays * food.rationPerChild;
                }
            });

            const stockInitial = totalDonated - consumedBeforeThisMonth;

            const joursPrepares = newPrepDays[food.id] || 0;
    
            const consommationMois = rationnaires * joursPrepares * food.rationPerChild;

            const consommationTotale = consumedBeforeThisMonth + consommationMois;
    
            const resteMagasin = totalDonated - consommationTotale;
    
            return {
                foodId: food.id,
                foodName: food.name,
                unit: food.unit,
                stockInitial,
                joursPrepares,
                consommationMois,
                consommationTotale,
                resteMagasin,
            };
        });
    
        const jourLePlusGrand = Math.max(0, ...Object.values(newPrepDays).map(Number));
        const mealPrice = schoolFoodSuppliesDons.find(sfs => sfs.schoolId === selectedSchoolId)?.mealPrice || 25;
        const cfcAVerser = rationnaires * jourLePlusGrand * mealPrice;
        const financial = { cfcAVerser, solde: cfcAVerser - cfcReellementVerse };
    
        return { reportRows, financial };
    }, [selectedSchoolId, selectedMonth, schools, foodItemsDons, schoolFoodSuppliesDons, verificationDataDons, newPrepDays, cfcReellementVerse, dons]);

    const handleSave = () => {
        if (!selectedSchoolId || !selectedMonth) {
            addToast("Veuillez sélectionner une école et un mois.", "error");
            return;
        }
        setVerificationDataDons(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            if (!newState[selectedSchoolId]) newState[selectedSchoolId] = {};
            newState[selectedSchoolId][selectedMonth] = {
                prepDays: newPrepDays,
                cfcReellementVerse: cfcReellementVerse
            };
            return newState;
        });
        addToast("Données (dons) du rapport sauvegardées !", "success");
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Vérification du Rapport Mensuel (Dons)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                      <div className="flex justify-between items-center mb-1">
                          <label htmlFor="school-select-verif-dons" className="block text-sm font-medium text-slate-700">École</label>
                          {selectedSchool && (
                              <span className="text-sm font-semibold text-blue-600">
                                  Rationnaires: {rationnaires}
                              </span>
                          )}
                      </div>
                      <select id="school-select-verif-dons" value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} disabled={isReadOnly} className="w-full p-2 border rounded-md bg-white">
                           <option value="" disabled>-- Choisir une école --</option>
                           {participatingSchools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                      </select>
                  </div>
                   <div>
                        <label htmlFor="month-select-verif-dons" className="block text-sm font-medium text-slate-700 mb-1">Mois du Rapport</label>
                        <input type="month" id="month-select-verif-dons" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md bg-white" />
                  </div>
              </div>

              {selectedSchool && selectedMonth && (
                  <>
                    <div className="overflow-x-auto mb-6">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3">N°</th>
                                    <th className="px-4 py-3">Denrée (Don)</th>
                                    <th className="px-4 py-3 text-center">Stock Initial</th>
                                    <th className="px-4 py-3 text-center">Jours préparés</th>
                                    <th className="px-4 py-3 text-center">Conso du Mois</th>
                                    <th className="px-4 py-3 text-center">Conso. Totale</th>
                                    <th className="px-4 py-3 text-center">Reste Magasin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calculationData.reportRows.map((item, index) => (
                                    <tr key={item.foodId} className="border-b even:bg-slate-50">
                                        <td className="px-4 py-2 font-medium">{index + 1}</td>
                                        <td className="px-4 py-2 font-medium">{item.foodName} ({item.unit})</td>
                                        <td className="px-4 py-2 text-center">{item.stockInitial.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-2 text-center">
                                            <input type="number" value={newPrepDays[item.foodId] || ''} onChange={e => setNewPrepDays(p => ({...p, [item.foodId]: Number(e.target.value)}))} disabled={isReadOnly} className="w-24 p-1 border rounded-md text-center" placeholder="0" min="0"/>
                                        </td>
                                        <td className="px-4 py-2 text-center text-red-600">{item.consommationMois.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-2 text-center text-orange-600">{item.consommationTotale.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-2 text-center font-bold text-blue-700">{item.resteMagasin.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="bg-slate-50 p-6 rounded-lg border">
                        <h4 className="text-lg font-semibold text-slate-700 mb-2 text-center">Valeur Financière de la Contribution (Dons)</h4>
                        <div className="flex justify-around text-center">
                             <div><span className="text-slate-500 block">Valeur estimée pour le mois</span><span className="font-bold text-xl">{(calculationData.financial.cfcAVerser || 0).toLocaleString('fr-FR', {maximumFractionDigits: 0})} {appSettings.currencySymbol}</span></div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button variant="primary" onClick={handleSave} icon={<SaveIcon className="h-5 w-5" />} disabled={isReadOnly}>Sauvegarder les Données du Mois</Button>
                    </div>
                  </>
              )}
        </div>
    );
};


// --- COPIED FROM CFCBilanPage.tsx AND ADAPTED ---
const CFCBilanDonsPage: React.FC = () => {
    const { appSettings, schools, schoolFoodSuppliesDons, schoolPreparationDaysDons, dons } = useAppContext();

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        Object.values(schoolPreparationDaysDons).forEach((schoolData) => {
            Object.keys(schoolData).forEach(month => {
                if (Object.values(schoolData[month]).some((days) => Number(days) > 0)) {
                    months.add(month);
                }
            });
        });
        return Array.from(months).sort();
    }, [schoolPreparationDaysDons]);

    const participatingSchools = useMemo(() => {
        const schoolIds = new Set<string>();
        dons.forEach(don => {
            if (don.schoolId) {
                schoolIds.add(don.schoolId);
            }
        });
        return schools.filter(school => schoolIds.has(school.id));
    }, [dons, schools]);


    const reportData = useMemo(() => {
        return participatingSchools.map(school => {
            const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
            const mealPrice = schoolFoodSuppliesDons.find(sfs => sfs.schoolId === school.id)?.mealPrice || 25;
            const monthlyCFCs: Record<string, number> = {};
            let totalCFC = 0;

            availableMonths.forEach(monthKey => {
                const prepDaysForMonth = schoolPreparationDaysDons[school.id]?.[monthKey] || {};
                const jourLePlusGrand = Object.values(prepDaysForMonth).length > 0
                    ? Math.max(0, ...Object.values(prepDaysForMonth).map(v => Number(v) || 0))
                    : 0;
                const cfcForMonth = rationnaires * mealPrice * jourLePlusGrand; // 100% of the value
                monthlyCFCs[monthKey] = cfcForMonth;
                totalCFC += cfcForMonth;
            });

            return { schoolId: school.id, schoolName: school.name, rationnaires, monthlyCFCs, totalCFC };
        }).filter(d => d.totalCFC > 0); // Only show schools with CFC from dons
    }, [participatingSchools, schoolFoodSuppliesDons, schoolPreparationDaysDons, availableMonths]);
    
    const totals = useMemo(() => {
        const monthlyTotals: Record<string, number> = {};
        let grandTotal = 0;
        let totalRationnaires = 0;
        availableMonths.forEach(month => { monthlyTotals[month] = 0; });
        reportData.forEach(data => {
            grandTotal += data.totalCFC;
            totalRationnaires += data.rationnaires;
            availableMonths.forEach(month => {
                monthlyTotals[month] += data.monthlyCFCs[month] || 0;
            });
        });
        return { monthlyTotals, grandTotal, totalRationnaires };
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
                "TOTAL Valeur Don": d.totalCFC,
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
            "TOTAL Valeur Don": totals.grandTotal,
        };
        availableMonths.forEach(month => {
            totalsRow[formatMonth(month)] = totals.monthlyTotals[month] || 0;
        });
        
        const finalData = [...dataToExport, totalsRow];

        const ws = XLSX.utils.json_to_sheet(finalData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bilan Valeur Dons");
        XLSX.writeFile(wb, `bilan_valeur_dons.xlsx`);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold text-slate-800">Bilan sur la Valeur des Dons en Vivres</h3>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />} disabled={reportData.length === 0}>Exporter</Button>
            </div>
            {availableMonths.length > 0 ? (
                <div className="overflow-x-auto mt-6">
                    <p className="text-sm text-slate-500 mb-4">Ce tableau n'affiche que les écoles ayant été désignées comme bénéficiaires et calcule la valeur totale des repas fournis par les dons (100% de la valeur).</p>
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-4 py-3 sticky left-0 bg-slate-100 z-10">N°</th>
                                <th className="px-6 py-3 sticky left-12 bg-slate-100 z-10">Nom Ecole</th>
                                <th className="px-6 py-3 text-right">Rationnaires</th>
                                <th className="px-6 py-3 text-right bg-slate-200">TOTAL Valeur Don</th>
                                {availableMonths.map(month => <th key={month} className="px-6 py-3 text-right">{formatMonth(month)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((data, index) => (
                                <tr key={data.schoolId} className="border-b even:bg-slate-50">
                                    <td className="px-4 py-4 sticky left-0 bg-white even:bg-slate-50">{index + 1}</td>
                                    <td className="px-6 py-4 font-semibold sticky left-12 bg-white even:bg-slate-50">{data.schoolName}</td>
                                    <td className="px-6 py-4 text-right">{data.rationnaires.toLocaleString('fr-FR')}</td>
                                    <td className="px-6 py-4 text-right font-bold bg-slate-100 even:bg-slate-100">{data.totalCFC.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                                    {availableMonths.map(month => <td key={month} className="px-6 py-4 text-right">{(data.monthlyCFCs[month] || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>)}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-200 font-bold text-slate-800">
                            <tr>
                                <td colSpan={2} className="px-6 py-3 text-right sticky left-0 bg-slate-200">Total</td>
                                <td className="px-6 py-3 text-right">{totals.totalRationnaires.toLocaleString('fr-FR')}</td>
                                <td className="px-6 py-3 text-right">{totals.grandTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {appSettings.currencySymbol}</td>
                                {availableMonths.map(month => <td key={month} className="px-6 py-3 text-right">{(totals.monthlyTotals[month] || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>)}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-50 rounded-lg mt-6">
                    <p className="text-slate-500">Aucune donnée de planification de dons trouvée.</p>
                </div>
            )}
        </div>
    );
};

// --- ORIGINAL DonsPage COMPONENTS (ADAPTED) ---
const GestionDonateursTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { donateurs, setDonateurs } = useAppContext();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDonateurs = useMemo(() => {
        return donateurs.filter(d => 
            d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [donateurs, searchTerm]);

    const addRow = () => {
        const newDonateur: Donateur = {
            id: `${Date.now()}`,
            nom: '',
            type: 'Particulier',
            contact: '',
            email: '',
            adresse: '',
        };
        setDonateurs(prev => [...prev, newDonateur]);
    };

    const removeRow = (id: string) => {
        setDonateurs(prev => prev.filter(d => d.id !== id));
    };

    const handleInputChange = (id: string, field: keyof Omit<Donateur, 'id'>, value: string) => {
        setDonateurs(prev => prev.map(d => (d.id === id ? { ...d, [field]: value } : d)));
    };

    const handleExport = () => {
        const dataToExport = donateurs.map(d => ({ Nom: d.nom, Type: d.type, Contact: d.contact, Email: d.email, Adresse: d.adresse }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Donateurs");
        XLSX.writeFile(wb, "liste_donateurs.xlsx");
        addToast("Liste des donateurs exportée.", 'success');
    };

     const handleImport = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
                
                const newDonateurs: Donateur[] = json.map((item, index) => ({
                    id: `${Date.now()}-${index}`,
                    nom: String(item["Nom"] || ''),
                    type: ['Particulier', 'Entreprise', 'ONG', 'Autre'].includes(String(item["Type"])) ? String(item["Type"]) as Donateur['type'] : 'Autre',
                    contact: String(item["Contact"] || ''),
                    email: String(item["Email"] || ''),
                    adresse: String(item["Adresse"] || ''),
                }));

                setDonateurs(prev => [...prev, ...newDonateurs]);
                addToast(`${newDonateurs.length} donateurs importés et ajoutés.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation des donateurs:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Gestion des Donateurs</h3>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-grow max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un donateur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <Button onClick={addRow} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={isReadOnly}>Ajouter</Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Excel</Button>
                <Button onClick={handleExportPDF} variant="secondary" icon={<FileTextIcon className="h-5 w-5" />}>PDF</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="ghost" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                <div className="ml-auto flex items-baseline gap-2 bg-slate-50 border px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                        {donateurs.length}
                    </span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th className="px-2 py-3 w-12">N°</th>
                            <th className="px-2 py-3">Nom</th>
                            <th className="px-2 py-3">Type</th>
                            <th className="px-2 py-3">Contact</th>
                            <th className="px-2 py-3">Email</th>
                            <th className="px-2 py-3">Adresse</th>
                            <th className="px-2 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDonateurs.map((d, index) => (
                            <tr key={d.id} className="border-b even:bg-slate-50 hover:bg-slate-100 transition-colors">
                                <td className="px-2 py-2 text-center text-slate-400">{index + 1}</td>
                                <td className="px-1 py-2"><input type="text" value={d.nom} onChange={e => handleInputChange(d.id, 'nom', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Nom du donateur" /></td>
                                <td className="px-1 py-2">
                                    <select value={d.type} onChange={e => handleInputChange(d.id, 'type', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none">
                                        <option>Particulier</option><option>Entreprise</option><option>ONG</option><option>Autre</option>
                                    </select>
                                </td>
                                <td className="px-1 py-2"><input type="text" value={d.contact} onChange={e => handleInputChange(d.id, 'contact', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Contact" /></td>
                                <td className="px-1 py-2"><input type="email" value={d.email} onChange={e => handleInputChange(d.id, 'email', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Email" /></td>
                                <td className="px-1 py-2"><input type="text" value={d.adresse} onChange={e => handleInputChange(d.id, 'adresse', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Adresse" /></td>
                                <td className="px-1 py-2 text-center"><button onClick={() => removeRow(d.id)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"><TrashIcon className="h-5 w-5" /></button></td>
                            </tr>
                        ))}
                        {filteredDonateurs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                                    {searchTerm ? "Aucun donateur ne correspond à votre recherche." : "Aucun donateur ajouté pour le moment."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DonFoodModal: React.FC<{don: Don; onClose: () => void; onSave: (foodQuantities: Record<string, number>) => void; isReadOnly?: boolean;}> = ({ don, onClose, onSave, isReadOnly=false }) => {
    const { foodItemsDons } = useAppContext();
    const [quantities, setQuantities] = useState<Record<string, number>>(don.foodQuantities || {});

    const handleQuantityChange = (foodId: string, value: string) => {
        const qty = parseFloat(value);
        setQuantities(prev => {
            const newQtys = { ...prev };
            if (!isNaN(qty) && qty > 0) {
                newQtys[foodId] = qty;
            } else {
                delete newQtys[foodId];
            }
            return newQtys;
        });
    };
    
    const handleSubmit = () => {
        onSave(quantities);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                 <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Gérer les denrées du don</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-200"><CloseIcon className="h-6 w-6" /></button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {foodItemsDons.map(food => (
                        <div key={food.id} className="grid grid-cols-3 gap-4 items-center">
                            <label htmlFor={`food-${food.id}`} className="text-sm font-medium">{food.name} ({food.unit})</label>
                            <input
                                id={`food-${food.id}`}
                                type="number"
                                value={quantities[food.id] || ''}
                                onChange={e => handleQuantityChange(food.id, e.target.value)}
                                disabled={isReadOnly}
                                className="col-span-2 p-1 border rounded-md"
                                placeholder="0"
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                    <Button onClick={onClose} variant="ghost">Annuler</Button>
                    <Button onClick={handleSubmit} variant="primary" disabled={isReadOnly}>Sauvegarder</Button>
                </div>
            </div>
        </div>
    );
};

const ListeDonsTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { dons, setDons, donateurs, schools, foodItemsDons } = useAppContext();
    const { addToast } = useToast();
    const [editingDon, setEditingDon] = useState<Don | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const donateurMap = useMemo(() => new Map(donateurs.map(d => [d.id, d.nom])), [donateurs]);
    const schoolMap = useMemo(() => new Map(schools.map(s => [s.id, s.name])), [schools]);

    const filteredDons = useMemo(() => {
        return dons.filter(d => {
            const donateurName = donateurMap.get(d.donateurId) || '';
            const schoolName = d.schoolId ? (schoolMap.get(d.schoolId) || '') : 'Toutes les écoles';
            const searchLower = searchTerm.toLowerCase();
            return (
                donateurName.toLowerCase().includes(searchLower) ||
                schoolName.toLowerCase().includes(searchLower) ||
                d.type.toLowerCase().includes(searchLower) ||
                d.description.toLowerCase().includes(searchLower)
            );
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [dons, searchTerm, donateurMap, schoolMap]);

    const addRow = () => {
        if (donateurs.length === 0) {
            addToast("Veuillez ajouter un donateur avant d'enregistrer un don.", 'error');
            return;
        }
        const newDon: Don = {
            id: `${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            donateurId: donateurs[0].id,
            schoolId: '',
            type: 'Financier',
            description: '',
            valeurEstimee: 0,
            foodQuantities: {},
        };
        setDons(prev => [...prev, newDon]);
    };

    const removeRow = (id: string) => {
        setDons(prev => prev.filter(d => d.id !== id));
    };

    const handleInputChange = (id: string, field: keyof Omit<Don, 'id' | 'foodQuantities'>, value: string) => {
        setDons(prev => prev.map(d => {
            if (d.id !== id) {
                return d;
            }
            const updatedDon = { ...d };
            if (field === 'valeurEstimee') {
                updatedDon[field] = Number(value) || 0;
            } else if (field === 'type') {
                updatedDon[field] = value as Don['type'];
            } else {
                Object.assign(updatedDon, { [field]: value });
            }
            return updatedDon;
        }));
    };
    
    const handleFoodQuantitiesSave = (donId: string, foodQuantities: Record<string, number>) => {
        setDons(prev => prev.map(d => d.id === donId ? { ...d, foodQuantities } : d));
    };

    const handleExport = () => {
        const foodItemMap = new Map(foodItemsDons.map(f => [f.id, f.name]));
    
        const dataToExport = dons.map(don => {
            let details = don.description;
            if (don.type === 'Vivres' && don.foodQuantities) {
                details = Object.entries(don.foodQuantities)
                    .map(([foodId, qty]) => `${foodItemMap.get(foodId) || 'N/A'}: ${qty}`)
                    .join(', ');
            } else if (don.type === 'Matériel' && don.quantite) {
                details = `${don.quantite} x ${don.description} (${don.unite})`;
            }
            return {
                "Date": don.date,
                "Donateur": donateurMap.get(don.donateurId) || 'N/A',
                "École Bénéficiaire": don.schoolId ? (schoolMap.get(don.schoolId) || 'Toutes') : 'Toutes',
                "Type": don.type,
                "Détails": details,
                "Valeur Estimée": don.valeurEstimee,
            };
        });
    
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dons");
        XLSX.writeFile(wb, "liste_des_dons.xlsx");
        addToast("Liste des dons exportée.", 'success');
    };
    
     const handleImport = (file: File) => {
        const donateurNameMap = new Map(donateurs.map(d => [d.nom.toLowerCase(), d.id]));
        const schoolNameMap = new Map(schools.map(s => [s.name.toLowerCase(), s.id]));
        const foodNameMap = new Map(foodItemsDons.map(f => [f.name.toLowerCase(), f.id]));

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
                
                const newDons: Don[] = json.map((item, index) => {
                    const donateurName = String(item["Donateur"] || '').toLowerCase();
                    const schoolName = String(item["École Bénéficiaire"] || '').toLowerCase();
                    const type = item["Type"] as Don['type'];
                    const details = String(item["Détails"] || '');
                    
                    let foodQuantities: Record<string, number> | undefined = undefined;
                    if (type === 'Vivres') {
                        foodQuantities = {};
                        details.split(',').forEach(part => {
                            const [name, qty] = part.split(':').map(s => s.trim());
                            const foodId = foodNameMap.get(name.toLowerCase());
                            if (foodId && !isNaN(Number(qty))) {
                                foodQuantities![foodId] = Number(qty);
                            }
                        });
                    }

                    return {
                        id: `${Date.now()}-${index}`,
                        date: String(item["Date"] || new Date().toISOString().split('T')[0]),
                        donateurId: donateurNameMap.get(donateurName) || '',
                        schoolId: schoolNameMap.get(schoolName),
                        type: ['Vivres', 'Matériel', 'Financier'].includes(type) ? type : 'Vivres',
                        description: type === 'Vivres' ? '' : details,
                        foodQuantities,
                        valeurEstimee: Number(item["Valeur Estimée"] || 0),
                    };
                });

                setDons(prev => [...prev, ...newDons]);
                addToast(`${newDons.length} dons importés et ajoutés.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation des dons:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    const totalValeurDons = useMemo(() => dons.reduce((sum, don) => sum + Number(don.valeurEstimee || 0), 0), [dons]);


    // Effect to auto-populate schoolFoodSuppliesDons from dons
    const { setSchoolFoodSuppliesDons } = useAppContext();
    useEffect(() => {
        const supplies: Record<string, SchoolFoodSupply> = {};
        dons.forEach(don => {
            if (don.type === 'Vivres' && don.schoolId && don.foodQuantities) {
                if (!supplies[don.schoolId]) {
                    supplies[don.schoolId] = {
                        id: `sfs-don-${don.schoolId}`,
                        schoolId: don.schoolId,
                        foodQuantities: {},
                        supplyDate: don.date, // Will be updated to latest
                        mealPrice: 25, // default
                    };
                }
                Object.entries(don.foodQuantities).forEach(([foodId, qty]) => {
                    supplies[don.schoolId].foodQuantities[foodId] = (supplies[don.schoolId].foodQuantities[foodId] || 0) + qty;
                });
                if (don.date > supplies[don.schoolId].supplyDate) {
                    supplies[don.schoolId].supplyDate = don.date;
                }
            }
        });
        setSchoolFoodSuppliesDons(Object.values(supplies));
    }, [dons, setSchoolFoodSuppliesDons]);


    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
             {editingDon && (
                <DonFoodModal
                    don={editingDon}
                    onClose={() => setEditingDon(null)}
                    onSave={(quantities) => handleFoodQuantitiesSave(editingDon.id, quantities)}
                    isReadOnly={isReadOnly}
                />
            )}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-grow max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un don (donateur, école, type...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <Button onClick={addRow} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={isReadOnly}>Ajouter</Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Excel</Button>
                <Button onClick={handleExportPDF} variant="secondary" icon={<FileTextIcon className="h-5 w-5" />}>PDF</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="ghost" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                 <div className="ml-auto flex items-baseline gap-2 bg-slate-50 border px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Valeur Totale:</span>
                    <span className="text-xl font-bold text-blue-600">
                        {totalValeurDons.toLocaleString('fr-FR')}
                    </span>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th className="px-2 py-3 w-12">N°</th>
                            <th className="px-2 py-3">Date</th>
                            <th className="px-2 py-3">Donateur</th>
                            <th className="px-2 py-3">École Bénéficiaire</th>
                            <th className="px-2 py-3">Type</th>
                            <th className="px-2 py-3">Description / Détails</th>
                            <th className="px-2 py-3">Valeur Estimée</th>
                            <th className="px-2 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDons.map((d, index) => (
                             <tr key={d.id} className="border-b even:bg-slate-50 hover:bg-slate-100 transition-colors">
                                <td className="px-2 py-2 text-center text-slate-400">{index + 1}</td>
                                <td className="px-1 py-2"><input type="date" value={d.date} onChange={e => handleInputChange(d.id, 'date', e.target.value)} disabled={isReadOnly} className="w-full p-1 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none" /></td>
                                <td className="px-1 py-2"><select value={d.donateurId} onChange={e => handleInputChange(d.id, 'donateurId', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none"><option value="" disabled>-- Choisir --</option>{donateurs.map(donateur => <option key={donateur.id} value={donateur.id}>{donateur.nom}</option>)}</select></td>
                                <td className="px-1 py-2"><select value={d.schoolId} onChange={e => handleInputChange(d.id, 'schoolId', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none"><option value="">Toutes les écoles</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                                <td className="px-1 py-2"><select value={d.type} onChange={e => handleInputChange(d.id, 'type', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none"><option>Vivres</option><option>Matériel</option><option>Financier</option></select></td>
                                <td className="px-1 py-2">
                                    {d.type === 'Vivres' ? (
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => setEditingDon(d)} 
                                            className="w-full text-xs py-1.5 flex items-center justify-center gap-1"
                                            icon={<PlusIcon className="h-3 w-3" />}
                                        >
                                            {Object.keys(d.foodQuantities || {}).length > 0 ? `${Object.keys(d.foodQuantities || {}).length} denrées` : 'Ajouter denrées'}
                                        </Button>
                                    ) : (
                                        <input type="text" value={d.description} onChange={e => handleInputChange(d.id, 'description', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Description du don" />
                                    )}
                                </td>
                                <td className="px-1 py-2"><input type="number" value={d.valeurEstimee} onChange={e => handleInputChange(d.id, 'valeurEstimee', e.target.value)} disabled={isReadOnly} className="w-full p-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-right" placeholder="0" /></td>
                                <td className="px-1 py-2 text-center"><button onClick={() => removeRow(d.id)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"><TrashIcon className="h-5 w-5" /></button></td>
                            </tr>
                        ))}
                        {filteredDons.length === 0 && (
                            <tr>
                                <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                                    {searchTerm ? "Aucun don ne correspond à votre recherche." : "Aucun don enregistré pour le moment."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CourriersModeles: React.FC = () => {
    const { letterTemplates, setLetterTemplates } = useAppContext();
    const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    const handleSelectTemplate = (id: string) => {
        const template = letterTemplates.find(t => t.id === id);
        setSelectedTemplate(template || null);
        setIsEditing(false);
    };

    const handleSave = () => {
        if (!selectedTemplate || !editorRef.current) return;
        const updatedTemplate = { ...selectedTemplate, body: editorRef.current.innerHTML };
        setLetterTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
        addToast("Modèle sauvegardé.", 'success');
        setIsEditing(false);
    };
    
    const handlePrint = () => {
        if (!editorRef.current) return;
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) {
            addToast("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les popups.", 'error');
            return;
        }
        printWindow.document.write('<html><head><title>Impression</title><style>body { font-family: sans-serif; padding: 40px; line-height: 1.6; } .no-print { display: none; }</style></head><body>');
        printWindow.document.write(editorRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const handleExportPDF = () => {
        if (!editorRef.current || !selectedTemplate) return;
        const doc = new jsPDF();
        
        // Simple HTML to PDF conversion
        // Note: jspdf's html() method is better but requires html2canvas
        // For now, we'll use a simpler approach or just text if it's simple
        const text = editorRef.current.innerText;
        const lines = doc.splitTextToSize(text, 180);
        doc.text(lines, 14, 20);
        
        doc.save(`${selectedTemplate.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
        addToast("Modèle exporté en PDF.", 'success');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-md border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5 text-blue-500" />
                    Modèles
                </h4>
                <div className="space-y-2">
                    {letterTemplates.map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => handleSelectTemplate(t.id)} 
                            className={`w-full text-left p-3 rounded-lg text-sm transition-all ${selectedTemplate?.id === t.id ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm' : 'hover:bg-slate-50 text-slate-600 border-l-4 border-transparent'}`}
                        >
                            <div className="font-semibold">{t.name}</div>
                            <div className="text-xs opacity-70 truncate">{t.subject}</div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md border border-slate-200">
                {selectedTemplate ? (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4 border-b pb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">{selectedTemplate.name}</h3>
                                <p className="text-sm text-slate-500">{selectedTemplate.subject}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {!isEditing ? (
                                    <Button onClick={() => setIsEditing(true)} variant="ghost" icon={<EditIcon className="h-4 w-4"/>}>Modifier</Button>
                                ) : (
                                    <Button onClick={handleSave} variant="success" icon={<CheckCircleIcon className="h-4 w-4"/>}>Sauvegarder</Button>
                                )}
                                <Button onClick={handlePrint} variant="secondary" icon={<PrinterIcon className="h-4 w-4"/>}>Imprimer</Button>
                                <Button onClick={handleExportPDF} variant="primary" icon={<FileTextIcon className="h-4 w-4"/>}>PDF</Button>
                            </div>
                        </div>
                         <div
                            ref={editorRef}
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            className={`p-8 border rounded-lg min-h-[600px] prose max-w-none shadow-inner transition-all ${isEditing ? 'border-blue-400 ring-4 ring-blue-50 bg-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                            dangerouslySetInnerHTML={{ __html: selectedTemplate.body }}
                        />
                        <div className="mt-4 text-xs text-slate-400 italic">
                            * Les variables entre crochets [Nom], [Date], etc. seront remplacées lors de la génération finale (fonctionnalité à venir).
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <FileTextIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-500">Aucun modèle sélectionné</h3>
                        <p className="text-slate-400">Choisissez un modèle dans la liste à gauche pour commencer.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const DonsPage: React.FC<{ activeSubMenu: SubMenuId | null; isReadOnly?: boolean; }> = ({ activeSubMenu, isReadOnly=false }) => {
    
    const renderContent = () => {
        switch (activeSubMenu) {
            case SubMenuId.GestionDonateurs:
                return <GestionDonateursTable isReadOnly={isReadOnly} />;
            case SubMenuId.ListeDons:
                return <ListeDonsTable isReadOnly={isReadOnly} />;
            case SubMenuId.CourriersModeles:
                 return <CourriersModeles isReadOnly={isReadOnly} />;
            case SubMenuId.DenreesDons:
                 return <DenreesDonsTable isReadOnly={isReadOnly} />;
            case SubMenuId.DenreesEcoleDons:
                 return <DenreesEcoleDonsTable isReadOnly={isReadOnly} />;
            case SubMenuId.ResteJoursDons:
                 return <ResteJoursDonsTable />;
            case SubMenuId.JoursPreparationDons:
                 return <JoursPreparationDonsPage isReadOnly={isReadOnly} />;
            case SubMenuId.VerificationRapportDons:
                 return <VerificationRapportDonsPage isReadOnly={isReadOnly} />;
            case SubMenuId.CFCBilanDons:
                return <CFCBilanDonsPage />;
            default:
                 return <GestionDonateursTable isReadOnly={isReadOnly} />;
        }
    };

    return <div>{renderContent()}</div>;
};

export default DonsPage;
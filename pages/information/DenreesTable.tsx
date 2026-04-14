import React from 'react';
import type { FoodItem } from '../../types';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

// FIX: Changed to a named export to resolve module import error.
export const DenreesTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { 
        foodItems, setFoodItems,
        setSchoolFoodSupplies, 
        setSchoolPreparationDays, 
        setVerificationData 
    } = useAppContext();
    const { addToast } = useToast();
    
    const addFoodItem = () => {
        const newFoodItem: FoodItem = {
            id: `${Date.now()}`, name: '', netWeight: 0, grossWeight: 0,
            boxPerPackage: 0, packaging: '', unit: '', rationPerChild: 0, operatingDays: 0, lowStockThreshold: 7
        };
        setFoodItems([...foodItems, newFoodItem]);
    };

    const removeFoodItem = (idToRemove: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette denrée ? Toutes les données de stock et de préparation associées seront également supprimées.")) {
            return;
        }
        setFoodItems(prev => prev.filter(item => item.id !== idToRemove));
        setSchoolFoodSupplies(prev => prev.map(supply => { const newQuantities = { ...supply.foodQuantities }; delete newQuantities[idToRemove]; return { ...supply, foodQuantities: newQuantities }; }));
        setSchoolPreparationDays(prev => {
            const newState = { ...prev };
            for (const schoolId in newState) { for (const monthKey in newState[schoolId]) { if (newState[schoolId][monthKey][idToRemove] !== undefined) delete newState[schoolId][monthKey][idToRemove]; } }
            return newState;
        });
        setVerificationData(prev => {
            const newState = { ...prev };
            for (const schoolId in newState) { for (const monthKey in newState[schoolId]) { if (newState[schoolId][monthKey].prepDays[idToRemove] !== undefined) delete newState[schoolId][monthKey].prepDays[idToRemove]; } }
            return newState;
        });
        addToast("La denrée et toutes ses données associées ont été supprimées.", 'info');
    };

    const handleInputChange = (id: string, field: keyof Omit<FoodItem, 'id'>, value: string) => {
        const numericFields: (keyof FoodItem)[] = ['netWeight', 'grossWeight', 'boxPerPackage', 'rationPerChild', 'operatingDays', 'lowStockThreshold'];
        const floatFields: (keyof FoodItem)[] = ['netWeight', 'grossWeight', 'rationPerChild'];
        let processedValue: string | number = value;
        if ((numericFields as string[]).includes(field as string)) {
            processedValue = (floatFields as string[]).includes(field as string) ? parseFloat(value) || 0 : parseInt(value, 10) || 0;
        }
        setFoodItems(foodItems.map(item => item.id === id ? { ...item, [field]: processedValue } : item));
    };

    const handleReset = () => {
        if(window.confirm("Êtes-vous sûr de vouloir réinitialiser toutes les denrées et leurs données associées ? Cette action est irréversible.")) {
            setFoodItems([]);
            setSchoolFoodSupplies(prev => prev.map(supply => ({ ...supply, foodQuantities: {} })));
            setSchoolPreparationDays(prev => {
                const newState = { ...prev };
                for (const schoolId in newState) { for (const monthKey in newState[schoolId]) { newState[schoolId][monthKey] = {}; } }
                return newState;
            });
            setVerificationData(prev => {
                const newState = { ...prev };
                for (const schoolId in newState) { for (const monthKey in newState[schoolId]) { newState[schoolId][monthKey].prepDays = {}; } }
                return newState;
            });
            addToast("Toutes les denrées et les données associées ont été réinitialisées.", 'info');
        }
    };

    const handleExport = () => {
        const dataToExport = foodItems.map((item) => ({
            "Nom de la Denrée": item.name,
            "Poids Net (kg)": item.netWeight,
            "Poids Brut (kg)": item.grossWeight,
            "Boîtes/Colis": item.boxPerPackage,
            "Emballage": item.packaging,
            "Unité": item.unit,
            "Ration par Enfant": item.rationPerChild,
            "Jours de fonctionnement": item.operatingDays,
            "Seuil d'alerte": item.lowStockThreshold
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Denrees");
        XLSX.writeFile(wb, "liste_denrees.xlsx");
        addToast("Liste des denrées exportée.", 'success');
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
                    id: `${Date.now()}-${index}`, name: String(item.name || ''), netWeight: Number(item.netWeight || 0), grossWeight: Number(item.grossWeight || 0),
                    boxPerPackage: Number(item.boxPerPackage || 0), packaging: String(item.packaging || ''), unit: String(item.unit || ''),
                    rationPerChild: Number(item.rationPerChild || 0), operatingDays: Number(item.operatingDays || 0), lowStockThreshold: Number(item.lowStockThreshold || 7),
                }));
                setFoodItems(prev => [...prev, ...newFoodItems]);
                addToast(`${newFoodItems.length} denrées importées et ajoutées.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation Denrées:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                 <h3 className="text-xl font-bold text-[var(--color-text-heading)] mr-auto">Gestion des Denrées</h3>
                 <Button onClick={addFoodItem} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} disabled={isReadOnly}>Ajouter</Button>
                 <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                 <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                 <Button onClick={handleReset} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>Réinitialiser</Button>
                <div className="flex items-baseline gap-2 bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">TOTAL DENRÉES:</span>
                    <span className="text-xl font-bold text-[var(--color-primary)]">{foodItems.length}</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th scope="col" className="px-4 py-3">N°</th>
                            <th scope="col" className="px-6 py-3 w-1/4">Nom de la Denrée</th>
                            <th scope="col" className="px-6 py-3">Poids Net (kg)</th>
                            <th scope="col" className="px-6 py-3">Poids Brut (kg)</th>
                            <th scope="col" className="px-6 py-3">Boîtes/Colis</th>
                            <th scope="col" className="px-6 py-3">Emballage</th>
                            <th scope="col" className="px-6 py-3">Unité</th>
                            <th scope="col" className="px-6 py-3">Ration/Enfant</th>
                            <th scope="col" className="px-6 py-3">Jours de fonct.</th>
                            <th scope="col" className="px-6 py-3">Seuil Alerte (j)</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {foodItems.map((item, index) => (
                            <tr key={item.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                <td className="px-4 py-2 font-medium text-[var(--color-text-heading)]">{index + 1}</td>
                                <td className="px-6 py-2"><input type="text" value={item.name} onChange={e => handleInputChange(item.id, 'name', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" step="0.01" value={item.netWeight} onChange={e => handleInputChange(item.id, 'netWeight', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" step="0.01" value={item.grossWeight} onChange={e => handleInputChange(item.id, 'grossWeight', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" value={item.boxPerPackage} onChange={e => handleInputChange(item.id, 'boxPerPackage', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="text" value={item.packaging} onChange={e => handleInputChange(item.id, 'packaging', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="text" value={item.unit} onChange={e => handleInputChange(item.id, 'unit', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-20 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" step="0.001" value={item.rationPerChild} onChange={e => handleInputChange(item.id, 'rationPerChild', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" value={item.operatingDays} onChange={e => handleInputChange(item.id, 'operatingDays', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><input type="number" value={item.lowStockThreshold} onChange={e => handleInputChange(item.id, 'lowStockThreshold', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                <td className="px-6 py-2"><button onClick={() => removeFoodItem(item.id)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="h-5 w-5" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
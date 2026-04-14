import React, { useMemo } from 'react';
import type { SchoolFoodSupply } from '../../types';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

const DenreesEcoleTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { appSettings, schoolFoodSupplies, setSchoolFoodSupplies, schools, foodItems } = useAppContext();
    const { addToast } = useToast();

    const sortedSchools = useMemo(() => [...schools].sort((a, b) => a.name.localeCompare(b.name)), [schools]);
    const schoolNameMap = useMemo(() => new Map(schools.map(s => [s.name, s.id])), [schools]);

    const addSupply = (schoolId: string) => {
        if (isReadOnly) return;
        const newSupply: SchoolFoodSupply = {
            id: `${Date.now()}`, schoolId, foodQuantities: {}, supplyDate: new Date().toISOString().split('T')[0], mealPrice: appSettings.defaultMealPrice
        };
        setSchoolFoodSupplies(prev => [...prev, newSupply].sort((a, b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime()));
    };

    const removeSupply = (supplyId: string) => {
        if (isReadOnly) return;
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette ligne de dotation ?")) {
            setSchoolFoodSupplies(prev => prev.filter(s => s.id !== supplyId));
        }
    };

    const handleSupplyChange = (supplyId: string, field: 'supplyDate' | 'mealPrice', value: string) => {
        if (isReadOnly) return;
        const processedValue = field === 'mealPrice' ? parseInt(value, 10) || 0 : value;
        setSchoolFoodSupplies(prev => prev.map(s => s.id === supplyId ? { ...s, [field]: processedValue } : s));
    };

    const handleQuantityChange = (supplyId: string, foodId: string, quantity: string) => {
        if (isReadOnly) return;
        const numQuantity = parseFloat(quantity) || 0;
        setSchoolFoodSupplies(prev => prev.map(s => {
            if (s.id === supplyId) {
                const newQuantities = { ...s.foodQuantities };
                if (numQuantity > 0) newQuantities[foodId] = numQuantity; else delete newQuantities[foodId];
                return { ...s, foodQuantities: newQuantities };
            }
            return s;
        }));
    };

    const handleReset = () => {
        if (window.confirm("Êtes-vous sûr de vouloir réinitialiser tous les approvisionnements ?")) {
            setSchoolFoodSupplies([]);
            addToast("Tous les approvisionnements ont été réinitialisés.", 'info');
        }
    };

    const handleExport = () => {
        const dataToExport = schoolFoodSupplies.map((supply) => {
            const school = schools.find(s => s.id === supply.schoolId);
            const row: Record<string, string | number> = { "Nom de l’Ecole": school?.name || 'N/A', "Date d’approvisionnement": supply.supplyDate, "Prix du repas": supply.mealPrice };
            foodItems.forEach(food => { row[`${food.name} (${food.unit})`] = supply.foodQuantities[food.id] || 0; });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Approvisionnement");
        XLSX.writeFile(wb, "approvisionnement_denrees_ecole.xlsx");
        addToast("Approvisionnements exportés.", 'success');
    };

    const handleImport = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
                const newSupplies: SchoolFoodSupply[] = json.map((item, index) => {
                    const schoolId = schoolNameMap.get(item["Nom de l’Ecole"]);
                    if (!schoolId) return null;
                    const foodQuantities: Record<string, number> = {};
                    foodItems.forEach(food => {
                        const colName = `${food.name} (${food.unit})`;
                        if (item[colName] !== undefined && Number(item[colName]) > 0) foodQuantities[food.id] = Number(item[colName]);
                    });
                    return {
                        id: `${Date.now()}-${index}`, schoolId: schoolId,
                        supplyDate: item["Date d’approvisionnement"] instanceof Date ? item["Date d’approvisionnement"].toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        mealPrice: Number(item["Prix du repas"] ?? appSettings.defaultMealPrice), foodQuantities,
                    };
                }).filter((s): s is SchoolFoodSupply => s !== null);
                setSchoolFoodSupplies(prev => [...prev, ...newSupplies]);
                addToast(`${newSupplies.length} lignes d'approvisionnement importées.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation Denrées/Ecole:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Gestion des Dotations par École</h3>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                <Button onClick={handleReset} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>Réinitialiser</Button>
            </div>
            {schools.length === 0 && <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">Veuillez d'abord ajouter des écoles et des denrées.</p>}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th className="px-2 py-3 sticky left-0 bg-[var(--color-bg-muted)] z-20">N°</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Prix repas</th>
                            {foodItems.map(food => (<th key={food.id} className="px-2 py-3 text-center" style={{ minWidth: '120px' }}>{food.name} ({food.unit})</th>))}
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSchools.map((school) => {
                            const suppliesForSchool = schoolFoodSupplies.filter(s => s.schoolId === school.id).sort((a, b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime());
                            const schoolTotals: Record<string, number> = {};
                            foodItems.forEach(food => { schoolTotals[food.id] = suppliesForSchool.reduce((sum, supply) => sum + (supply.foodQuantities[food.id] || 0), 0); });
                            return (
                                <React.Fragment key={school.id}>
                                    <tr className="bg-slate-100 border-t-4 border-[var(--color-bg-card)]"><td colSpan={4 + foodItems.length} className="px-4 py-3 font-bold text-base text-slate-700">{school.name}</td></tr>
                                    {suppliesForSchool.map((supply, index) => (
                                        <tr key={supply.id} className="border-b border-[var(--color-border-base)] hover:bg-[var(--color-bg-base)] align-middle">
                                            <td className="px-2 py-2 font-medium text-[var(--color-text-heading)] sticky left-0 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-base)] z-10">{index + 1}</td>
                                            <td className="px-4 py-2"><input type="date" value={supply.supplyDate || ''} onChange={e => handleSupplyChange(supply.id, 'supplyDate', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                            <td className="px-4 py-2"><input type="number" value={supply.mealPrice ?? ''} onChange={e => handleSupplyChange(supply.id, 'mealPrice', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" placeholder={String(appSettings.defaultMealPrice)} /></td>
                                            {foodItems.map(food => (<td key={food.id} className="px-2 py-2 text-center"><input type="number" step="0.01" value={supply.foodQuantities[food.id] || ''} onChange={(e) => handleQuantityChange(supply.id, food.id, e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-24 p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" placeholder="0"/></td>))}
                                            <td className="px-4 py-2">{!isReadOnly && <button onClick={() => removeSupply(supply.id)} title="Supprimer cette dotation" className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button>}</td>
                                        </tr>
                                    ))}
                                    <tr><td colSpan={3 + foodItems.length + 1} className="pt-2 pl-4"><Button onClick={() => addSupply(school.id)} variant="secondary" icon={<PlusCircleIcon className="h-5 w-5" />} className="py-1.5 text-xs" disabled={isReadOnly}>Ajouter une dotation pour {school.name}</Button></td></tr>
                                    <tr className="bg-slate-200 font-bold text-slate-800">
                                        <td colSpan={3} className="px-4 py-2 text-right">Total pour {school.name}</td>
                                        {foodItems.map(food => (<td key={food.id} className="px-2 py-2 text-center">{schoolTotals[food.id].toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>))}
                                        <td></td>
                                    </tr>
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default DenreesEcoleTable;
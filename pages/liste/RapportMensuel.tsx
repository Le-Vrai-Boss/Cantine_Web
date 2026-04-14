import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { RapportMensuelContribution, RapportMensuelMonthData } from '../../types';
import { Button } from '../../components/Button';
import { PlusCircleIcon, TrashIcon, ExportIcon, SaveIcon } from '../../components/Icons';

const RapportMensuel: React.FC = () => {
    const { 
        appSettings, ieppData, schools, foodItems, globalSchoolId, globalMonth,
        schoolFoodSupplies, schoolPreparationDays, rapportMensuelData, setRapportMensuelData
    } = useAppContext();
    const { addToast } = useToast();
    
    const [selectedSchoolId, setSelectedSchoolId] = useState(globalSchoolId !== 'all' ? globalSchoolId : schools[0]?.id || '');
    const [selectedMonth, setSelectedMonth] = useState(globalMonth || new Date().toISOString().slice(0, 7));
    const [monthlyInputs, setMonthlyInputs] = useState<RapportMensuelMonthData>({ contributions: [], denreesRecues: [], prepDays: {} });

    useEffect(() => {
        if (globalSchoolId !== 'all' && schools.some(s => s.id === globalSchoolId)) {
            setSelectedSchoolId(globalSchoolId);
        } else if (!schools.some(s => s.id === selectedSchoolId) && schools.length > 0) {
            setSelectedSchoolId(schools[0].id);
        }
    }, [globalSchoolId, schools, selectedSchoolId]);
    
    useEffect(() => {
        if(globalMonth) setSelectedMonth(globalMonth)
    }, [globalMonth]);

    useEffect(() => {
        if (selectedSchoolId && selectedMonth) {
            const data = rapportMensuelData[selectedSchoolId]?.[selectedMonth];
            setMonthlyInputs(data || { contributions: [], denreesRecues: [], prepDays: {} });
        }
    }, [selectedSchoolId, selectedMonth, rapportMensuelData]);

    const selectedSchool = useMemo(() => schools.find(s => s.id === selectedSchoolId), [selectedSchoolId, schools]);

    const mealPriceForSchool = useMemo(() => {
        if (!selectedSchoolId || !selectedMonth) return appSettings.defaultMealPrice;
        
        return schoolFoodSupplies
            .filter(sfs => sfs.schoolId === selectedSchoolId && sfs.supplyDate <= `${selectedMonth}-31`)
            .sort((a, b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime())[0]?.mealPrice || appSettings.defaultMealPrice;
    }, [selectedSchoolId, selectedMonth, schoolFoodSupplies, appSettings.defaultMealPrice]);

    const calculationData = useMemo(() => {
        if (!selectedSchool || !selectedMonth) return null;
        
        const rationnaires = selectedSchool.rationnaireGirls + selectedSchool.rationnaireBoys;
        
        // --- Stock Initial ---
        const stockInitial = foodItems.map(food => {
            let totalReceived = 0;
            schoolFoodSupplies.forEach(supply => {
                if (supply.schoolId === selectedSchoolId) {
                    totalReceived += supply.foodQuantities[food.id] || 0;
                }
            });

            let consumedBefore = 0;
            const schoolPlanData = schoolPreparationDays[selectedSchoolId] || {};
            Object.keys(schoolPlanData).forEach(monthKey => {
                if (monthKey < selectedMonth) {
                    const monthData = schoolPlanData[monthKey];
                    const prepDays = monthData[food.id] || 0;
                    consumedBefore += rationnaires * prepDays * food.rationPerChild;
                }
            });

            const poids = totalReceived - consumedBefore;
            const colis = food.netWeight > 0 ? poids / food.netWeight : 0;
            return { foodId: food.id, colis, poids };
        });

        // --- Data from Inputs ---
        const totalContribution = monthlyInputs.contributions.reduce((sum, c) => sum + c.montant, 0);
        
        const denreesRecues = foodItems.map(food => {
            const received = monthlyInputs.denreesRecues.find(d => d.foodId === food.id);
            const colis = received?.colis || 0;
            return { foodId: food.id, colis, poids: colis * food.netWeight };
        });

        // --- Consommation ---
        const consommationMois = foodItems.map(food => {
            const prepDays = monthlyInputs.prepDays?.[food.id] || 0;
            const poids = rationnaires * prepDays * food.rationPerChild;
            const colis = food.netWeight > 0 ? poids / food.netWeight : 0;
            return { foodId: food.id, colis, poids };
        });

        // --- Stock Final ---
        const stockFinal = foodItems.map(food => {
            const initial = stockInitial.find(s => s.foodId === food.id)?.poids || 0;
            const received = denreesRecues.find(s => s.foodId === food.id)?.poids || 0;
            const consumed = consommationMois.find(s => s.foodId === food.id)?.poids || 0;
            const poids = initial + received - consumed;
            const colis = food.netWeight > 0 ? poids / food.netWeight : 0;
            return { foodId: food.id, colis, poids };
        });

        return {
            rationnaires,
            joursFonctionnement: monthlyInputs.contributions.length,
            totalContribution,
            totalRepasServis: monthlyInputs.contributions.reduce((sum, c) => sum + c.filles + c.garcons, 0),
            sommeReservee: totalContribution * (appSettings.inspectionPercentage / 100),
            stockInitial,
            denreesRecues,
            consommationMois,
            stockFinal
        };

    }, [selectedSchool, selectedSchoolId, selectedMonth, monthlyInputs, foodItems, schoolFoodSupplies, schoolPreparationDays, appSettings]);

    const handleContributionChange = (id: string, field: keyof Omit<RapportMensuelContribution, 'id'>, value: string) => {
        setMonthlyInputs(prev => ({
            ...prev,
            contributions: prev.contributions.map(c => {
                if (c.id !== id) return c;
                
                const newC = { ...c };
                const isNumericField = field === 'filles' || field === 'garcons' || field === 'montant';
                (newC as Record<string, string | number>)[field] = isNumericField ? Number(value) || 0 : value;
    
                if (field === 'filles' || field === 'garcons') {
                    newC.montant = (newC.filles + newC.garcons) * mealPriceForSchool;
                }
                
                return newC;
            })
        }));
    };
    
    const addContributionRow = () => {
        if (!selectedSchool) {
            addToast("Veuillez d'abord sélectionner une école.", 'warning');
            return;
        }

        const totalRationnaires = selectedSchool.rationnaireGirls + selectedSchool.rationnaireBoys;

        const newContribution: RapportMensuelContribution = {
            id: Date.now().toString(),
            date: '', // Let the user fill the date
            filles: selectedSchool.rationnaireGirls,
            garcons: selectedSchool.rationnaireBoys,
            montant: totalRationnaires * mealPriceForSchool
        };

        setMonthlyInputs(prev => ({
            ...prev,
            contributions: [...prev.contributions, newContribution]
        }));
    };
    const removeContributionRow = (id: string) => setMonthlyInputs(prev => ({ ...prev, contributions: prev.contributions.filter(c => c.id !== id)}));
    
    const handleDenreeRecueChange = (foodId: string, value: string) => {
        setMonthlyInputs(prev => {
            const newDenrees = [...prev.denreesRecues];
            const existing = newDenrees.find(d => d.foodId === foodId);
            const colis = Number(value) || 0;
            if (existing) {
                if (colis > 0) existing.colis = colis;
                else return { ...prev, denreesRecues: newDenrees.filter(d => d.foodId !== foodId) };
            } else if (colis > 0) {
                newDenrees.push({ foodId, colis });
            }
            return { ...prev, denreesRecues: newDenrees };
        });
    };

    const handlePrepDaysChange = (foodId: string, value: string) => {
        const newDays = parseInt(value, 10) || 0;
        setMonthlyInputs(prev => ({
            ...prev,
            prepDays: {
                ...(prev.prepDays || {}),
                [foodId]: newDays < 0 ? 0 : newDays,
            }
        }));
    };

    const handleSave = () => {
        if (!selectedSchoolId || !selectedMonth) {
            addToast("Veuillez sélectionner une école et un mois.", 'error');
            return;
        }
        setRapportMensuelData(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            if (!newState[selectedSchoolId]) newState[selectedSchoolId] = {};
            newState[selectedSchoolId][selectedMonth] = monthlyInputs;
            return newState;
        });
        addToast("Rapport mensuel sauvegardé avec succès !", "success");
    };

    const handlePdfExport = () => { addToast("Export PDF en cours de développement.", 'info'); };

    if (!selectedSchool) {
        return <div className="bg-white p-6 rounded-lg shadow-md text-center">Veuillez d'abord ajouter une école dans la section "Informations".</div>;
    }
    
    const formatMonthForDisplay = (monthKey: string) => {
         if (!monthKey) return '';
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const formatted = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-xs">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Rapport Mensuel sur les Stocks de Vivres</h3>
             <div className="flex justify-between items-center mb-4 border-b pb-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium text-slate-600">École</label>
                        <select value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} className="p-1.5 border rounded-md bg-white">
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium text-slate-600">Mois</label>
                        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-1 border rounded-md" />
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={handleSave} variant="primary" icon={<SaveIcon className="h-4 w-4" />}>Sauvegarder</Button>
                    <Button onClick={handlePdfExport} variant="success" icon={<ExportIcon className="h-4 w-4" />}>Exporter PDF</Button>
                </div>
            </div>

            <div className="p-4 border">
                {/* Header */}
                <div className="text-center font-bold text-sm mb-4">RAPPORT MENSUEL SUR LES STOCKS DE VIVRES</div>
                <div className="flex justify-between mb-4 text-xs">
                    <div>
                        <p>DRENA : {ieppData.regionalDirection}</p>
                        <p>MR / PC :</p>
                        <p>IEPP : {ieppData.iepp}</p>
                    </div>
                    <div>
                        <p>ECOLE : {selectedSchool?.name}</p>
                        <p>MOIS : {formatMonthForDisplay(selectedMonth).split(' ')[0].toUpperCase()}</p>
                        <p>ANNEE : {selectedMonth.split('-')[0]}</p>
                        <p>RATION : {calculationData?.rationnaires}</p>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* Left Column */}
                    <div className="col-span-6">
                        <h4 className="font-bold text-center border-t border-x border-black py-1">Tableau 1 : ETAT DES CONTRIBUTIONS FINANCIERES COMMUNAUTAIRES</h4>
                        <table className="w-full border-collapse border border-black">
                            <thead>
                                <tr className="text-center">
                                    <th className="border border-black p-1" rowSpan={2}>Date de Fonctionnement</th>
                                    <th className="border border-black p-1" colSpan={3}>Nbre de Rationnaire</th>
                                    <th className="border border-black p-1" rowSpan={2}>Total CFC</th>
                                    <th className="border border-black p-1" rowSpan={2}></th>
                                </tr>
                                <tr className="text-center"><th className="border border-black p-1">G</th><th className="border border-black p-1">F</th><th className="border border-black p-1">T</th></tr>
                            </thead>
                            <tbody>
                                {monthlyInputs.contributions.map(c => (
                                    <tr key={c.id}>
                                        <td className="border border-black p-0"><input type="date" value={c.date} onChange={e => handleContributionChange(c.id, 'date', e.target.value)} className="w-full text-xs p-1 bg-transparent border-0"/></td>
                                        <td className="border border-black p-0"><input type="number" value={c.garcons} onChange={e => handleContributionChange(c.id, 'garcons', e.target.value)} className="w-full text-xs p-1 bg-transparent border-0 text-center"/></td>
                                        <td className="border border-black p-0"><input type="number" value={c.filles} onChange={e => handleContributionChange(c.id, 'filles', e.target.value)} className="w-full text-xs p-1 bg-transparent border-0 text-center"/></td>
                                        <td className="border border-black p-1 text-center font-semibold">{c.garcons + c.filles}</td>
                                        <td className="border border-black p-0"><input type="number" value={c.montant} onChange={e => handleContributionChange(c.id, 'montant', e.target.value)} className="w-full text-xs p-1 bg-transparent border-0 text-right"/></td>
                                        <td className="border border-black p-0 text-center"><button onClick={() => removeContributionRow(c.id)} className="text-red-500"><TrashIcon className="h-3 w-3"/></button></td>
                                    </tr>
                                ))}
                                <tr><td colSpan={6} className="p-1"><Button onClick={addContributionRow} variant="secondary" className="w-full text-xs py-1"><PlusCircleIcon className="h-3 w-3 mr-1"/>Ajouter une ligne</Button></td></tr>
                            </tbody>
                             <tfoot>
                                <tr><td className="border border-black p-1 font-bold" colSpan={2}>Nbre de jours de Fonctionnement</td><td className="border border-black p-1 text-center font-bold" colSpan={2}>{calculationData?.joursFonctionnement}</td><td className="border border-black p-1 font-bold" colSpan={2}>Total des repas servis</td><td className="border border-black p-1 text-center font-bold">{calculationData?.totalRepasServis}</td></tr>
                                <tr><td className="border-t-2 border-black p-1 font-bold" colSpan={6}>Total Fonds</td><td className="border-t-2 border-black p-1 text-right font-bold">{calculationData?.totalContribution.toLocaleString('fr-FR')}</td></tr>
                            </tfoot>
                        </table>
                         <div className="flex justify-between items-center mt-4 p-2 border border-black">
                            <span className="font-bold">SOMME RESERVEE AUX ACTIVITES CANTINES SCOLAIRES {appSettings.inspectionPercentage}%</span>
                            <span className="font-bold border border-black p-1 w-24 text-center">{calculationData?.sommeReservee.toLocaleString('fr-FR')}</span>
                        </div>
                    </div>
                    {/* Right Column */}
                    <div className="col-span-6 space-y-2">
                         {[{title: 'Tableau 2 : Etat des stocks au :', data: calculationData?.stockInitial}, {title: 'Tableau 3 : Denrées reçues durant le mois de :', data: calculationData?.denreesRecues, editable: true}, {title: 'Tableau 4 : Consommation durant le mois de :', data: calculationData?.consommationMois}, {title: 'Tableau 5 : Etat des stocks à la fin du mois de :', data: calculationData?.stockFinal}].map((table, tableIdx) => (
                            <div key={table.title}>
                                <h4 className="font-bold text-center border-t border-x border-black py-1">{table.title}</h4>
                                <table className="w-full border-collapse border border-black">
                                    <thead><tr className="text-center">
                                        <th className="border border-black p-1">Denrées</th>
                                        {tableIdx === 2 && <th className="border border-black p-1">Jrs Prep.</th>}
                                        <th className="border border-black p-1">Nbre Colis</th>
                                        <th className="border border-black p-1">Poids Total</th>
                                    </tr></thead>
                                    <tbody>
                                        {foodItems.map(food => {
                                            const rowData = table.data?.find(d => d.foodId === food.id);
                                            return (
                                                <tr key={food.id}>
                                                    <td className="border border-black p-1 font-semibold">{food.name.split('(')[0]}</td>
                                                    {tableIdx === 2 && (
                                                        <td className="border border-black p-0 text-center">
                                                            <input
                                                                type="number"
                                                                value={monthlyInputs.prepDays?.[food.id] || ''}
                                                                onChange={e => handlePrepDaysChange(food.id, e.target.value)}
                                                                className="w-12 text-xs p-1 bg-transparent border-0 text-center"
                                                                placeholder="0"
                                                                min="0"
                                                            />
                                                        </td>
                                                    )}
                                                     <td className="border border-black p-0 text-center">
                                                        {table.editable ? (
                                                            <input type="number" value={rowData?.colis || ''} onChange={e => handleDenreeRecueChange(food.id, e.target.value)} className="w-full text-xs p-1 bg-transparent border-0 text-center"/>
                                                        ) : (rowData?.colis || 0).toFixed(2)}
                                                    </td>
                                                    <td className="border border-black p-1 text-right">{(rowData?.poids || 0).toFixed(2)}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RapportMensuel;

import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { AlertTriangleIcon } from '../components/Icons';

const Card: React.FC<{title: string, children: React.ReactNode, className?: string}> = ({ title, children, className }) => (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${className}`}>
        <h5 className="font-semibold text-slate-700 mb-3 border-b pb-2 text-md">{title}</h5>
        {children}
    </div>
);

const BilanEcoleLegacyPage: React.FC = () => {
    const { 
        globalSchoolId, globalMonth,
        schools, directors, cepeResults, infrastructures,
        verificationData, schoolFoodSupplies, foodItems, appSettings,
        dons, verificationDataDons, schoolFoodSuppliesDons, foodItemsDons
    } = useAppContext();

    const selectedSchool = useMemo(() => schools.find(s => s.id === globalSchoolId), [globalSchoolId, schools]);
    const director = useMemo(() => directors.find(d => d.schoolId === globalSchoolId), [globalSchoolId, directors]);
    const infrastructure = useMemo(() => infrastructures.find(i => i.schoolId === globalSchoolId), [globalSchoolId, infrastructures]);

    const latestCepeResult = useMemo(() => {
        if (!selectedSchool) return null;
        return cepeResults
            .filter(r => r.schoolId === selectedSchool.id)
            .sort((a, b) => b.schoolYear.localeCompare(a.schoolYear))[0];
    }, [selectedSchool, cepeResults]);
    
    const monthlyData = useMemo(() => {
        if (!selectedSchool || !globalMonth) return null;

        const verificationMonthData = verificationData[selectedSchool.id]?.[globalMonth];
        const rationnaires = selectedSchool.rationnaireGirls + selectedSchool.rationnaireBoys;
        const mealPrice = schoolFoodSupplies
            .filter(sfs => sfs.schoolId === selectedSchool.id)
            .sort((a, b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime())[0]?.mealPrice || appSettings.defaultMealPrice;
        
        const inspectionPart = appSettings.inspectionPercentage / 100;
        const jourLePlusGrand = Math.max(0, ...Object.values(verificationMonthData?.prepDays || {}).map(Number));
        const cfcTotalAVerser = rationnaires * jourLePlusGrand * mealPrice * inspectionPart;
        const cfcVerse = verificationMonthData?.cfcReellementVerse || 0;

        const allMonths = Object.keys(verificationData[selectedSchool.id] || {}).sort();
        const previousMonths = allMonths.filter(m => m < globalMonth);
        
        const stock = foodItems.map(food => {
             let totalReceivedBefore = 0;
            schoolFoodSupplies.forEach(supply => {
                if (supply.schoolId === selectedSchool.id && supply.supplyDate < `${globalMonth}-01`) {
                    totalReceivedBefore += supply.foodQuantities[food.id] || 0;
                }
            });

            let totalConsumedBefore = 0;
            previousMonths.forEach(monthKey => {
                const prevMonthData = verificationData[selectedSchool.id][monthKey];
                const prevPrepDays = prevMonthData.prepDays[food.id] || 0;
                totalConsumedBefore += rationnaires * prevPrepDays * food.rationPerChild;
            });

            const stockInitial = totalReceivedBefore - totalConsumedBefore;
            
            const receivedThisMonth = schoolFoodSupplies
                .filter(s => s.schoolId === selectedSchool.id && s.supplyDate.startsWith(globalMonth))
                .reduce((sum, supply) => sum + (supply.foodQuantities[food.id] || 0), 0);

            const consumedThisMonth = rationnaires * (verificationMonthData?.prepDays[food.id] || 0) * food.rationPerChild;
            const stockFinal = stockInitial + receivedThisMonth - consumedThisMonth;
            
            return {
                foodName: food.name,
                unit: food.unit,
                stockInitial,
                receivedThisMonth,
                consumedThisMonth,
                stockFinal,
            };
        });

        return {
            financial: { cfcTotalAVerser, cfcVerse, solde: cfcTotalAVerser - cfcVerse },
            stock
        };
    }, [selectedSchool, globalMonth, verificationData, schoolFoodSupplies, foodItems, appSettings]);

    const hasDons = useMemo(() => {
        if (!selectedSchool) return false;
        return dons.some(don => don.schoolId === selectedSchool.id);
    }, [selectedSchool, dons]);

    const monthlyDonsData = useMemo(() => {
        if (!selectedSchool || !globalMonth || !hasDons) return null;
    
        const rationnaires = selectedSchool.rationnaireGirls + selectedSchool.rationnaireBoys;
        const verificationMonthData = verificationDataDons[selectedSchool.id]?.[globalMonth];
        const mealPrice = (schoolFoodSuppliesDons.find(sfs => sfs.schoolId === selectedSchool.id)?.mealPrice) || 25;
        
        const jourLePlusGrand = Math.max(0, ...Object.values(verificationMonthData?.prepDays || {}).map(Number));
        const valeurEstimeeConsommation = rationnaires * jourLePlusGrand * mealPrice;

        const allMonths = Object.keys(verificationDataDons[selectedSchool.id] || {}).sort();
        const previousMonths = allMonths.filter(m => m < globalMonth);

        const stock = foodItemsDons.map(food => {
            const totalReceivedBefore = dons
                .filter(d => d.schoolId === selectedSchool.id && d.type === 'Vivres' && d.foodQuantities && d.date < `${globalMonth}-01`)
                .reduce((sum, d) => sum + (d.foodQuantities![food.id] || 0), 0);

            let totalConsumedBefore = 0;
            previousMonths.forEach(monthKey => {
                const prevMonthData = verificationDataDons[selectedSchool.id][monthKey];
                totalConsumedBefore += rationnaires * (prevMonthData.prepDays[food.id] || 0) * food.rationPerChild;
            });
            
            const stockInitial = totalReceivedBefore - totalConsumedBefore;

            const receivedThisMonth = dons
                .filter(d => d.schoolId === selectedSchool.id && d.type === 'Vivres' && d.foodQuantities && d.date.startsWith(globalMonth))
                .reduce((sum, d) => sum + (d.foodQuantities![food.id] || 0), 0);
            
            const consumedThisMonth = rationnaires * (verificationMonthData?.prepDays[food.id] || 0) * food.rationPerChild;
            
            const stockFinal = stockInitial + receivedThisMonth - consumedThisMonth;

            return { foodName: food.name, unit: food.unit, stockInitial, receivedThisMonth, consumedThisMonth, stockFinal };
        });

        return {
            financial: { valeurEstimeeConsommation },
            stock
        };
    }, [selectedSchool, globalMonth, hasDons, verificationDataDons, foodItemsDons, dons, schoolFoodSuppliesDons]);
    
    if (globalSchoolId === 'all') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-full">
                <AlertTriangleIcon className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Aucune École Sélectionnée</h3>
                <p className="mt-2 text-slate-500">Veuillez sélectionner une école dans le filtre global en haut de la page pour afficher son bilan détaillé.</p>
            </div>
        );
    }
    
    if (!selectedSchool) {
         return <div className="text-center p-8">École non trouvée.</div>;
    }

    const enrollmentData = [
        { name: 'Filles', value: selectedSchool.rationnaireGirls },
        { name: 'Garçons', value: selectedSchool.rationnaireBoys },
    ];
    const enrollmentColors = ['#f472b6', '#60a5fa'];
    
    const formatNumber = (num: number) => num.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
    
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Informations Générales" className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><span className="text-slate-500 block">Code École</span> <span className="font-semibold text-lg">{selectedSchool.code}</span></p>
                        <p><span className="text-slate-500 block">Directeur/trice</span> <span className="font-semibold text-lg">{director?.name || 'N/A'}</span></p>
                        <p><span className="text-slate-500 block">Total Élèves</span> <span className="font-semibold text-lg">{formatNumber(selectedSchool.studentsBoys + selectedSchool.studentsGirls)}</span></p>
                        <p><span className="text-slate-500 block">Total Rationnaires</span> <span className="font-semibold text-lg">{formatNumber(selectedSchool.rationnaireBoys + selectedSchool.rationnaireGirls)}</span></p>
                    </div>
                </Card>
                <Card title="Répartition des Rationnaires">
                     <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie data={enrollmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5} label>
                                {enrollmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={enrollmentColors[index % enrollmentColors.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => [formatNumber(value), '']} />
                            <Legend iconSize={10} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Résultats au CEPE (Dernière Année)">
                    {latestCepeResult ? (
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <div><span className="text-slate-500 block">Année</span><span className="font-semibold text-lg">{latestCepeResult.schoolYear}</span></div>
                            <div><span className="text-slate-500 block">Candidats</span><span className="font-semibold text-lg">{formatNumber(latestCepeResult.candidates)}</span></div>
                            <div><span className="text-slate-500 block">Taux Réussite</span><span className="font-semibold text-lg text-green-600">{((latestCepeResult.admitted / latestCepeResult.candidates) * 100).toFixed(2)}%</span></div>
                        </div>
                    ) : <p className="text-slate-500 text-center text-sm py-4">Aucun résultat au CEPE enregistré.</p>}
                </Card>
                <Card title="Infrastructures Disponibles">
                    {infrastructure ? (
                         <div className="grid grid-cols-3 gap-4 text-sm text-center">
                            <p>Cuisine: <span className={infrastructure.cuisine ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{infrastructure.cuisine ? 'Oui' : 'Non'}</span></p>
                            <p>Magasin: <span className={infrastructure.magasin ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{infrastructure.magasin ? 'Oui' : 'Non'}</span></p>
                            <p>Point d'eau: <span className={infrastructure.pointEau.functional ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{infrastructure.pointEau.functional ? 'Oui' : 'Non'}</span></p>
                         </div>
                    ) : <p className="text-slate-500 text-center text-sm py-4">Aucune donnée d'infrastructure.</p>}
                </Card>
            </div>
            
            {globalMonth ? (
                monthlyData ? (
                    <div className="space-y-6">
                        <Card title={`Situation Financière CFC (GVT) - ${globalMonth}`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div><span className="text-slate-500 block">CFC à Verser</span><span className="font-semibold text-lg">{formatNumber(monthlyData.financial.cfcTotalAVerser)}</span></div>
                                <div><span className="text-slate-500 block">CFC Versé</span><span className="font-semibold text-lg text-green-600">{formatNumber(monthlyData.financial.cfcVerse)}</span></div>
                                <div><span className="text-slate-500 block">Solde</span><span className={`font-semibold text-lg ${monthlyData.financial.solde === 0 ? 'text-slate-800' : 'text-red-600'}`}>{formatNumber(monthlyData.financial.solde)}</span></div>
                            </div>
                        </Card>
                         <Card title={`Consommation des Vivres (GVT) - ${globalMonth}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Denrée</th>
                                            <th className="px-2 py-2 text-right">Stock Initial</th>
                                            <th className="px-2 py-2 text-right">Reçu</th>
                                            <th className="px-2 py-2 text-right">Consommé</th>
                                            <th className="px-2 py-2 text-right">Stock Final</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-700">
                                        {monthlyData.stock.map(item => (
                                            <tr key={item.foodName} className="border-t">
                                                <td className="px-2 py-2 font-medium">{item.foodName} ({item.unit})</td>
                                                <td className="px-2 py-2 text-right">{formatNumber(item.stockInitial)}</td>
                                                <td className="px-2 py-2 text-right text-green-600">{formatNumber(item.receivedThisMonth)}</td>
                                                <td className="px-2 py-2 text-right text-red-600">{formatNumber(item.consumedThisMonth)}</td>
                                                <td className="px-2 py-2 text-right font-bold">{formatNumber(item.stockFinal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-yellow-50 text-yellow-800 rounded-lg">
                        Aucune donnée de vérification GVT trouvée pour le mois sélectionné ({globalMonth}).
                    </div>
                )
            ) : (
                 <div className="text-center p-8 bg-blue-50 text-blue-800 rounded-lg">
                    Sélectionnez un mois dans le filtre global pour voir la situation financière et la consommation.
                </div>
            )}

            {hasDons && globalMonth && (
                monthlyDonsData ? (
                    <div className="space-y-6 mt-6 pt-6 border-t-2 border-dashed border-slate-300">
                        <Card title={`Situation des Dons - ${globalMonth}`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div><span className="text-slate-500 block">Valeur Estimée Consommée</span><span className="font-semibold text-lg">{formatNumber(monthlyDonsData.financial.valeurEstimeeConsommation)} {appSettings.currencySymbol}</span></div>
                            </div>
                        </Card>
                        <Card title={`Consommation des Vivres (Dons) - ${globalMonth}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Denrée</th>
                                            <th className="px-2 py-2 text-right">Stock Initial</th>
                                            <th className="px-2 py-2 text-right">Reçu</th>
                                            <th className="px-2 py-2 text-right">Consommé</th>
                                            <th className="px-2 py-2 text-right">Stock Final</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-700">
                                        {monthlyDonsData.stock.map(item => (
                                            <tr key={item.foodName} className="border-t">
                                                <td className="px-2 py-2 font-medium">{item.foodName} ({item.unit})</td>
                                                <td className="px-2 py-2 text-right">{formatNumber(item.stockInitial)}</td>
                                                <td className="px-2 py-2 text-right text-green-600">{formatNumber(item.receivedThisMonth)}</td>
                                                <td className="px-2 py-2 text-right text-red-600">{formatNumber(item.consumedThisMonth)}</td>
                                                <td className="px-2 py-2 text-right font-bold">{formatNumber(item.stockFinal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-yellow-50 text-yellow-800 rounded-lg mt-6">
                        Aucune consommation de dons enregistrée pour le mois sélectionné ({globalMonth}).
                    </div>
                )
            )}
        </div>
    );
};

export default BilanEcoleLegacyPage;
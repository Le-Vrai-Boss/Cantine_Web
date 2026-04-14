import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import { ExportIcon } from '../../components/Icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const RapportDistributionReport: React.FC = () => {
    const { ieppData, schools, foodItems, schoolFoodSupplies } = useAppContext();
    const { addToast } = useToast();
    
    const sortedFoodItems = useMemo(() => 
        [...foodItems].sort((a, b) => {
            const order = ['Riz', 'Huile', 'Poisson', 'TSP', 'Haricot'];
            const nameA = a.name.split(' ')[0];
            const nameB = b.name.split(' ')[0];
            const indexA = order.indexOf(nameA);
            const indexB = order.indexOf(nameB);
            if(indexA !== -1 && indexB !== -1) return indexA - indexB;
            if(indexA !== -1) return -1;
            if(indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
        }), 
    [foodItems]);

    const reportData = useMemo(() => {
        const totalRationnaires = schools.reduce((sum, s) => sum + s.rationnaireGirls + s.rationnaireBoys, 0);

        const recapDenreesRecues = sortedFoodItems.map(food => {
            const totalPoidsKg = schoolFoodSupplies.reduce((sum, supply) => {
                return sum + (supply.foodQuantities[food.id] || 0);
            }, 0);
            const totalColis = food.netWeight > 0 ? totalPoidsKg / food.netWeight : 0;
            return {
                foodId: food.id,
                name: food.name,
                totalColis: totalColis,
                totalPoidsTonnes: totalPoidsKg / 1000,
            };
        });
        const totalPoidsTonnesGlobal = recapDenreesRecues.reduce((sum, item) => sum + item.totalPoidsTonnes, 0);

        const schoolDistribution = schools.map(school => {
            const supply = schoolFoodSupplies.find(sfs => sfs.schoolId === school.id);
            let totalPoidsKgSchool = 0;
            const foodData = sortedFoodItems.map(food => {
                const poidsKg = supply?.foodQuantities[food.id] || 0;
                totalPoidsKgSchool += poidsKg;
                return {
                    foodId: food.id,
                    poidsKg,
                    colis: food.netWeight > 0 ? poidsKg / food.netWeight : 0,
                };
            });
            return {
                schoolName: school.name,
                canteenType: ieppData.foodType || 'GVT',
                rationnaires: school.rationnaireGirls + school.rationnaireBoys,
                foodData,
                totalPoidsKg: totalPoidsKgSchool,
            };
        }).sort((a, b) => a.schoolName.localeCompare(b.schoolName));

        const totalsDistribution = {
            totalRationnaires: schoolDistribution.reduce((sum, s) => sum + s.rationnaires, 0),
            foodData: sortedFoodItems.map(food => {
                const totalColis = schoolDistribution.reduce((sum, s) => sum + (s.foodData.find(fd => fd.foodId === food.id)?.colis || 0), 0);
                const totalPoidsKg = schoolDistribution.reduce((sum, s) => sum + (s.foodData.find(fd => fd.foodId === food.id)?.poidsKg || 0), 0);
                return { foodId: food.id, totalColis, totalPoidsKg, };
            }),
            grandTotalPoidsKg: schoolDistribution.reduce((sum, s) => sum + s.totalPoidsKg, 0),
        };
        
        const recapitulatifFinal = {
            totalRationnaires: totalsDistribution.totalRationnaires,
            foodData: totalsDistribution.foodData.map(fd => ({
                foodId: fd.foodId,
                totalColis: fd.totalColis,
                totalPoidsTonnes: fd.totalPoidsKg / 1000,
            })),
            grandTotalPoidsTonnes: totalsDistribution.grandTotalPoidsKg / 1000,
        };

        return {
            totalRationnaires,
            recapDenreesRecues,
            totalPoidsTonnesGlobal,
            schoolDistribution,
            totalsDistribution,
            recapitulatifFinal,
        };
    }, [ieppData, schools, schoolFoodSupplies, sortedFoodItems]);
    
    const handlePdfExport = () => { 
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' }) as jsPDF & { autoTable: (options: Record<string, unknown>) => void };
        doc.setFont('helvetica', 'normal');

        doc.autoTable({
            html: '#rapport-distribution-content',
            theme: 'plain',
            styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 2,
            },
            didDrawPage: () => {
                // This is a simplified version; complex headers/footers might need manual drawing
            },
        });
        
        doc.save(`rapport_distribution_${ieppData.schoolYear}.pdf`);
        addToast("PDF généré avec succès.", "success");
    };
    
    const introText = `La première distribution des vivres de l'année scolaire ${ieppData.schoolYear} a eu lieu du ${ieppData.distributionPeriod}. Les ${reportData.totalRationnaires.toLocaleString('fr-FR')} rationnaires des ${schools.length} cantines scolaires de l'Inspection de l'Enseignement Préscolaire et Primaire de ${ieppData.iepp} ont reçu pour ${ieppData.operatingDays} jours de fonctionnement ${reportData.totalPoidsTonnesGlobal.toFixed(3)} tonnes de vivres.`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-xl font-bold text-slate-800">Rapport de Distribution des Vivres</h3>
                <Button onClick={handlePdfExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Télécharger en PDF
                </Button>
            </div>

            <div id="rapport-distribution-content" className="p-4 border bg-white font-serif text-gray-800 text-[10px]">
                <div className="text-center my-4 p-2 border-2 border-gray-700 rounded-lg">
                    <h1 className="text-lg font-bold">RAPPORT DE DISTRIBUTION DES VIVRES DE LA CANTINE {ieppData.schoolYear}</h1>
                </div>

                <p className="text-xs mb-4">{introText}</p>
                <p className="text-xs mb-4">
                    {sortedFoodItems.map(item => `${item.name.split(' ')[0]}: ${reportData.recapDenreesRecues.find(r => r.foodId === item.id)?.totalPoidsTonnes.toFixed(3) || '0.000'} tonnes`).join('; ')}
                </p>
                <p className="text-xs mb-4">Les quantités de denrées reçues par chaque école sont consignées dans le tableau ci-dessous :</p>
                
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-center bg-gray-200 p-1 border border-black text-xs">DENREES ET QUANTITES RECUES</h4>
                        <table className="w-1/2 mx-auto border-collapse border border-black text-xs">
                            <thead><tr className="font-bold text-center"><td className="border border-black p-1">DENREES</td><td className="border border-black p-1">NOMBRE DE COLIS</td><td className="border border-black p-1">POIDS (Tonnes)</td></tr></thead>
                            <tbody>
                                {reportData.recapDenreesRecues.map(item => (<tr key={item.foodId}><td className="border border-black p-1">{item.name}</td><td className="border border-black p-1 text-center">{item.totalColis.toFixed(2)}</td><td className="border border-black p-1 text-center">{item.totalPoidsTonnes.toFixed(3)}</td></tr>))}
                                <tr className="font-bold"><td className="border border-black p-1">TOTAL</td><td className="border border-black p-1 text-center">{reportData.recapDenreesRecues.reduce((s, i) => s + i.totalColis, 0).toFixed(2)}</td><td className="border border-black p-1 text-center">{reportData.totalPoidsTonnesGlobal.toFixed(3)}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <h4 className="font-bold text-center bg-gray-200 p-1 border border-black text-xs">DISTRIBUTION DES DENREES PAR ECOLE</h4>
                        <table className="w-full border-collapse border border-black text-[9px]">
                             <thead className="align-top">
                                <tr className="font-bold text-center">
                                    <td rowSpan={2} className="border border-black p-1">ECOLES</td>
                                    <td rowSpan={2} className="border border-black p-1">Type de Cantine</td>
                                    <td rowSpan={2} className="border border-black p-1">Nombre de Ration</td>
                                    {sortedFoodItems.map(food => <td colSpan={2} key={food.id} className="border border-black p-1">{food.name.split(' ')[0]}</td>)}
                                    <td rowSpan={2} className="border border-black p-1">Poids TOTAL</td>
                                </tr>
                                <tr className="font-bold text-center">
                                    {sortedFoodItems.map(food => <React.Fragment key={food.id}><td className="border border-black p-1">Colis</td><td className="border border-black p-1">Poids (Kg)</td></React.Fragment>)}
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.schoolDistribution.map(school => (
                                    <tr key={school.schoolName} className="text-center">
                                        <td className="border border-black p-1 text-left font-semibold">{school.schoolName}</td>
                                        <td className="border border-black p-1">{school.canteenType}</td>
                                        <td className="border border-black p-1">{school.rationnaires}</td>
                                        {school.foodData.map(fd => <React.Fragment key={fd.foodId}><td className="border border-black p-1">{fd.colis.toFixed(2)}</td><td className="border border-black p-1">{fd.poidsKg.toLocaleString('fr-FR')}</td></React.Fragment>)}
                                        <td className="border border-black p-1 font-bold">{school.totalPoidsKg.toLocaleString('fr-FR')}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold text-center bg-gray-100">
                                    <td colSpan={2} className="border border-black p-1">TOTAL</td>
                                    <td className="border border-black p-1">{reportData.totalsDistribution.totalRationnaires}</td>
                                    {reportData.totalsDistribution.foodData.map(fd => <React.Fragment key={fd.foodId}><td className="border border-black p-1">{fd.totalColis.toFixed(2)}</td><td className="border border-black p-1">{Math.round(fd.totalPoidsKg).toLocaleString('fr-FR')}</td></React.Fragment>)}
                                    <td className="border border-black p-1">{Math.round(reportData.totalsDistribution.grandTotalPoidsKg).toLocaleString('fr-FR')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-center bg-gray-200 p-1 border border-black text-xs">ETAT RECAPITULATIF DES DENREES SERVIES</h4>
                        <table className="w-full border-collapse border border-black text-[9px]">
                            <thead className="align-top">
                                <tr className="font-bold text-center">
                                    <td rowSpan={2} className="border border-black p-1">IEPP</td>
                                    <td rowSpan={2} className="border border-black p-1">Type de Cantine</td>
                                    <td rowSpan={2} className="border border-black p-1">Nombre de Ration</td>
                                    {sortedFoodItems.map(food => <td colSpan={2} key={food.id} className="border border-black p-1">{food.name.split(' ')[0]}</td>)}
                                    <td rowSpan={2} className="border border-black p-1">Poids TOTAL</td>
                                </tr>
                                <tr className="font-bold text-center">
                                    {sortedFoodItems.map(food => <React.Fragment key={food.id}><td className="border border-black p-1">Colis</td><td className="border border-black p-1">Poids (t)</td></React.Fragment>)}
                                </tr>
                            </thead>
                            <tbody>
                                 <tr className="text-center">
                                    <td className="border border-black p-1 text-left font-semibold">{ieppData.iepp}</td>
                                    <td className="border border-black p-1">{ieppData.foodType || 'GVT'}</td>
                                    <td className="border border-black p-1">{reportData.recapitulatifFinal.totalRationnaires}</td>
                                    {reportData.recapitulatifFinal.foodData.map(fd => <React.Fragment key={fd.foodId}><td className="border border-black p-1">{fd.totalColis.toFixed(2)}</td><td className="border border-black p-1">{fd.totalPoidsTonnes.toFixed(3)}</td></React.Fragment>)}
                                    <td className="border border-black p-1 font-bold">{reportData.recapitulatifFinal.grandTotalPoidsTonnes.toFixed(3)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-xs mt-4">La distribution s'est bien déroulée dans l'ensemble. Toutes les écoles ont été servies.</p>

                <footer className="text-xs mt-8">
                    <p className="text-right">Fait à {ieppData.iepp.split(' ')[1] || 'Yamoussoukro'}, le {ieppData.distributionReportDate ? new Date(ieppData.distributionReportDate + 'T00:00:00').toLocaleDateString('fr-FR') : ''}</p>
                    <div className="flex justify-between mt-8">
                        <div className="text-center">
                            <p className="font-bold underline">Le Conseiller chargé des Cantines</p>
                            <p className="font-bold mt-16">{ieppData.advisorName || 'ADOUKO GNANGBA ALAIN-JOSEPH'}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold underline">Le Chef de Circonscription</p>
                            <p className="font-bold mt-16">{ieppData.inspectorName || 'ZEHI née KOSSOUHAN SOLANGE'}</p>
                            <p>Inspecteur Principal de l'Enseignement Préscolaire et Primaire</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default RapportDistributionReport;

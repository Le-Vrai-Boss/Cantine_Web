import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import { AlertTriangleIcon } from '../../components/Icons';
import type { PlanActionSection } from '../../types';

const EditableCell: React.FC<{ value: string | number; onChange: (value: string | number) => void; type?: 'text' | 'number' | 'textarea'; className?: string; rows?: number, isReadOnly?: boolean }> = ({ value, onChange, type = 'text', className = '', rows, isReadOnly = false }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (isReadOnly) return;
        onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value);
    };

    if (type === 'textarea') {
        return <textarea value={value} onChange={handleChange} rows={rows || 2} readOnly={isReadOnly} className={`w-full p-1 bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 rounded text-xs disabled:bg-slate-100 ${className}`} />;
    }

    return <input type={type} value={value} onChange={handleChange} readOnly={isReadOnly} className={`w-full p-1 bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 rounded text-xs disabled:bg-slate-100 ${className}`} />;
};

const PlanActionBudgetiseReport: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { planActionData, setPlanActionData, ieppData } = useAppContext();
    const { addToast } = useToast();

    const handleDataChange = (path: (string | number)[], value: string | number) => {
        setPlanActionData(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            let current = newState as Record<string, unknown>;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]] as Record<string, unknown>;
            }
            current[path[path.length - 1]] = value;
            return newState;
        });
    };

    const calculatedTotals = useMemo(() => {
        const sectionTotals: Record<string, number> = {};
        planActionData.sections.forEach(section => {
            const total = section.resultats.reduce((sum, resultat) =>
                sum + resultat.activities.reduce((actSum, activity) => actSum + Number(activity.montant), 0)
            , 0);
            sectionTotals[section.id] = total;
        });

        const totalDepenses = Object.values(sectionTotals).reduce((sum, total) => sum + total, 0);
        const totalRevenus = planActionData.budget.revenus.reduce((sum, revenu) => sum + Number(revenu.montant), 0);
        const solde = totalRevenus - totalDepenses;

        return { sectionTotals, totalDepenses, totalRevenus, solde };
    }, [planActionData]);
    
    const handlePdfExport = () => { addToast("L'exportation PDF est en cours de développement.", 'info'); };
    const handleWordExport = () => { addToast("L'exportation Word n'est pas encore disponible.", 'info'); };

    const anneeScolaireFin = ieppData.schoolYear ? ieppData.schoolYear.split('-')[1] : new Date().getFullYear();

    const renderHeader = () => (
        <header className="mb-8">
            <div className="flex justify-between items-start text-[10px] mb-6">
                <div className="text-left">
                    <p className="font-bold">{ieppData.ministry}</p>
                    <p>_____________________________________</p>
                    <p>{ieppData.regionalDirection}</p>
                    <p>_____________________________________</p>
                    <p>{ieppData.iepp}</p>
                    <div className="mt-4">
                        <p>B.P. : {ieppData.postalBox}</p>
                        <p>Tél. : {ieppData.phone}</p>
                        <p>E.mail : {ieppData.email}</p>
                        <p className="font-bold mt-2">SERVICE CANTINE SCOLAIRE</p>
                        <p>N° : ......................../ {anneeScolaireFin}/IEPP/YAKRO-FOND</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <p>REPUBLIQUE DE CÔTE D'IVOIRE</p>
                    <p>_________________</p>
                    <p>Union - Discipline - Travail</p>
                    <p className="mt-4">ANNEE SCOLAIRE {ieppData.schoolYear}</p>
                </div>
            </div>
            <h1 className="text-2xl font-bold text-center">PLAN D'ACTION BUDGETISE</h1>
            <h2 className="text-lg font-bold text-center mt-8">SOMMAIRE</h2>
            <ul className="list-decimal list-inside pl-10 mt-4 text-sm" style={{ listStyleType: 'upper-roman' }}>
                {planActionData.sections.map((s) => <li key={s.id}>{s.titre}</li>)}
            </ul>
        </header>
    );

    const renderSection = (section: PlanActionSection, sectionIndex: number) => {
        const budgetAlloue = calculatedTotals.totalRevenus * (section.pourcentage / 100);
        const depensesSection = calculatedTotals.sectionTotals[section.id];
        const depassement = depensesSection > budgetAlloue;

        return (
            <div key={section.id} className="mb-8 break-after-page">
                <h3 className="text-sm font-bold bg-gray-200 text-center p-1 border border-black">
                    {['I', 'II', 'III', 'IV'][sectionIndex]}. {section.titre} {section.pourcentage}%
                </h3>
                <table className="w-full border-collapse border border-black text-xs">
                    <thead className="align-top">
                        <tr className="font-bold text-center">
                            <td className="border border-black p-1 w-[20%]">ACTIVITES</td>
                            <td className="border border-black p-1 w-[10%]">RESPONSABLE</td>
                            <td className="border border-black p-1 w-[10%]">PERIODE D'EXECUTION</td>
                            <td className="border border-black p-1 w-[20%]">INDICATEUR OBJECTIVEMENT VERITABLE</td>
                            <td className="border border-black p-1 w-[20%]">SOURCE DE VERIFICATION</td>
                            <td className="border border-black p-1 w-[10%]">MONTANT</td>
                            <td className="border border-black p-1 w-[10%]">SOURCE DE FINANCEMENT</td>
                        </tr>
                    </thead>
                    <tbody>
                        {section.resultats.map((resultat, resIndex) => (
                            <React.Fragment key={resultat.id}>
                                <tr className="font-bold bg-gray-100">
                                    <td className="border border-black p-1 align-middle">RESULTATS {resIndex + 1} :</td>
                                    <td colSpan={6} className="border border-black p-0 align-middle">
                                         <EditableCell value={resultat.titre} onChange={(val) => handleDataChange(['sections', sectionIndex, 'resultats', resIndex, 'titre'], val as string)} isReadOnly={isReadOnly} className="font-bold"/>
                                    </td>
                                </tr>
                                {resultat.activities.map((activite, actIndex) => (
                                    <tr key={activite.id} className="align-top">
                                        <td className="border border-black p-0"><EditableCell value={activite.activite} onChange={val => handleDataChange(['sections', sectionIndex, 'resultats', resIndex, 'activities', actIndex, 'activite'], val as string)} type="textarea" isReadOnly={isReadOnly} /></td>
                                        <td className="border border-black p-0"><EditableCell value={activite.responsable} onChange={val => handleDataChange(['sections', sectionIndex, 'resultats', resIndex, 'activities', actIndex, 'responsable'], val as string)} isReadOnly={isReadOnly} /></td>
                                        <td className="border border-black p-0"><EditableCell value={activite.periode} onChange={val => handleDataChange(['sections', sectionIndex, 'resultats', resIndex, 'activities', actIndex, 'periode'], val as string)} isReadOnly={isReadOnly} /></td>
                                        <td className="border border-black p-0"><EditableCell value={activite.indicateur} onChange={val => handleDataChange(['sections', sectionIndex, 'resultats', resIndex, 'activities', actIndex, 'indicateur'], val as string)} type="textarea" isReadOnly={isReadOnly} /></td>
                                        <td className="border border-black p-0"><EditableCell value={activite.sourceVerification} onChange={val => handleDataChange(['sections', sectionIndex, 'resultats', resIndex, 'activities', actIndex, 'sourceVerification'], val as string)} type="textarea" isReadOnly={isReadOnly} /></td>
                                        <td className="border border-black p-0"><EditableCell value={activite.montant} onChange={val => handleDataChange(['sections', sectionIndex, 'resultats', resIndex, 'activities', actIndex, 'montant'], val)} type="number" isReadOnly={isReadOnly} /></td>
                                        <td className="border border-black p-0"><EditableCell value={activite.sourceFinancement} onChange={val => handleDataChange(['sections', sectionIndex, 'resultats', resIndex, 'activities', actIndex, 'sourceFinancement'], val as string)} isReadOnly={isReadOnly} /></td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                        <tr className="font-bold bg-gray-200">
                            <td colSpan={5} className="border border-black p-1 text-right">TOTAL PARTIEL {sectionIndex + 1}</td>
                            <td className={`border border-black p-1 text-right ${depassement ? 'text-red-600' : ''}`}>
                                <div className="flex items-center justify-end">
                                    {depassement && <AlertTriangleIcon className="h-4 w-4 mr-1" />}
                                    {depensesSection.toLocaleString('fr-FR')}
                                </div>
                            </td>
                            <td className="border border-black p-1"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const renderBudget = () => (
        <div className="mt-12">
            <h3 className="text-lg font-bold text-center mb-2">BUDGET ANNUEL</h3>
            <div className="grid grid-cols-2 gap-0">
                <table className="w-full border-collapse border-2 border-black text-xs">
                     <thead className="align-top"><tr className="font-bold bg-gray-200"><td className="border border-black p-1 text-center">TOTAL DES REVENUS</td><td className="border border-black p-1 text-center">MONTANT</td></tr></thead>
                    <tbody>
                        {planActionData.budget.revenus.map((revenu, revIndex) => (
                            <tr key={revenu.id}>
                                <td className="border border-black p-0"><EditableCell value={revenu.label} onChange={val => handleDataChange(['budget', 'revenus', revIndex, 'label'], val as string)} isReadOnly={isReadOnly} /></td>
                                <td className="border border-black p-0"><EditableCell value={revenu.montant} onChange={val => handleDataChange(['budget', 'revenus', revIndex, 'montant'], val)} type="number" isReadOnly={isReadOnly} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <table className="w-full border-collapse border-2 border-black text-xs">
                     <thead className="align-top"><tr className="font-bold bg-gray-200"><td className="border border-black p-1 text-center">DEPENSES</td><td className="border border-black p-1 text-center">MONTANT</td></tr></thead>
                    <tbody>
                        {planActionData.sections.map(section => (
                            <tr key={section.id}>
                                <td className="border border-black p-1">{section.titre} {section.pourcentage}%</td>
                                <td className="border border-black p-1 text-right">{calculatedTotals.sectionTotals[section.id].toLocaleString('fr-FR')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <table className="w-full border-collapse border-2 border-black text-xs mt-0">
                <tbody>
                    <tr className="font-bold bg-gray-200">
                        <td className="border border-black p-1 w-1/4">TOTAL DES REVENUS</td>
                        <td className="border border-black p-1 w-1/4 text-right">{calculatedTotals.totalRevenus.toLocaleString('fr-FR')}</td>
                        <td className="border border-black p-1 w-1/4">TOTAL DES DEPENSES</td>
                        <td className="border border-black p-1 w-1/4 text-right">{calculatedTotals.totalDepenses.toLocaleString('fr-FR')}</td>
                    </tr>
                    <tr className="font-bold bg-gray-300">
                        <td className="border border-black p-1">SOLDE</td>
                        <td className="border border-black p-1 text-right">{calculatedTotals.solde.toLocaleString('fr-FR')}</td>
                        <td colSpan={2}></td>
                    </tr>
                </tbody>
             </table>
        </div>
    );

    const renderSignatures = () => (
        <footer className="mt-12 text-xs">
            <p className="text-right">Fait à Yamoussoukro, le {new Date().toLocaleDateString('fr-FR')}</p>
            <div className="grid grid-cols-4 gap-4 mt-8 text-center">
                <div>
                    <p className="underline">La Conseillère chargée des cantines</p>
                    <p className="font-bold mt-12">{ieppData.advisorName || 'N/A'}</p>
                </div>
                <div>
                    <p className="underline">Le chef de circonscription</p>
                    <p className="font-bold mt-12">{ieppData.inspectorName || 'N/A'}</p>
                    <p>Inspecteur Principal de l'Enseignement Préscolaire et Primaire</p>
                </div>
                <div>
                    <p className="underline">Le Directeur Régional de l'Education Nationale</p>
                    <p className="font-bold mt-12">{planActionData.signatures.directeurRegional}</p>
                </div>
                <div>
                    <p className="underline">Le Directeur des cantines scolaires</p>
                    <p className="font-bold mt-12">{planActionData.signatures.directeurCantines}</p>
                </div>
            </div>
        </footer>
    );

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)]">Plan d'Action Budgétisé (Modifiable)</h3>
                <div className="flex space-x-2">
                    <Button onClick={handlePdfExport} variant="secondary">Exporter PDF</Button>
                    <Button onClick={handleWordExport} variant="secondary">Exporter Word</Button>
                </div>
            </div>
            <div className="p-4 border font-serif text-sm bg-white" id="plan-action-content">
                {renderHeader()}
                <main>
                    {planActionData.sections.map((section, index) => renderSection(section, index))}
                    {renderBudget()}
                </main>
                {renderSignatures()}
            </div>
        </div>
    );
};

export default PlanActionBudgetiseReport;

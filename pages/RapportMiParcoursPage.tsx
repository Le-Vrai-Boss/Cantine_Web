import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { ExportIcon } from '../components/Icons';

const coatOfArmsBase64 = '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';

const ReportHeader: React.FC = () => {
    const { ieppData } = useAppContext();
    
    return (
        <header className="mb-4">
            <div className="flex justify-between items-start">
                <div className="text-left">
                    <p className="font-bold">{ieppData.ministry}</p>
                    <hr className="border-black my-1"/>
                    <p>{ieppData.regionalDirection}</p>
                    <hr className="border-black my-1"/>
                    <p>{ieppData.iepp}</p>
                    <div className="mt-2">
                        <p>B.P. : {ieppData.postalBox}</p>
                        <p>Tél. : {ieppData.phone}</p>
                        <p>Email: {ieppData.email}</p>
                        <p className="font-bold mt-1">SERVICE : CANTINE</p>
                        <p>N° : ................../{ieppData.schoolYear.split('-')[1]}/IEPP/YAKRO-FOND</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <p>REPUBLIQUE DE CÔTE D'IVOIRE</p>
                    <p>Union-Discipline-Travail</p>
                    <img src={coatOfArmsBase64} alt="Blason" className="w-16 h-16 mt-2" />
                    <p className="mt-2">Année - Scolaire {ieppData.schoolYear}</p>
                </div>
            </div>
            <div className="text-center my-4 p-2 border-2 border-black rounded-lg">
                <h1 className="text-lg font-bold">RAPPORT D'ACTIVITES A MI-PARCOURS DU PROGRAMME DES CANTINES SCOLAIRES DE L'IEPP YAMOUSSOUKRO-FONDATION</h1>
                <h2 className="text-md font-bold mt-2">ANNEE SCOLAIRE : {ieppData.schoolYear}</h2>
            </div>
             <div className="grid grid-cols-2 gap-x-8 text-xs">
                <p><span className="font-bold">Nom et prénoms du DRENA :</span> VAZOUMANA CISSE_07 08 51 81 18</p>
                <p><span className="font-bold">Nom et prénoms de l'IEPP :</span> {ieppData.inspectorName}</p>
                <p><span className="font-bold">Nom et prénoms du CRESAC Coordonnateur :</span> YEO DONASSONGUI Martin_07 07 46 42 30 / 05 55 63 36 43</p>
                <p><span className="font-bold">Nom et prénoms CRESAC MAGASIN :</span> ATSE HUGUES Barthélemy _ 07 08 11 14 41</p>
                <p><span className="font-bold">Nom et Prénoms des CESAC :</span> {ieppData.advisorName}</p>
            </div>
        </header>
    );
};

const ReportFooter: React.FC = () => {
    const { ieppData } = useAppContext();
    return (
        <footer className="mt-12 pt-8 text-sm">
            <div className="flex justify-end">
                <div className="text-center">
                    <p>Fait à Yamoussoukro, le {new Date().toLocaleDateString('fr-FR')}</p>
                    <p className="font-bold mt-4 underline">LE CHEF DE CIRCONSCRIPTION</p>
                    <p className="font-bold mt-16">{ieppData.inspectorName}</p>
                    <p>Inspecteur Principal de l'Enseignement Préscolaire et Primaire</p>
                </div>
            </div>
        </footer>
    );
};

const ReportTable: React.FC<{ title: string, head: React.ReactNode, children: React.ReactNode, className?: string }> = ({ title, head, children, className = '' }) => (
    <div className={`mb-6 print-break-inside-avoid ${className}`}>
        <h4 className="font-bold text-center bg-gray-200 p-1 border border-black text-sm">{title}</h4>
        <table className="w-full border-collapse border border-black text-xs">
            <thead className="align-top font-bold text-center bg-gray-100">
                {head}
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
    </div>
);

const RapportMiParcoursPage: React.FC = () => {
    const { ieppData, schools, foodItems, schoolFoodSupplies, verificationData, depenses, cesacMembers, dons } = useAppContext();
    
    const handlePrint = () => { window.print(); };

    const formatNumber = (num: number | undefined, digits = 0) => (num || 0).toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    
    // --- CALCULATIONS ---

    const listeCantinesData = useMemo(() => {
        const rows = schools.map(s => ({
            name: s.name,
            filles: s.studentsGirls,
            garcons: s.studentsBoys,
            total: s.studentsGirls + s.studentsBoys,
            rationnaires: s.rationnaireGirls + s.rationnaireBoys,
        }));
        const totals = {
            filles: rows.reduce((sum, r) => sum + r.filles, 0),
            garcons: rows.reduce((sum, r) => sum + r.garcons, 0),
            total: rows.reduce((sum, r) => sum + r.total, 0),
            rationnaires: rows.reduce((sum, r) => sum + r.rationnaires, 0),
        };
        return { rows, totals };
    }, [schools]);

    const vivresGVTData = useMemo(() => {
        const rows = foodItems.map(food => {
            const totalRecu = schoolFoodSupplies.reduce((sum, supply) => sum + (supply.foodQuantities[food.id] || 0), 0);
            return {
                name: food.name.split(' ')[0],
                recus: totalRecu / 1000, // in tonnes
            };
        });
        const total = rows.reduce((sum, r) => sum + r.recus, 0);
        return { rows, total };
    }, [foodItems, schoolFoodSupplies]);
    
    const comptesBancairesData = useMemo(() => {
        const cfcCollectees = Object.values(verificationData).flatMap(schoolData => Object.values(schoolData)).reduce((sum, monthData) => sum + monthData.cfcReellementVerse, 0);
        const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
        const soldeInitial = ieppData.initialBalance || 0;
        const resteEnCompte = soldeInitial + cfcCollectees - totalDepenses;
        return { soldeInitial, cfcCollectees, totalDepenses, resteEnCompte };
    }, [ieppData, verificationData, depenses]);

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-hidden { display: none; }
                    .print-break-after-page { page-break-after: always; }
                    .print-break-inside-avoid { page-break-inside: avoid; }
                }
                @page { size: A4; margin: 0.75in; }
            `}</style>
            
            <div className="flex justify-between items-center mb-4 print-hidden">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)]">Aperçu du Rapport à mi-parcours</h3>
                <Button onClick={handlePrint} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Imprimer / Enregistrer en PDF
                </Button>
            </div>
            
            <div id="print-area" className="bg-white p-8 font-serif text-black text-sm border border-[var(--color-border-base)]">
                <ReportHeader />
                <main>
                    {/* LISTE ACTUALISEE DES CANTINES SCOLAIRES */}
                    <ReportTable 
                        title="I.1 LISTE ACTUALISEE DES CANTINES SCOLAIRES"
                        head={<tr><td className="border border-black p-1">N°</td><td className="border border-black p-1">Cantines Scolaire</td><td className="border border-black p-1">Filles</td><td className="border border-black p-1">Garçons</td><td className="border border-black p-1">Total</td><td className="border border-black p-1">Nombre de Rationnaires</td></tr>}
                    >
                        {listeCantinesData.rows.map((row, i) => (
                            <tr key={row.name}><td className="border border-black p-1 text-center">{i+1}</td><td className="border border-black p-1">{row.name}</td><td className="border border-black p-1 text-center">{formatNumber(row.filles)}</td><td className="border border-black p-1 text-center">{formatNumber(row.garcons)}</td><td className="border border-black p-1 text-center font-bold">{formatNumber(row.total)}</td><td className="border border-black p-1 text-center">{formatNumber(row.rationnaires)}</td></tr>
                        ))}
                        <tr className="font-bold bg-gray-100"><td className="border border-black p-1" colSpan={2}>TOTAL</td><td className="border border-black p-1 text-center">{formatNumber(listeCantinesData.totals.filles)}</td><td className="border border-black p-1 text-center">{formatNumber(listeCantinesData.totals.garcons)}</td><td className="border border-black p-1 text-center">{formatNumber(listeCantinesData.totals.total)}</td><td className="border border-black p-1 text-center">{formatNumber(listeCantinesData.totals.rationnaires)}</td></tr>
                    </ReportTable>
                    
                    {/* POINT DES VIVRES REÇUS DU GOUVERNEMENT */}
                    <ReportTable
                        title="II.1 POINT DES VIVRES REÇUS DU GOUVERNEMENT"
                        head={<tr><td className="border border-black p-1">TYPE DE DENREES</td><td className="border border-black p-1">Initial</td><td className="border border-black p-1">Reçus</td><td className="border border-black p-1">Distribués</td><td className="border border-black p-1">Final</td></tr>}
                    >
                        {vivresGVTData.rows.map(row => (
                            <tr key={row.name}><td className="border border-black p-1">{row.name}</td><td className="border border-black p-1 text-center">0</td><td className="border border-black p-1 text-center">{row.recus.toFixed(3)}</td><td className="border border-black p-1 text-center">{row.recus.toFixed(3)}</td><td className="border border-black p-1 text-center">0</td></tr>
                        ))}
                        <tr className="font-bold bg-gray-100"><td className="border border-black p-1">TOTAL</td><td className="border border-black p-1 text-center">0</td><td className="border border-black p-1 text-center">{vivresGVTData.total.toFixed(3)}</td><td className="border border-black p-1 text-center">{vivresGVTData.total.toFixed(3)}</td><td className="border border-black p-1 text-center">0</td></tr>
                    </ReportTable>
                    
                    <p className="text-xs my-4">Commentaire : Les trente-deux (32) cantines ont bénéficiés de dotation en riz, en huile, en poisson, en TSP et en haricot pour vingt-six ({ieppData.operatingDays}) jours de fonctionnement.</p>

                    <div className="print-break-after-page"></div>
                    
                    {/* COMPTES BANCAIRES */}
                     <ReportTable
                        title="III.6 COMPTES BANCAIRES ET ETAT DES AVOIRS A MI-PARCOURS DE L'ANNEE SCOLAIRE"
                        head={<tr><td className="border border-black p-1">N° COMPTE</td><td className="border border-black p-1">STRUCTURES FINANCIERES</td><td className="border border-black p-1">SOLDE INITIAL</td><td className="border border-black p-1">CFC Collectées</td><td className="border border-black p-1">DEPENSES (CFA)</td><td className="border border-black p-1">RESTE EN COMPTE</td></tr>}
                    >
                        <tr>
                            <td className="border border-black p-1">{ieppData.accountNumber}</td>
                            <td className="border border-black p-1">{ieppData.bankName}</td>
                            <td className="border border-black p-1 text-right">{formatNumber(comptesBancairesData.soldeInitial)}</td>
                            <td className="border border-black p-1 text-right">{formatNumber(comptesBancairesData.cfcCollectees)}</td>
                            <td className="border border-black p-1 text-right">{formatNumber(comptesBancairesData.totalDepenses)}</td>
                            <td className="border border-black p-1 text-right font-bold">{formatNumber(comptesBancairesData.resteEnCompte)}</td>
                        </tr>
                    </ReportTable>
                    
                     {/* LISTE ET SITUATION DES CONSEILLERS */}
                    <ReportTable
                        title="V.1 LISTE ET SITUATION DES CONSEILLERS"
                        head={<tr><td className="border border-black p-1">NOM & PRENOMS</td><td className="border border-black p-1">FONCTION</td><td className="border border-black p-1">MATRICULE</td><td className="border border-black p-1">TELEPHONE</td><td className="border border-black p-1">E-MAIL</td><td className="border border-black p-1">ANCIENNETE AU POSTE ACTUEL</td><td className="border border-black p-1">DATE DE DEPART A LA RETRAITE</td></tr>}
                    >
                        {cesacMembers.map(m => (
                            <tr key={m.id}>
                                <td className="border border-black p-1">{m.name}</td>
                                <td className="border border-black p-1">CESAC</td>
                                <td className="border border-black p-1">{m.matricule}</td>
                                <td className="border border-black p-1">{m.contact}</td>
                                <td className="border border-black p-1">{m.email}</td>
                                <td className="border border-black p-1 text-center">{m.seniority} ANS</td>
                                <td className="border border-black p-1">{m.retirementDate}</td>
                            </tr>
                        ))}
                    </ReportTable>

                    <div className="mt-8">
                        <h4 className="font-bold text-center">CONCLUSION</h4>
                        <p className="mt-2 text-justify">
                            Au cours de l'année scolaire {ieppData.schoolYear}, les {schools.length} cantines scolaires ont reçu une dotation de {vivresGVTData.total.toFixed(2)} tonnes de vivres GVT pour un fonctionnement de {ieppData.operatingDays} jours. Grâce à la technique de mobilisation communautaire, l'apport de vivres des communautés, groupements et des cadres s'élève à {(dons.reduce((sum, d) => sum + d.valeurEstimee, 0) / (25 * 50)).toFixed(2)} tonnes. La sensibilisation sera poursuivie pour une meilleure prise en charge des cantines. Les contributions financières communautaires attendues ont été collectées et déposées sur les comptes ouverts à cet effet.
                        </p>
                    </div>

                </main>
                <ReportFooter />
            </div>
        </div>
    );
};

export default RapportMiParcoursPage;
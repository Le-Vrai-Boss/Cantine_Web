

import React, { useMemo } from 'react';
import { SubMenuId } from '../constants';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { SuiviMedical, FormationHygiene, InspectionLocaux, IncidentSante } from '../types';
import { Button } from '../components/Button';
import { PlusCircleIcon, TrashIcon, ExportIcon } from '../components/Icons';
import * as XLSX from 'xlsx';

const SuiviMedicalTable: React.FC = () => {
    const { suivisMedicaux, setSuivisMedicaux, cantinieres, schools } = useAppContext();
    const { addToast } = useToast();

    const cantiniereMap = useMemo(() => {
        const map = new Map<string, { name: string, schoolName: string }>();
        cantinieres.forEach(c => {
            const school = schools.find(s => s.id === c.schoolId);
            map.set(c.id, { name: c.name, schoolName: school?.name || 'N/A' });
        });
        return map;
    }, [cantinieres, schools]);

    const addRow = () => {
        if (cantinieres.length === 0) {
            addToast("Veuillez d'abord ajouter des cantinières dans la section Informations.", 'error');
            return;
        }
        const newSuivi: SuiviMedical = {
            id: `${Date.now()}`,
            cantiniereId: cantinieres[0].id,
            dateVisite: new Date().toISOString().split('T')[0],
            typeVisite: 'Annuelle',
            resultat: 'En attente',
            commentaires: '',
        };
        setSuivisMedicaux(prev => [...prev, newSuivi]);
    };

    const removeRow = (id: string) => {
        setSuivisMedicaux(prev => prev.filter(s => s.id !== id));
    };

    const handleInputChange = (id: string, field: keyof Omit<SuiviMedical, 'id'>, value: string) => {
        setSuivisMedicaux(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };
    
    const handleExport = () => {
        const dataToExport = suivisMedicaux.map(s => ({
            "Nom Cantinière": cantiniereMap.get(s.cantiniereId)?.name || 'N/A',
            "École": cantiniereMap.get(s.cantiniereId)?.schoolName || 'N/A',
            "Date de Visite": s.dateVisite,
            "Type de Visite": s.typeVisite,
            "Résultat": s.resultat,
            "Commentaires": s.commentaires,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Suivi Médical");
        XLSX.writeFile(wb, "suivi_medical_personnel.xlsx");
        addToast("Données du suivi médical exportées.", 'success');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Suivi Médical du Personnel (Cantinières)</h3>
             <div className="flex items-center space-x-2 mb-4">
                <Button onClick={addRow} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />}>
                    Ajouter un suivi
                </Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter
                </Button>
            </div>
            {cantinieres.length === 0 && (
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">
                    Aucune cantinière n'a été trouvée. Veuillez en ajouter dans "Informations {'>'} Cantinières" pour commencer le suivi.
                </p>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                     <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th className="px-4 py-3">Cantinière</th>
                            <th className="px-4 py-3">École</th>
                            <th className="px-4 py-3">Date Visite</th>
                            <th className="px-4 py-3">Type Visite</th>
                            <th className="px-4 py-3">Résultat</th>
                            <th className="px-4 py-3">Commentaires</th>
                            <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suivisMedicaux.map(suivi => (
                            <tr key={suivi.id} className="border-b even:bg-slate-50 hover:bg-slate-100 align-middle">
                                <td className="px-4 py-2">
                                    <select
                                        value={suivi.cantiniereId}
                                        onChange={e => handleInputChange(suivi.id, 'cantiniereId', e.target.value)}
                                        className="w-full p-1.5 border rounded-md bg-white"
                                    >
                                        {cantinieres.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-2 text-slate-600">{cantiniereMap.get(suivi.cantiniereId)?.schoolName}</td>
                                <td className="px-4 py-2"><input type="date" value={suivi.dateVisite} onChange={e => handleInputChange(suivi.id, 'dateVisite', e.target.value)} className="w-full p-1 border rounded-md" /></td>
                                <td className="px-4 py-2">
                                    <select value={suivi.typeVisite} onChange={e => handleInputChange(suivi.id, 'typeVisite', e.target.value)} className="w-full p-1.5 border rounded-md bg-white">
                                        <option>Annuelle</option>
                                        <option>Embauche</option>
                                        <option>Contrôle</option>
                                        <option>Autre</option>
                                    </select>
                                </td>
                                <td className="px-4 py-2">
                                     <select value={suivi.resultat} onChange={e => handleInputChange(suivi.id, 'resultat', e.target.value)} className="w-full p-1.5 border rounded-md bg-white">
                                        <option>Apte</option>
                                        <option>Inapte Temporairement</option>
                                        <option>Apte avec réserves</option>
                                        <option>En attente</option>
                                    </select>
                                </td>
                                <td className="px-4 py-2"><input type="text" value={suivi.commentaires} onChange={e => handleInputChange(suivi.id, 'commentaires', e.target.value)} className="w-full p-1 border rounded-md" /></td>
                                <td className="px-4 py-2 text-center">
                                    <button onClick={() => removeRow(suivi.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FormationsHygieneTable: React.FC = () => {
    const { formationsHygiene, setFormationsHygiene } = useAppContext();
    const { addToast } = useToast();

    const addRow = () => {
        const newFormation: FormationHygiene = {
            id: `${Date.now()}`,
            dateFormation: new Date().toISOString().split('T')[0],
            theme: '',
            participants: '',
            formateur: '',
        };
        setFormationsHygiene(prev => [...prev, newFormation]);
    };

    const removeRow = (id: string) => {
        setFormationsHygiene(prev => prev.filter(f => f.id !== id));
    };

    const handleInputChange = (id: string, field: keyof Omit<FormationHygiene, 'id'>, value: string) => {
        setFormationsHygiene(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const handleExport = () => {
        if (formationsHygiene.length === 0) {
            addToast("Aucune formation à exporter.", 'info');
            return;
        }
        const dataToExport = formationsHygiene.map(f => ({
            "DATE": f.dateFormation,
            "THÈME": f.theme,
            "PARTICIPANTS": f.participants,
            "FORMATEUR": f.formateur,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Formations Hygiène");
        XLSX.writeFile(wb, "formations_hygiene.xlsx");
        addToast("Données des formations exportées.", 'success');
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Formations sur l'Hygiène</h3>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={addRow} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />}>
                    Ajouter une formation
                </Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-heading)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th className="px-4 py-3 w-40">DATE</th>
                            <th className="px-4 py-3">THÈME</th>
                            <th className="px-4 py-3">PARTICIPANTS</th>
                            <th className="px-4 py-3">FORMATEUR</th>
                            <th className="px-4 py-3 text-center">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formationsHygiene.map(formation => (
                            <tr key={formation.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                <td className="px-2 py-2">
                                    <input type="date" value={formation.dateFormation} onChange={e => handleInputChange(formation.id, 'dateFormation', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="text" value={formation.theme} onChange={e => handleInputChange(formation.id, 'theme', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="text" value={formation.participants} onChange={e => handleInputChange(formation.id, 'participants', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="text" value={formation.formateur} onChange={e => handleInputChange(formation.id, 'formateur', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2 text-center">
                                    <button onClick={() => removeRow(formation.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                         {formationsHygiene.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-[var(--color-text-muted)]">
                                    Aucune formation enregistrée.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const IncidentsSanteTable: React.FC = () => {
    const { incidentsSante, setIncidentsSante, schools } = useAppContext();
    const { addToast } = useToast();

    const schoolMap = useMemo(() => new Map(schools.map(s => [s.id, s.name])), [schools]);

    const addRow = () => {
        if (schools.length === 0) {
            addToast("Veuillez d'abord ajouter des écoles dans la section Informations.", 'error');
            return;
        }
        const newIncident: IncidentSante = {
            id: `${Date.now()}`,
            schoolId: schools[0].id,
            dateIncident: new Date().toISOString().split('T')[0],
            typeIncident: '',
            description: '',
            personnesAffectees: 0,
            mesuresPrises: '',
        };
        setIncidentsSante(prev => [...prev, newIncident]);
    };

    const removeRow = (id: string) => {
        setIncidentsSante(prev => prev.filter(i => i.id !== id));
    };

    const handleInputChange = (id: string, field: keyof Omit<IncidentSante, 'id'>, value: string) => {
        const processedValue = field === 'personnesAffectees' ? parseInt(value, 10) || 0 : value;
        setIncidentsSante(prev => prev.map(i => i.id === id ? { ...i, [field]: processedValue } : i));
    };

    const handleExport = () => {
        if (incidentsSante.length === 0) {
            addToast("Aucun incident à exporter.", 'info');
            return;
        }
        const dataToExport = incidentsSante.map(i => ({
            "DATE": i.dateIncident,
            "ÉCOLE": schoolMap.get(i.schoolId) || 'N/A',
            "TYPE D'INCIDENT": i.typeIncident,
            "DESCRIPTION": i.description,
            "PERSONNES AFFECTÉES": i.personnesAffectees,
            "MESURES PRISES": i.mesuresPrises,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Incidents Santé");
        XLSX.writeFile(wb, "incidents_sante.xlsx");
        addToast("Données des incidents exportées.", 'success');
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Gestion des Incidents de Santé</h3>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={addRow} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />}>
                    Ajouter un incident
                </Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter
                </Button>
            </div>
            {schools.length === 0 && (
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">
                    Aucune école n'a été trouvée. Veuillez en ajouter dans "Informations {'>'} Ecoles" pour enregistrer un incident.
                </p>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-heading)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th className="px-4 py-3">DATE</th>
                            <th className="px-4 py-3">ÉCOLE</th>
                            <th className="px-4 py-3">TYPE D'INCIDENT</th>
                            <th className="px-4 py-3">DESCRIPTION</th>
                            <th className="px-4 py-3">PERSONNES AFFECTÉES</th>
                            <th className="px-4 py-3">MESURES PRISES</th>
                            <th className="px-4 py-3 text-center">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidentsSante.map(incident => (
                            <tr key={incident.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                <td className="px-2 py-2 w-40">
                                    <input type="date" value={incident.dateIncident} onChange={e => handleInputChange(incident.id, 'dateIncident', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2 w-48">
                                    <select value={incident.schoolId} onChange={e => handleInputChange(incident.id, 'schoolId', e.target.value)} className="w-full p-2.5 border border-[var(--color-border-input)] rounded-md bg-transparent">
                                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </td>
                                <td className="px-2 py-2">
                                    <input type="text" value={incident.typeIncident} onChange={e => handleInputChange(incident.id, 'typeIncident', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="text" value={incident.description} onChange={e => handleInputChange(incident.id, 'description', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2 w-32">
                                    <input type="number" value={incident.personnesAffectees} onChange={e => handleInputChange(incident.id, 'personnesAffectees', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent text-center" min="0" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="text" value={incident.mesuresPrises} onChange={e => handleInputChange(incident.id, 'mesuresPrises', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2 text-center">
                                    <button onClick={() => removeRow(incident.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                        {incidentsSante.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-[var(--color-text-muted)]">
                                    Aucun incident enregistré.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InspectionsLocauxTable: React.FC = () => {
    const { inspectionsLocaux, setInspectionsLocaux, schools } = useAppContext();
    const { addToast } = useToast();

    const schoolMap = useMemo(() => new Map(schools.map(s => [s.id, s.name])), [schools]);

    const addRow = () => {
        if (schools.length === 0) {
            addToast("Veuillez d'abord ajouter des écoles dans la section Informations.", 'error');
            return;
        }
        const newInspection: InspectionLocaux = {
            id: `${Date.now()}`,
            schoolId: schools[0].id,
            dateInspection: new Date().toISOString().split('T')[0],
            inspecteur: '',
            propretete: 1,
            equipement: 1,
            stockage: 1,
            hygienePersonnel: 1,
            commentaires: '',
            actionsCorrectives: '',
        };
        setInspectionsLocaux(prev => [...prev, newInspection]);
    };

    const removeRow = (id: string) => {
        setInspectionsLocaux(prev => prev.filter(i => i.id !== id));
    };

    const handleInputChange = (id: string, field: keyof Omit<InspectionLocaux, 'id'>, value: string) => {
        const ratingFields: (keyof InspectionLocaux)[] = ['propretete', 'equipement', 'stockage', 'hygienePersonnel'];
        let processedValue: string | number = value;

        if ((ratingFields as string[]).includes(field as string)) {
            let numValue = parseInt(value, 10) || 1;
            if (numValue < 1) numValue = 1;
            if (numValue > 5) numValue = 5;
            processedValue = numValue;
        }
        
        setInspectionsLocaux(prev => prev.map(i => i.id === id ? { ...i, [field]: processedValue } : i));
    };
    
    const calculateScore = (inspection: InspectionLocaux) => {
        const { propretete, equipement, stockage, hygienePersonnel } = inspection;
        const score = (propretete + equipement + stockage + hygienePersonnel) / 4;
        return score;
    };
    
    const getScoreColor = (score: number) => {
        if (score < 2.5) return 'bg-red-100 text-red-800';
        if (score < 4) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const handleExport = () => {
        if (inspectionsLocaux.length === 0) {
            addToast("Aucune inspection à exporter.", 'info');
            return;
        }
        const dataToExport = inspectionsLocaux.map(i => {
            const score = calculateScore(i);
            return {
                "DATE": i.dateInspection,
                "ÉCOLE": schoolMap.get(i.schoolId) || 'N/A',
                "INSPECTEUR": i.inspecteur,
                "PROPRETÉ (1-5)": i.propretete,
                "ÉQUIPEMENT (1-5)": i.equipement,
                "STOCKAGE (1-5)": i.stockage,
                "HYGIÈNE PERSONNEL (1-5)": i.hygienePersonnel,
                "SCORE GLOBAL (/5)": score.toFixed(2),
                "COMMENTAIRES": i.commentaires,
                "ACTIONS CORRECTIVES": i.actionsCorrectives,
            }
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inspections Locaux");
        XLSX.writeFile(wb, "inspections_locaux.xlsx");
        addToast("Données des inspections exportées.", 'success');
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Registre des Inspections des Locaux</h3>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={addRow} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />}>
                    Ajouter une inspection
                </Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter
                </Button>
            </div>
            {schools.length === 0 && (
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">
                    Aucune école n'a été trouvée. Veuillez en ajouter dans "Informations {'>'} Ecoles" pour enregistrer une inspection.
                </p>
            )}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-heading)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th className="px-2 py-3">DATE</th>
                            <th className="px-2 py-3">ÉCOLE</th>
                            <th className="px-2 py-3">INSPECTEUR</th>
                            <th className="px-2 py-3 text-center">PROPRETÉ</th>
                            <th className="px-2 py-3 text-center">ÉQUIPEMENT</th>
                            <th className="px-2 py-3 text-center">STOCKAGE</th>
                            <th className="px-2 py-3 text-center">HYGIÈNE PERS.</th>
                            <th className="px-2 py-3 text-center">SCORE GLOBAL</th>
                            <th className="px-2 py-3">COMMENTAIRES</th>
                            <th className="px-2 py-3">ACTIONS CORRECTIVES</th>
                            <th className="px-2 py-3 text-center">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inspectionsLocaux.map(inspection => {
                            const score = calculateScore(inspection);
                            return (
                                <tr key={inspection.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                    <td className="px-1 py-2 w-40">
                                        <input type="date" value={inspection.dateInspection} onChange={e => handleInputChange(inspection.id, 'dateInspection', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                    </td>
                                    <td className="px-1 py-2 w-48">
                                        <select value={inspection.schoolId} onChange={e => handleInputChange(inspection.id, 'schoolId', e.target.value)} className="w-full p-2.5 border border-[var(--color-border-input)] rounded-md bg-transparent">
                                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-1 py-2"><input type="text" value={inspection.inspecteur} onChange={e => handleInputChange(inspection.id, 'inspecteur', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                    <td className="px-1 py-2"><input type="number" min="1" max="5" value={inspection.propretete} onChange={e => handleInputChange(inspection.id, 'propretete', e.target.value)} className="w-20 p-2 border border-[var(--color-border-input)] rounded-md bg-transparent text-center" /></td>
                                    <td className="px-1 py-2"><input type="number" min="1" max="5" value={inspection.equipement} onChange={e => handleInputChange(inspection.id, 'equipement', e.target.value)} className="w-20 p-2 border border-[var(--color-border-input)] rounded-md bg-transparent text-center" /></td>
                                    <td className="px-1 py-2"><input type="number" min="1" max="5" value={inspection.stockage} onChange={e => handleInputChange(inspection.id, 'stockage', e.target.value)} className="w-20 p-2 border border-[var(--color-border-input)] rounded-md bg-transparent text-center" /></td>
                                    <td className="px-1 py-2"><input type="number" min="1" max="5" value={inspection.hygienePersonnel} onChange={e => handleInputChange(inspection.id, 'hygienePersonnel', e.target.value)} className="w-20 p-2 border border-[var(--color-border-input)] rounded-md bg-transparent text-center" /></td>
                                    <td className="px-1 py-2 text-center">
                                        <span className={`px-3 py-1.5 text-base font-bold rounded-full ${getScoreColor(score)}`}>
                                            {score.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-1 py-2"><input type="text" value={inspection.commentaires} onChange={e => handleInputChange(inspection.id, 'commentaires', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                    <td className="px-1 py-2"><input type="text" value={inspection.actionsCorrectives} onChange={e => handleInputChange(inspection.id, 'actionsCorrectives', e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" /></td>
                                    <td className="px-1 py-2 text-center">
                                        <button onClick={() => removeRow(inspection.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {inspectionsLocaux.length === 0 && (
                            <tr>
                                <td colSpan={11} className="text-center py-8 text-[var(--color-text-muted)]">
                                    Aucune inspection enregistrée.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SanteHygienePage: React.FC<{ activeSubMenu: SubMenuId | null; }> = ({ activeSubMenu }) => {
    const renderContent = () => {
        switch (activeSubMenu) {
            case SubMenuId.SuiviMedical:
                return <SuiviMedicalTable />;
            case SubMenuId.FormationsHygiene:
                return <FormationsHygieneTable />;
            case SubMenuId.InspectionsLocaux:
                return <InspectionsLocauxTable />;
            case SubMenuId.IncidentsSante:
                return <IncidentsSanteTable />;
            default:
                return <SuiviMedicalTable />;
        }
    };

    return <div>{renderContent()}</div>;
};

export default SanteHygienePage;

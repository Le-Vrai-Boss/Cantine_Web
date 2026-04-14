import React, { useMemo } from 'react';
import type { Infrastructure } from '../../types';
import { ExportIcon, ImportIcon, ResetIcon } from '../../components/Icons';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/Button';
import * as XLSX from 'xlsx';
import { handleEnterNavigation, openImportDialog } from '../../utils/uiHelpers';

const InfrastructuresTable: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { infrastructures, setInfrastructures, schools } = useAppContext();
    const { addToast } = useToast();
    
    const sortedSchools = useMemo(() => [...schools].sort((a, b) => a.name.localeCompare(b.name)), [schools]);
    
    const infrastructuresMap = useMemo(() => {
        const map = new Map<string, Infrastructure>();
        infrastructures.forEach(i => map.set(i.schoolId, i));
        schools.forEach(school => {
            if (!map.has(school.id)) {
                map.set(school.id, {
                    id: `new-${school.id}`, schoolId: school.id, milieu: 'Urbain', cuisine: false, refectoire: false, magasin: false,
                    foyerAmeliore: { donator: '', contact: '', functional: false }, pointEau: { donator: '', contact: '', functional: false }, latrine: { donator: '', contact: '', functional: false },
                });
            }
        });
        return map;
    }, [infrastructures, schools]);

    const schoolNameMap = useMemo(() => new Map(schools.map(s => [s.name, s.id])), [schools]);

    const updateInfrastructure = (schoolId: string, field: keyof Omit<Infrastructure, 'id' | 'schoolId' | 'foyerAmeliore' | 'pointEau' | 'latrine'>, value: string | boolean) => {
        setInfrastructures(prev => {
            const existingIndex = prev.findIndex(i => i.schoolId === schoolId);
            if (existingIndex > -1) {
                const newState = [...prev]; newState[existingIndex] = { ...newState[existingIndex], [field]: value }; return newState;
            } else {
                const newItem: Infrastructure = {
                    id: `${Date.now()}`, schoolId, milieu: 'Urbain', cuisine: false, refectoire: false, magasin: false,
                    foyerAmeliore: { donator: '', contact: '', functional: false }, pointEau: { donator: '', contact: '', functional: false }, latrine: { donator: '', contact: '', functional: false }, [field]: value
                };
                return [...prev, newItem];
            }
        });
    };

    const updateNestedInfrastructure = (schoolId: string, facility: 'foyerAmeliore' | 'pointEau' | 'latrine', field: 'donator' | 'contact' | 'functional', value: string | boolean) => {
        setInfrastructures(prev => {
            const existingIndex = prev.findIndex(i => i.schoolId === schoolId);
            if (existingIndex > -1) {
                const newState = [...prev];
                const newFacilityData = { ...newState[existingIndex][facility], [field]: value };
                newState[existingIndex] = { ...newState[existingIndex], [facility]: newFacilityData };
                return newState;
            } else {
                const newFacilityData = { donator: '', contact: '', functional: false, [field]: value };
                const newItem: Infrastructure = {
                    id: `${Date.now()}`, schoolId, milieu: 'Urbain', cuisine: false, refectoire: false, magasin: false,
                    foyerAmeliore: { donator: '', contact: '', functional: false }, pointEau: { donator: '', contact: '', functional: false }, latrine: { donator: '', contact: '', functional: false }, [facility]: newFacilityData
                };
                return [...prev, newItem];
            }
        });
    };

    const handleReset = () => { if (window.confirm("Voulez-vous vraiment effacer toutes les données d'infrastructure ?")) setInfrastructures([]); };

    const handleExport = () => {
        const dataToExport = sortedSchools.map(school => {
            const infra = infrastructuresMap.get(school.id) || {
                milieu: 'Urbain', cuisine: false, refectoire: false, magasin: false,
                foyerAmeliore: { donator: '', contact: '', functional: false }, pointEau: { donator: '', contact: '', functional: false }, latrine: { donator: '', contact: '', functional: false }
            };
            return {
                "École": school.name, "Milieu": infra.milieu, "Cuisine": infra.cuisine ? 'Oui' : 'Non', "Réfectoire": infra.refectoire ? 'Oui' : 'Non', "Magasin": infra.magasin ? 'Oui' : 'Non',
                "Foyer Amélioré - Donateur": infra.foyerAmeliore.donator, "Foyer Amélioré - Contact": infra.foyerAmeliore.contact, "Foyer Amélioré - Fonctionnel": infra.foyerAmeliore.functional ? 'Oui' : 'Non',
                "Point d'Eau - Donateur": infra.pointEau.donator, "Point d'Eau - Contact": infra.pointEau.contact, "Point d'Eau - Fonctionnel": infra.pointEau.functional ? 'Oui' : 'Non',
                "Latrine - Donateur": infra.latrine.donator, "Latrine - Contact": infra.latrine.contact, "Latrine - Fonctionnel": infra.latrine.functional ? 'Oui' : 'Non',
            };
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Infrastructures");
        XLSX.writeFile(wb, "infrastructures_ecoles.xlsx");
        addToast("Infrastructures exportées.", 'success');
    };

    const handleImport = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const wsname = workbook.SheetNames[0];
                const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[wsname]);
                const updatedInfrastructures = new Map(infrastructures.map(i => [i.schoolId, { ...i }]));
                let updatedCount = 0;

                json.forEach((item, index) => {
                    const schoolId = schoolNameMap.get(String(item["École"] || ''));
                    if (!schoolId) { console.warn(`École non trouvée: ${item["École"]}`); return; }
                    updatedCount++;
                    const toBoolean = (val: unknown) => String(val).toLowerCase() === 'oui';
                    const infraData: Omit<Infrastructure, 'id'> = {
                        schoolId: schoolId, milieu: (item["Milieu"] === 'Urbain' || item["Milieu"] === 'Rural') ? item["Milieu"] : 'Urbain',
                        cuisine: toBoolean(item["Cuisine"]), refectoire: toBoolean(item["Réfectoire"]), magasin: toBoolean(item["Magasin"]),
                        foyerAmeliore: { donator: String(item["Foyer Amélioré - Donateur"] || ''), contact: String(item["Foyer Amélioré - Contact"] || ''), functional: toBoolean(item["Foyer Amélioré - Fonctionnel"]) },
                        pointEau: { donator: String(item["Point d'Eau - Donateur"] || ''), contact: String(item["Point d'Eau - Contact"] || ''), functional: toBoolean(item["Point d'Eau - Fonctionnel"]) },
                        latrine: { donator: String(item["Latrine - Donateur"] || ''), contact: String(item["Latrine - Contact"] || ''), functional: toBoolean(item["Latrine - Fonctionnel"]) }
                    };
                    const existing = updatedInfrastructures.get(schoolId);
                    if (existing) {
                        Object.assign(existing, infraData);
                    } else { updatedInfrastructures.set(schoolId, { id: `${Date.now()}-${index}`, ...infraData }); }
                });
                setInfrastructures(Array.from(updatedInfrastructures.values()));
                addToast(`${updatedCount} fiches d'infrastructure importées et fusionnées.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation Infrastructures:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] enter-nav-container">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Gestion des Infrastructures</h3>
             <div className="flex items-center space-x-2 mb-4">
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>Exporter</Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />} disabled={isReadOnly}>Importer</Button>
                <Button onClick={handleReset} variant="warning" icon={<ResetIcon className="h-5 w-5" />} disabled={isReadOnly}>Réinitialiser</Button>
            </div>
            {schools.length === 0 && <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">Veuillez d'abord ajouter une école.</p>}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th rowSpan={2} className="px-6 py-3 border-b border-[var(--color-border-base)] align-bottom">Ecole</th><th rowSpan={2} className="px-6 py-3 border-b border-[var(--color-border-base)] align-bottom">Milieu</th>
                            <th rowSpan={2} className="px-4 py-3 border-b border-[var(--color-border-base)] align-bottom">Cuisine</th><th rowSpan={2} className="px-4 py-3 border-b border-[var(--color-border-base)] align-bottom">Réfectoire</th><th rowSpan={2} className="px-4 py-3 border-b border-[var(--color-border-base)] align-bottom">Magasin</th>
                            <th colSpan={3} className="px-6 py-3 text-center border-b border-[var(--color-border-base)]">Foyer Amélioré</th><th colSpan={3} className="px-6 py-3 text-center border-b border-[var(--color-border-base)]">Point d'eau</th><th colSpan={3} className="px-6 py-3 text-center border-b border-[var(--color-border-base)]">Latrine</th>
                        </tr>
                        <tr>
                            <th className="px-4 py-2">Donateur</th><th className="px-4 py-2">Contact</th><th className="px-4 py-2">Fonctionnel</th>
                            <th className="px-4 py-2">Donateur</th><th className="px-4 py-2">Contact</th><th className="px-4 py-2">Fonctionnel</th>
                            <th className="px-4 py-2">Donateur</th><th className="px-4 py-2">Contact</th><th className="px-4 py-2">Fonctionnel</th>
                        </tr>
                    </thead>
                    <tbody>
                    {sortedSchools.map(school => {
                        const item = infrastructuresMap.get(school.id)!;
                        return (
                        <tr key={school.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                            <td className="px-2 py-2 font-semibold text-[var(--color-text-heading)]">{school.name}</td>
                            <td className="px-2 py-2"><select value={item.milieu} onChange={e => updateInfrastructure(school.id, 'milieu', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1.5 border border-[var(--color-border-input)] rounded-md bg-transparent"><option value="Urbain">Urbain</option><option value="Rural">Rural</option></select></td>
                            <td className="px-4 py-2 text-center"><input type="checkbox" checked={item.cuisine} onChange={e => updateInfrastructure(school.id, 'cuisine', e.target.checked)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /></td>
                            <td className="px-4 py-2 text-center"><input type="checkbox" checked={item.refectoire} onChange={e => updateInfrastructure(school.id, 'refectoire', e.target.checked)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /></td>
                            <td className="px-4 py-2 text-center"><input type="checkbox" checked={item.magasin} onChange={e => updateInfrastructure(school.id, 'magasin', e.target.checked)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="h-4 w-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /></td>
                            {/* Foyer Amélioré */}
                            <td className="px-1 py-1"><input type="text" value={item.foyerAmeliore.donator} onChange={e => updateNestedInfrastructure(school.id, 'foyerAmeliore', 'donator', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border rounded-md" /></td>
                            <td className="px-1 py-1"><input type="text" value={item.foyerAmeliore.contact} onChange={e => updateNestedInfrastructure(school.id, 'foyerAmeliore', 'contact', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border rounded-md" /></td>
                            <td className="px-4 py-2 text-center"><input type="checkbox" checked={item.foyerAmeliore.functional} onChange={e => updateNestedInfrastructure(school.id, 'foyerAmeliore', 'functional', e.target.checked)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="h-4 w-4 rounded text-[var(--color-primary)]" /></td>
                            {/* Point d'Eau */}
                            <td className="px-1 py-1"><input type="text" value={item.pointEau.donator} onChange={e => updateNestedInfrastructure(school.id, 'pointEau', 'donator', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border rounded-md" /></td>
                            <td className="px-1 py-1"><input type="text" value={item.pointEau.contact} onChange={e => updateNestedInfrastructure(school.id, 'pointEau', 'contact', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border rounded-md" /></td>
                            <td className="px-4 py-2 text-center"><input type="checkbox" checked={item.pointEau.functional} onChange={e => updateNestedInfrastructure(school.id, 'pointEau', 'functional', e.target.checked)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="h-4 w-4 rounded text-[var(--color-primary)]" /></td>
                            {/* Latrine */}
                            <td className="px-1 py-1"><input type="text" value={item.latrine.donator} onChange={e => updateNestedInfrastructure(school.id, 'latrine', 'donator', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border rounded-md" /></td>
                            <td className="px-1 py-1"><input type="text" value={item.latrine.contact} onChange={e => updateNestedInfrastructure(school.id, 'latrine', 'contact', e.target.value)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="w-full p-1 border rounded-md" /></td>
                            <td className="px-4 py-2 text-center"><input type="checkbox" checked={item.latrine.functional} onChange={e => updateNestedInfrastructure(school.id, 'latrine', 'functional', e.target.checked)} onKeyDown={handleEnterNavigation} disabled={isReadOnly} className="h-4 w-4 rounded text-[var(--color-primary)]" /></td>
                        </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InfrastructuresTable;
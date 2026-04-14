import React, { useMemo, useState } from 'react';
import { SubMenuId } from '../constants';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { Fournisseur, Commande, OrderItem, EvaluationFournisseur } from '../types';
import { Button } from '../components/Button';
import { PlusCircleIcon, TrashIcon, ExportIcon, ImportIcon, CloseIcon } from '../components/Icons';
import * as XLSX from 'xlsx';
import { openImportDialog } from '../utils/uiHelpers';

const ListeFournisseursTable: React.FC = () => {
    const { fournisseurs, setFournisseurs } = useAppContext();
    const { addToast } = useToast();

    const addRow = () => {
        const newFournisseur: Fournisseur = {
            id: `${Date.now()}`,
            nom: '',
            categorie: 'Vivres',
            contact: '',
            email: '',
            adresse: '',
            personneContact: '',
        };
        setFournisseurs(prev => [...prev, newFournisseur]);
    };

    const removeRow = (id: string) => {
        setFournisseurs(prev => prev.filter(f => f.id !== id));
    };

    const handleInputChange = (id: string, field: keyof Omit<Fournisseur, 'id'>, value: string) => {
        setFournisseurs(prev => prev.map(f => (f.id === id ? { ...f, [field]: value } : f)));
    };

    const handleExport = () => {
        if (fournisseurs.length === 0) {
            addToast("Aucun fournisseur à exporter.", 'info');
            return;
        }
        const dataToExport = fournisseurs.map(f => ({
            "Nom": f.nom,
            "Catégorie": f.categorie,
            "Contact (Tél)": f.contact,
            "Email": f.email,
            "Adresse": f.adresse,
            "Personne à contacter": f.personneContact,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fournisseurs");
        XLSX.writeFile(wb, "liste_fournisseurs.xlsx");
        addToast("Liste des fournisseurs exportée.", 'success');
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
                
                const newFournisseurs: Fournisseur[] = json.map((item, index) => {
                    const cat = String(item["Catégorie"] || '');
                    return {
                        id: `${Date.now()}-${index}`,
                        nom: String(item["Nom"] || ''),
                        categorie: (['Vivres', 'Matériel', 'Services', 'Autre'] as Fournisseur['categorie'][]).includes(cat as Fournisseur['categorie']) ? cat as Fournisseur['categorie'] : 'Autre',
                        contact: String(item["Contact (Tél)"] || ''),
                        email: String(item["Email"] || ''),
                        adresse: String(item["Adresse"] || ''),
                        personneContact: String(item["Personne à contacter"] || ''),
                    };
                });

                setFournisseurs(prev => [...prev, ...newFournisseurs]);
                addToast(`${newFournisseurs.length} fournisseurs importés et ajoutés.`, 'success');
            } catch (error) {
                console.error("Erreur d'importation des fournisseurs:", error);
                addToast("Erreur lors de la lecture du fichier Excel.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)] mr-auto">Liste des Fournisseurs</h3>
                <Button onClick={addRow} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />}>
                    Ajouter un fournisseur
                </Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter
                </Button>
                <Button onClick={() => openImportDialog(handleImport)} variant="secondary" icon={<ImportIcon className="h-5 w-5" />}>
                    Importer
                </Button>
                 <div className="ml-auto flex items-baseline gap-2 bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">TOTAL FOURNISSEURS:</span>
                    <span className="text-xl font-bold text-[var(--color-primary)]">
                        {fournisseurs.length}
                    </span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th className="px-4 py-3">Nom du Fournisseur</th>
                            <th className="px-4 py-3">Catégorie</th>
                            <th className="px-4 py-3">Contact (Tél)</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Adresse</th>
                            <th className="px-4 py-3">Personne Contact</th>
                            <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fournisseurs.map(fournisseur => (
                            <tr key={fournisseur.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)] align-middle">
                                <td className="px-2 py-2">
                                    <input type="text" value={fournisseur.nom} onChange={e => handleInputChange(fournisseur.id, 'nom', e.target.value)} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2">
                                    <select value={fournisseur.categorie} onChange={e => handleInputChange(fournisseur.id, 'categorie', e.target.value)} className="w-full p-1.5 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)]">
                                        <option>Vivres</option>
                                        <option>Matériel</option>
                                        <option>Services</option>
                                        <option>Autre</option>
                                    </select>
                                </td>
                                <td className="px-2 py-2">
                                    <input type="text" value={fournisseur.contact} onChange={e => handleInputChange(fournisseur.id, 'contact', e.target.value)} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="email" value={fournisseur.email} onChange={e => handleInputChange(fournisseur.id, 'email', e.target.value)} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="text" value={fournisseur.adresse} onChange={e => handleInputChange(fournisseur.id, 'adresse', e.target.value)} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="text" value={fournisseur.personneContact} onChange={e => handleInputChange(fournisseur.id, 'personneContact', e.target.value)} className="w-full p-1 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                                </td>
                                <td className="px-2 py-2 text-center">
                                    <button onClick={() => removeRow(fournisseur.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                        {fournisseurs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-[var(--color-text-muted)]">
                                    Aucun fournisseur ajouté pour le moment.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface CommandeModalProps {
    onClose: () => void;
    onSave: (commande: Commande) => void;
    commande: Commande | null;
}
const CommandeModal: React.FC<CommandeModalProps> = ({ onClose, onSave, commande }) => {
    const { fournisseurs, foodItems, appSettings } = useAppContext();
    const [editedCommande, setEditedCommande] = useState<Commande>(
        commande ? JSON.parse(JSON.stringify(commande)) : {
            id: '',
            date: new Date().toISOString().split('T')[0],
            numero: `CMD-${Date.now().toString().slice(-6)}`,
            fournisseurId: fournisseurs.length > 0 ? fournisseurs[0].id : '',
            items: [],
            statut: 'En attente',
        }
    );

    const handleInputChange = (field: keyof Commande, value: string) => {
        setEditedCommande(prev => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
        const newItems = [...editedCommande.items];
        const numValue = Number(value) || 0;
        newItems[index] = { ...newItems[index], [field]: numValue };
        setEditedCommande(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        if (foodItems.length === 0) return;
        const newItem: OrderItem = {
            denreeId: foodItems[0].id,
            quantity: 1,
            unitPrice: 0,
        };
        setEditedCommande(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (index: number) => {
        setEditedCommande(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const totalCommande = useMemo(() => 
        editedCommande.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [editedCommande.items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedCommande);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-[var(--color-bg-card)] rounded-lg [box-shadow:var(--shadow-xl)] p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-[var(--color-border-base)] pb-3 mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">
                        {commande ? 'Modifier la Commande' : 'Ajouter une Commande'}
                    </h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-bg-muted)]"><CloseIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input type="text" value={editedCommande.numero} onChange={e => handleInputChange('numero', e.target.value)} placeholder="Numéro de commande" className="p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                        <input type="date" value={editedCommande.date} onChange={e => handleInputChange('date', e.target.value)} className="p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                        <select value={editedCommande.fournisseurId} onChange={e => handleInputChange('fournisseurId', e.target.value)} className="p-2 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)]">
                            {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                        </select>
                        <select value={editedCommande.statut} onChange={e => handleInputChange('statut', e.target.value)} className="p-2 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)]">
                            <option>En attente</option>
                            <option>Partiellement Livrée</option>
                            <option>Livrée</option>
                            <option>Annulée</option>
                        </select>
                    </div>

                    <h4 className="font-semibold mt-6 mb-2">Articles de la commande</h4>
                    <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-xs font-medium text-[var(--color-text-muted)] border-b border-[var(--color-border-base)]">
                        <div className="col-span-5">Denrée</div>
                        <div className="col-span-2">Qté</div>
                        <div className="col-span-2">Prix U.</div>
                        <div className="col-span-2 text-right">Sous-total</div>
                        <div className="col-span-1 text-center">Action</div>
                    </div>
                    <div className="space-y-2 mt-2">
                        {editedCommande.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-[var(--color-bg-muted)] rounded">
                                <select value={item.denreeId} onChange={e => handleItemChange(index, 'denreeId', e.target.value)} className="col-span-5 p-1.5 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)] text-sm">
                                    {foodItems.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} placeholder="Qté" className="col-span-2 p-1.5 border border-[var(--color-border-input)] rounded-md text-sm bg-transparent" />
                                <input type="number" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} placeholder="Prix U." className="col-span-2 p-1.5 border border-[var(--color-border-input)] rounded-md text-sm bg-transparent" />
                                <p className="col-span-2 text-right text-sm font-semibold">{(item.quantity * item.unitPrice).toLocaleString('fr-FR')} {appSettings.currencySymbol}</p>
                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1 justify-self-center"><TrashIcon className="h-4 w-4" /></button>
                            </div>
                        ))}
                    </div>
                     <Button type="button" onClick={addItem} variant="secondary" className="mt-2 text-sm py-1.5">
                        <PlusCircleIcon className="h-4 w-4 mr-1" /> Ajouter un produit
                    </Button>
                </form>
                 <div className="mt-6 pt-4 border-t border-[var(--color-border-base)] flex justify-between items-center">
                    <p className="font-bold text-lg">Total: {totalCommande.toLocaleString('fr-FR')} {appSettings.currencySymbol}</p>
                    <div className="flex space-x-3">
                        <Button type="button" onClick={onClose} variant="ghost">Annuler</Button>
                        <Button type="submit" onClick={handleSubmit} variant="primary">
                            {commande ? 'Sauvegarder' : 'Ajouter'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SuiviCommandesTable: React.FC = () => {
    const { commandes, setCommandes, fournisseurs, foodItems, appSettings } = useAppContext();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCommande, setCurrentCommande] = useState<Commande | null>(null);

    const fournisseurMap = useMemo(() => new Map(fournisseurs.map(f => [f.id, f.nom])), [fournisseurs]);

    const calculateTotal = (items: OrderItem[]) => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const handleAdd = () => {
        if (fournisseurs.length === 0 || foodItems.length === 0) {
            addToast("Veuillez d'abord ajouter des fournisseurs et des denrées.", "error");
            return;
        }
        setCurrentCommande(null);
        setIsModalOpen(true);
    };
    
    const handleEdit = (commande: Commande) => {
        setCurrentCommande(commande);
        setIsModalOpen(true);
    };

    const handleSave = (commande: Commande) => {
        if (currentCommande) {
            setCommandes(prev => prev.map(c => c.id === commande.id ? commande : c));
            addToast("Commande modifiée avec succès.", 'success');
        } else {
            setCommandes(prev => [...prev, { ...commande, id: `${Date.now()}` }]);
            addToast("Commande ajoutée avec succès.", 'success');
        }
        setIsModalOpen(false);
    };
    
    const handleRemove = (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
            setCommandes(prev => prev.filter(c => c.id !== id));
            addToast("Commande supprimée.", 'info');
        }
    };
    
    const handleExport = () => {
        const dataToExport = commandes.map(c => ({
            "Date": c.date,
            "Numéro": c.numero,
            "Fournisseur": fournisseurMap.get(c.fournisseurId) || 'N/A',
            "Statut": c.statut,
            "Montant Total": calculateTotal(c.items),
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Commandes");
        XLSX.writeFile(wb, "suivi_commandes.xlsx");
        addToast("Liste des commandes exportée.", 'success');
    };
    
    const statutColors: Record<Commande['statut'], string> = {
        'En attente': 'bg-yellow-100 text-yellow-800',
        'Partiellement Livrée': 'bg-blue-100 text-blue-800',
        'Livrée': 'bg-green-100 text-green-800',
        'Annulée': 'bg-red-100 text-red-800',
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Suivi des Commandes</h3>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={handleAdd} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />}>
                    Ajouter une commande
                </Button>
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter
                </Button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Numéro</th>
                            <th className="px-4 py-3">Fournisseur</th>
                            <th className="px-4 py-3">Statut</th>
                            <th className="px-4 py-3 text-right">Montant Total</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commandes.map(c => (
                            <tr key={c.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)]">
                                <td className="px-4 py-2">{c.date}</td>
                                <td className="px-4 py-2 font-mono text-xs">{c.numero}</td>
                                <td className="px-4 py-2 font-semibold">{fournisseurMap.get(c.fournisseurId) || 'N/A'}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statutColors[c.statut]}`}>
                                        {c.statut}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right font-bold">{calculateTotal(c.items).toLocaleString('fr-FR')} {appSettings.currencySymbol}</td>
                                <td className="px-4 py-2 text-center space-x-2">
                                    <button onClick={() => handleEdit(c)} className="text-blue-600 hover:underline text-xs">Éditer</button>
                                    <button onClick={() => handleRemove(c.id)} className="text-red-600 hover:underline text-xs">Suppr.</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <CommandeModal onClose={() => setIsModalOpen(false)} onSave={handleSave} commande={currentCommande} />}
        </div>
    );
};

const EvaluationFournisseurs: React.FC = () => {
    const { fournisseurs, evaluationsFournisseurs, setEvaluationsFournisseurs } = useAppContext();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFournisseurId, setSelectedFournisseurId] = useState<string | null>(null);

    const handleOpenModal = (fournisseurId: string) => {
        setSelectedFournisseurId(fournisseurId);
        setIsModalOpen(true);
    };

    const handleSaveEvaluation = (evaluation: Omit<EvaluationFournisseur, 'id'>) => {
        setEvaluationsFournisseurs(prev => [...prev, { ...evaluation, id: `${Date.now()}` }]);
        addToast("Évaluation enregistrée.", 'success');
        setIsModalOpen(false);
    };

    const evaluationData = useMemo(() => {
        return fournisseurs.map(f => {
            const evals = evaluationsFournisseurs.filter(e => e.fournisseurId === f.id);
            if (evals.length === 0) {
                return { ...f, avgRating: 0, evalCount: 0 };
            }
            const totalRating = evals.reduce((sum, e) => sum + e.qualiteProduits + e.respectDelais + e.prix + e.serviceClient, 0);
            const avgRating = totalRating / (evals.length * 4);
            return { ...f, avgRating, evalCount: evals.length };
        });
    }, [fournisseurs, evaluationsFournisseurs]);

    const handleExport = () => {
        const dataToExport = evaluationData.map(f => ({
            "Fournisseur": f.nom,
            "Note Moyenne (/5)": f.avgRating.toFixed(2),
            "Nombre d'évaluations": f.evalCount,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Evaluations");
        XLSX.writeFile(wb, "evaluation_fournisseurs.xlsx");
        addToast("Évaluations exportées.", 'success');
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Évaluation des Fournisseurs</h3>
            <div className="flex items-center space-x-2 mb-4">
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5" />}>
                    Exporter les Notes
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th className="px-4 py-3">Fournisseur</th>
                            <th className="px-4 py-3">Note Moyenne</th>
                            <th className="px-4 py-3 text-center">Nb. Évaluations</th>
                            <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evaluationData.map(f => (
                            <tr key={f.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)]">
                                <td className="px-4 py-2 font-semibold">{f.nom}</td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className={`w-5 h-5 ${i < Math.round(f.avgRating) ? 'text-yellow-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                        <span className="ml-2 text-xs text-[var(--color-text-muted)]">({f.avgRating.toFixed(2)})</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-center">{f.evalCount}</td>
                                <td className="px-4 py-2 text-center">
                                    <Button onClick={() => handleOpenModal(f.id)} variant="secondary" className="py-1 px-3 text-xs">Évaluer</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && selectedFournisseurId && (
                <EvaluationModal
                    fournisseurId={selectedFournisseurId}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveEvaluation}
                />
            )}
        </div>
    );
};

const EvaluationModal: React.FC<{ fournisseurId: string, onClose: () => void, onSave: (evalData: Omit<EvaluationFournisseur, 'id'>) => void }> = ({ fournisseurId, onClose, onSave }) => {
    const { fournisseurs } = useAppContext();
    const [evaluation, setEvaluation] = useState({
        fournisseurId,
        date: new Date().toISOString().split('T')[0],
        qualiteProduits: 3,
        respectDelais: 3,
        prix: 3,
        serviceClient: 3,
        commentaire: '',
    });
    
    const handleRatingChange = (field: keyof typeof evaluation, value: number) => {
        setEvaluation(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(evaluation);
    };

    const fournisseur = fournisseurs.find(f => f.id === fournisseurId);

    const StarRating: React.FC<{ value: number, onChange: (value: number) => void }> = ({ value, onChange }) => (
        <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
                <button type="button" key={i} onClick={() => onChange(i + 1)}>
                    <svg className={`w-6 h-6 ${i < value ? 'text-yellow-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </button>
            ))}
        </div>
    );
    
    const criteria = [
        { key: 'qualiteProduits', label: 'Qualité des produits' },
        { key: 'respectDelais', label: 'Respect des délais' },
        { key: 'prix', label: 'Prix' },
        { key: 'serviceClient', label: 'Service client' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-[var(--color-bg-card)] rounded-lg [box-shadow:var(--shadow-xl)] p-6 w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                     <div className="flex justify-between items-center border-b border-[var(--color-border-base)] pb-3 mb-4">
                        <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">Évaluer {fournisseur?.nom}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-bg-muted)]"><CloseIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="space-y-4">
                        {criteria.map(c => (
                             <div key={c.key} className="flex justify-between items-center">
                                <label className="text-sm">{c.label}</label>
                                <StarRating value={evaluation[c.key as keyof typeof evaluation] as number} onChange={(val) => handleRatingChange(c.key as keyof typeof evaluation, val)} />
                            </div>
                        ))}
                        <div>
                            <label htmlFor="commentaire" className="text-sm block mb-1">Commentaire</label>
                            <textarea id="commentaire" value={evaluation.commentaire} onChange={e => setEvaluation(p => ({ ...p, commentaire: e.target.value }))} rows={3} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" />
                        </div>
                    </div>
                     <div className="mt-6 pt-4 border-t border-[var(--color-border-base)] flex justify-end space-x-3">
                        <Button type="button" onClick={onClose} variant="ghost">Annuler</Button>
                        <Button type="submit" variant="primary">Enregistrer</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FournisseursPage: React.FC<{ activeSubMenu: SubMenuId | null; }> = ({ activeSubMenu }) => {
    
    const renderContent = () => {
        switch (activeSubMenu) {
            case SubMenuId.ListeFournisseurs:
                return <ListeFournisseursTable />;
            case SubMenuId.SuiviCommandes:
                return <SuiviCommandesTable />;
            case SubMenuId.EvaluationFournisseurs:
                return <EvaluationFournisseurs />;
            default:
                 return <ListeFournisseursTable />;
        }
    };

    return <div>{renderContent()}</div>;
};

export default FournisseursPage;
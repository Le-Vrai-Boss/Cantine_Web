

import React, { useState, useMemo } from 'react';
import { SubMenuId } from '../constants';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { Menu, MenuItem, WeeklyPlanningData, DayPlan } from '../types';
import { Button } from '../components/Button';
import { PlusCircleIcon, TrashIcon, CloseIcon, ExportIcon } from '../components/Icons';
import * as XLSX from 'xlsx';

// --- MODAL COMPONENT ---
interface MenuModalProps {
    onClose: () => void;
    onSave: (menu: Menu) => void;
    menu: Menu | null;
}
const MenuModal: React.FC<MenuModalProps> = ({ onClose, onSave, menu }) => {
    const { foodItems } = useAppContext();
    const [editedMenu, setEditedMenu] = useState<Menu>(
        menu ? JSON.parse(JSON.stringify(menu)) : {
            id: '',
            name: '',
            items: [],
        }
    );

    const handleNameChange = (name: string) => {
        setEditedMenu(prev => ({ ...prev, name }));
    };

    const handleItemChange = (index: number, field: keyof MenuItem, value: string) => {
        const newItems = [...editedMenu.items];
        if (field === 'denreeId') {
            newItems[index] = { ...newItems[index], [field]: value };
        } else {
            const numValue = parseFloat(value) || 0;
            newItems[index] = { ...newItems[index], [field]: numValue };
        }
        setEditedMenu(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        if (foodItems.length === 0) return;
        const newItem: MenuItem = {
            denreeId: foodItems[0].id,
            quantityPerRation: 0,
        };
        setEditedMenu(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (index: number) => {
        setEditedMenu(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedMenu);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-[var(--color-bg-card)] rounded-lg [box-shadow:var(--shadow-xl)] p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-[var(--color-border-base)] pb-3 mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">{menu ? 'Modifier le Menu' : 'Ajouter un Menu'}</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-bg-muted)]"><CloseIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
                    <div className="mb-4">
                        <label htmlFor="menu-name" className="block text-sm font-medium text-[var(--color-text-muted)]">Nom du Menu</label>
                        <input id="menu-name" type="text" value={editedMenu.name} onChange={e => handleNameChange(e.target.value)} placeholder="Ex: Riz, Sauce arachide, Poulet" className="mt-1 block w-full p-2 border border-[var(--color-border-input)] rounded-md bg-transparent" required />
                    </div>

                    <h4 className="font-semibold text-[var(--color-text-base)] mt-6 mb-2">Composition du menu</h4>
                    <div className="space-y-2">
                        {editedMenu.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-[var(--color-bg-muted)] rounded">
                                <select value={item.denreeId} onChange={e => handleItemChange(index, 'denreeId', e.target.value)} className="col-span-6 p-1.5 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)] text-sm">
                                    {foodItems.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <input type="number" step="0.001" value={item.quantityPerRation} onChange={e => handleItemChange(index, 'quantityPerRation', e.target.value)} placeholder="Ration/enfant" className="col-span-5 p-1.5 border border-[var(--color-border-input)] rounded-md text-sm bg-transparent" />
                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-4 w-4" /></button>
                            </div>
                        ))}
                    </div>
                     <Button type="button" onClick={addItem} variant="secondary" className="mt-2 text-sm py-1.5">
                        <PlusCircleIcon className="h-4 w-4 mr-1" /> Ajouter une denrée
                    </Button>
                </form>
                 <div className="mt-6 pt-4 border-t border-[var(--color-border-base)] flex justify-end space-x-3">
                    <Button type="button" onClick={onClose} variant="ghost">Annuler</Button>
                    <Button type="submit" onClick={handleSubmit} variant="primary">
                        {menu ? 'Sauvegarder' : 'Ajouter'}
                    </Button>
                </div>
            </div>
        </div>
    );
};


const GestionMenusTable: React.FC = () => {
    const { menus, setMenus, foodItems } = useAppContext();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);

    const foodItemMap = useMemo(() => new Map(foodItems.map(f => [f.id, f.name])), [foodItems]);

    const handleAdd = () => {
        if (foodItems.length === 0) {
            addToast("Veuillez d'abord ajouter des denrées dans la section Informations.", "error");
            return;
        }
        setCurrentMenu(null);
        setIsModalOpen(true);
    };
    
    const handleEdit = (menu: Menu) => {
        setCurrentMenu(menu);
        setIsModalOpen(true);
    };

    const handleSave = (menu: Menu) => {
        if (currentMenu) {
            setMenus(prev => prev.map(m => m.id === menu.id ? menu : m));
            addToast("Menu modifié avec succès.", 'success');
        } else {
            setMenus(prev => [...prev, { ...menu, id: `${Date.now()}` }]);
            addToast("Menu ajouté avec succès.", 'success');
        }
        setIsModalOpen(false);
    };
    
    const handleRemove = (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce menu ?")) {
            setMenus(prev => prev.filter(m => m.id !== id));
            addToast("Menu supprimé.", 'info');
        }
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-heading)] mr-auto">Gestion des Menus Types</h3>
                <Button onClick={handleAdd} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />}>
                    Créer un menu
                </Button>
                <div className="ml-auto flex items-baseline gap-2 bg-[var(--color-bg-muted)] border border-[var(--color-border-base)] px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">TOTAL MENUS:</span>
                    <span className="text-xl font-bold text-[var(--color-primary)]">
                        {menus.length}
                    </span>
                </div>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th className="px-4 py-3">Nom du Menu</th>
                            <th className="px-4 py-3">Composition</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menus.map(menu => (
                            <tr key={menu.id} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-base)]">
                                <td className="px-4 py-3 font-semibold w-1/3 text-[var(--color-text-heading)]">{menu.name}</td>
                                <td className="px-4 py-3 text-xs">
                                    <div className="flex flex-wrap gap-2">
                                        {menu.items.map((item, index) => (
                                            <span key={index} className="bg-[var(--color-bg-base)] text-[var(--color-text-base)] px-2 py-1 rounded-full">
                                                {foodItemMap.get(item.denreeId) || 'N/A'} ({item.quantityPerRation})
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center space-x-2">
                                    <button onClick={() => handleEdit(menu)} className="text-[var(--color-primary)] hover:underline text-xs">Éditer</button>
                                    <button onClick={() => handleRemove(menu.id)} className="text-[var(--color-danger)] hover:underline text-xs">Suppr.</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {menus.length === 0 && <p className="text-center py-8 text-[var(--color-text-muted)]">Aucun menu créé. Commencez par en ajouter un !</p>}
            </div>
            {isModalOpen && <MenuModal onClose={() => setIsModalOpen(false)} onSave={handleSave} menu={currentMenu} />}
        </div>
    );
};


const PlanningHebdomadaire: React.FC = () => {
    const { schools, menus, weeklyPlannings, setWeeklyPlannings } = useAppContext();
    const { addToast } = useToast();
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
    
    const getWeekId = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1)/7);
        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    };
    
    const [selectedWeekId, setSelectedWeekId] = useState<string>(getWeekId(new Date()));

    const weekDays = useMemo(() => {
        if (!selectedWeekId) return [];
        const [year, week] = selectedWeekId.split('-W').map(Number);
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        
        return Array.from({length: 7}).map((_, i) => {
            const date = new Date(ISOweekStart);
            date.setDate(date.getDate() + i);
            return date;
        });
    }, [selectedWeekId]);

    const currentPlan = useMemo(() => {
        return weeklyPlannings.find(p => p.schoolId === selectedSchoolId && p.weekId === selectedWeekId);
    }, [weeklyPlannings, selectedSchoolId, selectedWeekId]);

    const handlePlanChange = (dayOfWeek: number, menuId: string | null) => {
        setWeeklyPlannings(prev => {
            const newPlannings = JSON.parse(JSON.stringify(prev));
            const planning = newPlannings.find((p: WeeklyPlanningData) => p.schoolId === selectedSchoolId && p.weekId === selectedWeekId);

            if (planning) {
                const day = planning.plan.find((d: DayPlan) => d.dayOfWeek === dayOfWeek);
                if (day) {
                    day.menuId = menuId;
                } else {
                    planning.plan.push({ dayOfWeek, menuId });
                }
            } else {
                const newPlan: WeeklyPlanningData = {
                    schoolId: selectedSchoolId,
                    weekId: selectedWeekId,
                    plan: Array.from({length: 7}).map((_, i) => ({
                        dayOfWeek: i,
                        menuId: i === dayOfWeek ? menuId : null,
                    }))
                };
                newPlannings.push(newPlan);
            }
            return newPlannings;
        });
        addToast("Planning sauvegardé", 'success');
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Planning Hebdomadaire des Menus</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="school-select" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">École</label>
                    <select id="school-select" value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)]">
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="week-select" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Semaine</label>
                    <input type="week" id="week-select" value={selectedWeekId} onChange={e => setSelectedWeekId(e.target.value)} className="w-full p-1.5 border border-[var(--color-border-input)] rounded-md" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {weekDays.map((date, index) => {
                    const dayPlan = currentPlan?.plan.find(p => p.dayOfWeek === index);
                    return (
                        <div key={index} className="bg-[var(--color-bg-muted)] p-3 rounded-lg border border-[var(--color-border-base)]">
                            <p className="font-bold text-[var(--color-text-heading)]">{date.toLocaleDateString('fr-FR', { weekday: 'long' })}</p>
                            <p className="text-xs text-[var(--color-text-muted)] mb-2">{date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                            <select
                                value={dayPlan?.menuId || ''}
                                onChange={e => handlePlanChange(index, e.target.value || null)}
                                className="w-full p-1.5 border border-[var(--color-border-input)] rounded-md text-sm bg-[var(--color-bg-card)]"
                                disabled={!selectedSchoolId}
                            >
                                <option value="">Aucun menu</option>
                                {menus.map(menu => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
                            </select>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const RapportBesoins: React.FC = () => {
    const { schools, menus, foodItems, weeklyPlannings } = useAppContext();
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');

    const getWeekId = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1)/7);
        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    };
    
    const [selectedWeekId, setSelectedWeekId] = useState<string>(getWeekId(new Date()));

    const needsData = useMemo(() => {
        const school = schools.find(s => s.id === selectedSchoolId);
        if (!school) return [];

        const rationnaires = school.rationnaireGirls + school.rationnaireBoys;
        const plan = weeklyPlannings.find(p => p.schoolId === selectedSchoolId && p.weekId === selectedWeekId);
        if (!plan) return [];

        const needs: Record<string, number> = {};

        plan.plan.forEach(day => {
            if (day.menuId) {
                const menu = menus.find(m => m.id === day.menuId);
                if (menu) {
                    menu.items.forEach(item => {
                        needs[item.denreeId] = (needs[item.denreeId] || 0) + (item.quantityPerRation * rationnaires);
                    });
                }
            }
        });

        return Object.entries(needs).map(([denreeId, quantity]) => {
            const foodItem = foodItems.find(f => f.id === denreeId);
            return {
                name: foodItem?.name || 'Inconnu',
                unit: foodItem?.unit || '',
                quantity,
            };
        });
    }, [selectedSchoolId, selectedWeekId, schools, weeklyPlannings, menus, foodItems]);
    
    const handleExport = () => {
        if (needsData.length === 0) return;
        const dataToExport = needsData.map(item => ({
            "Denrée": item.name,
            "Quantité Nécessaire": item.quantity.toFixed(3),
            "Unité": item.unit,
        }));
        const schoolName = schools.find(s => s.id === selectedSchoolId)?.name || 'ecole';
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Besoins");
        XLSX.writeFile(wb, `rapport_besoins_${schoolName}_${selectedWeekId}.xlsx`);
    };

    return (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
            <h3 className="text-xl font-bold text-[var(--color-text-heading)] mb-4">Rapport sur les Besoins en Vivres</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="school-select-report" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">École</label>
                    <select id="school-select-report" value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} className="w-full p-2 border border-[var(--color-border-input)] rounded-md bg-[var(--color-bg-card)]">
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="week-select-report" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Semaine</label>
                    <input type="week" id="week-select-report" value={selectedWeekId} onChange={e => setSelectedWeekId(e.target.value)} className="w-full p-1.5 border border-[var(--color-border-input)] rounded-md" />
                </div>
            </div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleExport} variant="success" icon={<ExportIcon className="h-5 w-5"/>}>Exporter</Button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[var(--color-text-muted)]">
                    <thead className="text-xs text-[var(--color-text-base)] uppercase bg-[var(--color-bg-muted)]">
                        <tr>
                            <th className="px-4 py-3">Denrée</th>
                            <th className="px-4 py-3 text-right">Quantité Nécessaire</th>
                            <th className="px-4 py-3">Unité</th>
                        </tr>
                    </thead>
                    <tbody>
                        {needsData.length > 0 ? needsData.map(item => (
                            <tr key={item.name} className="border-b border-[var(--color-border-base)] even:bg-[var(--color-bg-muted)]">
                                <td className="px-4 py-3 font-semibold text-[var(--color-text-heading)]">{item.name}</td>
                                <td className="px-4 py-3 text-right font-mono">{item.quantity.toLocaleString('fr-FR', {maximumFractionDigits: 3})}</td>
                                <td className="px-4 py-3">{item.unit}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-[var(--color-text-muted)]">Aucun besoin calculé. Assurez-vous d'avoir planifié des menus pour cette semaine.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const MenusPage: React.FC<{ activeSubMenu: SubMenuId | null; }> = ({ activeSubMenu }) => {
    
    const renderContent = () => {
        switch (activeSubMenu) {
            case SubMenuId.GestionMenus:
                return <GestionMenusTable />;
            case SubMenuId.PlanningHebdomadaire:
                return <PlanningHebdomadaire />;
            case SubMenuId.RapportBesoins:
                return <RapportBesoins />;
            default:
                 return <GestionMenusTable />;
        }
    };

    return <div>{renderContent()}</div>;
};

export default MenusPage;

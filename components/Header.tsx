import React, { useMemo } from 'react';
import type { SubMenuItem } from '../types';
import { SubMenuId, MainMenuId } from '../constants';
import { useAppContext } from '../context/AppContext';
import { LockIcon, MenuIcon, CalendarIcon, FoodIcon, PackageIcon } from './Icons';

interface HeaderProps {
    title: string;
    subMenus: SubMenuItem[];
    activeSubMenu: SubMenuId | null;
    onSubMenuClick: (id: SubMenuId) => void;
    activeMainMenu: MainMenuId;
    currentUserLevel: number | null;
    onToggleSidebar: () => void;
    onToggleMobileSidebar: () => void;
    isMobileView: boolean;
    onNavigateToCalendar: () => void;
    onNavigateToResteJours: () => void;
    onNavigateToResteDenrees: () => void;
}

const formatMonth = (monthKey: string) => {
    if (!monthKey) return '';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const formatted = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};


export const Header: React.FC<HeaderProps> = ({ title, subMenus, activeSubMenu, onSubMenuClick, activeMainMenu, currentUserLevel, onToggleSidebar, onToggleMobileSidebar, isMobileView, onNavigateToCalendar, onNavigateToResteJours, onNavigateToResteDenrees }) => {
    const {
        schools,
        globalSchoolId, setGlobalSchoolId,
        globalMonth, setGlobalMonth,
        verificationData, schoolPreparationDays,
        ieppData
    } = useAppContext();

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        Object.values(schoolPreparationDays).forEach(schoolData => {
            Object.keys(schoolData).forEach(month => months.add(month));
        });
        Object.values(verificationData).forEach(schoolData => {
            Object.keys(schoolData).forEach(month => months.add(month));
        });
        return Array.from(months).sort().reverse();
    }, [schoolPreparationDays, verificationData]);

    const showGlobalFilters = activeMainMenu !== MainMenuId.Dashboard && activeMainMenu !== MainMenuId.Informations;

    return (
        <header className="bg-[var(--color-bg-header)] backdrop-blur-sm [box-shadow:var(--shadow-sm)] z-10 sticky top-0">
            <div className="min-h-16 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 border-b border-[var(--color-border-base)]">
                <div className="flex items-center gap-2 lg:gap-4">
                     <img src="/logo.svg" alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10" referrerPolicy="no-referrer" />
                     <button
                        onClick={isMobileView ? onToggleMobileSidebar : onToggleSidebar}
                        className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-base)] transition-colors"
                        title="Basculer le menu"
                    >
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div className="flex flex-wrap items-baseline gap-x-3">
                        <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-heading)] leading-tight">{title}</h2>
                        {ieppData.iepp && <span className="hidden sm:inline text-md md:text-lg font-semibold text-[var(--color-primary)] leading-tight">{ieppData.iepp}</span>}
                    </div>
                </div>
                <div className="flex items-center flex-wrap gap-2 md:gap-4">
                    {showGlobalFilters && (
                        <div className="hidden sm:flex items-center flex-wrap gap-2 md:gap-4">
                            <div>
                                <label htmlFor="global-school-filter" className="sr-only">École globale:</label>
                                <select
                                    id="global-school-filter"
                                    value={globalSchoolId}
                                    onChange={(e) => setGlobalSchoolId(e.target.value)}
                                    className="text-xs md:text-sm px-2 py-1.5 md:px-3 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                >
                                    <option value="all">Toutes les écoles</option>
                                    {schools.map(school => (
                                        <option key={school.id} value={school.id}>{school.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="global-month-filter" className="sr-only">Mois global:</label>
                                <select
                                    id="global-month-filter"
                                    value={globalMonth}
                                    onChange={(e) => setGlobalMonth(e.target.value)}
                                    className="text-xs md:text-sm px-2 py-1.5 md:px-3 bg-[var(--color-bg-card)] border border-[var(--color-border-input)] rounded-md [box-shadow:var(--shadow-sm)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                >
                                    <option value="">Tous les mois</option>
                                    {availableMonths.map(month => (
                                        <option key={month} value={month}>{formatMonth(month)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={onNavigateToCalendar}
                        className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-base)] transition-colors"
                        title="Afficher le calendrier"
                    >
                        <CalendarIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={onNavigateToResteJours}
                        className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-base)] transition-colors"
                        title="Afficher le reste des jours"
                    >
                        <FoodIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={onNavigateToResteDenrees}
                        className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-base)] transition-colors"
                        title="Afficher le reste des denrées"
                    >
                        <PackageIcon className="h-5 w-5" />
                    </button>
                    {currentUserLevel !== null && (
                        <div className="hidden sm:flex items-center gap-2 bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] px-3 py-1.5 rounded-full text-sm font-semibold">
                            <LockIcon className="h-4 w-4" />
                            <span>{currentUserLevel === 0 ? 'Concepteur' : `Niveau ${currentUserLevel}`}</span>
                        </div>
                    )}
                </div>
            </div>
            {subMenus.length > 0 && (
                <div className="flex items-center px-4 py-2 space-x-1 border-b border-[var(--color-border-base)] bg-[var(--color-bg-card)] overflow-x-auto">
                    {subMenus.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onSubMenuClick(item.id)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--color-primary)] ${
                                activeSubMenu === item.id 
                                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] font-semibold' 
                                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-base)]'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                    <div className="hidden ml-auto pl-4 text-xs font-medium text-[var(--color-text-base)] whitespace-nowrap lg:block">
                        Concepteur: M. ADOUKO 05 44 42 62 59
                    </div>
                </div>
            )}
        </header>
    );
};
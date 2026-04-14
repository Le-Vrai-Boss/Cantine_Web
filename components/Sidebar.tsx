
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { NavItem } from '../types';
import { MainMenuId } from '../constants';
import { SearchIcon } from './Icons';

interface SidebarProps {
    navItems: NavItem[];
    activeMainMenu: MainMenuId;
    onMenuClick: (id: MainMenuId) => void;
    organizationName: string;
    isCollapsed: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onExpandRequest: () => void;
    isMobileView: boolean;
    isMobileSidebarOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    navItems, 
    activeMainMenu, 
    onMenuClick, 
    organizationName, 
    isCollapsed, 
    onMouseEnter, 
    onMouseLeave, 
    onExpandRequest,
    isMobileView,
    isMobileSidebarOpen
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const hideText = !isMobileView && isCollapsed;

    useEffect(() => {
        if ((!isCollapsed && !isMobileView) || (isMobileView && isMobileSidebarOpen)) {
            // Focus the search input when the sidebar expands
            searchInputRef.current?.focus();
        }
    }, [isCollapsed, isMobileView, isMobileSidebarOpen]);

    const filteredNavItems = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        if (!normalizedQuery) {
            return navItems;
        }

        return navItems.filter(item => {
            const mainLabelMatch = item.label.toLowerCase().includes(normalizedQuery);
            const subMenuMatch = item.subMenus?.some(subMenu =>
                subMenu.label.toLowerCase().includes(normalizedQuery)
            );
            return mainLabelMatch || subMenuMatch;
        });
    }, [navItems, searchQuery]);

    const handleSearchClick = () => {
        onExpandRequest();
    };

    return (
        <aside 
            className={`bg-[var(--color-bg-sidebar)] text-[var(--color-sidebar-text)] flex flex-col border-r border-[var(--color-sidebar-border)] transition-all duration-300 ease-in-out
            ${isMobileView
                ? `fixed h-full z-40 w-64 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                : `flex-shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`
            }`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="bg-[var(--color-bg-sidebar)] h-16 flex items-center gap-3 border-b border-[var(--color-sidebar-border)] px-4 flex-shrink-0">
                 <img src="/logo.svg" alt="Logo" className="h-10 w-10 flex-shrink-0" referrerPolicy="no-referrer" />
                 <h1 className={`text-xl font-bold text-white tracking-wider truncate transition-opacity duration-200 ${hideText ? 'opacity-0' : 'opacity-100'}`}>
                    {organizationName}
                 </h1>
            </div>

            <div className="p-4 border-b border-[var(--color-sidebar-border)] flex-shrink-0">
                {hideText ? (
                    <button 
                        onClick={handleSearchClick} 
                        className="w-full flex items-center justify-center py-2.5 text-[var(--color-sidebar-icon)] hover:text-white rounded-lg hover:bg-[var(--color-sidebar-bg-hover)] transition-colors duration-200"
                        aria-label="Rechercher et développer le menu"
                        title="Rechercher"
                    >
                        <SearchIcon className="h-6 w-6" />
                    </button>
                ) : (
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-[var(--color-sidebar-icon)]" />
                        </span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher..."
                            className="w-full bg-[#1e293b] text-white text-sm rounded-lg border border-[var(--color-sidebar-border)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] block pl-10 p-2.5 transition"
                            aria-label="Rechercher dans le menu"
                        />
                    </div>
                )}
            </div>

            <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeMainMenu;
                    return (
                        <a
                            key={item.id}
                            href="#"
                            onClick={(e) => { e.preventDefault(); onMenuClick(item.id); }}
                            className={`relative flex items-center py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group ${hideText ? 'px-3 justify-center' : 'px-4'} ${
                                isActive 
                                ? 'bg-[var(--color-primary)] text-white' 
                                : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-bg-hover)] hover:text-[var(--color-sidebar-text-active)]'
                            }`}
                        >
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/25 rounded-r-full"></div>}
                            <Icon className={`h-5 w-5 transition-colors ${hideText ? 'mr-0' : 'mr-3'} ${isActive ? 'text-white' : 'text-[var(--color-sidebar-icon)] group-hover:text-[var(--color-sidebar-text-active)]'}`} />
                            {!hideText && (
                                <span className="transition-opacity duration-200 whitespace-nowrap">{item.label}</span>
                            )}
                             {hideText && (
                               <span className="absolute left-full ml-4 px-2 py-1 text-xs font-bold text-[var(--color-sidebar-text-active)] bg-[var(--color-bg-sidebar)] border border-[var(--color-sidebar-border)] rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                   {item.label}
                               </span>
                            )}
                        </a>
                    );
                })}
            </nav>
            <div className="flex-shrink-0">
                <div className={`px-4 pt-4 transition-all duration-300 ease-in-out overflow-hidden ${hideText ? 'h-0 p-0 opacity-0' : 'h-auto opacity-100'}`}>
                    <div className="text-center whitespace-nowrap border-t border-[var(--color-sidebar-border)] pt-4">
                        <p className="text-xs text-[var(--color-text-muted)]">&copy; 2024 Logiciel de Gestion</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
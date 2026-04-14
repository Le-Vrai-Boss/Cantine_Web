

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { navItems, SubMenuId, MainMenuId } from './constants';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import DashboardPage from './pages/Dashboard';
import InformationPage from './pages/Information';
import JoursPreparationPage from './pages/JoursPreparationPage';
import BilanVivresPage from './pages/BilanVivresPage';
import VerificationRapportPage from './pages/VerificationRapportPage';
import CFCBilanPage from './pages/CFCBilanPage';
import BilanEcolePage from './pages/BilanEcolePage';
import ListePage from './pages/ListePage';
import ParametresPage from './pages/ParametresPage';
import AssistantPage from './pages/AssistantPage';
import SanteHygienePage from './pages/SanteHygienePage';
import FournisseursPage from './pages/FournisseursPage';
import DonsPage from './pages/DonsPage';
import MenusPage from './pages/MenusPage';
import HistoriquePage from './pages/HistoriquePage';
import AProposPage from './pages/AProposPage';
import MessageriePage from './pages/MessageriePage';
import { useAppContext } from './context/AppContext';
import { ToastContainer } from './components/Toast';
import { LockScreen } from './components/LockScreen';
import { ForcedPasswordChangeScreen } from './components/ForcedPasswordChangeScreen';
import { DeactivatedScreen } from './components/DeactivatedScreen';
import { useToast } from './context/ToastContext';
import { SplashScreen } from './components/SplashScreen';
import { ApprovalScreen } from './components/ApprovalScreen';

const optionalModuleIds: MainMenuId[] = [
    MainMenuId.AssistantAI,
    MainMenuId.Messagerie,
    MainMenuId.Informations,
    MainMenuId.SanteHygiene,
    MainMenuId.Fournisseurs,
    MainMenuId.GestionDons,
    MainMenuId.MenusPlanification,
    MainMenuId.CFCBilan,
    MainMenuId.BilanVivres,
    MainMenuId.BilanEcole,
    MainMenuId.Liste,
    MainMenuId.VerificationRapport,
    MainMenuId.Historique,
    MainMenuId.APropos,
];

const App: React.FC = () => {
    const { appSettings, setAppSettings, logAction, isLoading, dataError } = useAppContext();
    const { addToast } = useToast();
    const [activeMainMenu, setActiveMainMenu] = useState<MainMenuId>(MainMenuId.Dashboard);
    const [activeSubMenu, setActiveSubMenu] = useState<SubMenuId | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isForcingPasswordChange, setIsForcingPasswordChange] = useState(false);
    const [authCheckDone, setAuthCheckDone] = useState(false);
    const [currentUserLevel, setCurrentUserLevel] = useState<number | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [returnTo, setReturnTo] = useState<{ mainMenu: MainMenuId; subMenu: SubMenuId | null } | null>(null);
    const collapseTimeout = useRef<number | null>(null);
    const [activationStatus, setActivationStatus] = useState<'trial' | 'activated' | 'expired' | 'unlimited'>('trial');
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const handleDesktopSidebarToggle = useCallback(() => {
        setIsSidebarCollapsed(prev => !prev);
    }, []);

    const handleToggleMobileSidebar = useCallback(() => {
        setIsMobileSidebarOpen(prev => !prev);
    }, []);

    const handleSidebarExpand = useCallback(() => {
        if (!isMobileView) {
            setIsSidebarCollapsed(false);
        }
    }, [isMobileView]);

    useEffect(() => {
        if (collapseTimeout.current) {
            clearTimeout(collapseTimeout.current);
        }
        if (!isSidebarCollapsed && !isMobileView) {
            collapseTimeout.current = window.setTimeout(() => {
                setIsSidebarCollapsed(true);
            }, 5000);
        }
        return () => {
            if (collapseTimeout.current) {
                clearTimeout(collapseTimeout.current);
            }
        };
    }, [isSidebarCollapsed, isMobileView]);
    
    const handleSidebarMouseEnter = useCallback(() => {
        if (!isMobileView && collapseTimeout.current) {
            clearTimeout(collapseTimeout.current);
        }
    }, [isMobileView]);

    const handleSidebarMouseLeave = useCallback(() => {
        if (!isMobileView && !isSidebarCollapsed) {
            collapseTimeout.current = window.setTimeout(() => {
                setIsSidebarCollapsed(true);
            }, 5000);
        }
    }, [isMobileView, isSidebarCollapsed]);

    useEffect(() => {
        const themeClass = `theme-${appSettings.theme || 'default'}`;
        document.documentElement.className = themeClass;
    }, [appSettings.theme]);
    
    useEffect(() => {
        if (dataError) {
            // Split by newline and show multiple toasts if needed
            dataError.split('\n').forEach(msg => {
                if (msg.trim()) {
                    addToast(msg, 'warning');
                }
            });
        }
    }, [dataError, addToast]);
    
    useEffect(() => {
        if (!isLoading) {
            // Once data is loaded, check for password and lock if necessary
            if (appSettings.isApproved && appSettings.password) {
                setIsLocked(true);
            } else {
                // No password set or not approved yet, default to admin level for now
                setCurrentUserLevel(1);
            }
            setAuthCheckDone(true);
        }
    }, [isLoading, appSettings.password, appSettings.isApproved]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobileView(mobile);
            if (!mobile) {
                setIsMobileSidebarOpen(false); // Close mobile sidebar if window is resized to desktop
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const checkActivation = () => {
            const { firstLaunchDate, activationStatus: savedStatus, expiryDate } = appSettings;
            const now = new Date().getTime();

            if (savedStatus === 'unlimited') {
                setActivationStatus('unlimited');
                setDaysRemaining(null);
                return;
            }

            if (savedStatus === 'activated' && expiryDate) {
                const expiry = new Date(expiryDate).getTime();
                if (now > expiry) {
                    setActivationStatus('expired');
                    setDaysRemaining(0);
                } else {
                    setActivationStatus('activated');
                    const remaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                    setDaysRemaining(remaining);
                }
                return;
            }

            // Default to trial
            if (firstLaunchDate) {
                const trialEndDate = new Date(firstLaunchDate);
                trialEndDate.setDate(trialEndDate.getDate() + 7);
                const trialEndTimestamp = trialEndDate.getTime();

                if (now > trialEndTimestamp) {
                    setActivationStatus('expired');
                    setDaysRemaining(0);
                } else {
                    setActivationStatus('trial');
                    const remaining = Math.ceil((trialEndTimestamp - now) / (1000 * 60 * 60 * 24));
                    setDaysRemaining(remaining);
                }
            } else {
                // Fallback if firstLaunchDate isn't set yet
                setActivationStatus('trial');
                setDaysRemaining(7);
            }
        };
        
        if (!isLoading) {
            checkActivation();
            // Check every hour
            const interval = setInterval(checkActivation, 1000 * 60 * 60); 
            return () => clearInterval(interval);
        }
    }, [isLoading, appSettings]);

    const visibleNavItems = useMemo(() => {
        let filteredNavItems = [...navItems];

        if (currentUserLevel === 3) {
            const forbiddenMenus = [
                MainMenuId.SanteHygiene,
                MainMenuId.BilanEcole,
            ];
            filteredNavItems = filteredNavItems.filter(
                item => !forbiddenMenus.includes(item.id)
            );
        }
        if (currentUserLevel === 4) {
            const forbiddenMenus = [
                MainMenuId.SanteHygiene,
                MainMenuId.Fournisseurs,
                MainMenuId.MenusPlanification,
                MainMenuId.BilanEcole,
                MainMenuId.Parametres,
            ];
            filteredNavItems = filteredNavItems.filter(
                item => !forbiddenMenus.includes(item.id)
            );
        }
        
        return filteredNavItems.filter(item => {
            if (optionalModuleIds.includes(item.id)) {
                return appSettings.optionalModules?.[item.id] === true;
            }
            return true;
        });
    }, [appSettings.optionalModules, currentUserLevel]);

    const handleMainMenuClick = useCallback((id: MainMenuId) => {
        if (id === MainMenuId.Fermer) {
            console.log("Tentative de fermeture de l'application.");
            return;
        }

        if (!isMobileView && !isSidebarCollapsed) {
            setIsSidebarCollapsed(true);
        }

        if (isMobileView) {
            setIsMobileSidebarOpen(false);
        }

        setActiveMainMenu(id);
        if (id === MainMenuId.Informations) {
            setActiveSubMenu(SubMenuId.IEPP);
        } else {
            setActiveSubMenu(null);
        }
    }, [isSidebarCollapsed, isMobileView]);

    const handleSubMenuClick = useCallback((id: SubMenuId) => {
        setActiveSubMenu(id);
    }, []);
    
    const handleNavigateToCalendar = useCallback(() => {
        setReturnTo({ mainMenu: activeMainMenu, subMenu: activeSubMenu });
        setActiveMainMenu(MainMenuId.Dashboard);
        setActiveSubMenu(SubMenuId.Calendrier);
    }, [activeMainMenu, activeSubMenu]);

    const handleNavigateToResteJours = useCallback(() => {
        setReturnTo({ mainMenu: activeMainMenu, subMenu: activeSubMenu });
        setActiveMainMenu(MainMenuId.Dashboard);
        setActiveSubMenu(SubMenuId.ResteJours);
    }, [activeMainMenu, activeSubMenu]);

    const handleNavigateToResteDenrees = useCallback(() => {
        setReturnTo({ mainMenu: activeMainMenu, subMenu: activeSubMenu });
        setActiveMainMenu(MainMenuId.Dashboard);
        setActiveSubMenu(SubMenuId.ResteDenrees);
    }, [activeMainMenu, activeSubMenu]);

    const handleNavigateToRapportMensuel = useCallback(() => {
        setReturnTo({ mainMenu: activeMainMenu, subMenu: activeSubMenu });
        setActiveMainMenu(MainMenuId.Liste);
        setActiveSubMenu(SubMenuId.RapportMensuel);
    }, [activeMainMenu, activeSubMenu]);

    const handleReturn = useCallback(() => {
        if (returnTo) {
            setActiveMainMenu(returnTo.mainMenu);
            setActiveSubMenu(returnTo.subMenu);
            setReturnTo(null);
        }
    }, [returnTo]);

    const handleNavigateToDashboard = useCallback(() => {
        setActiveMainMenu(MainMenuId.Dashboard);
        setActiveSubMenu(null);
    }, []);

    const activeItem = useMemo(() => {
        return visibleNavItems.find(item => item.id === activeMainMenu) || visibleNavItems[0];
    }, [visibleNavItems, activeMainMenu]);

    const subMenuItems = useMemo(() => {
        let subs = activeItem.subMenus || [];
        
        // Filter Licence & Activation sub-menu: only visible for designer (level 0)
        // User requested that users can activate their app, so we keep it visible but restrict content inside.
        // if (currentUserLevel !== 0) {
        //     subs = subs.filter(sub => sub.id !== SubMenuId.ParametresLicence);
        // }
        
        if ((currentUserLevel === 2 || currentUserLevel === 3 || currentUserLevel === 4) && activeMainMenu === MainMenuId.Informations) {
            subs = subs.filter(sub => sub.id !== SubMenuId.EffectifsHistorique);
        }

        return subs;
    }, [activeItem, currentUserLevel, activeMainMenu]);

    const renderPage = () => {
        const isInfoReadOnly = currentUserLevel === 3 || currentUserLevel === 4;
        const isParamsReadOnly = currentUserLevel === 3;
        const isLevel4ReadOnly = currentUserLevel === 4;

        switch (activeMainMenu) {
            case MainMenuId.Dashboard:
                return <DashboardPage activeSubMenu={activeSubMenu} currentUserLevel={currentUserLevel} returnTo={returnTo} onReturn={handleReturn} />;
            case MainMenuId.AssistantAI:
                return <AssistantPage />;
            case MainMenuId.Messagerie:
                return <MessageriePage />;
            case MainMenuId.Informations:
                return <InformationPage activeSubMenu={activeSubMenu} isReadOnly={isInfoReadOnly} currentUserLevel={currentUserLevel}/>;
            case MainMenuId.SanteHygiene:
                return <SanteHygienePage activeSubMenu={activeSubMenu} />;
            case MainMenuId.Fournisseurs:
                return <FournisseursPage activeSubMenu={activeSubMenu} />;
            case MainMenuId.GestionDons:
                return <DonsPage activeSubMenu={activeSubMenu} isReadOnly={isLevel4ReadOnly} />;
            case MainMenuId.MenusPlanification:
                return <MenusPage activeSubMenu={activeSubMenu} />;
            case MainMenuId.JoursPreparation:
                return <JoursPreparationPage isReadOnly={isLevel4ReadOnly} currentUserLevel={currentUserLevel} />;
            case MainMenuId.BilanVivres:
                return <BilanVivresPage />;
            case MainMenuId.VerificationRapport:
                return <VerificationRapportPage isReadOnly={isLevel4ReadOnly} onNavigateToRapportMensuel={handleNavigateToRapportMensuel} />;
            case MainMenuId.CFCBilan:
                return <CFCBilanPage />;
            case MainMenuId.BilanEcole:
                return <BilanEcolePage />;
            case MainMenuId.Liste:
                return <ListePage activeSubMenu={activeSubMenu} isReadOnly={isLevel4ReadOnly} returnTo={returnTo} onReturn={handleReturn} />;
            case MainMenuId.Historique:
                return <HistoriquePage currentUserLevel={currentUserLevel} />;
            case MainMenuId.APropos:
                return <AProposPage />;
            case MainMenuId.Parametres:
                return <ParametresPage activeSubMenu={activeSubMenu} currentUserLevel={currentUserLevel} isReadOnly={isParamsReadOnly} onSaveSuccess={handleNavigateToDashboard} />;
            default:
                return <DashboardPage activeSubMenu={activeSubMenu} currentUserLevel={currentUserLevel} returnTo={null} onReturn={() => {}} />;
        }
    };

    const handleUnlock = (level: number, recoveryUsed = false) => {
        setCurrentUserLevel(level);
        let action = '';
        if (level === 0) {
            action = "Accès Concepteur (TheBrain2010).";
        } else {
            action = recoveryUsed
                ? `Déverrouillage par récupération (Niveau ${level}).`
                : `Déverrouillage de l'application (Niveau ${level}).`;
        }
        logAction(action, level);

        if (recoveryUsed || (level === 1 && appSettings.mustChangePassword)) {
            setIsLocked(false);
            setIsForcingPasswordChange(true);
        } else {
            setIsLocked(false);
        }
    };

    const handlePasswordChanged = (newPassword: string) => {
        logAction("Changement du mot de passe principal requis effectué.", 1);
        setAppSettings(prev => ({
            ...prev,
            password: newPassword,
            mustChangePassword: false,
        }));
        setIsForcingPasswordChange(false);
    };

    if (isLoading || !authCheckDone) {
        return <SplashScreen />;
    }

    if (!appSettings.isApproved) {
        return <ApprovalScreen />;
    }
    
    if (isLocked) {
        return <LockScreen onUnlock={handleUnlock} />;
    }
    
    if (isForcingPasswordChange) {
        return <ForcedPasswordChangeScreen onPasswordChanged={handlePasswordChanged} />;
    }

    if (activationStatus === 'expired') {
        return <DeactivatedScreen onActivateClick={() => {
            setActiveMainMenu(MainMenuId.Parametres);
            setActiveSubMenu(null);
            // Temporarily set a valid status to allow access to settings page
            setActivationStatus('trial'); 
        }} />;
    }

    return (
        <div className="flex h-screen bg-[var(--color-bg-base)] font-sans text-[var(--color-text-base)]">
            {isMobileView && isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={handleToggleMobileSidebar}
                    aria-hidden="true"
                />
            )}
            <Sidebar 
                navItems={visibleNavItems} 
                activeMainMenu={activeMainMenu} 
                onMenuClick={handleMainMenuClick} 
                organizationName={appSettings.organizationName}
                isCollapsed={isSidebarCollapsed}
                onMouseEnter={handleSidebarMouseEnter}
                onMouseLeave={handleSidebarMouseLeave}
                onExpandRequest={handleSidebarExpand}
                isMobileView={isMobileView}
                isMobileSidebarOpen={isMobileSidebarOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    title={activeItem.title} 
                    subMenus={subMenuItems} 
                    activeSubMenu={activeSubMenu} 
                    onSubMenuClick={handleSubMenuClick}
                    activeMainMenu={activeMainMenu}
                    currentUserLevel={currentUserLevel}
                    onToggleSidebar={handleDesktopSidebarToggle}
                    onToggleMobileSidebar={handleToggleMobileSidebar}
                    isMobileView={isMobileView}
                    onNavigateToCalendar={handleNavigateToCalendar}
                    onNavigateToResteJours={handleNavigateToResteJours}
                    onNavigateToResteDenrees={handleNavigateToResteDenrees}
                    activationStatus={activationStatus}
                    daysRemaining={daysRemaining}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-bg-base)] p-4 lg:p-6">
                    {renderPage()}
                </main>
            </div>
            <ToastContainer />
        </div>
    );
};

export default App;
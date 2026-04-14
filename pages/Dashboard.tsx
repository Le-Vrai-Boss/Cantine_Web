import React from 'react';
import { SubMenuId } from '../constants';
import CustomCalendar from './dashboard/CustomCalendar';
import ResteJoursTable from './dashboard/ResteJoursTable';
import ResteDenreesTable from './dashboard/ResteDenreesTable';
import DepensesTable from './dashboard/DepensesTable';
import ActivitesTable from './dashboard/ActivitesTable';
import DefaultDashboardContent from './dashboard/DefaultDashboardContent';

const DashboardPage: React.FC<{ activeSubMenu: SubMenuId | null; currentUserLevel: number | null, returnTo: { mainMenu: MainMenuId; subMenu: SubMenuId | null } | null; onReturn: () => void }> = ({ activeSubMenu, currentUserLevel, returnTo, onReturn }) => {
    
    const isDashboardReadOnly = currentUserLevel === 3 || currentUserLevel === 4;

    const renderContent = () => {
        switch (activeSubMenu) {
            case SubMenuId.Depenses:
                return <DepensesTable isReadOnly={isDashboardReadOnly} />;
            case SubMenuId.Activites:
                return <ActivitesTable isReadOnly={isDashboardReadOnly} />;
            case SubMenuId.Calendrier:
                return <CustomCalendar readOnly={isDashboardReadOnly} returnTo={returnTo} onReturn={onReturn} />;
            case SubMenuId.ResteJours:
                return <ResteJoursTable returnTo={returnTo} onReturn={onReturn} />;
            case SubMenuId.ResteDenrees:
                 return <ResteDenreesTable returnTo={returnTo} onReturn={onReturn} />;
            default:
                return <DefaultDashboardContent />;
        }
    };

    return <div>{renderContent()}</div>;
};

export default DashboardPage;
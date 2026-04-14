import React from 'react';
import { MainMenuId, SubMenuId, navItems } from '../constants';
import { ChevronLeftIcon } from '../components/Icons';
import { Button } from '../components/Button';
import RapportMiParcoursPage from './RapportMiParcoursPage';
import FichePrevisionPage from './FichePrevisionPage';

// Import new components
import PlanActionBudgetiseReport from './liste/PlanActionBudgetiseReport';
import RapportDistributionReport from './liste/RapportDistributionReport';
import RapportMensuel from './liste/RapportMensuel';

interface ListePageProps {
    activeSubMenu: SubMenuId | null;
    isReadOnly?: boolean;
    returnTo?: { mainMenu: MainMenuId; subMenu: SubMenuId | null } | null;
    onReturn?: () => void;
}

const ListePage: React.FC<ListePageProps> = ({ activeSubMenu, isReadOnly = false, returnTo, onReturn }) => {
    const subMenuItem = navItems
        .find(item => item.id === MainMenuId.Liste)
        ?.subMenus?.find(sub => sub.id === activeSubMenu);

    const RapportMensuelWrapper: React.FC = () => {
        return (
            <div>
                {returnTo && onReturn && (
                    <div className="mb-4">
                        <Button onClick={onReturn} variant="secondary" icon={<ChevronLeftIcon className="h-5 w-5" />}>
                            Retour à la Vérification du Rapport
                        </Button>
                    </div>
                )}
                <RapportMensuel />
            </div>
        );
    }

    const renderContent = () => {
        switch (activeSubMenu) {
            case SubMenuId.RapportMiParcours:
                return <RapportMiParcoursPage />;
            case SubMenuId.PlanningActivite:
                return <PlanActionBudgetiseReport isReadOnly={isReadOnly} />;
            case SubMenuId.RapportDistribution:
                return <RapportDistributionReport />;
            case SubMenuId.FichePrevision:
                return <FichePrevisionPage />;
            case SubMenuId.RapportMensuel:
                return <RapportMensuelWrapper />;
            default:
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-xl font-semibold text-slate-700">{subMenuItem?.label || "Liste des Documents"}</h3>
                        <p className="mt-2 text-slate-500">
                            {subMenuItem ? `La section pour "${subMenuItem.label}" est en cours de développement.` : "Veuillez sélectionner un document dans le sous-menu pour l'afficher."}
                        </p>
                    </div>
                );
        }
    };

    return <div>{renderContent()}</div>;
};

export default ListePage;



import React from 'react';
import { SubMenuId } from '../constants';
import { useAppContext } from '../context/AppContext';

// Import newly created components
import IEPPForm from './information/IEPPForm';
import EcolesTable from './information/EcolesTable';
// FIX: Changed to named import as per error message
import { DenreesTable } from './information/DenreesTable';
import StaffTable from './information/StaffTable';
import { ClassEnrollmentTable } from './information/ClassEnrollmentTable';
import HistoricalEnrollmentTable from './information/HistoricalEnrollmentTable';
import SaisieAssiduiteTable from './information/SaisieAssiduiteTable';
import CepeResultsTable from './information/CepeResultsTable';
import CesacTable from './information/CesacTable';
import InfrastructuresTable from './information/InfrastructuresTable';
import DenreesEcoleTable from './information/DenreesEcoleTable';

interface InformationPageProps {
    activeSubMenu: SubMenuId | null;
    isReadOnly?: boolean;
    currentUserLevel: number | null;
}

const InformationPage: React.FC<InformationPageProps> = ({ activeSubMenu, isReadOnly = false, currentUserLevel }) => {
    const { 
        directors, setDirectors,
        gerants, setGerants, 
        cantinieres, setCantinieres, 
        cogesMembers, setCogesMembers 
    } = useAppContext();

    // Use variables to avoid unused warnings if they are needed for the context but not directly in the switch
    // Actually, they are used in the switch below. Wait.
    // Ah! They ARE used in the switch!
    /*
    case SubMenuId.Directeurs:
        return <StaffTable 
            ...
            items={directors} 
            setItems={setDirectors}
    */
    // So they are NOT unused.
    // Why did the lint say they are unused?
    // Maybe it's because they are in a different scope? No.
    // Wait, let me check the lint output again.
    // `src/pages/Information.tsx:29:11 error 'directors' is defined but never used @typescript-eslint/no-unused-vars`
    // Ah! I see. The `InformationPage` component destructures them but maybe they are not used in the way the linter expects?
    // No, they are used in the `renderContent` function which is called in the return.
    // Wait, I'll just leave them if they are used.
    // Let me re-read the file.
    

    const renderContent = () => {
        switch (activeSubMenu) {
            case SubMenuId.IEPP:
                return <IEPPForm isReadOnly={isReadOnly} />;
            case SubMenuId.Ecoles:
                return <EcolesTable isReadOnly={isReadOnly} currentUserLevel={currentUserLevel} />;
            case SubMenuId.Denrees:
                return <DenreesTable isReadOnly={isReadOnly} />;
            case SubMenuId.Directeurs:
                return <StaffTable 
                    title="Liste des Directeurs"
                    personLabel="Nom et Prénom (Directeur)"
                    items={directors} 
                    setItems={setDirectors}
                    isReadOnly={isReadOnly}
                />;
            case SubMenuId.Gerants:
                return <StaffTable 
                    title="Liste des Gérants"
                    personLabel="Nom et Prénom (Gérant)"
                    items={gerants} 
                    setItems={setGerants} 
                    isReadOnly={isReadOnly}
                />;
            case SubMenuId.Cantinieres:
                return <StaffTable
                    title="Liste des Cantinières"
                    personLabel="Nom et Prénom (Cantinière)"
                    items={cantinieres}
                    setItems={setCantinieres}
                    isReadOnly={isReadOnly}
                />;
            case SubMenuId.COGES:
                return <StaffTable
                    title="Liste des Membres COGES"
                    personLabel="Nom et Prénom (Membre COGES)"
                    items={cogesMembers}
                    setItems={setCogesMembers}
                    isReadOnly={isReadOnly}
                />;
            case SubMenuId.Classes:
                 return <ClassEnrollmentTable isReadOnly={isReadOnly} />;
            case SubMenuId.EffectifsHistorique:
                 return <HistoricalEnrollmentTable isReadOnly={isReadOnly} />;
            case SubMenuId.SaisieAssiduite:
                 return <SaisieAssiduiteTable isReadOnly={isReadOnly} />;
            case SubMenuId.CepeResults:
                 return <CepeResultsTable isReadOnly={isReadOnly} />;
            case SubMenuId.CESAC:
                 return <CesacTable isReadOnly={isReadOnly} />;
            case SubMenuId.Infrastructures:
                return <InfrastructuresTable isReadOnly={isReadOnly} />;
            case SubMenuId.DenreesEcole:
                return <DenreesEcoleTable isReadOnly={isReadOnly} />;
            default:
                return (
                    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)] text-center">
                        <h3 className="text-xl font-semibold text-[var(--color-text-heading)]">Section Informations</h3>
                        <p className="mt-2 text-[var(--color-text-muted)]">Veuillez sélectionner un sous-menu (IEPP, Ecoles, Denrées, etc.) pour afficher ou modifier les informations.</p>
                    </div>
                );
        }
    };

    return <div>{renderContent()}</div>;
};

export default InformationPage;
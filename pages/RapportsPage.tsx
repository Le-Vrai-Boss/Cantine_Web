import React from 'react';
import { SubMenuId } from '../constants';
import RapportMensuel from './liste/RapportMensuel';

const RapportsPage: React.FC<{ activeSubMenu: SubMenuId | null }> = ({ activeSubMenu }) => {
    const renderContent = () => {
        switch (activeSubMenu) {
            case SubMenuId.RapportMensuel:
                return <RapportMensuel />;
            default:
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-xl font-semibold text-slate-700">Rapports d'Analyse</h3>
                        <p className="mt-2 text-slate-500">Veuillez sélectionner un rapport dans le sous-menu pour l'afficher.</p>
                    </div>
                );
        }
    };

    return <div>{renderContent()}</div>;
};

export default RapportsPage;
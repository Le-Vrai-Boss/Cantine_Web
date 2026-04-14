

import React from 'react';
import { BookOpenIcon, LockIcon, SaveIcon, ChartIcon, UsersIcon, ClipboardListIcon, HelpCircleIcon } from '../components/Icons';

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg [box-shadow:var(--shadow-md)]">
        <div className="flex items-start mb-3">
            <div className="p-2 bg-[var(--color-primary-light)] rounded-full mr-4 shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-[var(--color-text-heading)]">{title}</h3>
            </div>
        </div>
        <div className="text-sm text-[var(--color-text-base)] space-y-2 pl-2">
            {children}
        </div>
    </div>
);

const AProposPage: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center">
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-primary-light)] mb-4">
                     <HelpCircleIcon className="h-9 w-9 text-[var(--color-primary)]" />
                 </div>
                <h2 className="text-3xl font-extrabold text-[var(--color-text-heading)]">À Propos de l'Application de Gestion des Cantines</h2>
                <p className="mt-2 text-lg text-[var(--color-text-muted)] max-w-3xl mx-auto">
                    Votre solution centralisée pour une gestion transparente et efficace des cantines scolaires.
                </p>
            </div>

            <InfoCard title="Notre Mission" icon={<BookOpenIcon className="h-6 w-6 text-[var(--color-primary)]" />}>
                <p>
                    Cette application a été conçue pour centraliser, organiser et simplifier toutes les opérations liées à la gestion des cantines au sein de votre inspection.
                </p>
                <p>
                    Notre mission est de fournir aux gestionnaires, directeurs et conseillers un outil puissant et intuitif pour assurer une gestion transparente, efficace et optimisée des ressources alimentaires et financières, garantissant ainsi des repas de qualité pour les élèves.
                </p>
            </InfoCard>

            <InfoCard title="Fonctionnalités Principales" icon={<ChartIcon className="h-6 w-6 text-[var(--color-primary)]" />}>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Tableau de Bord :</strong> Obtenez une vue d'ensemble instantanée des alertes, statistiques clés, dépenses et activités.</li>
                    <li><strong>Informations :</strong> Centralisez la saisie et la consultation des données de base : IEPP, écoles, denrées, personnel (directeurs, gérants, etc.).</li>
                    <li><strong>Jours de Préparation :</strong> Planifiez la consommation mensuelle des vivres pour chaque école avec un suivi des jours restants.</li>
                    <li><strong>Vérification Rapport :</strong> Contrôlez et validez les rapports mensuels de consommation, avec calculs financiers et bilans de stock automatisés.</li>
                    <li><strong>Bilans (Vivres, CFC, Écoles) :</strong> Générez des rapports d'analyse détaillés pour évaluer la performance et la gestion.</li>
                    <li><strong>Modules Optionnels :</strong> Étendez les capacités avec la gestion de la santé, des fournisseurs, des dons et de la planification des menus.</li>
                </ul>
            </InfoCard>

            <InfoCard title="Niveaux d'Accès Utilisateur" icon={<LockIcon className="h-6 w-6 text-[var(--color-primary)]" />}>
                <p>L'application dispose d'un système de sécurité à plusieurs niveaux pour garantir que chaque utilisateur n'accède qu'aux informations pertinentes :</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Niveau 1 (Administrateur) :</strong> Accès total. Peut gérer les paramètres globaux, la sécurité, les sauvegardes et toutes les données de l'application.</li>
                    <li><strong>Niveau 2 (Superviseur/Conseiller) :</strong> Accès étendu. Peut voir et modifier la plupart des données, mais ne peut pas gérer les paramètres de sécurité (mots de passe).</li>
                    <li><strong>Niveau 3 (Directeur d'école) :</strong> Accès limité. Peut consulter la plupart des informations et saisir certaines données. Plusieurs sections sont en lecture seule pour garantir l'intégrité des données.</li>
                    <li><strong>Niveau 4 (Gérant/Opérateur) :</strong> Accès de saisie. Conçu pour la saisie des données opérationnelles (dépenses, jours de préparation, etc.). L'accès à de nombreuses sections est en lecture seule.</li>
                </ul>
            </InfoCard>
            
             <InfoCard title="Guide de Démarrage Rapide" icon={<ClipboardListIcon className="h-6 w-6 text-[var(--color-primary)]" />}>
                <ol className="list-decimal pl-5 space-y-2">
                    <li>
                        <strong>Configurez les Paramètres :</strong>
                        Allez dans <strong className="font-semibold text-[var(--color-primary)]">Paramètres</strong> pour définir le nom de votre organisation, le thème visuel, et les mots de passe si nécessaire. C'est la première étape essentielle.
                    </li>
                     <li>
                        <strong>Renseignez les Informations de Base :</strong>
                        Allez dans <strong className="font-semibold text-[var(--color-primary)]">Informations</strong> et remplissez les sections dans l'ordre : <strong className="font-semibold">IEPP</strong>, puis <strong className="font-semibold">Denrées</strong>, et enfin <strong className="font-semibold">Ecoles</strong>. Ces données sont la fondation de toute l'application.
                    </li>
                    <li>
                        <strong>Saisissez le Personnel et les Effectifs :</strong>
                        Toujours dans <strong className="font-semibold text-[var(--color-primary)]">Informations</strong>, ajoutez les directeurs, gérants, cantinières, et les effectifs par classe.
                    </li>
                     <li>
                        <strong>Planifiez la Préparation :</strong>
                        Utilisez le menu <strong className="font-semibold text-[var(--color-primary)]">Jours de préparation</strong> pour planifier la consommation mensuelle pour chaque denrée et chaque école.
                    </li>
                     <li>
                        <strong>Explorez et Utilisez :</strong>
                        Le <strong className="font-semibold text-[var(--color-primary)]">Tableau de Bord</strong> vous donnera une vue d'ensemble. Utilisez les autres menus pour générer des bilans et des rapports.
                    </li>
                </ol>
            </InfoCard>

            <InfoCard title="Gestion des Données" icon={<SaveIcon className="h-6 w-6 text-[var(--color-primary)]" />}>
                <p>Toutes vos données sont stockées localement dans votre navigateur. Il est crucial de les sauvegarder régulièrement.</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Sauvegarde :</strong> Dans <strong className="font-semibold text-[var(--color-primary)]">Paramètres {'>'} Synchronisation et Sauvegarde</strong>, vous pouvez sauvegarder toutes vos données dans un fichier JSON ou générer des QR Codes pour les transférer.</li>
                    <li><strong>Restauration :</strong> Utilisez un fichier de sauvegarde ou les QR Codes pour restaurer vos données. <strong>Attention :</strong> cette action remplacera toutes les données actuellement dans l'application.</li>
                    <li><strong>Synchronisation Cloud :</strong> Pour une sauvegarde automatique, configurez l'URL de synchronisation dans les paramètres (nécessite une configuration côté serveur).</li>
                </ul>
            </InfoCard>
            
             <InfoCard title="Contact & Support" icon={<UsersIcon className="h-6 w-6 text-[var(--color-primary)]" />}>
                <p>
                    Pour toute question, suggestion ou problème technique, veuillez contacter le service de support à l'adresse suivante :
                </p>
                <p className="font-semibold text-[var(--color-primary)]">support.cantine@exemple.com</p>
            </InfoCard>

        </div>
    );
};

export default AProposPage;
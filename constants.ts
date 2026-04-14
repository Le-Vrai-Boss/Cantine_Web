

import { NavItem } from './types';
import { HomeIcon, ListIcon, ChartIcon, FoodIcon, CheckIcon, CalendarIcon, InfoIcon, CloseIcon, SettingsIcon, SparklesIcon, ClipboardListIcon, ShieldCheckIcon, TruckIcon, BookOpenIcon, GiftIcon, HistoryIcon, HelpCircleIcon, MessageSquareIcon } from './components/Icons';

export enum MainMenuId {
    Dashboard = 'dashboard',
    AssistantAI = 'assistant-ai',
    Messagerie = 'messagerie',
    Informations = 'informations',
    SanteHygiene = 'sante-hygiene',
    Fournisseurs = 'fournisseurs',
    GestionDons = 'gestion-dons',
    MenusPlanification = 'menus-planification',
    Liste = 'liste',
    BilanEcole = 'bilan-ecole',
    CFCBilan = 'cfc-bilan',
    BilanVivres = 'bilan-vivres',
    VerificationRapport = 'verification-rapport',
    JoursPreparation = 'jours-preparation',
    Historique = 'historique',
    APropos = 'a-propos',
    Parametres = 'parametres',
    Reset = 'reset',
    Fermer = 'fermer',
}

export enum SubMenuId {
    // Dashboard
    ResteJours = 'reste-jours',
    ResteDenrees = 'reste-denrees',
    Depenses = 'depenses',
    Activites = 'activites',
    Calendrier = 'calendrier',
    // Informations
    IEPP = 'iepp',
    Denrees = 'denrees',
    Ecoles = 'ecoles',
    Directeurs = 'directeurs',
    Gerants = 'gerants',
    Cantinieres = 'cantinieres',
    COGES = 'coges',
    Classes = 'classes',
    Infrastructures = 'infrastructures',
    EffectifsHistorique = 'effectifs-historique',
    SaisieAssiduite = "saisie-assiduite",
    CepeResults = 'cepe-results',
    CESAC = 'cesac',
    DenreesEcole = 'denrees-ecole',
    // Santé & Hygiène
    SuiviMedical = 'suivi-medical',
    FormationsHygiene = 'formations-hygiene',
    InspectionsLocaux = 'inspections-locaux',
    IncidentsSante = 'incidents-sante',
    // Fournisseurs
    ListeFournisseurs = 'liste-fournisseurs',
    SuiviCommandes = 'suivi-commandes',
    EvaluationFournisseurs = 'evaluation-fournisseurs',
    // Gestion des Dons
    ListeDons = 'liste-dons',
    GestionDonateurs = 'gestion-donateurs',
    CourriersModeles = 'courriers-modeles',
    DenreesDons = 'denrees-dons',
    DenreesEcoleDons = 'denrees-ecole-dons',
    ResteJoursDons = 'reste-jours-dons',
    JoursPreparationDons = 'jours-preparation-dons',
    VerificationRapportDons = 'verification-rapport-dons',
    CFCBilanDons = 'cfc-bilan-dons',
    // Menus & Planification
    GestionMenus = 'gestion-menus',
    PlanningHebdomadaire = 'planning-hebdomadaire',
    RapportBesoins = 'rapport-besoins',
    // Liste
    PlanningActivite = "planning-activite",
    RapportDistribution = "rapport-distribution",
    ActivitesRealisees = "activites-realisees",
    FichePrevision = "fiche-prevision",
    GestionStocks = "gestion-stocks",
    RapportDepenses = "rapport-depenses",
    RapportMiParcours = "rapport-mi-parcours",
    RapportMensuel = "rapport-mensuel",

    // Paramètres
    ParametresGeneraux = 'parametres-generaux',
    ParametresAssistant = 'parametres-assistant',
    ParametresApparence = 'parametres-apparence',
    ParametresModules = 'parametres-modules',
    ParametresSecurite = 'parametres-securite',
    ParametresLicence = 'parametres-licence',
    ParametresDonnees = 'parametres-donnees',
    ParametresDanger = 'parametres-danger',
}

export const navItems: NavItem[] = [
    {
        id: MainMenuId.Dashboard,
        label: "Tableau de Bord",
        icon: HomeIcon,
        title: "LOGICIEL DE GESTION DES CANTINES SCOLAIRES",
        subMenus: [
            { id: SubMenuId.ResteJours, label: "Reste des jours" },
            { id: SubMenuId.ResteDenrees, label: "Reste des Denrées" },
            { id: SubMenuId.Depenses, label: "Dépenses" },
            { id: SubMenuId.Activites, label: "Activités" },
            { id: SubMenuId.Calendrier, label: "Calendrier" }
        ]
    },
    {
        id: MainMenuId.AssistantAI,
        label: "Assistant AI",
        icon: SparklesIcon,
        title: "ASSISTANT INTELLIGENT DE BILAN ET D'ANALYSE"
    },
    {
        id: MainMenuId.Messagerie,
        label: "Messagerie",
        icon: MessageSquareIcon,
        title: "MESSAGERIE ET COMMUNICATION"
    },
    {
        id: MainMenuId.Informations,
        label: "Informations",
        icon: InfoIcon,
        title: "INFORMATION DES CANTINES A INSCRIRE",
        subMenus: [
            { id: SubMenuId.IEPP, label: "IEPP" },
            { id: SubMenuId.Denrees, label: "Denrées" },
            { id: SubMenuId.Ecoles, label: "Ecoles" },
            { id: SubMenuId.Directeurs, label: "Directeurs" },
            { id: SubMenuId.Gerants, label: "Gérants" },
            { id: SubMenuId.Cantinieres, label: "Cantinières" },
            { id: SubMenuId.COGES, label: "COGES" },
            { id: SubMenuId.Classes, label: "Classes" },
            { id: SubMenuId.Infrastructures, label: "Infrastructures" },
            { id: SubMenuId.EffectifsHistorique, label: "Effectifs Historique" },
            { id: SubMenuId.SaisieAssiduite, label: "Saisie Assiduité" },
            { id: SubMenuId.CepeResults, label: "Résultats CEPE" },
            { id: SubMenuId.CESAC, label: "CESAC" },
            { id: SubMenuId.DenreesEcole, label: "Denrées/Ecole" },
        ]
    },
     {
        id: MainMenuId.SanteHygiene,
        label: "Santé & Hygiène",
        icon: ShieldCheckIcon,
        title: "SUIVI DE LA SANTÉ ET DE L'HYGIÈNE",
        subMenus: [
            { id: SubMenuId.SuiviMedical, label: "Suivi Médical Personnel" },
            { id: SubMenuId.FormationsHygiene, label: "Formations Hygiène" },
            { id: SubMenuId.InspectionsLocaux, label: "Inspections des Locaux" },
            { id: SubMenuId.IncidentsSante, label: "Incidents" },
        ]
    },
    {
        id: MainMenuId.Fournisseurs,
        label: "Fournisseurs",
        icon: TruckIcon,
        title: "GESTION DES FOURNISSEURS",
        subMenus: [
            { id: SubMenuId.ListeFournisseurs, label: "Liste des Fournisseurs" },
            { id: SubMenuId.SuiviCommandes, label: "Suivi des Commandes" },
            { id: SubMenuId.EvaluationFournisseurs, label: "Évaluation" },
        ]
    },
    {
        id: MainMenuId.GestionDons,
        label: "Gestion des Dons",
        icon: GiftIcon,
        title: "GESTION DES DONS ET PARTENARIATS",
        subMenus: [
            { id: SubMenuId.GestionDonateurs, label: "Gestion des Donateurs" },
            { id: SubMenuId.ListeDons, label: "Liste des Dons" },
            { id: SubMenuId.CourriersModeles, label: "Courriers & Modèles" },
            { id: SubMenuId.DenreesDons, label: "Denrées (Dons)" },
            { id: SubMenuId.DenreesEcoleDons, label: "Denrées/Ecole (Dons)" },
            { id: SubMenuId.JoursPreparationDons, label: "Jours de préparation (Dons)" },
            { id: SubMenuId.VerificationRapportDons, label: "Vérification Rapport (Dons)" },
            { id: SubMenuId.ResteJoursDons, label: "Reste des jours (Dons)" },
            { id: SubMenuId.CFCBilanDons, label: "Bilan CFC (Dons)" },
        ]
    },
    {
        id: MainMenuId.MenusPlanification,
        label: "Menus & Planification",
        icon: BookOpenIcon,
        title: "GESTION DES MENUS ET PLANIFICATION",
        subMenus: [
            { id: SubMenuId.GestionMenus, label: "Gestion des Menus" },
            { id: SubMenuId.PlanningHebdomadaire, label: "Planning Hebdomadaire" },
            { id: SubMenuId.RapportBesoins, label: "Rapport Besoins" },
        ]
    },
    {
        id: MainMenuId.Liste,
        label: "Liste",
        icon: ListIcon,
        title: "LISTE DES DOCUMENTS DES CANTINES SCOLAIRES",
        subMenus: [
            { id: SubMenuId.RapportMiParcours, label: "Rapport à mi-parcours" },
            { id: SubMenuId.PlanningActivite, label: "Planning d'activité" },
            { id: SubMenuId.RapportDistribution, label: "Rapport de Distribution" },
            { id: SubMenuId.FichePrevision, label: "Fiche de prévision" },
            { id: SubMenuId.RapportMensuel, label: "Saisie Rapport Mensuel" },
        ]
    },
    {
        id: MainMenuId.BilanEcole,
        label: "Analyse Comparative",
        icon: ClipboardListIcon,
        title: "ANALYSE COMPARATIVE DES ÉCOLES"
    },
    {
        id: MainMenuId.CFCBilan,
        label: "CFC Bilan",
        icon: ChartIcon,
        title: "LES CFC DES MOIS"
    },
    {
        id: MainMenuId.BilanVivres,
        label: "Bilan Consommation Planifiée",
        icon: FoodIcon,
        title: "BILAN DE CONSOMMATION PLANIFIÉE DES VIVRES"
    },
    {
        id: MainMenuId.VerificationRapport,
        label: "Vérification Rapport",
        icon: CheckIcon,
        title: "VERIFICATION DU RAPPORT MENSUEL"
    },
    {
        id: MainMenuId.JoursPreparation,
        label: "Jours de préparation",
        icon: CalendarIcon,
        title: "INSCRIPTION DES JOURS DE PRÉPARATION"
    },
    {
        id: MainMenuId.Historique,
        label: "Historique",
        icon: HistoryIcon,
        title: "HISTORIQUE DES ACTIONS",
    },
    {
        id: MainMenuId.APropos,
        label: "À Propos",
        icon: HelpCircleIcon,
        title: "À PROPOS DE L'APPLICATION",
    },
    {
        id: MainMenuId.Parametres,
        label: "Paramètres",
        icon: SettingsIcon,
        title: "PARAMÈTRES DE L'APPLICATION",
        subMenus: [
            { id: SubMenuId.ParametresGeneraux, label: 'Généraux' },
            { id: SubMenuId.ParametresAssistant, label: 'Assistant AI' },
            { id: SubMenuId.ParametresApparence, label: 'Apparence' },
            { id: SubMenuId.ParametresModules, label: 'Modules & Alertes' },
            { id: SubMenuId.ParametresSecurite, label: 'Sécurité' },
            { id: SubMenuId.ParametresLicence, label: 'Licence & Activation' },
            { id: SubMenuId.ParametresDonnees, label: 'Données (Sauvegarde)' },
            { id: SubMenuId.ParametresDanger, label: 'Zone de Danger' },
        ],
    },
    {
        id: MainMenuId.Fermer,
        label: "Fermer",
        icon: CloseIcon,
        title: "FERMER L'APPLICATION"
    }
];
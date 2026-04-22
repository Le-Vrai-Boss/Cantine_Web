

import React from 'react';
import { MainMenuId, SubMenuId } from './constants';

export interface SubMenuItem {
    id: SubMenuId;
    label: string;
}

export interface NavItem {
    id: MainMenuId;
    label:string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subMenus?: SubMenuItem[];
}


export interface AppSettings {
    organizationName: string;
    currencySymbol: string;
    defaultMealPrice: number;
    inspectionPercentage: number;
    optionalModules: { [key: string]: boolean; };
    dashboardAlerts?: { [key: string]: boolean; };
    theme: string;
    apiKey: string;
    password?: string;
    passwordHint?: string;
    mustChangePassword?: boolean;
    level2Password?: string;
    level3Password?: string;
    level4Password?: string;
    firstLaunchDate?: string;
    isApproved?: boolean;
}

export interface School {
    id: string;
    name: string;
    code: string;
    openingYear: number;
    canteenOpeningYear: number;
    studentsGirls: number; // Effectif Ecole Filles
    studentsBoys: number; // Effectif Ecole Garçons
    rationnaireGirls: number; // Effectif Rationnaire Filles
    rationnaireBoys: number; // Effectif Rationnaire Garçons
}

export interface HistoricalEnrollment {
    id: string;
    schoolId: string;
    schoolYear: string;
    studentsGirls: number;
    studentsBoys: number;
    rationnaireGirls: number;
    rationnaireBoys: number;
}

export interface FoodItem {
    id: string;
    name: string;
    netWeight: number;
    grossWeight: number;
    boxPerPackage: number;
    packaging: string;
    unit: string;
    rationPerChild: number;
    operatingDays: number;
    lowStockThreshold: number; // in days
}

export interface IEPPData {
    ministry: string;
    regionalDirection: string;
    iepp: string;
    schoolYear: string;
    postalBox: string;
    phone: string;
    email: string;
    refIEPP: string;
    foodType: 'GVT' | 'Autres';
    distributionPeriod: string;
    distributionReportDate: string;
    firstPreparationDate: string;
    operatingDays: number;
    inspectorName: string;
    advisorName: string;
    bankName: string;
    accountNumber: string;
    initialBalance: number;
}

export interface Director {
    id: string;
    schoolId: string;
    name: string;
    contact: string;
    trained: boolean;
    trainingYear: number | '';
    trainingType: string;
}

export interface Gerant {
    id: string;
    schoolId: string;
    name: string;
    contact: string;
    trained: boolean;
    trainingYear: number | '';
    trainingType: string;
}

export interface Cantiniere {
    id: string;
    schoolId: string;
    name: string;
    contact: string;
    trained: boolean;
    trainingYear: number | '';
    trainingType: string;
}

export interface CogesMember {
    id: string;
    schoolId: string;
    name: string;
    contact: string;
    trained: boolean;
    trainingYear: number | '';
    trainingType: string;
}

export interface ClassEnrollment {
    schoolId: string;
    cp1_filles: number;
    cp1_garcons: number;
    cp2_filles: number;
    cp2_garcons: number;
    ce1_filles: number;
    ce1_garcons: number;
    ce2_filles: number;
    ce2_garcons: number;
    cm1_filles: number;
    cm1_garcons: number;
    cm2_filles: number;
    cm2_garcons: number;
}

export interface CesacMember {
    id: string;
    name: string;
    matricule: string;
    contact: string;
    email: string;
    entryDate: string;
    seniority: number;
    retirementDate: string;
}

interface FacilityDetail {
    donator: string;
    contact: string;
    functional: boolean;
}

export interface Infrastructure {
    id: string;
    schoolId: string;
    milieu: 'Urbain' | 'Rural';
    cuisine: boolean;
    refectoire: boolean;
    magasin: boolean;
    foyerAmeliore: FacilityDetail;
    pointEau: FacilityDetail;
    latrine: FacilityDetail;
}

export interface SchoolFoodSupply {
    id: string;
    schoolId: string;
    foodQuantities: Record<string, number>; // foodId -> quantity
    supplyDate: string;
    mealPrice: number;
    operatingDays?: Record<string, number>; // foodId -> operatingDays override for this school
}

export interface Depense {
    id: string;
    date: string;
    designation: string;
    montant: number;
}

export interface Activite {
    id: string;
    date: string;
    designation: string;
}

export interface Alert {
    id: string;
    type: 'warning' | 'info';
    title: string;
    description: string;
}

export type EventType = 'holiday' | 'special' | 'activity' | 'vacation' | 'preparation';

export interface CalendarEvent {
    id: string;
    date: string; // ISO string "YYYY-MM-DD"
    type: EventType;
    title: string;
}

// schoolId -> YYYY-MM -> foodId -> days
export type SchoolPreparationDaysData = Record<string, Record<string, Record<string, number>>>;


// Data for the Verification Rapport page
export interface MonthlyVerification {
    prepDays: Record<string, number>; // foodId -> days
    cfcReellementVerse: number;
}

// schoolId -> YYYY-MM -> data
export type VerificationData = Record<string, Record<string, MonthlyVerification>>;

export interface CepeResult {
    id: string;
    schoolId: string;
    schoolYear: string; // e.g., "2022-2023"
    candidates: number;
    admitted: number;
}

// schoolId -> YYYY-MM -> DD -> count
export type AttendanceData = Record<string, Record<string, Record<string, number>>>;

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

// --- Santé & Hygiène ---
export interface SuiviMedical {
    id: string;
    cantiniereId: string;
    dateVisite: string;
    typeVisite: 'Annuelle' | 'Embauche' | 'Contrôle' | 'Autre';
    resultat: 'Apte' | 'Inapte Temporairement' | 'Apte avec réserves' | 'En attente';
    commentaires: string;
}

export interface FormationHygiene {
    id: string;
    dateFormation: string;
    theme: string;
    participants: string; // Simple text for flexibility
    formateur: string;
}

export interface InspectionLocaux {
    id: string;
    schoolId: string;
    dateInspection: string;
    inspecteur: string;
    propretete: number; // Rating 1-5
    equipement: number; // Rating 1-5
    stockage: number; // Rating 1-5
    hygienePersonnel: number; // Rating 1-5
    commentaires: string;
    actionsCorrectives: string;
}

export interface IncidentSante {
    id: string;
    schoolId: string;
    dateIncident: string;
    typeIncident: string;
    description: string;
    personnesAffectees: number;
    mesuresPrises: string;
}
// --- End Santé & Hygiène ---

// --- Fournisseurs ---
export interface Fournisseur {
    id: string;
    nom: string;
    categorie: 'Vivres' | 'Matériel' | 'Services' | 'Autre';
    contact: string;
    email: string;
    adresse: string;
    personneContact: string;
}

export interface OrderItem {
    denreeId: string;
    quantity: number;
    unitPrice: number;
}

export interface Commande {
    id: string;
    date: string;
    numero: string;
    fournisseurId: string;
    items: OrderItem[];
    statut: 'En attente' | 'Partiellement Livrée' | 'Livrée' | 'Annulée';
}

export interface EvaluationFournisseur {
    id: string;
    fournisseurId: string;
    date: string;
    qualiteProduits: number; // 1-5
    respectDelais: number; // 1-5
    prix: number; // 1-5
    serviceClient: number; // 1-5
    commentaire: string;
}
// --- End Fournisseurs ---

// --- Gestion des Dons ---
export interface Donateur {
    id: string;
    nom: string;
    type: 'Particulier' | 'Entreprise' | 'ONG' | 'Autre';
    contact: string;
    email: string;
    adresse: string;
}

export interface Don {
    id: string;
    date: string;
    donateurId: string;
    schoolId?: string;
    type: 'Vivres' | 'Matériel' | 'Financier';
    description: string;
    foodQuantities?: Record<string, number>; // foodId -> quantity
    quantite?: number;
    unite?: string;
    valeurEstimee: number;
}

export interface LetterTemplate {
  id: string;
  name: string;
  type: 'demande' | 'remerciement';
  recipient: string;
  subject: string;
  body: string;
}
// --- End Gestion des Dons ---

// --- Menus & Planification ---
export interface MenuItem {
    denreeId: string;
    quantityPerRation: number; // specific ration for this menu, overrides default
}

export interface Menu {
    id: string;
    name: string;
    items: MenuItem[];
}

export interface DayPlan {
    dayOfWeek: number; // 0 for Sunday, 6 for Saturday
    menuId: string | null;
}

export interface WeeklyPlanningData {
    schoolId: string;
    weekId: string; // "YYYY-WW", e.g. "2024-W23"
    plan: DayPlan[];
}
// --- End Menus & Planification ---

// --- Plan d'Action Budgétisé ---
export interface PlanActionActivity {
  id: string;
  activite: string;
  responsable: string;
  periode: string;
  indicateur: string;
  sourceVerification: string;
  montant: number;
  sourceFinancement: string;
}

export interface PlanActionResultat {
  id: string;
  titre: string;
  activities: PlanActionActivity[];
}

export interface PlanActionSection {
  id: string;
  titre: string;
  pourcentage: number;
  resultats: PlanActionResultat[];
}

export interface PlanActionRevenu {
    id: string;
    label: string;
    montant: number;
}

export interface PlanActionBudget {
    revenus: PlanActionRevenu[];
}

export interface PlanActionData {
  sections: PlanActionSection[];
  budget: PlanActionBudget;
  signatures: {
      directeurRegional: string;
      directeurCantines: string;
  }
}
// --- End Plan d'Action Budgétisé ---

// --- Rapport Mensuel ---
export interface RapportMensuelContribution {
    id: string;
    date: string; // YYYY-MM-DD
    filles: number;
    garcons: number;
    montant: number;
}

export interface RapportMensuelDenreeRecue {
    foodId: string;
    colis: number;
}

export interface RapportMensuelMonthData {
    contributions: RapportMensuelContribution[];
    denreesRecues: RapportMensuelDenreeRecue[];
    prepDays?: Record<string, number>; // foodId -> days
}

// schoolId -> YYYY-MM -> data
export type RapportMensuelData = Record<string, Record<string, RapportMensuelMonthData>>;
// --- End Rapport Mensuel ---

// p: part, t: total, d: data
export interface QRCodeChunk {
    p: number;
    t: number;
    d: string;
}

// --- Historique ---
export interface HistoryEntry {
    id: number;
    timestamp: string;
    userLevel: number | null;
    action: string;
}
// --- End Historique ---

// --- Messagerie ---
export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
}

export interface MessageRecipient {
  name: string;
  contact: string;
  role: string;
  schoolName: string;
  schoolId: string;
}

export interface MessageHistoryEntry {
  id: string;
  timestamp: string;
  content: string;
  recipients: MessageRecipient[];
}
// --- End Messagerie ---

export interface AppContextType {
    // App Status
    isLoading: boolean;
    dataError: string | null;

    // Settings
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;

    // Information Data
    ieppData: IEPPData;
    setIeppData: React.Dispatch<React.SetStateAction<IEPPData>>;
    schools: School[];
    setSchools: React.Dispatch<React.SetStateAction<School[]>>;
    foodItems: FoodItem[];
    setFoodItems: React.Dispatch<React.SetStateAction<FoodItem[]>>;
    directors: Director[];
    setDirectors: React.Dispatch<React.SetStateAction<Director[]>>;
    gerants: Gerant[];
    setGerants: React.Dispatch<React.SetStateAction<Gerant[]>>;
    cantinieres: Cantiniere[];
    setCantinieres: React.Dispatch<React.SetStateAction<Cantiniere[]>>;
    cogesMembers: CogesMember[];
    setCogesMembers: React.Dispatch<React.SetStateAction<CogesMember[]>>;
    classEnrollments: ClassEnrollment[];
    setClassEnrollments: React.Dispatch<React.SetStateAction<ClassEnrollment[]>>;
    cesacMembers: CesacMember[];
    setCesacMembers: React.Dispatch<React.SetStateAction<CesacMember[]>>;
    infrastructures: Infrastructure[];
    setInfrastructures: React.Dispatch<React.SetStateAction<Infrastructure[]>>;
    schoolFoodSupplies: SchoolFoodSupply[];
    setSchoolFoodSupplies: React.Dispatch<React.SetStateAction<SchoolFoodSupply[]>>;

    // Dashboard Data
    depenses: Depense[];
    setDepenses: React.Dispatch<React.SetStateAction<Depense[]>>;
    activites: Activite[];
    setActivites: React.Dispatch<React.SetStateAction<Activite[]>>;
    calendarEvents: CalendarEvent[];
    setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    preparationWeekdays: number[];
    setPreparationWeekdays: React.Dispatch<React.SetStateAction<number[]>>;
    
    // Jours de Préparation Data
    schoolPreparationDays: SchoolPreparationDaysData;
    setSchoolPreparationDays: React.Dispatch<React.SetStateAction<SchoolPreparationDaysData>>;
    preparationValidationStatus: Record<string, boolean>;
    setPreparationValidationStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    // Verification Rapport Data
    verificationData: VerificationData;
    setVerificationData: React.Dispatch<React.SetStateAction<VerificationData>>;

    // CEPE Results Data
    cepeResults: CepeResult[];
    setCepeResults: React.Dispatch<React.SetStateAction<CepeResult[]>>;
    
    // Historical Enrollment Data
    historicalEnrollments: HistoricalEnrollment[];
    setHistoricalEnrollments: React.Dispatch<React.SetStateAction<HistoricalEnrollment[]>>;

    // Attendance Data
    attendanceData: AttendanceData;
    setAttendanceData: React.Dispatch<React.SetStateAction<AttendanceData>>;
    
    // Santé & Hygiène Data
    suivisMedicaux: SuiviMedical[];
    setSuivisMedicaux: React.Dispatch<React.SetStateAction<SuiviMedical[]>>;
    formationsHygiene: FormationHygiene[];
    setFormationsHygiene: React.Dispatch<React.SetStateAction<FormationHygiene[]>>;
    inspectionsLocaux: InspectionLocaux[];
    setInspectionsLocaux: React.Dispatch<React.SetStateAction<InspectionLocaux[]>>;
    incidentsSante: IncidentSante[];
    setIncidentsSante: React.Dispatch<React.SetStateAction<IncidentSante[]>>;

    // Fournisseurs Data
    fournisseurs: Fournisseur[];
    setFournisseurs: React.Dispatch<React.SetStateAction<Fournisseur[]>>;
    commandes: Commande[];
    setCommandes: React.Dispatch<React.SetStateAction<Commande[]>>;
    evaluationsFournisseurs: EvaluationFournisseur[];
    setEvaluationsFournisseurs: React.Dispatch<React.SetStateAction<EvaluationFournisseur[]>>;

    // Gestion des Dons Data
    donateurs: Donateur[];
    setDonateurs: React.Dispatch<React.SetStateAction<Donateur[]>>;
    dons: Don[];
    setDons: React.Dispatch<React.SetStateAction<Don[]>>;
    letterTemplates: LetterTemplate[];
    setLetterTemplates: React.Dispatch<React.SetStateAction<LetterTemplate[]>>;
    firstPreparationDateDons: string;
    setFirstPreparationDateDons: React.Dispatch<React.SetStateAction<string>>;
    foodItemsDons: FoodItem[];
    setFoodItemsDons: React.Dispatch<React.SetStateAction<FoodItem[]>>;
    schoolPreparationDaysDons: SchoolPreparationDaysData;
    setSchoolPreparationDaysDons: React.Dispatch<React.SetStateAction<SchoolPreparationDaysData>>;
    schoolFoodSuppliesDons: SchoolFoodSupply[];
    setSchoolFoodSuppliesDons: React.Dispatch<React.SetStateAction<SchoolFoodSupply[]>>;
    verificationDataDons: VerificationData;
    setVerificationDataDons: React.Dispatch<React.SetStateAction<VerificationData>>;

    // Menus & Planification
    menus: Menu[];
    setMenus: React.Dispatch<React.SetStateAction<Menu[]>>;
    weeklyPlannings: WeeklyPlanningData[];
    setWeeklyPlannings: React.Dispatch<React.SetStateAction<WeeklyPlanningData[]>>;

    // Plan d'Action Budgétisé
    planActionData: PlanActionData;
    setPlanActionData: React.Dispatch<React.SetStateAction<PlanActionData>>;
    
    // Rapport Mensuel Data
    rapportMensuelData: RapportMensuelData;
    setRapportMensuelData: React.Dispatch<React.SetStateAction<RapportMensuelData>>;

    // Historique
    history: HistoryEntry[];
    setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
    logAction: (action: string, userLevel: number | null) => void;

    // Messagerie
    messageTemplates: MessageTemplate[];
    setMessageTemplates: React.Dispatch<React.SetStateAction<MessageTemplate[]>>;
    messageHistory: MessageHistoryEntry[];
    setMessageHistory: React.Dispatch<React.SetStateAction<MessageHistoryEntry[]>>;

    // Global Filters
    globalSchoolId: string;
    setGlobalSchoolId: React.Dispatch<React.SetStateAction<string>>;
    globalMonth: string;
    setGlobalMonth: React.Dispatch<React.SetStateAction<string>>;
    
    // New function for data restoration
    restoreAllData: (data: Record<string, unknown>) => boolean;
    resetAllData: () => boolean;
}
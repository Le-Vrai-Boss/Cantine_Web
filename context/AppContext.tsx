

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { MainMenuId } from '../constants';
import type { 
    AppContextType, AppSettings, School, FoodItem, IEPPData, Director, Gerant, Cantiniere, CogesMember,
    ClassEnrollment, CesacMember, Infrastructure, SchoolFoodSupply,
    Depense, Activite, CalendarEvent, SchoolPreparationDaysData, VerificationData,
    CepeResult, HistoricalEnrollment, AttendanceData,
    SuiviMedical, FormationHygiene, InspectionLocaux, IncidentSante, Fournisseur, Commande,
    EvaluationFournisseur, Don, Donateur, Menu, WeeklyPlanningData, PlanActionData, RapportMensuelData, HistoryEntry,
    LetterTemplate, MessageTemplate, MessageHistoryEntry
} from '../types';
import {
    initialPlanActionData,
    initialLetterTemplates,
    seedSchools,
    seedFoodItems,
    seedSchoolFoodSupplies,
    seedIeppData,
    seedSchoolPreparationDays
} from './seedData';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const OLD_APP_DATA_KEY = 'canteen_app_data';
export const DATA_KEY_PREFIX = 'canteen_app_';

const getDefaultSettings = (): AppSettings => ({
    organizationName: 'Mon IEPP',
    currencySymbol: 'FCFA',
    defaultMealPrice: 25,
    inspectionPercentage: 10,
    optionalModules: {
        [MainMenuId.AssistantAI]: false,
        [MainMenuId.Messagerie]: true,
        [MainMenuId.Informations]: true,
        [MainMenuId.SanteHygiene]: false,
        [MainMenuId.Fournisseurs]: false,
        [MainMenuId.GestionDons]: false,
        [MainMenuId.MenusPlanification]: false,
        [MainMenuId.BilanEcole]: false,
        [MainMenuId.CFCBilan]: true,
        [MainMenuId.BilanVivres]: true,
        [MainMenuId.Liste]: false,
        [MainMenuId.VerificationRapport]: true,
        [MainMenuId.Historique]: false,
        [MainMenuId.APropos]: true,
    },
    dashboardAlerts: { stock: true, verify: true, event: true },
    theme: 'default',
    apiKey: '',
    password: '',
    mustChangePassword: false,
    level2Password: '',
    level3Password: '',
    level4Password: '',
    firstLaunchDate: new Date().toISOString(),
    isApproved: false,
});

const initialMessageTemplates: MessageTemplate[] = [
  { id: 'tpl_01', name: "Rappel Contribution Cantine", content: "Bonjour, nous vous rappelons aimablement l'échéance pour la contribution financière de la cantine. Votre soutien est essentiel pour le bien-être de nos élèves. Cordialement." },
  { id: 'tpl_02', name: "Convocation Réunion COGES", content: "Bonjour, vous êtes convié(e) à une importante réunion du COGES qui se tiendra le [date] à [heure] à l'école. Ordre du jour : [sujet]. Votre présence est indispensable." },
  { id: 'tpl_03', name: "Information Fermeture Cantine", content: "Info Cantine : Nous vous informons que la cantine sera exceptionnellement fermée le [date] pour cause de [motif]. Merci de prendre vos dispositions. Cordialement." },
  { id: 'tpl_04', name: "Alerte Stock Denrée", content: "URGENT : Le stock de [nom de la denrée] est à un niveau critique à l'école [nom de l'école]. Un réapprovisionnement est nécessaire dans les plus brefs délais." },
  { id: 'tpl_05', name: "Rappel Soumission Rapport", content: "Rappel : Le rapport mensuel de gestion de la cantine pour le mois de [mois] doit être soumis avant le [date limite]. Merci de votre diligence." },
  { id: 'tpl_06', name: "Demande de soutien (Dons)", content: "Bonjour, la cantine scolaire fait appel à votre générosité pour des dons en vivres ou financiers afin d'améliorer les repas de nos enfants. Chaque contribution compte. Merci !" }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    // Initialize all states with default values. They will be hydrated from localStorage.
    const [appSettings, setAppSettings] = useState<AppSettings>(getDefaultSettings());
    const [ieppData, setIeppData] = useState<IEPPData>(seedIeppData);
    const [schools, setSchools] = useState<School[]>(seedSchools);
    const [foodItems, setFoodItems] = useState<FoodItem[]>(seedFoodItems);
    const [directors, setDirectors] = useState<Director[]>([]);
    const [gerants, setGerants] = useState<Gerant[]>([]);
    const [cantinieres, setCantinieres] = useState<Cantiniere[]>([]);
    const [cogesMembers, setCogesMembers] = useState<CogesMember[]>([]);
    const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>([]);
    const [cesacMembers, setCesacMembers] = useState<CesacMember[]>([]);
    const [infrastructures, setInfrastructures] = useState<Infrastructure[]>([]);
    const [schoolFoodSupplies, setSchoolFoodSupplies] = useState<SchoolFoodSupply[]>(seedSchoolFoodSupplies);
    const [depenses, setDepenses] = useState<Depense[]>([]);
    const [activites, setActivites] = useState<Activite[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [preparationWeekdays, setPreparationWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [schoolPreparationDays, setSchoolPreparationDays] = useState<SchoolPreparationDaysData>(seedSchoolPreparationDays);
    const [preparationValidationStatus, setPreparationValidationStatus] = useState<Record<string, boolean>>({});
    const [verificationData, setVerificationData] = useState<VerificationData>({});
    const [cepeResults, setCepeResults] = useState<CepeResult[]>([]);
    const [historicalEnrollments, setHistoricalEnrollments] = useState<HistoricalEnrollment[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
    const [suivisMedicaux, setSuivisMedicaux] = useState<SuiviMedical[]>([]);
    const [formationsHygiene, setFormationsHygiene] = useState<FormationHygiene[]>([]);
    const [inspectionsLocaux, setInspectionsLocaux] = useState<InspectionLocaux[]>([]);
    const [incidentsSante, setIncidentsSante] = useState<IncidentSante[]>([]);
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [commandes, setCommandes] = useState<Commande[]>([]);
    const [evaluationsFournisseurs, setEvaluationsFournisseurs] = useState<EvaluationFournisseur[]>([]);
    const [donateurs, setDonateurs] = useState<Donateur[]>([]);
    const [dons, setDons] = useState<Don[]>([]);
    const [letterTemplates, setLetterTemplates] = useState<LetterTemplate[]>(initialLetterTemplates);
    const [firstPreparationDateDons, setFirstPreparationDateDons] = useState<string>(new Date().toISOString().split('T')[0]);
    const [foodItemsDons, setFoodItemsDons] = useState<FoodItem[]>([]);
    const [schoolPreparationDaysDons, setSchoolPreparationDaysDons] = useState<SchoolPreparationDaysData>({});
    const [schoolFoodSuppliesDons, setSchoolFoodSuppliesDons] = useState<SchoolFoodSupply[]>([]);
    const [verificationDataDons, setVerificationDataDons] = useState<VerificationData>({});
    const [menus, setMenus] = useState<Menu[]>([]);
    const [weeklyPlannings, setWeeklyPlannings] = useState<WeeklyPlanningData[]>([]);
    const [planActionData, setPlanActionData] = useState<PlanActionData>(initialPlanActionData);
    const [rapportMensuelData, setRapportMensuelData] = useState<RapportMensuelData>({});
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>(initialMessageTemplates);
    const [messageHistory, setMessageHistory] = useState<MessageHistoryEntry[]>([]);
    const [globalSchoolId, setGlobalSchoolId] = useState<string>('all');
    const [globalMonth, setGlobalMonth] = useState<string>('');
    
    // Load data from localStorage on initial mount
    useEffect(() => {
        setIsLoading(true);
        setDataError(null);
        const corruptionMessages: string[] = [];
        
        // This timeout ensures the splash screen is visible for a minimum duration
        setTimeout(() => {
            try {
                // Check for old data format to clean it up. We start fresh for stability.
                if (localStorage.getItem(OLD_APP_DATA_KEY)) {
                    console.warn("Ancien format de données détecté. Réinitialisation pour une meilleure stabilité.");
                    corruptionMessages.push("Mise à jour du format de données. L'application a été réinitialisée.");
                    // We don't try to migrate to avoid propagating corruption. We clear all to start fresh.
                    localStorage.clear();
                }

                const dataSlices = [
                    { key: 'appSettings', setter: setAppSettings, default: getDefaultSettings(), merge: true },
                    { key: 'ieppData', setter: setIeppData, default: seedIeppData },
                    { key: 'schools', setter: setSchools, default: seedSchools },
                    { key: 'foodItems', setter: setFoodItems, default: seedFoodItems },
                    { key: 'directors', setter: setDirectors, default: [] },
                    { key: 'gerants', setter: setGerants, default: [] },
                    { key: 'cantinieres', setter: setCantinieres, default: [] },
                    { key: 'cogesMembers', setter: setCogesMembers, default: [] },
                    { key: 'classEnrollments', setter: setClassEnrollments, default: [] },
                    { key: 'cesacMembers', setter: setCesacMembers, default: [] },
                    { key: 'infrastructures', setter: setInfrastructures, default: [] },
                    { key: 'schoolFoodSupplies', setter: setSchoolFoodSupplies, default: seedSchoolFoodSupplies },
                    { key: 'depenses', setter: setDepenses, default: [] },
                    { key: 'activites', setter: setActivites, default: [] },
                    { key: 'calendarEvents', setter: setCalendarEvents, default: [] },
                    { key: 'preparationWeekdays', setter: setPreparationWeekdays, default: [1,2,3,4,5] },
                    { key: 'schoolPreparationDays', setter: setSchoolPreparationDays, default: seedSchoolPreparationDays },
                    { key: 'preparationValidationStatus', setter: setPreparationValidationStatus, default: {} },
                    { key: 'verificationData', setter: setVerificationData, default: {} },
                    { key: 'cepeResults', setter: setCepeResults, default: [] },
                    { key: 'historicalEnrollments', setter: setHistoricalEnrollments, default: [] },
                    { key: 'attendanceData', setter: setAttendanceData, default: {} },
                    { key: 'suivisMedicaux', setter: setSuivisMedicaux, default: [] },
                    { key: 'formationsHygiene', setter: setFormationsHygiene, default: [] },
                    { key: 'inspectionsLocaux', setter: setInspectionsLocaux, default: [] },
                    { key: 'incidentsSante', setter: setIncidentsSante, default: [] },
                    { key: 'fournisseurs', setter: setFournisseurs, default: [] },
                    { key: 'commandes', setter: setCommandes, default: [] },
                    { key: 'evaluationsFournisseurs', setter: setEvaluationsFournisseurs, default: [] },
                    { key: 'donateurs', setter: setDonateurs, default: [] },
                    { key: 'dons', setter: setDons, default: [] },
                    { key: 'letterTemplates', setter: setLetterTemplates, default: initialLetterTemplates },
                    { key: 'firstPreparationDateDons', setter: setFirstPreparationDateDons, default: new Date().toISOString().split('T')[0] },
                    { key: 'foodItemsDons', setter: setFoodItemsDons, default: [] },
                    { key: 'schoolPreparationDaysDons', setter: setSchoolPreparationDaysDons, default: {} },
                    { key: 'schoolFoodSuppliesDons', setter: setSchoolFoodSuppliesDons, default: [] },
                    { key: 'verificationDataDons', setter: setVerificationDataDons, default: {} },
                    { key: 'menus', setter: setMenus, default: [] },
                    { key: 'weeklyPlannings', setter: setWeeklyPlannings, default: [] },
                    { key: 'planActionData', setter: setPlanActionData, default: initialPlanActionData },
                    { key: 'rapportMensuelData', setter: setRapportMensuelData, default: {} },
                    { key: 'history', setter: setHistory, default: [] },
                    { key: 'messageTemplates', setter: setMessageTemplates, default: initialMessageTemplates },
                    { key: 'messageHistory', setter: setMessageHistory, default: [] },
                    { key: 'globalSchoolId', setter: setGlobalSchoolId, default: 'all' },
                    { key: 'globalMonth', setter: setGlobalMonth, default: '' },
                ];
                
                dataSlices.forEach(slice => {
                    const itemKey = `${DATA_KEY_PREFIX}${slice.key}`;
                    try {
                        const storedItem = localStorage.getItem(itemKey);
                        if (storedItem) {
                            const parsedData = JSON.parse(storedItem);
                            // Merge for appSettings to handle new settings added in updates
                            // FIX: Cast slice.default to object and ensure parsedData is an object before spreading to prevent type errors.
                            if (slice.merge) {
                                slice.setter({ ...(slice.default as object), ...(typeof parsedData === 'object' && parsedData ? parsedData : {}) });
                            } else {
                                slice.setter(parsedData);
                            }
                        } else if (slice.key === 'appSettings') {
                            // FIX: Cast slice.default to object to prevent spread operator type error on union types.
                            slice.setter({ ...(slice.default as object), firstLaunchDate: new Date().toISOString() });
                        }
                    } catch (e) {
                        console.error(`Corruption détectée dans '${itemKey}'. Réinitialisation de cette section.`, e);
                        slice.setter(slice.default);
                        corruptionMessages.push(`La section '${slice.key}' était corrompue et a été réinitialisée.`);
                    }
                });
                
                if (corruptionMessages.length > 0) {
                    setDataError(corruptionMessages.join('\n'));
                }

            } catch (error) {
                console.error("Erreur critique lors du chargement des données. Réinitialisation complète.", error);
                setDataError("Une erreur critique est survenue. L'application a été réinitialisée à son état par défaut.");
                localStorage.clear();
                // We just reload, the default states will be applied.
                window.location.reload();
            } finally {
                setIsLoading(false);
            }
        }, 500); // Increased delay for splash screen visibility and to simulate check
    }, []);

    const allStatesForSaving = {
        appSettings, ieppData, schools, foodItems, directors, gerants, cantinieres, cogesMembers,
        classEnrollments, cesacMembers, infrastructures, schoolFoodSupplies, depenses, activites,
        calendarEvents, preparationWeekdays, schoolPreparationDays, preparationValidationStatus,
        verificationData, cepeResults, historicalEnrollments, attendanceData,
        suivisMedicaux, formationsHygiene, inspectionsLocaux, incidentsSante,
        fournisseurs, commandes, evaluationsFournisseurs, donateurs, dons, letterTemplates,
        firstPreparationDateDons, foodItemsDons, schoolPreparationDaysDons, schoolFoodSuppliesDons, verificationDataDons,
        menus, weeklyPlannings, planActionData, rapportMensuelData, history, messageTemplates, messageHistory, globalSchoolId, globalMonth
    };
    
    useEffect(() => {
        if (isLoading) return;

        try {
            for (const [key, value] of Object.entries(allStatesForSaving)) {
                localStorage.setItem(`${DATA_KEY_PREFIX}${key}`, JSON.stringify(value));
            }
        } catch (error) {
            console.error("Error saving state to localStorage", error);
            setDataError("Erreur lors de la sauvegarde des données. L'espace de stockage est peut-être plein.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        appSettings, ieppData, schools, foodItems, directors, gerants, cantinieres, cogesMembers,
        classEnrollments, cesacMembers, infrastructures, schoolFoodSupplies, depenses, activites,
        calendarEvents, preparationWeekdays, schoolPreparationDays, preparationValidationStatus,
        verificationData, cepeResults, historicalEnrollments, attendanceData,
        suivisMedicaux, formationsHygiene, inspectionsLocaux, incidentsSante,
        fournisseurs, commandes, evaluationsFournisseurs, donateurs, dons, letterTemplates,
        firstPreparationDateDons, foodItemsDons, schoolPreparationDaysDons, schoolFoodSuppliesDons, verificationDataDons,
        menus, weeklyPlannings, planActionData, rapportMensuelData, history, messageTemplates, messageHistory, globalSchoolId, globalMonth,
        isLoading
    ]);

    const logAction = useCallback((action: string, userLevel: number | null) => {
        const newEntry: HistoryEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            userLevel,
            action,
        };
        setHistory(prev => [newEntry, ...prev.slice(0, 499)]); // Keep history to 500 entries
    }, []);

    const restoreAllData = useCallback((data: Record<string, unknown>): boolean => {
        try {
            if (!data || !data.appSettings || !data.schools) {
                console.error("Invalid restore data: missing key properties.");
                return false;
            }

            const defaultSettings = getDefaultSettings();
            const loadedSettings = (data.appSettings as AppSettings) || {};
            const mergedSettings = { ...defaultSettings, ...loadedSettings, isApproved: true };
            data.appSettings = mergedSettings;

            const setters: [React.Dispatch<React.SetStateAction<never>>, unknown, unknown?][] = [
                [setAppSettings as React.Dispatch<React.SetStateAction<never>>, data.appSettings, defaultSettings],
                [setIeppData as React.Dispatch<React.SetStateAction<never>>, data.ieppData, seedIeppData],
                [setSchools as React.Dispatch<React.SetStateAction<never>>, data.schools, seedSchools],
                [setFoodItems as React.Dispatch<React.SetStateAction<never>>, data.foodItems, seedFoodItems],
                [setDirectors as React.Dispatch<React.SetStateAction<never>>, data.directors, []], [setGerants as React.Dispatch<React.SetStateAction<never>>, data.gerants, []], [setCantinieres as React.Dispatch<React.SetStateAction<never>>, data.cantinieres, []],
                [setCogesMembers as React.Dispatch<React.SetStateAction<never>>, data.cogesMembers, []], [setClassEnrollments as React.Dispatch<React.SetStateAction<never>>, data.classEnrollments, []], [setCesacMembers as React.Dispatch<React.SetStateAction<never>>, data.cesacMembers, []],
                [setInfrastructures as React.Dispatch<React.SetStateAction<never>>, data.infrastructures, []], [setSchoolFoodSupplies as React.Dispatch<React.SetStateAction<never>>, data.schoolFoodSupplies, seedSchoolFoodSupplies],
                [setDepenses as React.Dispatch<React.SetStateAction<never>>, data.depenses, []], [setActivites as React.Dispatch<React.SetStateAction<never>>, data.activites, []], [setCalendarEvents as React.Dispatch<React.SetStateAction<never>>, data.calendarEvents, []],
                [setPreparationWeekdays as React.Dispatch<React.SetStateAction<never>>, data.preparationWeekdays, [1,2,3,4,5]], [setSchoolPreparationDays as React.Dispatch<React.SetStateAction<never>>, data.schoolPreparationDays, seedSchoolPreparationDays],
                [setPreparationValidationStatus as React.Dispatch<React.SetStateAction<never>>, data.preparationValidationStatus, {}], [setVerificationData as React.Dispatch<React.SetStateAction<never>>, data.verificationData, {}],
                [setCepeResults as React.Dispatch<React.SetStateAction<never>>, data.cepeResults, []], [setHistoricalEnrollments as React.Dispatch<React.SetStateAction<never>>, data.historicalEnrollments, []], [setAttendanceData as React.Dispatch<React.SetStateAction<never>>, data.attendanceData, {}],
                [setSuivisMedicaux as React.Dispatch<React.SetStateAction<never>>, data.suivisMedicaux, []], [setFormationsHygiene as React.Dispatch<React.SetStateAction<never>>, data.formationsHygiene, []], [setInspectionsLocaux as React.Dispatch<React.SetStateAction<never>>, data.inspectionsLocaux, []],
                [setIncidentsSante as React.Dispatch<React.SetStateAction<never>>, data.incidentsSante, []], [setFournisseurs as React.Dispatch<React.SetStateAction<never>>, data.fournisseurs, []], [setCommandes as React.Dispatch<React.SetStateAction<never>>, data.commandes, []],
                [setEvaluationsFournisseurs as React.Dispatch<React.SetStateAction<never>>, data.evaluationsFournisseurs, []], [setDonateurs as React.Dispatch<React.SetStateAction<never>>, data.donateurs, []], [setDons as React.Dispatch<React.SetStateAction<never>>, data.dons, []],
                [setLetterTemplates as React.Dispatch<React.SetStateAction<never>>, data.letterTemplates, initialLetterTemplates], [setFirstPreparationDateDons as React.Dispatch<React.SetStateAction<never>>, data.firstPreparationDateDons, new Date().toISOString().split('T')[0]],
                [setFoodItemsDons as React.Dispatch<React.SetStateAction<never>>, data.foodItemsDons, []], [setSchoolFoodSuppliesDons as React.Dispatch<React.SetStateAction<never>>, data.schoolFoodSuppliesDons, []],
                [setSchoolPreparationDaysDons as React.Dispatch<React.SetStateAction<never>>, data.schoolPreparationDaysDons, {}], [setVerificationDataDons as React.Dispatch<React.SetStateAction<never>>, data.verificationDataDons, {}],
                [setMenus as React.Dispatch<React.SetStateAction<never>>, data.menus, []], [setWeeklyPlannings as React.Dispatch<React.SetStateAction<never>>, data.weeklyPlannings, []], [setPlanActionData as React.Dispatch<React.SetStateAction<never>>, data.planActionData, initialPlanActionData],
                [setRapportMensuelData as React.Dispatch<React.SetStateAction<never>>, data.rapportMensuelData, {}], [setHistory as React.Dispatch<React.SetStateAction<never>>, data.history, []], 
                [setMessageTemplates as React.Dispatch<React.SetStateAction<never>>, data.messageTemplates, initialMessageTemplates], 
                [setMessageHistory as React.Dispatch<React.SetStateAction<never>>, data.messageHistory, []], 
                [setGlobalSchoolId as React.Dispatch<React.SetStateAction<never>>, data.globalSchoolId, 'all'],
                [setGlobalMonth as React.Dispatch<React.SetStateAction<never>>, data.globalMonth, '']
            ];
            setters.forEach(([setter, value, fallback]) => setter(value ?? fallback));
            return true;
        } catch (e) { console.error("Failed to restore data", e); return false; }
    }, []);

    const resetAllData = useCallback((): boolean => {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(DATA_KEY_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch(e) {
            console.error("Failed to clear data", e);
            return false;
        }
    }, []);

    const value: AppContextType = {
        isLoading, dataError,
        appSettings, setAppSettings, ieppData, setIeppData, schools, setSchools, foodItems, setFoodItems, directors, setDirectors,
        gerants, setGerants, cantinieres, setCantinieres, cogesMembers, setCogesMembers, classEnrollments, setClassEnrollments,
        cesacMembers, setCesacMembers, infrastructures, setInfrastructures, schoolFoodSupplies, setSchoolFoodSupplies,
        depenses, setDepenses, activites, setActivites, calendarEvents, setCalendarEvents, preparationWeekdays, setPreparationWeekdays,
        schoolPreparationDays, setSchoolPreparationDays, preparationValidationStatus, setPreparationValidationStatus,
        verificationData, setVerificationData, cepeResults, setCepeResults, historicalEnrollments, setHistoricalEnrollments,
        attendanceData, setAttendanceData, suivisMedicaux, setSuivisMedicaux, formationsHygiene, setFormationsHygiene,
        inspectionsLocaux, setInspectionsLocaux, incidentsSante, setIncidentsSante, fournisseurs, setFournisseurs,
        commandes, setCommandes, evaluationsFournisseurs, setEvaluationsFournisseurs, donateurs, setDonateurs, dons, setDons,
        letterTemplates, setLetterTemplates,
        firstPreparationDateDons, setFirstPreparationDateDons, foodItemsDons, setFoodItemsDons,
        schoolPreparationDaysDons, setSchoolPreparationDaysDons, schoolFoodSuppliesDons, setSchoolFoodSuppliesDons,
        verificationDataDons, setVerificationDataDons,
        menus, setMenus, weeklyPlannings, setWeeklyPlannings, planActionData, setPlanActionData,
        rapportMensuelData, setRapportMensuelData,
        history, setHistory, logAction,
        messageTemplates, setMessageTemplates,
        messageHistory, setMessageHistory,
        globalSchoolId, setGlobalSchoolId,
        globalMonth, setGlobalMonth,
        restoreAllData,
        resetAllData,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
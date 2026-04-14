import type { 
    School, FoodItem, IEPPData, SchoolFoodSupply,
    SchoolPreparationDaysData, PlanActionData, LetterTemplate
} from '../types';


export const initialPlanActionData: PlanActionData = {
    sections: [],
    budget: {
        revenus: []
    },
    signatures: {
        directeurRegional: "",
        directeurCantines: "",
    }
};

export const initialLetterTemplates: LetterTemplate[] = [];

export const seedSchools: School[] = [];

export const seedFoodItems: FoodItem[] = [];

export const seedSchoolFoodSupplies: SchoolFoodSupply[] = [];

export const seedIeppData: IEPPData = {
    ministry: '',
    regionalDirection: '',
    iepp: '',
    schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    postalBox: '',
    phone: '',
    email: '',
    refIEPP: '',
    foodType: 'GVT',
    distributionPeriod: '',
    distributionReportDate: '',
    firstPreparationDate: `${new Date().getFullYear()}-09-01`,
    operatingDays: 0,
    inspectorName: '',
    advisorName: '',
    bankName: '',
    accountNumber: '',
    initialBalance: 0,
};

export const seedSchoolPreparationDays: SchoolPreparationDaysData = {};

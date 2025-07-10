export enum OnboardingStep {
    CHOOSING_COMPANY = "CHOOSING_COMPANY",
    STRIPE_SETUP = "STRIPE_SETUP",
    FINISH = "FINISH",
}

export interface ICompany {
    company_id: string;
    name: string;
}

export interface IUserResponse {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
    companyCompany_id?: string;
    first_name: string;
    last_name: string;
    company_id?: string;
    onboarding_completed: boolean;
    onboarding_step: OnboardingStep;
    stripe_account_id?: string;
    stripe_onboarded: boolean;
    Company?: ICompany | null;
}

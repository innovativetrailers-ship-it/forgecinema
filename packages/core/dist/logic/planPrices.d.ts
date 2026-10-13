export interface PlanDisplayPrice {
    id: 'free' | 'pro' | 'studio' | 'ultimate';
    name: string;
    monthlyAud: number;
    yearlyAud: number;
    credits: string;
}
export declare const PLAN_DISPLAY_PRICES: PlanDisplayPrice[];
export declare function formatPlanAud(amount: number): string;
export declare function planDisplay(id: PlanDisplayPrice['id']): PlanDisplayPrice;

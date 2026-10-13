"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_DISPLAY_PRICES = void 0;
exports.formatPlanAud = formatPlanAud;
exports.planDisplay = planDisplay;
exports.PLAN_DISPLAY_PRICES = [
    { id: 'free', name: 'Free Trial', monthlyAud: 0, yearlyAud: 0, credits: '50 credits (one-time)' },
    { id: 'pro', name: 'Pro', monthlyAud: 19, yearlyAud: 190, credits: '500 credits / month' },
    { id: 'studio', name: 'Studio', monthlyAud: 49, yearlyAud: 490, credits: '2,000 credits / month' },
    { id: 'ultimate', name: 'Ultimate', monthlyAud: 99, yearlyAud: 990, credits: '6,000 credits / month' },
];
function formatPlanAud(amount) {
    if (amount === 0)
        return 'Free';
    return `$${amount}`;
}
function planDisplay(id) {
    const row = exports.PLAN_DISPLAY_PRICES.find((plan) => plan.id === id);
    if (!row)
        throw new Error(`Unknown plan ${id}`);
    return row;
}
//# sourceMappingURL=planPrices.js.map
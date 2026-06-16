interface RiskCheckResult {
    passed: boolean;
    rule: string;
    message: string;
    level: 'warn' | 'block';
}
declare class RiskControlService {
    private rules;
    constructor();
    private initRules;
    checkRule(ruleCode: string, ...args: any[]): Promise<RiskCheckResult>;
    checkAll(...args: any[]): Promise<RiskCheckResult[]>;
    checkCommission(amount: number, promoterId: string): Promise<void>;
    checkWithdraw(promoterId: string, amount: number): Promise<void>;
    checkOrder(amount: number): Promise<RiskCheckResult[]>;
    getRules(): {
        name: string;
        code: string;
        enabled: boolean;
    }[];
}
declare const _default: RiskControlService;
export default _default;
//# sourceMappingURL=RiskControl.service.d.ts.map
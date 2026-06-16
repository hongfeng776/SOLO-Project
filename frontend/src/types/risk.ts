export interface RiskRule {
  id: number; name: string; code: string; type: number; category: number;
  condition: any; threshold: number; action: number; severity: number;
  status: number; hitCount: number; description: string; createTime: string; updateTime: string
}
export interface RiskRecord {
  id: number; ruleId: number; ruleName: string; ruleCode: string;
  targetType: number; targetId: number; targetName: string;
  riskType: number; severity: number; action: number; detail: string;
  status: number; handlerId: number | null; handlerName: string | null;
  handleResult: string | null; handleTime: string | null; createTime: string
}

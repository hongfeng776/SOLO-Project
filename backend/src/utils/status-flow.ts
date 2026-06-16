import { AppError, ParamError } from './app-error';

export interface StatusTransition {
  from: string | string[];
  to: string;
  label: string;
  action: string;
  description?: string;
}

export interface StatusFlowConfig {
  entityType: string;
  initialStatus: string;
  transitions: StatusTransition[];
  finalStatuses: string[];
}

export class StatusFlowEngine {
  private configs: Map<string, StatusFlowConfig> = new Map();

  register(config: StatusFlowConfig) {
    this.configs.set(config.entityType, config);
  }

  getConfig(entityType: string): StatusFlowConfig {
    const config = this.configs.get(entityType);
    if (!config) {
      throw new ParamError(`未找到${entityType}的状态流转配置`);
    }
    return config;
  }

  canTransition(entityType: string, currentStatus: string, targetStatus: string): boolean {
    const config = this.getConfig(entityType);
    return config.transitions.some(
      (t) =>
        (t.from === currentStatus || (Array.isArray(t.from) && t.from.includes(currentStatus))) &&
        t.to === targetStatus
    );
  }

  validateTransition(entityType: string, currentStatus: string, targetStatus: string): void {
    if (!this.canTransition(entityType, currentStatus, targetStatus)) {
      throw new AppError(
        40002,
        `状态流转不合法：无法从"${currentStatus}"流转到"${targetStatus}"`
      );
    }
  }

  getAvailableTransitions(entityType: string, currentStatus: string): StatusTransition[] {
    const config = this.getConfig(entityType);
    return config.transitions.filter(
      (t) => t.from === currentStatus || (Array.isArray(t.from) && t.from.includes(currentStatus))
    );
  }

  isFinalStatus(entityType: string, status: string): boolean {
    const config = this.getConfig(entityType);
    return config.finalStatuses.includes(status);
  }

  getInitialStatus(entityType: string): string {
    const config = this.getConfig(entityType);
    return config.initialStatus;
  }
}

export const statusFlowEngine = new StatusFlowEngine();

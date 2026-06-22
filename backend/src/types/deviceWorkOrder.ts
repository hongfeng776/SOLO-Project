import { BaseEntity, PaginationParams } from './common';

export type WorkOrderType = 1 | 2 | 3 | 4;
export type WorkOrderStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type MaintenanceLevel = 1 | 2 | 3 | 4;
export type AcceptanceStatus = 0 | 1 | 2 | 3;
export type TaskStatus = 0 | 1 | 2 | 3 | 4;
export type WorkOrderLogType = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type WarrantyStatus = 0 | 1 | 2;

export const WorkOrderTypeText: Record<number, string> = {
  1: '日常保养',
  2: '故障维修',
  3: '定期检修',
  4: '报废核验'
};

export const WorkOrderStatusText: Record<number, string> = {
  0: '草稿',
  1: '待派单',
  2: '已派单',
  3: '处理中',
  4: '待验收',
  5: '已完成',
  6: '已取消'
};

export const MaintenanceLevelText: Record<number, string> = {
  1: '一级',
  2: '二级',
  3: '三级',
  4: '四级'
};

export const AcceptanceStatusText: Record<number, string> = {
  0: '未验收',
  1: '验收通过',
  2: '验收不通过',
  3: '验收中'
};

export const TaskStatusText: Record<number, string> = {
  0: '草稿',
  1: '待执行',
  2: '执行中',
  3: '已完成',
  4: '已取消'
};

export const WorkOrderLogTypeText: Record<number, string> = {
  1: '工单创建',
  2: '工单派单',
  3: '开始处理',
  4: '提交验收',
  5: '验收通过',
  6: '验收不通过',
  7: '工单取消'
};

export const WarrantyStatusText: Record<number, string> = {
  0: '不在保',
  1: '在保',
  2: '即将到期'
};

export interface WorkOrderTypeConfig {
  order_type: WorkOrderType;
  order_type_text: string;
  maintenance_level: MaintenanceLevel;
  maintenance_level_text: string;
  standard_process: string[];
  acceptance_standard: string[];
  cost_calculation_rule: string;
  estimated_hours: number;
  required_qualifications: string[];
}

export const WORK_ORDER_TYPE_CONFIG: Record<number, WorkOrderTypeConfig> = {
  1: {
    order_type: 1, order_type_text: '日常保养', maintenance_level: 1, maintenance_level_text: '一级',
    standard_process: ['外观检查', '清洁除尘', '润滑保养', '功能测试', '参数记录'],
    acceptance_standard: ['外观整洁', '运行正常', '参数在正常范围', '保养记录完整'],
    cost_calculation_rule: '基础保养费 + 配件费',
    estimated_hours: 1,
    required_qualifications: ['basic_maintenance']
  },
  2: {
    order_type: 2, order_type_text: '故障维修', maintenance_level: 3, maintenance_level_text: '三级',
    standard_process: ['故障诊断', '配件更换', '功能修复', '测试验证', '报告提交'],
    acceptance_standard: ['故障排除', '功能恢复正常', '连续运行2小时无异常', '维修记录完整'],
    cost_calculation_rule: '维修费 + 配件费 + 人工费',
    estimated_hours: 4,
    required_qualifications: ['fault_repair', 'component_replacement']
  },
  3: {
    order_type: 3, order_type_text: '定期检修', maintenance_level: 2, maintenance_level_text: '二级',
    standard_process: ['全面检查', '性能测试', '安全检测', '隐患排查', '检修报告'],
    acceptance_standard: ['各项指标合格', '无安全隐患', '设备运行稳定', '检修报告完整'],
    cost_calculation_rule: '检修费 + 检测费',
    estimated_hours: 2,
    required_qualifications: ['periodic_inspection', 'safety_cert']
  },
  4: {
    order_type: 4, order_type_text: '报废核验', maintenance_level: 4, maintenance_level_text: '四级',
    standard_process: ['报废申请审核', '技术鉴定', '残值评估', '资产核销', '档案归档'],
    acceptance_standard: ['技术鉴定确认无法修复', '残值评估合理', '资产核销手续完备', '档案完整归档'],
    cost_calculation_rule: '鉴定费 + 处置费',
    estimated_hours: 8,
    required_qualifications: ['scrap_verification', 'asset_management']
  }
};

export interface MaintenanceFrequencyConfig {
  usage_years_range: [number, number];
  fault_frequency_per_month: [number, number];
  frequency_days: number;
  is_old_device: boolean;
  description: string;
}

export const MAINTENANCE_FREQUENCY_CONFIG: MaintenanceFrequencyConfig[] = [
  { usage_years_range: [0, 2], fault_frequency_per_month: [0, 1], frequency_days: 90, is_old_device: false, description: '新设备低故障：每季度1次' },
  { usage_years_range: [0, 2], fault_frequency_per_month: [2, 4], frequency_days: 60, is_old_device: false, description: '新设备中故障：每2月1次' },
  { usage_years_range: [2, 5], fault_frequency_per_month: [0, 2], frequency_days: 60, is_old_device: false, description: '一般设备低故障：每2月1次' },
  { usage_years_range: [2, 5], fault_frequency_per_month: [3, 6], frequency_days: 30, is_old_device: false, description: '一般设备中故障：每月1次' },
  { usage_years_range: [5, 10], fault_frequency_per_month: [0, 3], frequency_days: 30, is_old_device: true, description: '老旧设备低故障：每月1次' },
  { usage_years_range: [5, 10], fault_frequency_per_month: [4, 10], frequency_days: 15, is_old_device: true, description: '老旧设备高故障：每半月1次' },
  { usage_years_range: [10, 99], fault_frequency_per_month: [0, 99], frequency_days: 7, is_old_device: true, description: '超期服役设备：每周1次' }
];

export interface WorkOrderPreCheckRequest {
  archive_no: string;
  sn_code: string;
  order_type: WorkOrderType;
  operator_id?: string;
}

export interface WorkOrderPreCheckResult {
  passed: boolean;
  blocked: boolean;
  block_reason?: string;
  warnings: string[];
  fault_checked: boolean;
  has_active_fault: boolean;
  fault_description?: string;
  permission_checked: boolean;
  has_permission: boolean;
  qualification_checked: boolean;
  has_valid_qualification: boolean;
  missing_qualifications: string[];
  warranty_checked: boolean;
  warranty_status: WarrantyStatus;
  warranty_status_text: string;
  warranty_expire_date?: string;
  banned_checked: boolean;
  is_banned: boolean;
  ban_reason?: string;
  normal_device_blocked: boolean;
  normal_device_detail?: string;
  order_type_config?: WorkOrderTypeConfig;
}

export interface CreateWorkOrderRequest {
  archive_no: string;
  sn_code: string;
  device_type: number;
  order_type: WorkOrderType;
  maintenance_level?: MaintenanceLevel;
  fault_description?: string;
  fault_code?: string;
  expected_finish_time?: string;
  assignee_id?: string;
  assignee_name?: string;
  org_id?: string;
  priority?: 1 | 2 | 3 | 4;
  remark?: string;
  cost_estimate?: number;
}

export interface WorkOrderQueryParams extends PaginationParams {
  keyword?: string;
  order_no?: string;
  archive_no?: string;
  sn_code?: string;
  device_type?: number;
  order_type?: WorkOrderType;
  status?: WorkOrderStatus;
  maintenance_level?: MaintenanceLevel;
  acceptance_status?: AcceptanceStatus;
  assignee_id?: string;
  org_id?: string;
  is_overdue?: number;
  start_time?: string;
  end_time?: string;
}

export interface DeviceWorkOrderVO extends BaseEntity {
  order_no: string;
  archive_no: string;
  sn_code: string;
  device_type: number;
  device_type_text: string;
  device_model: string;
  manufacturer: string;
  order_type: WorkOrderType;
  order_type_text: string;
  maintenance_level: MaintenanceLevel;
  maintenance_level_text: string;
  status: WorkOrderStatus;
  status_text: string;
  fault_description?: string;
  fault_code?: string;
  maintenance_content?: string;
  maintenance_result?: string;
  acceptance_status: AcceptanceStatus;
  acceptance_status_text: string;
  acceptance_remark?: string;
  acceptance_time?: string;
  acceptance_by?: string;
  acceptance_by_name?: string;
  assignee_id?: string;
  assignee_name?: string;
  creator_id: string;
  creator_name: string;
  org_id?: string;
  org_name?: string;
  install_location?: string;
  priority: number;
  priority_text: string;
  expected_finish_time?: string;
  actual_finish_time?: string;
  cost_estimate?: number;
  cost_actual?: number;
  is_overdue: number;
  warranty_status: WarrantyStatus;
  warranty_status_text: string;
  remark?: string;
  used_parts?: string;
  maintenance_hours?: number;
}

export interface WorkOrderUpdateRequest {
  id: string;
  status: WorkOrderStatus;
  maintenance_content?: string;
  maintenance_result?: string;
  acceptance_status?: AcceptanceStatus;
  acceptance_remark?: string;
  cost_actual?: number;
  used_parts?: string;
  maintenance_hours?: number;
  assignee_id?: string;
  assignee_name?: string;
  remark?: string;
}

export interface WorkOrderBatchTaskRequest {
  order_type: WorkOrderType;
  device_type?: number;
  org_id?: string;
  is_old_device?: number;
  fault_frequency_min?: number;
  min_usage_years?: number;
  max_usage_years?: number;
  start_date: string;
  end_date: string;
  priority?: number;
  assignee_id?: string;
  assignee_name?: string;
  remark?: string;
}

export interface MaintenanceTaskQueryParams extends PaginationParams {
  keyword?: string;
  task_no?: string;
  order_type?: WorkOrderType;
  task_status?: TaskStatus;
  assignee_id?: string;
  org_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface DeviceMaintenanceTaskVO extends BaseEntity {
  task_no: string;
  task_name: string;
  order_type: WorkOrderType;
  order_type_text: string;
  task_status: TaskStatus;
  task_status_text: string;
  total_count: number;
  completed_count: number;
  pending_count: number;
  progress: number;
  start_date: string;
  end_date: string;
  priority: number;
  priority_text: string;
  assignee_id?: string;
  assignee_name?: string;
  creator_id: string;
  creator_name: string;
  org_id?: string;
  org_name?: string;
  is_old_device_filter: number;
  fault_frequency_min?: number;
  min_usage_years?: number;
  max_usage_years?: number;
  remark?: string;
  device_list?: string;
}

export interface WorkOrderTraceRequest {
  archive_no?: string;
  sn_code?: string;
  trace_type?: 'maintenance' | 'repair' | 'acceptance' | 'all';
}

export interface WorkOrderTraceResult {
  device_info?: {
    archive_no: string;
    sn_code: string;
    device_type: number;
    device_type_text: string;
    usage_years: number;
    fault_count_total: number;
    maintenance_count_total: number;
    avg_recovery_hours: number;
  };
  fake_maintenance_check: {
    passed: boolean;
    issues: string[];
    fake_count: number;
  };
  violation_check: {
    passed: boolean;
    issues: string[];
    violation_count: number;
  };
  acceptance_check: {
    passed: boolean;
    issues: string[];
    perfunctory_count: number;
  };
  risk_prompts: string[];
  work_order_history: DeviceWorkOrderVO[];
  maintenance_logs: DeviceWorkOrderLogVO[];
}

export interface DeviceWorkOrderLogVO extends BaseEntity {
  order_id: string;
  order_no: string;
  log_type: WorkOrderLogType;
  log_type_text: string;
  before_status?: WorkOrderStatus;
  before_status_text?: string;
  after_status?: WorkOrderStatus;
  after_status_text?: string;
  operation_detail?: string;
  operator_id: string;
  operator_name: string;
  operation_remark?: string;
}

export interface WorkOrderStatistics {
  total_count: number;
  pending_count: number;
  processing_count: number;
  acceptance_count: number;
  completed_count: number;
  cancelled_count: number;
  overdue_count: number;
  today_created_count: number;
  today_completed_count: number;
  avg_processing_hours: number;
  monthly_cost: number;
  type_distribution: Record<number, number>;
}

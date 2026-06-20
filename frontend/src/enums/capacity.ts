export enum CapacityTypeEnum {
  EXPRESS = 1,
  PREMIUM = 2,
  LUXURY = 3,
  CARPOOL = 4,
  TAXI = 5
}

export const CapacityTypeMap: Record<number, string> = {
  [CapacityTypeEnum.EXPRESS]: '快车',
  [CapacityTypeEnum.PREMIUM]: '专车',
  [CapacityTypeEnum.LUXURY]: '豪华车',
  [CapacityTypeEnum.CARPOOL]: '拼车',
  [CapacityTypeEnum.TAXI]: '出租车'
}

export const CapacityTypeColorMap: Record<number, string> = {
  [CapacityTypeEnum.EXPRESS]: '#409eff',
  [CapacityTypeEnum.PREMIUM]: '#67c23a',
  [CapacityTypeEnum.LUXURY]: '#e6a23c',
  [CapacityTypeEnum.CARPOOL]: '#909399',
  [CapacityTypeEnum.TAXI]: '#f56c6c'
}

export enum CapacityStatusCode {
  NORMAL = 'normal',
  SATURATED = 'saturated',
  SHORTAGE = 'shortage',
  SURPLUS = 'surplus'
}

export const CapacityStatusLabelMap: Record<string, string> = {
  [CapacityStatusCode.NORMAL]: '运力正常',
  [CapacityStatusCode.SATURATED]: '运力饱和',
  [CapacityStatusCode.SHORTAGE]: '运力紧缺',
  [CapacityStatusCode.SURPLUS]: '运力过剩'
}

export const CapacityStatusColorMap: Record<string, string> = {
  [CapacityStatusCode.NORMAL]: '#67c23a',
  [CapacityStatusCode.SATURATED]: '#e6a23c',
  [CapacityStatusCode.SHORTAGE]: '#f56c6c',
  [CapacityStatusCode.SURPLUS]: '#909399'
}

export const CapacityStatusSeverityMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  [CapacityStatusCode.NORMAL]: 'success',
  [CapacityStatusCode.SATURATED]: 'warning',
  [CapacityStatusCode.SHORTAGE]: 'danger',
  [CapacityStatusCode.SURPLUS]: 'info'
}

export enum UserRole {
  ADMIN = 'admin',
  CAPACITY_MANAGER = 'capacity_manager',
  CITY_MANAGER = 'city_manager',
  OPERATOR = 'operator'
}

export const UserRoleMap: Record<string, string> = {
  [UserRole.ADMIN]: '超级管理员',
  [UserRole.CAPACITY_MANAGER]: '运力管理员',
  [UserRole.CITY_MANAGER]: '城市管理员',
  [UserRole.OPERATOR]: '运营人员'
}

export enum OperationType {
  DISPATCH_TASK = 'dispatch_task',
  ONLINE_REMINDER = 'online_reminder'
}

export const OperationTypeMap: Record<string, string> = {
  [OperationType.DISPATCH_TASK]: '发布调度任务',
  [OperationType.ONLINE_REMINDER]: '推送上线提醒'
}

export enum TimeRange {
  HOURS_24 = '24h',
  DAYS_7 = '7d',
  DAYS_30 = '30d'
}

export const TimeRangeMap: Record<string, string> = {
  [TimeRange.HOURS_24]: '近24小时',
  [TimeRange.DAYS_7]: '近7天',
  [TimeRange.DAYS_30]: '近30天'
}

export enum ReportType {
  COMPREHENSIVE = 'comprehensive',
  SHORTAGE = 'shortage',
  SURPLUS = 'surplus',
  TREND = 'trend'
}

export const ReportTypeMap: Record<string, string> = {
  [ReportType.COMPREHENSIVE]: '综合分析报告',
  [ReportType.SHORTAGE]: '运力缺口报告',
  [ReportType.SURPLUS]: '运力冗余报告',
  [ReportType.TREND]: '趋势分析报告'
}

export const CITY_OPTIONS = [
  '北京市',
  '上海市',
  '广州市',
  '深圳市',
  '杭州市',
  '成都市',
  '武汉市',
  '西安市'
]

export const BUSINESS_DISTRICTS: Record<string, string[]> = {
  '北京市': ['朝阳区望京', '海淀区中关村', '东城区王府井', '西城区金融街', '丰台区丽泽'],
  '上海市': ['浦东新区陆家嘴', '静安区南京西路', '徐汇区衡山路', '黄浦区外滩', '长宁区古北'],
  '广州市': ['天河区珠江新城', '越秀区北京路', '海珠区客村', '白云区新市', '番禺区万博'],
  '深圳市': ['南山区科技园', '福田区华强北', '罗湖区东门', '宝安区西乡', '龙岗区坂田'],
  '杭州市': ['西湖区文三路', '滨江区网商路', '上城区庆春路', '拱墅区万达广场', '余杭区未来科技城'],
  '成都市': ['锦江区春熙路', '高新区天府大道', '武侯区桐梓林', '青羊区宽窄巷子', '成华区建设路'],
  '武汉市': ['江汉区江汉路', '洪山区光谷', '武昌区中南路', '江岸区永清', '汉阳区王家湾'],
  '西安市': ['雁塔区高新路', '碑林区南大街', '未央区凤城五路', '莲湖区西大街', '新城区解放路']
}

export const TIME_PERIODS = [
  '早高峰(7:00-9:00)',
  '日间(9:00-17:00)',
  '晚高峰(17:00-19:00)',
  '夜间(19:00-23:00)',
  '凌晨(23:00-7:00)'
]

export enum DispatchType {
  MANUAL = 'manual',
  AUTO = 'auto',
  EMERGENCY = 'emergency'
}

export const DispatchTypeMap: Record<string, string> = {
  [DispatchType.MANUAL]: '手动调度',
  [DispatchType.AUTO]: '自动调度',
  [DispatchType.EMERGENCY]: '紧急调度'
}

export enum OrderPriority {
  URGENT = 'urgent',
  NORMAL = 'normal',
  LOW = 'low'
}

export const OrderPriorityMap: Record<string, string> = {
  [OrderPriority.URGENT]: '紧急',
  [OrderPriority.NORMAL]: '普通',
  [OrderPriority.LOW]: '低优先级'
}

export const OrderPriorityColorMap: Record<string, string> = {
  [OrderPriority.URGENT]: '#f56c6c',
  [OrderPriority.NORMAL]: '#409eff',
  [OrderPriority.LOW]: '#909399'
}

export enum OrderHeatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXTREME = 'extreme'
}

export const OrderHeatMap: Record<string, string> = {
  [OrderHeatLevel.LOW]: '低热',
  [OrderHeatLevel.MEDIUM]: '中热',
  [OrderHeatLevel.HIGH]: '高热',
  [OrderHeatLevel.EXTREME]: '极高热'
}

export enum TrafficLevel {
  SMOOTH = 'smooth',
  SLOW = 'slow',
  CONGESTED = 'congested',
  BLOCKED = 'blocked'
}

export const TrafficLevelMap: Record<string, string> = {
  [TrafficLevel.SMOOTH]: '畅通',
  [TrafficLevel.SLOW]: '缓行',
  [TrafficLevel.CONGESTED]: '拥堵',
  [TrafficLevel.BLOCKED]: '严重拥堵'
}

export enum BatchOperationType {
  DISPATCH_TO_GAP = 'dispatch_to_gap',
  ADJUST_WEIGHT = 'adjust_weight',
  CANCEL_INVALID = 'cancel_invalid'
}

export const BatchOperationTypeMap: Record<string, string> = {
  [BatchOperationType.DISPATCH_TO_GAP]: '批量调度至缺口区域',
  [BatchOperationType.ADJUST_WEIGHT]: '批量调整调度权重',
  [BatchOperationType.CANCEL_INVALID]: '批量取消无效任务'
}

export enum DispatchResult {
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  INTERCEPTED = 'intercepted'
}

export const DispatchResultMap: Record<string, string> = {
  [DispatchResult.SUCCESS]: '调度成功',
  [DispatchResult.FAILED]: '调度失败',
  [DispatchResult.CANCELLED]: '已取消',
  [DispatchResult.INTERCEPTED]: '已拦截'
}

export const PRIORITY_WEIGHTS = {
  urgent: { urgency: 0.4, distance: 0.2, serviceScore: 0.2, load: 0.2 },
  normal: { urgency: 0.2, distance: 0.3, serviceScore: 0.3, load: 0.2 },
  low: { urgency: 0.1, distance: 0.3, serviceScore: 0.3, load: 0.3 }
}

export const DISPATCH_PARAM_LIMITS = {
  maxDispatchRadius: { min: 1, max: 50, unit: 'km' },
  maxDispatchCount: { min: 1, max: 500, unit: '人' },
  dispatchTimeout: { min: 30, max: 600, unit: '秒' }
}

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

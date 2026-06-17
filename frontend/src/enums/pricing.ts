export enum RuleType {
  BASE = 1,
  TIME_SURGE = 2,
  WEATHER_SURGE = 3,
  HOLIDAY_SURGE = 4,
  CITY_STANDARD = 5
}

export const RuleTypeMap: Record<number, string> = {
  [RuleType.BASE]: '基础计费',
  [RuleType.TIME_SURGE]: '时段溢价',
  [RuleType.WEATHER_SURGE]: '天气溢价',
  [RuleType.HOLIDAY_SURGE]: '节假日溢价',
  [RuleType.CITY_STANDARD]: '城市标准'
}

export const RuleTypeColorMap: Record<number, string> = {
  [RuleType.BASE]: '#409eff',
  [RuleType.TIME_SURGE]: '#e6a23c',
  [RuleType.WEATHER_SURGE]: '#67c23a',
  [RuleType.HOLIDAY_SURGE]: '#f56c6c',
  [RuleType.CITY_STANDARD]: '#909399'
}

export enum TimePeriod {
  DAYTIME = 'daytime',
  NIGHTTIME = 'nighttime',
  PEAK = 'peak'
}

export const TimePeriodMap: Record<string, string> = {
  [TimePeriod.DAYTIME]: '日间(06:00-22:00)',
  [TimePeriod.NIGHTTIME]: '夜间(22:00-06:00)',
  [TimePeriod.PEAK]: '高峰(07:00-09:00,17:00-19:00)'
}

export enum WeatherCondition {
  NORMAL = 'normal',
  RAIN = 'rain',
  SNOW = 'snow',
  FOG = 'fog',
  HOT = 'hot'
}

export const WeatherConditionMap: Record<string, string> = {
  [WeatherCondition.NORMAL]: '常规',
  [WeatherCondition.RAIN]: '雨天',
  [WeatherCondition.SNOW]: '雪天',
  [WeatherCondition.FOG]: '雾天',
  [WeatherCondition.HOT]: '高温'
}

export enum HolidayType {
  WORKDAY = 'workday',
  WEEKEND = 'weekend',
  HOLIDAY = 'holiday'
}

export const HolidayTypeMap: Record<string, string> = {
  [HolidayType.WORKDAY]: '工作日',
  [HolidayType.WEEKEND]: '周末',
  [HolidayType.HOLIDAY]: '法定节假日'
}

export const PricingChangeTypeMap: Record<string, string> = {
  create: '创建规则',
  update: '更新规则',
  delete: '删除规则',
  apply: '应用计费',
  cancel: '取消计费',
  recalculate: '重新核算',
  batch_adjust: '批量调整'
}

export const PricingChangeTypeColorMap: Record<string, string> = {
  create: '#67c23a',
  update: '#e6a23c',
  delete: '#f56c6c',
  apply: '#409eff',
  cancel: '#909399',
  recalculate: '#9b59b6',
  batch_adjust: '#13ce66'
}

export const ResponsibilityMap: Record<string, string> = {
  passenger: '乘客责任',
  driver: '司机责任',
  platform: '平台责任'
}

export const ResponsibilityColorMap: Record<string, string> = {
  passenger: '#e6a23c',
  driver: '#f56c6c',
  platform: '#909399'
}

export const INDUSTRY_PRICE_THRESHOLD = 500
export const SURGE_RATIO_LIMIT = 3.0
export const MIN_PRICE = 5
export const MAX_PRICE = 1000

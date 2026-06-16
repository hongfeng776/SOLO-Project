export enum CapacityType {
  EXPRESS = 1,
  PREMIUM = 2,
  LUXURY = 3,
  CARPOOL = 4,
  TAXI = 5
}

export const CapacityTypeMap: Record<number, string> = {
  [CapacityType.EXPRESS]: '快车',
  [CapacityType.PREMIUM]: '专车',
  [CapacityType.LUXURY]: '豪华车',
  [CapacityType.CARPOOL]: '拼车',
  [CapacityType.TAXI]: '出租车'
}

export const CapacityTypeColorMap: Record<number, string> = {
  [CapacityType.EXPRESS]: '#409eff',
  [CapacityType.PREMIUM]: '#67c23a',
  [CapacityType.LUXURY]: '#e6a23c',
  [CapacityType.CARPOOL]: '#909399',
  [CapacityType.TAXI]: '#f56c6c'
}

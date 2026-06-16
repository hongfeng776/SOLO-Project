export enum CouponType {
  FULL_REDUCTION = 1,
  DISCOUNT = 2,
  FIXED_AMOUNT = 3
}

export const CouponTypeMap: Record<number, string> = {
  [CouponType.FULL_REDUCTION]: '满减',
  [CouponType.DISCOUNT]: '折扣',
  [CouponType.FIXED_AMOUNT]: '立减'
}

export enum CampaignType {
  NEW_USER = 1,
  HOLIDAY = 2,
  PEAK_SUBSIDY = 3,
  VIP_EXCLUSIVE = 4
}

export const CampaignTypeMap: Record<number, string> = {
  [CampaignType.NEW_USER]: '新用户',
  [CampaignType.HOLIDAY]: '节日',
  [CampaignType.PEAK_SUBSIDY]: '高峰补贴',
  [CampaignType.VIP_EXCLUSIVE]: '会员专享'
}

export enum CampaignStatus {
  DRAFT = 0,
  RUNNING = 1,
  FINISHED = 2,
  PAUSED = 3
}

export const CampaignStatusMap: Record<number, string> = {
  [CampaignStatus.DRAFT]: '草稿',
  [CampaignStatus.RUNNING]: '进行中',
  [CampaignStatus.FINISHED]: '已结束',
  [CampaignStatus.PAUSED]: '已暂停'
}

export const CampaignStatusColorMap: Record<number, string> = {
  [CampaignStatus.DRAFT]: '#909399',
  [CampaignStatus.RUNNING]: '#67c23a',
  [CampaignStatus.FINISHED]: '#409eff',
  [CampaignStatus.PAUSED]: '#e6a23c'
}

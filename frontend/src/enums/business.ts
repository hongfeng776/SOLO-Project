export enum NoteStatus {
  DRAFT = 0,
  PENDING_REVIEW = 1,
  PUBLISHED = 2,
  REJECTED = 3,
  OFF_SHELF = 4
}

export enum ReviewLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3
}

export enum TagType {
  CONTENT = 'content',
  PRODUCT = 'product',
  ACTIVITY = 'activity'
}

export enum MerchantQualificationStatus {
  PENDING_SUBMIT = 0,
  UNDER_REVIEW = 1,
  APPROVED = 2,
  REJECTED = 3
}

export enum OrderType {
  PROMOTION = 'promotion',
  DELIVERY = 'delivery',
  CUSTOM = 'custom'
}

export enum OrderStatus {
  PENDING_PAYMENT = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  REFUNDED = 4
}

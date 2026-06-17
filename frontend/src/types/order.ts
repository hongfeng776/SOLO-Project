export interface Order {
  id: number
  orderNo: string
  passengerId: number
  passengerName: string
  passengerPhone: string
  driverId: number | null
  driverName: string | null
  driverPhone: string | null
  vehicleId: number | null
  vehiclePlate: string | null
  capacityType: number
  startAddress: string
  startLng: number
  startLat: number
  endAddress: string
  endLng: number
  endLat: number
  distance: number
  duration: number
  estimatedPrice: number
  actualPrice: number | null
  status: number
  payStatus?: number
  orderSource?: number
  createTime: string
  acceptTime: string | null
  pickupTime: string | null
  completeTime: string | null
  cancelTime: string | null
  cancelReason: string | null
  availableActions?: string[]
}

export interface OrderQueryParams {
  page?: number
  pageSize?: number
  orderNo?: string
  status?: number | number[] | string
  passengerName?: string
  driverName?: string
  startTime?: string
  endTime?: string
  capacityType?: number
  payStatus?: number
  orderSource?: number
  serviceType?: number
}

export interface EditConditionResult {
  canEdit: boolean
  reasons: string[]
  hasSettled: boolean
  hasTicket: boolean
  hasArrears: boolean
  order: Order
}

export interface PriceValidateResult {
  calculatedPrice: number
  deviation: number
  threshold: number
  isValid: boolean
  suggestions: string[]
}

export interface StatusLogItem {
  id: number
  orderId: number
  orderNo: string
  oldStatus: number | null
  newStatus: number
  operatorId: number | null
  operatorName: string | null
  operatorType: number
  changeReason: string | null
  remark: string | null
  traceId: string | null
  createTime: string
}

export interface DataIntegrity {
  score: number
  totalModules: number
  completeCount: number
  missingCount: number
  missing: string[]
  complete: string[]
}

export interface OrderTraceData {
  order: Order
  driver: any | null
  passenger: any | null
  vehicle: any | null
  tickets: any[]
  statements: any[]
  riskRecords: any[]
  statusLogs: StatusLogItem[]
  coupons: any[]
  isRepeated: boolean
  repeatCount: number
  integrity: DataIntegrity
}

export interface BatchOpResult {
  success: number
  failed: number
  total: number
  failedOrders: Array<{ id: number; orderNo?: string; reason: string }>
  progress: number
}

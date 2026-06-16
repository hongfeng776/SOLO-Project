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
  createTime: string
  acceptTime: string | null
  pickupTime: string | null
  completeTime: string | null
  cancelTime: string | null
  cancelReason: string | null
}

export interface OrderQueryParams {
  page?: number
  pageSize?: number
  orderNo?: string
  status?: number
  passengerName?: string
  driverName?: string
  startTime?: string
  endTime?: string
  capacityType?: number
}

export interface Ticket {
  id: number; ticketNo: string; orderId: number; orderNo: string;
  passengerId: number; passengerName: string; passengerPhone: string;
  driverId: number | null; driverName: string | null;
  type: number; priority: number; status: number; category: string;
  content: string; handleResult: string | null; handlerId: number | null;
  handlerName: string | null; handleTime: string | null; remark: string | null;
  createTime: string; updateTime: string
}

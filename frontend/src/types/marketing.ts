export interface Coupon {
  id: number; name: string; code: string; type: number; discount: number;
  minAmount: number; totalCount: number; usedCount: number; perLimit: number;
  startTime: string; endTime: string; status: number; description: string;
  createTime: string; updateTime: string
}
export interface MarketingCampaign {
  id: number; name: string; code: string; type: number; couponId: number | null;
  subsidyAmount: number; budget: number; usedBudget: number;
  startTime: string; endTime: string; targetUser: number; rules: any;
  status: number; participantCount: number; orderCount: number;
  description: string; createTime: string; updateTime: string
}

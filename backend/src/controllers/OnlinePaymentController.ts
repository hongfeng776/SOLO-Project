import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { OnlinePaymentService } from '../services';
import {
  OnlinePaymentPreCheckRequest,
  OnlinePaymentQueryParams,
  CreateOnlinePaymentRequest,
  OnlinePaymentBatchProcessRequest,
  OnlinePaymentTraceRequest
} from '../types';

export class OnlinePaymentController {
  private onlinePaymentService: OnlinePaymentService;

  constructor() {
    this.onlinePaymentService = new OnlinePaymentService();
  }

  async config(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.onlinePaymentService.getOnlinePaymentConfig();
      sendSuccess(res, result, '获取线上支付配置成功');
    } catch (error) {
      next(error);
    }
  }

  async preCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OnlinePaymentPreCheckRequest = req.body;
      const result = await this.onlinePaymentService.preCheckOnlinePayment(request, req.userId);
      sendSuccess(res, result, '支付前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: OnlinePaymentQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 15,
        keyword: req.query.keyword as string,
        payment_no: req.query.payment_no as string,
        payer_account_no: req.query.payer_account_no as string,
        merchant_no: req.query.merchant_no as string,
        merchant_name: req.query.merchant_name as string,
        channel_type: req.query.channel_type ? Number(req.query.channel_type) as any : undefined,
        pay_scene: req.query.pay_scene ? Number(req.query.pay_scene) as any : undefined,
        status: req.query.status ? Number(req.query.status) as any : undefined,
        risk_level: req.query.risk_level ? Number(req.query.risk_level) as any : undefined,
        device_id: req.query.device_id as string,
        ip_address: req.query.ip_address as string,
        abnormal_flag: req.query.abnormal_flag ? req.query.abnormal_flag === 'true' : undefined,
        org_id: req.query.org_id as string,
        operator_id: req.query.operator_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined
      };
      const result = await this.onlinePaymentService.getOnlinePaymentList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取支付订单列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.onlinePaymentService.getOnlinePaymentById(req.params.id);
      sendSuccess(res, result, '获取订单详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateOnlinePaymentRequest = req.body;
      const result = await this.onlinePaymentService.createOnlinePayment(request, req.userId!, req.user?.org_id);
      sendSuccess(res, result, '创建支付成功');
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const confirmData = req.body;
      const result = await this.onlinePaymentService.confirmPayment(req.params.id, confirmData);
      sendSuccess(res, result, '确认支付成功');
    } catch (error) {
      next(error);
    }
  }

  async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refundData = req.body;
      const result = await this.onlinePaymentService.refundPayment(req.params.id, refundData);
      sendSuccess(res, result, '退款成功');
    } catch (error) {
      next(error);
    }
  }

  async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const closeReason = req.body?.close_reason || '';
      const result = await this.onlinePaymentService.closePayment(req.params.id, closeReason);
      sendSuccess(res, result, '关闭订单成功');
    } catch (error) {
      next(error);
    }
  }

  async batch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OnlinePaymentBatchProcessRequest = req.body;
      const userRoles = (req.user?.roles || []).map((r: any) => r.code || r);
      const result = await this.onlinePaymentService.batchProcessPayment(request, req.userId!, userRoles);
      sendSuccess(res, result, `批量处理完成：成功${result.success_count}条，失败${result.fail_count}条`);
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OnlinePaymentTraceRequest = req.body;
      const result = await this.onlinePaymentService.traceOnlinePayment(request);
      sendSuccess(res, result, '支付溯源查询完成');
    } catch (error) {
      next(error);
    }
  }

  async merchantDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.onlinePaymentService.getMerchantDetail(req.params.no);
      sendSuccess(res, result, '获取商户信息成功');
    } catch (error) {
      next(error);
    }
  }

  async deviceList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 15,
        keyword: req.query.keyword as string,
        payer_account_no: req.query.payer_account_no as string,
        device_type: req.query.device_type ? Number(req.query.device_type) as any : undefined,
        is_trusted: req.query.is_trusted ? req.query.is_trusted === 'true' : undefined
      };
      const result = await this.onlinePaymentService.getDeviceList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取设备绑定列表成功');
    } catch (error) {
      next(error);
    }
  }
}

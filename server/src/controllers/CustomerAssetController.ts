import { Request, Response, NextFunction } from 'express';
import customerAssetService from '@services/CustomerAssetService';
import { success, paginated } from '@utils/response';

export async function getCustomerList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const riskLevel = req.query.riskLevel as string | undefined;
    const customerType = req.query.customerType as string | undefined;
    const status = req.query.status as string | undefined;
    const archiveStatus = req.query.archiveStatus as string | undefined;
    const filingStatus = req.query.filingStatus as string | undefined;
    const accountStatus = req.query.accountStatus as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const result = await customerAssetService.getCustomerList({
      page,
      pageSize,
      riskLevel,
      customerType,
      status,
      archiveStatus,
      filingStatus,
      accountStatus,
      keyword,
    });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await customerAssetService.getCustomerById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getCustomerAuditTrail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await customerAssetService.getAuditTrail(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const result = await customerAssetService.createCustomer(req.body, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const result = await customerAssetService.updateCustomer(id, req.body, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function convertToFormal(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const result = await customerAssetService.convertToFormal(id, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    await customerAssetService.deleteCustomer(id, user);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}

export async function batchFreeze(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const user = (req as any).user;
    await customerAssetService.batchFreeze(ids, user);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}

export async function batchImport(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { dataList } = req.body;
    const result = await customerAssetService.batchImport(dataList, user);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function validateCustomerData(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, forFormalArchive } = req.body;
    const result = customerAssetService.validateCustomerData(data, forFormalArchive);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkPreconditions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = customerAssetService.checkPreconditions(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getCustomerSimpleList(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const result = await customerAssetService.getCustomerList({
      page: 1,
      pageSize: 1000,
      status: status || 'normal',
    });
    res.json(success(result.list));
  } catch (err) {
    next(err);
  }
}

export async function exportList(req: Request, res: Response, next: NextFunction) {
  try {
    const riskLevel = req.query.riskLevel as string | undefined;
    const customerType = req.query.customerType as string | undefined;
    const status = req.query.status as string | undefined;
    const archiveStatus = req.query.archiveStatus as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const result = await customerAssetService.getCustomerList({
      page: 1,
      pageSize: 10000,
      riskLevel,
      customerType,
      status,
      archiveStatus,
      keyword,
    });
    res.json(success(result.list));
  } catch (err) {
    next(err);
  }
}

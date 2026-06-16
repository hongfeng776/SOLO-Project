import { Request, Response, NextFunction } from 'express';
import assetProductService from '@services/AssetProductService';
import { success, paginated } from '@utils/response';

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await assetProductService.getProductById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getProductList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const productType = req.query.productType as string | undefined;
    const riskLevel = req.query.riskLevel as string | undefined;
    const productStatus = req.query.productStatus as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const result = await assetProductService.getProductList({ page, pageSize, productType, riskLevel, productStatus, keyword });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getProductByCode(req: Request, res: Response, next: NextFunction) {
  try {
    const productCode = req.params.productCode;
    const result = await assetProductService.getProductByCode(productCode);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assetProductService.createProduct(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await assetProductService.updateProduct(id, req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await assetProductService.deleteProduct(id);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}

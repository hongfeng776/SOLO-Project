import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { OrganizationService } from '../services';
import { OrganizationQueryParams, CreateOrganizationRequest, UpdateOrganizationRequest } from '../types';

const organizationService = new OrganizationService();

function flattenTree(nodes: any[]): any[] {
  return nodes.flatMap(node => [node, ...flattenTree(node.children || [])]);
}

export class OrganizationController {
  async tree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keyword = req.query.keyword as string | undefined;
      const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
      const tree = await organizationService.getOrganizationTree(keyword, status as any);
      sendSuccess(res, tree, '获取机构树成功');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: OrganizationQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined,
        org_type: req.query.org_type !== undefined ? Number(req.query.org_type) : undefined
      };
      const result = await organizationService.getOrganizationList(params);
      sendSuccessPage(res, result, '获取机构列表成功');
    } catch (error) {
      next(error);
    }
  }

  async options(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await organizationService.getAllOrganizations();
      const allOrgs = flattenTree(tree);
      const options = allOrgs
        .filter(o => o.status === 1)
        .map(o => ({ label: o.name, value: o.id, code: o.code }));
      sendSuccess(res, options, '获取机构选项成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organizationService.getOrganizationById(req.params.id);
      sendSuccess(res, org, '获取机构详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organizationService.createOrganization(req.body as CreateOrganizationRequest);
      sendSuccess(res, org, '创建机构成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organizationService.updateOrganization(req.params.id, req.body as UpdateOrganizationRequest);
      sendSuccess(res, org, '更新机构成功');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await organizationService.deleteOrganization(req.params.id);
      sendSuccess(res, null, '删除机构成功');
    } catch (error) {
      next(error);
    }
  }
}

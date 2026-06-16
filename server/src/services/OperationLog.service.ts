import { operationLogDao } from '../dao';
import { PaginationResult } from '../types';

interface OperationLogQueryParams {
  page: number;
  pageSize: number;
  userId?: string;
  module?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
}

class OperationLogService {
  public async findAll(params: OperationLogQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await operationLogDao.findAllPaged(params);
    return { list: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
  }
}

export default new OperationLogService();

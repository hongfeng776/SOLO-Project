import { get, post } from '@utils/request'
import service from '@utils/request'
import type {
  IApiResponse,
  IPaginatedData,
  IHistoryRecord,
  IPeriodSegment,
  IReplaySession,
  IReplaySessionDetail,
  IReplayConclusion,
  IVolatilityPattern,
  IDataCompleteness,
  ISectorComparison,
  IStockReplayQueryParams,
  IReplayExportParams,
} from '@/types/api'

export function validateTimeRange(startDate: string, endDate: string): Promise<IApiResponse<{ valid: boolean; message?: string }>> {
  return post('/api/replay/validate-time', { startDate, endDate })
}

export function validateStockCode(code: string): Promise<IApiResponse<{ valid: boolean; message?: string }>> {
  return post('/api/replay/validate-code', { code })
}

export function getReplaySessions(params: { page: number; pageSize: number; sector?: string; status?: string }): Promise<IApiResponse<IPaginatedData<IReplaySession>>> {
  return get('/api/replay/sessions', params)
}

export function getReplaySessionById(id: number): Promise<IApiResponse<IReplaySessionDetail>> {
  return get(`/api/replay/sessions/${id}`)
}

export function createReplaySession(data: Partial<IReplaySession>): Promise<IApiResponse<IReplaySession>> {
  return post('/api/replay/sessions', data)
}

export function generateConclusion(sessionId: number): Promise<IApiResponse<IReplayConclusion[]>> {
  return post(`/api/replay/sessions/${sessionId}/conclusion`, {})
}

export function queryHistoryData(params: IStockReplayQueryParams): Promise<IApiResponse<{ list: IHistoryRecord[]; total: number; periodSegments: IPeriodSegment[] }>> {
  return get('/api/replay/query', params as unknown as Record<string, unknown>)
}

export function getVolatilityPattern(stockCode: string, startDate: string, endDate: string): Promise<IApiResponse<IVolatilityPattern>> {
  return get(`/api/replay/volatility/${stockCode}`, { startDate, endDate })
}

export function checkDataCompleteness(stockCode: string, startDate: string, endDate: string): Promise<IApiResponse<IDataCompleteness>> {
  return get(`/api/replay/completeness/${stockCode}`, { startDate, endDate })
}

export function getSectorComparison(sector: string, startDate: string, endDate: string): Promise<IApiResponse<ISectorComparison[]>> {
  return get('/api/replay/sector-comparison', { sector, startDate, endDate })
}

export function exportReplayData(params: IReplayExportParams): Promise<Blob> {
  return service.post('/api/replay/export', params, { responseType: 'blob' }) as unknown as Promise<Blob>
}

import { IApiResponse, IPaginatedResponse, IPaginatedData } from '@typings/index';

export function success<T>(data: T, message = 'Success'): IApiResponse<T> {
  return {
    code: 200,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function paginated<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
  message = 'Success',
): IPaginatedResponse<T> {
  const paginatedData: IPaginatedData<T> = {
    list,
    total,
    page,
    pageSize,
  };

  return {
    code: 200,
    message,
    data: paginatedData,
    timestamp: new Date().toISOString(),
  };
}

export function fail(code: number, message: string): IApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

export function error(code: number, message: string, _data: unknown = null): IApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

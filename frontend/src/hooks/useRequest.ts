import { ref, shallowRef, computed } from 'vue';
import { sleep } from '@/utils/common';

interface UseRequestOptions<T = any, P extends any[] = any[]> {
  manual?: boolean;
  defaultParams?: P;
  defaultLoading?: boolean;
  pollingInterval?: number;
  debounceInterval?: number;
  throttleInterval?: number;
  loadingDelay?: number;
  ready?: boolean;
  refreshDeps?: any[];
  onSuccess?: (data: T, params: P) => void;
  onError?: (err: Error, params: P) => void;
  onFinally?: () => void;
  mockData?: () => Promise<T> | T;
  useMock?: boolean;
}

interface UseRequestResult<T = any, P extends any[] = any[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  run: (...params: P) => Promise<T | null>;
  runAsync: (...params: P) => Promise<T>;
  refresh: () => Promise<T | null>;
  cancel: () => void;
  params: P | [];
}

let timer: ReturnType<typeof setTimeout> | null = null;
const pendingMap = new WeakMap<any, AbortController>();

function useRequest<T = any, P extends any[] = any[]>(
  service: (...args: P) => Promise<T>,
  options: UseRequestOptions<T, P> = {},
): UseRequestResult<T, P> {
  const {
    manual = false,
    defaultParams = [] as unknown as P,
    defaultLoading = false,
    pollingInterval = 0,
    loadingDelay = 0,
    ready = true,
    onSuccess,
    onError,
    onFinally,
    mockData,
    useMock = false,
  } = options;

  const data = shallowRef<T | null>(null);
  const loading = ref(defaultLoading);
  const error = ref<Error | null>(null);
  const params = ref<P | []>(defaultParams);

  let pollingTimer: ReturnType<typeof setInterval> | null = null;
  let loadingTimer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;
  let lastParams: P | null = null;

  const startPolling = (p: P) => {
    if (!pollingInterval) return;
    stopPolling();
    pollingTimer = setInterval(() => {
      if (!cancelled) runAsync(...p).catch(() => {});
    }, pollingInterval);
  };

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };

  const startLoadingDelay = () => {
    if (loadingDelay > 0) {
      loadingTimer = setTimeout(() => (loading.value = true), loadingDelay);
    } else {
      loading.value = true;
    }
  };

  const clearLoadingDelay = () => {
    if (loadingTimer) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
    }
  };

  const runAsync = async (...p: P): Promise<T> => {
    if (!ready) throw new Error('Not ready');
    cancelled = false;
    lastParams = p;
    params.value = p;
    error.value = null;
    startLoadingDelay();

    try {
      const result = useMock && mockData
        ? await mockData()
        : await service(...p);
      if (cancelled) throw new Error('Cancelled');
      data.value = result;
      onSuccess?.(result, p);
      return result;
    } catch (e) {
      error.value = e as Error;
      onError?.(e as Error, p);
      throw e;
    } finally {
      clearLoadingDelay();
      loading.value = false;
      onFinally?.();
      if (!cancelled && pollingInterval) startPolling(p);
    }
  };

  const run = async (...p: P): Promise<T | null> => {
    try {
      return await runAsync(...p);
    } catch {
      return null;
    }
  };

  const refresh = (): Promise<T | null> => {
    const p = (lastParams || defaultParams) as P;
    return run(...p);
  };

  const cancel = () => {
    cancelled = true;
    clearLoadingDelay();
    loading.value = false;
    stopPolling();
  };

  if (!manual && ready) {
    run(...defaultParams).catch(() => {});
  }

  return {
    data: data.value,
    loading: loading.value,
    error: error.value,
    run,
    runAsync,
    refresh,
    cancel,
    params: params.value,
  };
}

export default useRequest;

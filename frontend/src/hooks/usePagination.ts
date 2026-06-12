import { ref, computed } from 'vue';

interface UsePaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  pageSizes?: number[];
  total?: number;
}

interface UsePaginationResult {
  page: number;
  pageSize: number;
  total: number;
  pageSizes: number[];
  totalPages: number;
  offset: number;
  hasPrev: boolean;
  hasNext: boolean;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setTotal: (t: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  getPaginationParams: () => { page: number; pageSize: number; offset: number };
}

function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
  const { defaultPage = 1, defaultPageSize = 10, pageSizes = [10, 20, 50, 100], total: initialTotal = 0 } = options;

  const page = ref(defaultPage);
  const pageSize = ref(defaultPageSize);
  const total = ref(initialTotal);

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 0);
  const offset = computed(() => (page.value - 1) * pageSize.value);
  const hasPrev = computed(() => page.value > 1);
  const hasNext = computed(() => page.value < totalPages.value);

  const setPage = (p: number) => {
    if (p >= 1 && p <= totalPages.value) page.value = p;
    else if (p >= 1) page.value = p;
  };

  const setPageSize = (s: number) => {
    pageSize.value = s;
    page.value = 1;
  };

  const setTotal = (t: number) => {
    total.value = t;
    if (page.value > totalPages.value && totalPages.value > 0) {
      page.value = totalPages.value;
    }
  };

  const next = () => {
    if (hasNext.value) page.value++;
  };

  const prev = () => {
    if (hasPrev.value) page.value--;
  };

  const reset = () => {
    page.value = 1;
    pageSize.value = defaultPageSize;
  };

  const getPaginationParams = () => ({
    page: page.value,
    pageSize: pageSize.value,
    offset: offset.value,
  });

  return {
    page: page.value,
    pageSize: pageSize.value,
    total: total.value,
    pageSizes,
    totalPages: totalPages.value,
    offset: offset.value,
    hasPrev: hasPrev.value,
    hasNext: hasNext.value,
    setPage,
    setPageSize,
    setTotal,
    next,
    prev,
    reset,
    getPaginationParams,
  };
}

export default usePagination;

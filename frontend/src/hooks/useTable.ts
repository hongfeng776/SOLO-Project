import { ref, reactive, computed } from 'vue';
import type { TableColumn } from '@/types';

interface UseTableOptions<T = any> {
  columns: TableColumn<T>[];
  fetchData: (params: any) => Promise<{ list: T[]; total: number }>;
  defaultParams?: Record<string, any>;
  autoFetch?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
}

interface UseTableResult<T = any> {
  data: T[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  pageSizes: number[];
  columns: TableColumn<T>[];
  searchParams: Record<string, any>;
  selection: T[];
  refresh: () => Promise<void>;
  search: (params?: Record<string, any>) => Promise<void>;
  reset: () => Promise<void>;
  handlePageChange: (p: number, s: number) => Promise<void>;
  handleSelectionChange: (rows: T[]) => void;
  clearSelection: () => void;
  setData: (list: T[], total: number) => void;
  setColumns: (cols: TableColumn<T>[]) => void;
  tableBindProps: any;
}

function useTable<T = any>(options: UseTableOptions<T>): UseTableResult<T> {
  const {
    columns: initialColumns,
    fetchData,
    defaultParams = {},
    autoFetch = true,
    showPagination = true,
    pageSize: defaultPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
  } = options;

  const data = ref<T[]>([]);
  const loading = ref(false);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(defaultPageSize);
  const columns = ref<TableColumn<T>[]>(initialColumns);
  const searchParams = reactive<Record<string, any>>({ ...defaultParams });
  const selection = ref<T[]>([]);

  const fetch = async () => {
    loading.value = true;
    try {
      const params = {
        ...searchParams,
        page: page.value,
        pageSize: pageSize.value,
      };
      const result = await fetchData(params);
      data.value = result.list;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => fetch();

  const search = async (params: Record<string, any> = {}) => {
    Object.assign(searchParams, params);
    page.value = 1;
    await fetch();
  };

  const reset = async () => {
    Object.keys(searchParams).forEach((k) => delete searchParams[k]);
    Object.assign(searchParams, defaultParams);
    page.value = 1;
    pageSize.value = defaultPageSize;
    selection.value = [];
    await fetch();
  };

  const handlePageChange = async (p: number, s: number) => {
    page.value = p;
    pageSize.value = s;
    await fetch();
  };

  const handleSelectionChange = (rows: T[]) => {
    selection.value = rows;
  };

  const clearSelection = () => {
    selection.value = [];
  };

  const setData = (list: T[], t: number) => {
    data.value = list;
    total.value = t;
  };

  const setColumns = (cols: TableColumn<T>[]) => {
    columns.value = cols;
  };

  const tableBindProps = computed(() => ({
    columns: columns.value,
    data: data.value,
    loading: loading.value,
    total: total.value,
    page: page.value,
    pageSize: pageSize.value,
    pageSizes: pageSizeOptions,
    showPagination,
    'onUpdate:page': (v: number) => { page.value = v; },
    'onUpdate:pageSize': (v: number) => { pageSize.value = v; },
  }));

  if (autoFetch) fetch().catch(() => {});

  return {
    data: data.value as T[],
    loading: loading.value,
    total: total.value,
    page: page.value,
    pageSize: pageSize.value,
    pageSizes: pageSizeOptions,
    columns: columns.value,
    searchParams,
    selection: selection.value as T[],
    refresh,
    search,
    reset,
    handlePageChange,
    handleSelectionChange,
    clearSelection,
    setData,
    setColumns,
    tableBindProps: tableBindProps.value as any,
  };
}

export default useTable;

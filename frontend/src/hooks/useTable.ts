import { ref, reactive, onMounted, type Ref } from 'vue'

export interface PageParams {
  page: number
  pageSize: number
}

export interface UseTableOptions<T> {
  apiFn?: (params: Record<string, unknown>) => Promise<{ list: T[]; total: number }>
  immediate?: boolean
  defaultParams?: Record<string, unknown>
}

export interface UseTableReturn<T> {
  loading: Ref<boolean>
  tableData: Ref<T[]>
  total: Ref<number>
  selectedRows: Ref<T[]>
  pageParams: PageParams
  searchForm: Record<string, unknown>
  fetchData: () => Promise<void>
  handleSearch: () => void
  handleReset: () => void
  handlePageChange: () => void
  handleSelectionChange: (val: unknown[]) => void
  handleClearSelection: () => void
}

export function useTable<T extends Record<string, unknown>>(
  options: UseTableOptions<T> = {}
): UseTableReturn<T> {
  const { apiFn, immediate = true, defaultParams = {} } = options

  const loading = ref<boolean>(false)
  const tableData = ref<T[]>([])
  const total = ref<number>(0)
  const selectedRows = ref<T[]>([])

  const searchForm = reactive<Record<string, unknown>>({ ...defaultParams })

  const pageParams = reactive<PageParams>({
    page: 1,
    pageSize: 10
  })

  const initialSearchForm = { ...defaultParams }

  const fetchData = async (): Promise<void> => {
    loading.value = true
    try {
      if (apiFn) {
        const params = {
          ...searchForm,
          page: pageParams.page,
          pageSize: pageParams.pageSize
        }
        const res = await apiFn(params)
        tableData.value = res.list || []
        total.value = res.total || 0
      }
    } finally {
      loading.value = false
    }
  }

  const handleSearch = (): void => {
    pageParams.page = 1
    fetchData()
  }

  const handleReset = (): void => {
    Object.assign(searchForm, initialSearchForm)
    pageParams.page = 1
    fetchData()
  }

  const handlePageChange = (): void => {
    fetchData()
  }

  const handleSelectionChange = (val: unknown[]): void => {
    selectedRows.value = val as T[]
  }

  const handleClearSelection = (): void => {
    selectedRows.value = []
  }

  if (immediate) {
    onMounted(() => {
      fetchData()
    })
  }

  return {
    loading,
    tableData,
    total,
    selectedRows,
    pageParams,
    searchForm,
    fetchData,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSelectionChange,
    handleClearSelection
  }
}

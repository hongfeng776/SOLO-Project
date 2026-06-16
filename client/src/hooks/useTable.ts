import { reactive, ref, type Ref } from 'vue'

interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  pageSizes: number[]
  layout: string
}

interface TableResult<T> {
  data: Ref<T[]>
  loading: Ref<boolean>
  pagination: PaginationConfig
  search: (params?: Record<string, any>) => Promise<void>
  reset: () => Promise<void>
  refresh: () => Promise<void>
  setParams: (params: Record<string, any>) => void
  handleSizeChange: (size: number) => Promise<void>
  handleCurrentChange: (page: number) => Promise<void>
}

export function useTable<T = any>(
  fetchFn: (params: Record<string, any>) => Promise<{ list: T[]; total: number }>,
  defaultParams: Record<string, any> = {}
): TableResult<T> {
  const data = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const searchParams = reactive<Record<string, any>>({ ...defaultParams })

  const pagination = reactive<PaginationConfig>({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizes: [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper'
  })

  const fetchData = async () => {
    loading.value = true
    try {
      const params = {
        ...searchParams,
        page: pagination.page,
        pageSize: pagination.pageSize
      }
      const result = await fetchFn(params)
      data.value = result.list || []
      pagination.total = result.total || 0
    } finally {
      loading.value = false
    }
  }

  const search = async (params?: Record<string, any>) => {
    if (params) {
      Object.assign(searchParams, params)
    }
    pagination.page = 1
    await fetchData()
  }

  const reset = async () => {
    Object.keys(searchParams).forEach((key) => {
      delete searchParams[key]
    })
    Object.assign(searchParams, { ...defaultParams })
    pagination.page = 1
    pagination.pageSize = 10
    await fetchData()
  }

  const refresh = async () => {
    await fetchData()
  }

  const setParams = (params: Record<string, any>) => {
    Object.assign(searchParams, params)
  }

  const handleSizeChange = async (size: number) => {
    pagination.pageSize = size
    pagination.page = 1
    await fetchData()
  }

  const handleCurrentChange = async (page: number) => {
    pagination.page = page
    await fetchData()
  }

  return {
    data,
    loading,
    pagination,
    search,
    reset,
    refresh,
    setParams,
    handleSizeChange,
    handleCurrentChange
  }
}

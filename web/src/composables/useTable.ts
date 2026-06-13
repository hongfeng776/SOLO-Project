import { ref, reactive, onMounted } from 'vue'
import type { PageResult } from '@/types/api'

interface FetchApiResult<T> {
  data: PageResult<T>
}

export function useTable<T = any, Q extends Record<string, any> = Record<string, any>>(
  fetchApi: (params: Q) => Promise<FetchApiResult<T>>,
  initialQuery: Partial<Q> = {} as Partial<Q>
) {
  const list = ref<T[]>([])
  const loading = ref(false)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const selectedIds = ref<number[]>([])

  const queryForm = reactive<Q>({
    pageNum: 1,
    pageSize: 10,
    ...initialQuery
  } as unknown as Q)

  async function fetchList() {
    loading.value = true
    try {
      const params = {
        ...queryForm,
        pageNum: pageNum.value,
        pageSize: pageSize.value
      }
      const res = await fetchApi(params as Q)
      list.value = res.data.records || []
      total.value = res.data.total || 0
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    pageNum.value = 1
    ;(queryForm as any).pageNum = 1
    fetchList()
  }

  function handleReset() {
    Object.keys(queryForm).forEach((key) => {
      if (key !== 'pageNum' && key !== 'pageSize') {
        ;(queryForm as any)[key] = initialQuery[key as keyof Q] ?? undefined
      }
    })
    handleSearch()
  }

  function handleRefresh() {
    fetchList()
  }

  function handlePageChange(pn: number, ps: number) {
    pageNum.value = pn
    pageSize.value = ps
    fetchList()
  }

  function handleSelectionChange(selection: any[]) {
    selectedIds.value = selection.map((item: any) => item.id).filter((id) => id != null)
  }

  onMounted(() => {
    fetchList()
  })

  return {
    list,
    loading,
    pageNum,
    pageSize,
    total,
    queryForm,
    selectedIds,
    fetchList,
    handleSearch,
    handleReset,
    handleRefresh,
    handlePageChange,
    handleSelectionChange
  }
}

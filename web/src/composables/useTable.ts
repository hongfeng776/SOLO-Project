import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { PageParams, PageResult } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { delConfirm, batchDelConfirm } from '@/components/common/BaseConfirm.vue'

interface UseTableOptions<T, Q extends PageParams> {
  fetchApi: (params: Q) => Promise<PageResult<T>>
  deleteApi?: (id: string | number) => Promise<any>
  batchDeleteApi?: (ids: (string | number)[]) => Promise<any>
  immediate?: boolean
}

export function useTable<T = any, Q extends PageParams = PageParams>(
  options: UseTableOptions<T, Q>
) {
  const { fetchApi, deleteApi, batchDeleteApi, immediate = true } = options

  const loading = ref(false)
  const dataList = ref<T[]>([])
  const total = ref(0)
  const selectedIds = ref<(string | number)[]>([])

  const pagination = reactive({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const queryParams = reactive<PageParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  }) as Q

  const hasSelection = computed(() => selectedIds.value.length > 0)

  async function fetchData() {
    loading.value = true
    try {
      const res = await fetchApi({
        ...queryParams,
        page: pagination.page,
        pageSize: pagination.pageSize,
      })
      dataList.value = res.list
      total.value = res.total
    } catch (error) {
      console.error('Fetch data error:', error)
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    pagination.page = 1
    fetchData()
  }

  function handleReset(resetFnOrEvent?: (() => void) | MouseEvent) {
    Object.keys(queryParams).forEach((key) => {
      if (key !== 'page' && key !== 'pageSize') {
        ;(queryParams as any)[key] = undefined
      }
    })
    if (typeof resetFnOrEvent === 'function') {
      resetFnOrEvent()
    }
    handleSearch()
  }

  function handlePageChange(page: number) {
    pagination.page = page
    fetchData()
  }

  function handleSizeChange(size: number) {
    pagination.pageSize = size
    pagination.page = 1
    fetchData()
  }

  async function handleDelete(id: string | number) {
    if (!deleteApi) return
    const confirmed = await delConfirm()
    if (!confirmed) return
    try {
      await deleteApi(id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  async function handleBatchDelete() {
    if (!batchDeleteApi || selectedIds.value.length === 0) return
    const confirmed = await batchDelConfirm(selectedIds.value.length)
    if (!confirmed) return
    try {
      await batchDeleteApi(selectedIds.value)
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      fetchData()
    } catch (error) {
      console.error('Batch delete error:', error)
    }
  }

  function handleSelectionChange(selection: T[], idKey: string = 'id') {
    selectedIds.value = selection.map((item) => (item as any)[idKey])
  }

  function handleRefresh() {
    fetchData()
  }

  function clearSelection() {
    selectedIds.value = []
  }

  if (immediate) {
    fetchData()
  }

  return {
    loading,
    dataList,
    total,
    selectedIds,
    pagination,
    queryParams,
    hasSelection,
    fetchData,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSizeChange,
    handleDelete,
    handleBatchDelete,
    handleSelectionChange,
    handleRefresh,
    clearSelection,
  }
}

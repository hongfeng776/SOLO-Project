import { ref, reactive, onMounted, computed, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { PageResult } from '@/types/api'

interface QueryParams extends Record<string, unknown> {
  page: number
  pageSize: number
}

interface UseFetchListOptions<T, P = Record<string, unknown>> {
  fetchApi: (params: Record<string, unknown>) => Promise<PageResult<T>>
  defaultParams?: Partial<P>
  immediate?: boolean
  onSuccess?: (data: PageResult<T>) => void
  onError?: (error: unknown) => void
}

export function useFetchList<T = unknown, P = Record<string, unknown>>(
  options: UseFetchListOptions<T, P>
) {
  const { fetchApi, defaultParams = {}, immediate = true, onSuccess, onError } = options

  const loading = ref(false)
  const dataList = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)

  const queryParams = reactive<QueryParams>({
    page: 1,
    pageSize: 10,
    ...(defaultParams as Record<string, unknown>)
  })

  const fetchData = async () => {
    loading.value = true
    try {
      const res = await fetchApi(queryParams)
      dataList.value = res.list
      total.value = res.total
      onSuccess?.(res)
    } catch (error) {
      console.error('[useFetchList] error:', error)
      onError?.(error)
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    queryParams.page = 1
    fetchData()
  }

  const handleReset = () => {
    Object.assign(queryParams, { page: 1, pageSize: 10, ...(defaultParams as Record<string, unknown>) })
    fetchData()
  }

  const handleSizeChange = (size: number) => {
    queryParams.pageSize = size
    queryParams.page = 1
    fetchData()
  }

  const handlePageChange = (page: number) => {
    queryParams.page = page
    fetchData()
  }

  const handlePaginate = () => {
    fetchData()
  }

  onMounted(() => {
    if (immediate) {
      fetchData()
    }
  })

  return {
    loading,
    dataList,
    total,
    queryParams,
    fetchData,
    handleSearch,
    handleReset,
    handleSizeChange,
    handlePageChange,
    handlePaginate
  }
}

interface UseCrudOptions<T> {
  createApi?: (data: Partial<T>) => Promise<{ id: number }>
  updateApi?: (id: number, data: Partial<T>) => Promise<{ id: number }>
  deleteApi?: (id: number) => Promise<null>
  fetchDetailApi?: (id: number) => Promise<T>
  successMessages?: {
    create?: string
    update?: string
    delete?: string
  }
  onDeleted?: () => void
  onSaved?: () => void
}

export function useCrud<T extends { id?: number } = Record<string, unknown>>(
  options: UseCrudOptions<T> = {}
) {
  const {
    createApi,
    updateApi,
    deleteApi,
    fetchDetailApi,
    successMessages = {},
    onDeleted,
    onSaved
  } = options

  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const formData = ref<Partial<T>>({}) as Ref<Partial<T>>
  const formLoading = ref(false)
  const isEdit = computed(() => !!formData.value.id)

  const handleAdd = (initData?: Partial<T>) => {
    dialogTitle.value = '新增'
    formData.value = initData || {}
    dialogVisible.value = true
  }

  const handleEdit = async (row: T, initData?: Partial<T>) => {
    dialogTitle.value = '编辑'
    if (fetchDetailApi && row.id) {
      formLoading.value = true
      try {
        const detail = await fetchDetailApi(row.id)
        formData.value = { ...detail, ...initData }
      } finally {
        formLoading.value = false
      }
    } else {
      formData.value = { ...row, ...initData }
    }
    dialogVisible.value = true
  }

  const handleDelete = async (row: T, tip = '确认删除该数据吗？') => {
    if (!row.id || !deleteApi) return
    try {
      await ElMessageBox.confirm(tip, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await deleteApi(row.id)
      ElMessage.success(successMessages.delete || '删除成功')
      onDeleted?.()
    } catch {
      // canceled
    }
  }

  const handleBatchDelete = async (ids: number[], tip = `确认删除选中的 ${ids.length} 条数据吗？`) => {
    if (!ids.length || !deleteApi) return
    try {
      await ElMessageBox.confirm(tip, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await Promise.all(ids.map((id) => deleteApi(id)))
      ElMessage.success(successMessages.delete || '删除成功')
      onDeleted?.()
    } catch {
      // canceled
    }
  }

  const handleSubmit = async (validateFn?: () => Promise<boolean> | boolean) => {
    if (!createApi && !updateApi) {
      ElMessage.warning('未配置保存接口')
      return false
    }
    try {
      if (validateFn) {
        const valid = await validateFn()
        if (!valid) return false
      }
      formLoading.value = true
      if (isEdit.value && updateApi && formData.value.id) {
        await updateApi(formData.value.id, formData.value)
        ElMessage.success(successMessages.update || '更新成功')
      } else if (createApi) {
        await createApi(formData.value)
        ElMessage.success(successMessages.create || '创建成功')
      }
      dialogVisible.value = false
      onSaved?.()
      return true
    } catch (error) {
      console.error('[useCrud] submit error:', error)
      return false
    } finally {
      formLoading.value = false
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
    formData.value = {}
  }

  return {
    dialogVisible,
    dialogTitle,
    formData,
    formLoading,
    isEdit,
    handleAdd,
    handleEdit,
    handleDelete,
    handleBatchDelete,
    handleSubmit,
    handleClose
  }
}

export function useSelection<T = unknown>() {
  const selectedRows = ref<T[]>([]) as Ref<T[]>
  const selectedIds = ref<number[]>([])

  const handleSelectionChange = (rows: T[]) => {
    selectedRows.value = rows
    selectedIds.value = rows.map((row) => (row as { id: number }).id).filter((id) => id != null)
  }

  const clearSelection = () => {
    selectedRows.value = []
    selectedIds.value = []
  }

  const hasSelection = computed(() => selectedRows.value.length > 0)

  return {
    selectedRows,
    selectedIds,
    hasSelection,
    handleSelectionChange,
    clearSelection
  }
}

import { ElMessageBox, ElMessage } from 'element-plus'
import type { ElMessageBoxOptions } from 'element-plus'

export function useConfirm() {
  function confirm(
    message: string,
    title: string = '提示',
    options: ElMessageBoxOptions = {}
  ): Promise<boolean> {
    return new Promise((resolve) => {
      ElMessageBox.confirm(message, title, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        ...options
      })
        .then(() => {
          resolve(true)
        })
        .catch(() => {
          resolve(false)
        })
    })
  }

  function confirmDelete(message: string = '确定要删除此条记录吗？'): Promise<boolean> {
    return confirm(message, '删除确认', {
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
  }

  function success(message: string) {
    ElMessage.success(message)
  }

  function warning(message: string) {
    ElMessage.warning(message)
  }

  function error(message: string) {
    ElMessage.error(message)
  }

  function info(message: string) {
    ElMessage.info(message)
  }

  return {
    confirm,
    confirmDelete,
    success,
    warning,
    error,
    info
  }
}

export default useConfirm

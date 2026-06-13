import { ElMessageBox, type ElMessageBoxOptions } from 'element-plus'

interface ConfirmOptions extends Partial<Omit<ElMessageBoxOptions, 'message' | 'title' | 'type'>> {
  title?: string
  message?: string
  type?: 'warning' | 'success' | 'error' | 'info'
  confirmButtonText?: string
  cancelButtonText?: string
}

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean>
  function confirm(message: string, title?: string, type?: ConfirmOptions['type']): Promise<boolean>
  function confirm(
    optionsOrMessage: ConfirmOptions | string,
    title = '提示',
    type: ConfirmOptions['type'] = 'warning'
  ): Promise<boolean> {
    let options: ConfirmOptions

    if (typeof optionsOrMessage === 'string') {
      options = {
        message: optionsOrMessage,
        title,
        type,
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    } else {
      options = {
        title: '提示',
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        ...optionsOrMessage
      }
    }

    return ElMessageBox.confirm(options.message || '', options.title || '提示', {
      confirmButtonText: options.confirmButtonText,
      cancelButtonText: options.cancelButtonText,
      type: options.type,
      distinguishCancelAndClose: true,
      ...options
    })
      .then(() => true)
      .catch(() => false)
  }

  function confirmDelete(message = '确定要删除这条数据吗？此操作不可恢复！'): Promise<boolean> {
    return confirm({
      message,
      title: '删除确认',
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  }

  function confirmLogout(message = '确定要退出当前登录吗？'): Promise<boolean> {
    return confirm({
      message,
      title: '退出确认',
      type: 'warning',
      confirmButtonText: '确认退出',
      cancelButtonText: '取消'
    })
  }

  return {
    confirm,
    confirmDelete,
    confirmLogout
  }
}

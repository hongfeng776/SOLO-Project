import { ElMessage } from 'element-plus'
import { useClipboard } from './useCommon'

export { useFetchList, useCrud, useSelection } from './useTable'
export { useDateTime, useNumberFormat, formatDate, formatDateTime, fromNow } from './useFormat'
export { useEventListener, useDebounce, useThrottle, useClipboard } from './useCommon'
export { useVirtualList } from './useVirtualList'

export function useCopy() {
  const { copy } = useClipboard()

  const handleCopy = async (text: string, successMsg = '复制成功') => {
    const success = await copy(text)
    if (success) {
      ElMessage.success(successMsg)
    } else {
      ElMessage.error('复制失败')
    }
  }

  return { handleCopy, copy }
}

export function useDownload() {
  const downloadByUrl = (url: string, filename?: string) => {
    const link = document.createElement('a')
    link.href = url
    if (filename) {
      link.download = filename
    }
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadByBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    downloadByUrl(url, filename)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return { downloadByUrl, downloadByBlob }
}

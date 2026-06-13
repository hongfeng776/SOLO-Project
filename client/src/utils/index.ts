import { ElMessage, ElMessageBox, type ElMessageBoxOptions } from 'element-plus';

export function formatDate(date: Date | string | number, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function formatNumber(num: number | string): string {
  if (num === null || num === undefined || num === '') return '';
  const n = Number(num);
  if (isNaN(n)) return String(num);
  return n.toLocaleString('zh-CN');
}

export function formatThousands(num: number | string): string {
  return formatNumber(num);
}

export function confirmDialog(
  message: string,
  title = '提示',
  options?: ElMessageBoxOptions
): Promise<boolean> {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    ...options
  })
    .then(() => true)
    .catch(() => false);
}

export function showSuccess(message = '操作成功') {
  ElMessage.success(message);
}

export function showError(message = '操作失败') {
  ElMessage.error(message);
}

export function showWarning(message = '注意') {
  ElMessage.warning(message);
}

export function showInfo(message = '提示') {
  ElMessage.info(message);
}

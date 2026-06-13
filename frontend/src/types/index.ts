export interface ApiResponse<T = any> {
  code: number;
  data: T | null;
  msg: string;
}

export interface PaginatedData<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  [key: string]: any;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: number;
  fansCount: number;
  visits: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: UserInfo;
}

export interface SystemConfig {
  id: number;
  configKey: string;
  configValue: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type TableRowAction<T = any> = (row: T, index: number) => void;

export interface TableColumn<T = any> {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right' | boolean;
  sortable?: boolean;
  formatter?: (row: T, column: any, value: any, index: number) => string;
  slot?: string;
  ellipsis?: boolean;
}

export interface ModalProps {
  visible: boolean;
  title: string;
  width?: string | number;
  height?: string | number;
  top?: string;
  okText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  showFooter?: boolean;
  closeOnClickModal?: boolean;
  appendToBody?: boolean;
  destroyOnClose?: boolean;
  round?: boolean;
}

export type ModalEmits = {
  (e: 'update:visible', val: boolean): void;
  (e: 'update:confirmLoading', val: boolean): void;
  (e: 'ok'): void;
  (e: 'cancel'): void;
  (e: 'close'): void;
};

export interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  cellHeight?: number;
  headerHeight?: number;
  bordered?: boolean;
  rounded?: boolean;
  animated?: boolean;
  rowWidths?: number[];
}

export interface BaseTableExposed<T = any> {
  clearSelection: () => void;
  toggleRowSelection: (row: T, selected?: boolean) => void;
  toggleAllSelection: () => void;
  setCurrentRow: (row: T | null) => void;
  clearSort: () => void;
  clearFilter: (columnKeys?: string[]) => void;
  doLayout: () => void;
  sort: (prop: string, order: 'ascending' | 'descending' | null) => void;
  selection: T[];
  getSelection: () => T[];
  getColumnWidths: () => Record<string, number>;
  getSortState: () => { prop: string; order: 'ascending' | 'descending' | null };
}

export interface BaseModalExposed {
  open: () => void;
  close: () => void;
  handleOk: () => Promise<void>;
  handleCancel: () => void;
  setConfirmLoading: (val: boolean) => void;
}


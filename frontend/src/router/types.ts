import type { RouteRecordRaw as VueRouteRecordRaw } from 'vue-router'

export interface RouteMeta {
  title?: string
  icon?: string
  roles?: string[]
  hidden?: boolean
  keepAlive?: boolean
  breadcrumb?: boolean
}

export interface RouteRecordRaw extends Omit<VueRouteRecordRaw, 'meta' | 'children'> {
  meta?: RouteMeta
  children?: RouteRecordRaw[]
}

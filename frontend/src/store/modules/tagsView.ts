import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

export interface TagView {
  name: string
  title: string
  path: string
  fullPath: string
  affix?: boolean
  query?: Record<string, unknown>
  params?: Record<string, unknown>
}

interface TagsViewState {
  visitedViews: TagView[]
  cachedViews: string[]
}

export const tagsViewStore = defineStore('tagsView', {
  state: (): TagsViewState => ({
    visitedViews: [],
    cachedViews: []
  }),
  actions: {
    addView(view: RouteLocationNormalized) {
      this.addVisitedView(view)
      this.addCachedView(view)
    },
    addVisitedView(view: RouteLocationNormalized) {
      if (this.visitedViews.some((v) => v.path === view.path)) return
      this.visitedViews.push({
        name: String(view.name || ''),
        title: String(view.meta?.title || 'no-name'),
        path: view.path,
        fullPath: view.fullPath,
        affix: view.meta?.affix as boolean,
        query: view.query as Record<string, unknown>,
        params: view.params as Record<string, unknown>
      })
    },
    addCachedView(view: RouteLocationNormalized) {
      if (this.cachedViews.includes(String(view.name))) return
      if (!view.meta?.noCache) {
        this.cachedViews.push(String(view.name))
      }
    },
    delView(view: RouteLocationNormalized) {
      return new Promise<{ visitedViews: TagView[]; cachedViews: string[] }>((resolve) => {
        this.delVisitedView(view)
        this.delCachedView(view)
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews]
        })
      })
    },
    delVisitedView(view: RouteLocationNormalized) {
      const index = this.visitedViews.findIndex((v) => v.path === view.path)
      if (index > -1) {
        this.visitedViews.splice(index, 1)
      }
    },
    delCachedView(view: RouteLocationNormalized) {
      const index = this.cachedViews.indexOf(String(view.name))
      if (index > -1) {
        this.cachedViews.splice(index, 1)
      }
    },
    delOthersViews(view: RouteLocationNormalized) {
      this.visitedViews = this.visitedViews.filter(
        (v) => v.affix || v.path === view.path
      )
      this.cachedViews = this.cachedViews.filter((v) => v === String(view.name))
    },
    delAllViews() {
      this.visitedViews = this.visitedViews.filter((v) => v.affix)
      this.cachedViews = []
    }
  }
})

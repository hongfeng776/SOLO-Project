import type { App } from 'vue'
import { createPinia, type Pinia } from 'pinia'
import { tagsViewStore, type TagView } from './modules/tagsView'
import { appStore } from './modules/app'

export * from './modules/user'
export * from './modules/permission'
export * from './modules/app'
export * from './modules/tagsView'

let _pinia: Pinia | null = null

const TAGS_VIEW_STORAGE_KEY = 'ccb_tags_view'
const APP_SIZE_STORAGE_KEY = 'ccb_app_size'

export const setupStore = (app?: App): void => {
  if (!_pinia) {
    _pinia = createPinia()
    if (app) {
      app.use(_pinia)
    }
  }

  try {
    const savedTagsView = localStorage.getItem(TAGS_VIEW_STORAGE_KEY)
    if (savedTagsView) {
      const parsed = JSON.parse(savedTagsView) as { visitedViews: TagView[]; cachedViews: string[] }
      const tStore = tagsViewStore()
      if (parsed.visitedViews && Array.isArray(parsed.visitedViews)) {
        tStore.visitedViews = parsed.visitedViews
      }
      if (parsed.cachedViews && Array.isArray(parsed.cachedViews)) {
        tStore.cachedViews = parsed.cachedViews
      }
    }
  } catch (error) {
    console.warn('Failed to restore tagsView from localStorage:', error)
  }

  try {
    const savedAppSize = localStorage.getItem(APP_SIZE_STORAGE_KEY)
    if (savedAppSize && ['large', 'default', 'small'].includes(savedAppSize)) {
      const aStore = appStore()
      aStore.size = savedAppSize as 'large' | 'default' | 'small'
    }
  } catch (error) {
    console.warn('Failed to restore app size from localStorage:', error)
  }
}

export const initStorePersistence = (): void => {
  const tStore = tagsViewStore()
  const aStore = appStore()

  const saveTagsView = () => {
    try {
      localStorage.setItem(
        TAGS_VIEW_STORAGE_KEY,
        JSON.stringify({
          visitedViews: tStore.visitedViews,
          cachedViews: tStore.cachedViews
        })
      )
    } catch (error) {
      console.warn('Failed to save tagsView to localStorage:', error)
    }
  }

  const saveAppSize = () => {
    try {
      localStorage.setItem(APP_SIZE_STORAGE_KEY, aStore.size)
    } catch (error) {
      console.warn('Failed to save app size to localStorage:', error)
    }
  }

  const originalAddView = tStore.addView.bind(tStore)
  tStore.addView = (view) => {
    originalAddView(view)
    saveTagsView()
  }

  const originalDelView = tStore.delView.bind(tStore)
  tStore.delView = async (view) => {
    const result = await originalDelView(view)
    saveTagsView()
    return result
  }

  const originalDelOthersViews = tStore.delOthersViews.bind(tStore)
  tStore.delOthersViews = (view) => {
    originalDelOthersViews(view)
    saveTagsView()
  }

  const originalDelAllViews = tStore.delAllViews.bind(tStore)
  tStore.delAllViews = () => {
    originalDelAllViews()
    saveTagsView()
  }

  const originalSetSize = aStore.setSize.bind(aStore)
  aStore.setSize = (size) => {
    originalSetSize(size)
    saveAppSize()
  }
}

export const useStore = (app?: App): void => {
  setupStore(app)
  initStorePersistence()
}

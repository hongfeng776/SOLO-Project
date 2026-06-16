import type { App, Directive, DirectiveBinding } from 'vue'

const PLACEHOLDER_BASE64 =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+'

const ERROR_IMAGE_BASE64 =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDclIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTg5ODk4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU3JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2JiYiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj5JbWFnZSBsb2FkIGVycm9yPC90ZXh0Pjwvc3ZnPg=='

const observers = new WeakMap<HTMLElement, IntersectionObserver>()
const loadedImages = new Set<string>()

function handleImageLoad(el: HTMLImageElement, src: string) {
  const img = new Image()
  img.onload = () => {
    el.src = src
    el.classList.add('lazy-loaded')
    el.classList.remove('lazy-loading')
    loadedImages.add(src)
  }
  img.onerror = () => {
    el.src = ERROR_IMAGE_BASE64
    el.classList.add('lazy-error')
    el.classList.remove('lazy-loading')
  }
  img.src = src
}

function createObserver(): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLImageElement
          const src = el.dataset.src
          if (src) {
            if (loadedImages.has(src)) {
              el.src = src
              el.classList.add('lazy-loaded')
              el.classList.remove('lazy-loading')
            } else {
              handleImageLoad(el, src)
            }
            const observer = observers.get(el)
            if (observer) {
              observer.unobserve(el)
              observers.delete(el)
            }
          }
        }
      })
    },
    {
      rootMargin: '100px 0px',
      threshold: 0.01
    }
  )
}

let defaultObserver: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (!defaultObserver) {
    defaultObserver = createObserver()
  }
  return defaultObserver
}

function bindLazy(el: HTMLImageElement, binding: DirectiveBinding<string>) {
  const src = binding.value
  if (!src) {
    el.src = ERROR_IMAGE_BASE64
    return
  }

  if (loadedImages.has(src)) {
    el.src = src
    el.classList.add('lazy-loaded')
    return
  }

  el.src = PLACEHOLDER_BASE64
  el.classList.add('lazy-image', 'lazy-loading')
  el.dataset.src = src

  if (typeof IntersectionObserver !== 'undefined') {
    const observer = getObserver()
    observer.observe(el)
    observers.set(el, observer)
  } else {
    handleImageLoad(el, src)
  }
}

function unbindLazy(el: HTMLImageElement) {
  const observer = observers.get(el)
  if (observer) {
    observer.unobserve(el)
    observers.delete(el)
  }
}

const vLazy: Directive<HTMLImageElement, string> = {
  mounted(el, binding) {
    bindLazy(el, binding)
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      unbindLazy(el)
      bindLazy(el, binding)
    }
  },
  beforeUnmount(el) {
    unbindLazy(el)
  }
}

export function setupLazyDirective(app: App): void {
  app.directive('lazy', vLazy)
}

export default vLazy

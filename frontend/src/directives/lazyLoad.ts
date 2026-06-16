import type { App, Directive, DirectiveBinding } from 'vue'

const DEFAULT_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const ERROR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTVlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYmZiZmJmIiBmb250LXNpemU9IjE0Ij7lm77niYc8L3RleHQ+PC9zdmc+'

type LazyElement = HTMLElement & {
  _lazyObserver?: IntersectionObserver
  _lazySrc?: string
}

function createObserver(callback: (el: LazyElement) => void): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as LazyElement
          callback(el)
          el._lazyObserver?.unobserve(el)
          el._lazyObserver = undefined
        }
      })
    },
    { rootMargin: '200px', threshold: 0.01 },
  )
}

const lazyDirective: Directive = {
  mounted(el: LazyElement, binding: DirectiveBinding<string>) {
    el.setAttribute('src', DEFAULT_PLACEHOLDER)

    const src = binding.value
    if (!src) return

    el._lazySrc = src
    el._lazyObserver = createObserver((target) => {
      const img = new Image()
      img.src = target._lazySrc!
      img.onload = () => {
        target.setAttribute('src', target._lazySrc!)
      }
      img.onerror = () => {
        target.setAttribute('src', ERROR_PLACEHOLDER)
      }
    })
    el._lazyObserver.observe(el)
  },
  updated(el: LazyElement, binding: DirectiveBinding<string>) {
    if (binding.value === binding.oldValue) return

    el._lazyObserver?.unobserve(el)

    const src = binding.value
    if (!src) {
      el.setAttribute('src', DEFAULT_PLACEHOLDER)
      return
    }

    el._lazySrc = src
    el._lazyObserver = createObserver((target) => {
      const img = new Image()
      img.src = target._lazySrc!
      img.onload = () => {
        target.setAttribute('src', target._lazySrc!)
      }
      img.onerror = () => {
        target.setAttribute('src', ERROR_PLACEHOLDER)
      }
    })
    el._lazyObserver.observe(el)
  },
  unmounted(el: LazyElement) {
    el._lazyObserver?.unobserve(el)
    el._lazyObserver = undefined
  },
}

const lazyBackgroundDirective: Directive = {
  mounted(el: LazyElement, binding: DirectiveBinding<string>) {
    el.style.backgroundImage = `url(${DEFAULT_PLACEHOLDER})`

    const src = binding.value
    if (!src) return

    el._lazySrc = src
    el._lazyObserver = createObserver((target) => {
      const img = new Image()
      img.src = target._lazySrc!
      img.onload = () => {
        target.style.backgroundImage = `url(${target._lazySrc!})`
      }
      img.onerror = () => {
        target.style.backgroundImage = `url(${ERROR_PLACEHOLDER})`
      }
    })
    el._lazyObserver.observe(el)
  },
  updated(el: LazyElement, binding: DirectiveBinding<string>) {
    if (binding.value === binding.oldValue) return

    el._lazyObserver?.unobserve(el)

    const src = binding.value
    if (!src) {
      el.style.backgroundImage = `url(${DEFAULT_PLACEHOLDER})`
      return
    }

    el._lazySrc = src
    el._lazyObserver = createObserver((target) => {
      const img = new Image()
      img.src = target._lazySrc!
      img.onload = () => {
        target.style.backgroundImage = `url(${target._lazySrc!})`
      }
      img.onerror = () => {
        target.style.backgroundImage = `url(${ERROR_PLACEHOLDER})`
      }
    })
    el._lazyObserver.observe(el)
  },
  unmounted(el: LazyElement) {
    el._lazyObserver?.unobserve(el)
    el._lazyObserver = undefined
  },
}

export function registerLazyLoadDirectives(app: App) {
  app.directive('lazy', lazyDirective)
  app.directive('lazy-background', lazyBackgroundDirective)
}

import type { Directive, DirectiveBinding } from 'vue'

let observer: IntersectionObserver | null = null

export function createLazyObserver(): IntersectionObserver {
  if (observer) return observer

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLImageElement
          const src = el.dataset.lazySrc
          if (src) {
            el.src = src
            el.removeAttribute('data-lazy-src')
            el.addEventListener('load', () => {
              el.dispatchEvent(new Event('loaded'))
            })
            el.addEventListener('error', () => {
              el.dispatchEvent(new Event('error'))
            })
          }
          observer!.unobserve(el)
        }
      })
    },
    {
      rootMargin: '0px 0px 200px 0px',
      threshold: 0
    }
  )

  return observer
}

const lazyLoad: Directive = {
  mounted(el: HTMLImageElement, binding: DirectiveBinding<string>) {
    el.dataset.lazySrc = binding.value
    const obs = createLazyObserver()
    obs.observe(el)
  },
  updated(el: HTMLImageElement, binding: DirectiveBinding<string>) {
    if (binding.value !== binding.oldValue) {
      el.dataset.lazySrc = binding.value
      if (!el.src || el.src === binding.oldValue) {
        const obs = createLazyObserver()
        obs.observe(el)
      }
    }
  },
  unmounted(el: HTMLImageElement) {
    const obs = createLazyObserver()
    obs.unobserve(el)
  }
}

export default lazyLoad

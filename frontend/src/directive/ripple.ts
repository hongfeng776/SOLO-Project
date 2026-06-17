import type { Directive, DirectiveBinding } from 'vue'

interface RippleHTMLElement extends HTMLElement {
  _rippleTrigger?: (e: MouseEvent) => void
}

export const ripple: Directive = {
  mounted(el: RippleHTMLElement, binding: DirectiveBinding) {
    const color = binding.value || 'rgba(255, 255, 255, 0.45)'

    el._rippleTrigger = (e: MouseEvent) => {
      const target = el
      const rect = target.getBoundingClientRect()

      const ripple = document.createElement('span')
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      ripple.style.width = ripple.style.height = size + 'px'
      ripple.style.left = x + 'px'
      ripple.style.top = y + 'px'
      ripple.style.position = 'absolute'
      ripple.style.borderRadius = '50%'
      ripple.style.backgroundColor = color
      ripple.style.transform = 'scale(0)'
      ripple.style.animation = 'ripple-animation 0.6s ease-out forwards'
      ripple.style.pointerEvents = 'none'
      ripple.style.zIndex = '1'

      const computedStyle = window.getComputedStyle(target)
      if (computedStyle.position === 'static') {
        target.style.position = 'relative'
      }
      target.style.overflow = 'hidden'

      target.appendChild(ripple)

      setTimeout(() => {
        ripple.remove()
      }, 650)
    }

    el.addEventListener('click', el._rippleTrigger)
  },
  unmounted(el: RippleHTMLElement) {
    if (el._rippleTrigger) {
      el.removeEventListener('click', el._rippleTrigger)
      delete el._rippleTrigger
    }
  }
}

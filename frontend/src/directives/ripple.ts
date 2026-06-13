import type { Directive } from 'vue'

interface RippleOptions {
  color?: string
  duration?: number
}

function createRipple(el: HTMLElement, event: MouseEvent, options: RippleOptions = {}) {
  const { color = 'rgba(255, 255, 255, 0.45)', duration = 600 } = options

  const rect = el.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const maxRadius = Math.max(rect.width, rect.height) * 2

  const ripple = document.createElement('span')
  ripple.className = 'ripple-effect'
  ripple.style.position = 'absolute'
  ripple.style.borderRadius = '50%'
  ripple.style.backgroundColor = color
  ripple.style.pointerEvents = 'none'
  ripple.style.transform = 'scale(0)'
  ripple.style.animation = `ripple-animation ${duration}ms ease-out`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  ripple.style.width = `${maxRadius}px`
  ripple.style.height = `${maxRadius}px`
  ripple.style.marginLeft = `-${maxRadius / 2}px`
  ripple.style.marginTop = `-${maxRadius / 2}px`

  if (getComputedStyle(el).position === 'static') {
    el.style.position = 'relative'
  }
  el.style.overflow = 'hidden'

  el.appendChild(ripple)

  setTimeout(() => {
    ripple.remove()
  }, duration)
}

const ripple: Directive = {
  mounted(el, binding) {
    let options: RippleOptions = {}

    if (typeof binding.value === 'string') {
      options = { color: binding.value }
    } else if (typeof binding.value === 'object' && binding.value !== null) {
      options = binding.value as RippleOptions
    }

    el.addEventListener('click', (event: MouseEvent) => {
      createRipple(el, event, options)
    })
  }
}

export default ripple

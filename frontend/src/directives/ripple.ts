import type { Directive, DirectiveBinding } from 'vue'

interface RippleOptions {
  color?: string
  duration?: number
}

const defaultOptions: Required<RippleOptions> = {
  color: 'rgba(255, 255, 255, 0.35)',
  duration: 600
}

function createRipple(event: MouseEvent, binding: DirectiveBinding<RippleOptions>) {
  const target = event.currentTarget as HTMLElement
  if (!target) return

  const options: Required<RippleOptions> = {
    color: binding.value?.color ?? defaultOptions.color,
    duration: binding.value?.duration ?? defaultOptions.duration
  }

  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const diameter = Math.max(rect.width, rect.height) * 2
  const radius = diameter / 2

  const ripple = document.createElement('span')
  ripple.style.position = 'absolute'
  ripple.style.width = ripple.style.height = `${diameter}px`
  ripple.style.left = `${x - radius}px`
  ripple.style.top = `${y - radius}px`
  ripple.style.background = options.color
  ripple.style.borderRadius = '50%'
  ripple.style.transform = 'scale(0)'
  ripple.style.opacity = '0.5'
  ripple.style.pointerEvents = 'none'
  ripple.style.willChange = 'transform, opacity'
  ripple.style.transition = `transform ${options.duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${options.duration}ms cubic-bezier(0.4, 0, 0.2, 1)`
  ripple.style.zIndex = '0'

  if ((target as any).style.position === 'static' || !target.style.position) {
    target.style.position = 'relative'
  }
  target.style.overflow = 'hidden'

  target.appendChild(ripple)

  requestAnimationFrame(() => {
    ripple.style.transform = 'scale(1)'
    ripple.style.opacity = '0'
  })

  setTimeout(() => {
    ripple.remove()
  }, options.duration)
}

export const ripple: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<RippleOptions>) {
    el.addEventListener('click', (event: MouseEvent) => createRipple(event, binding))
  }
}

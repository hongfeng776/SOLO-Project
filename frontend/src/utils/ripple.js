const createRipple = (event, el) => {
  const custom = window.getComputedStyle(el)
  const border = parseInt(custom.borderRadius || '0', 10)

  const surface = el
  const rect = surface.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const radius = Math.max(rect.width, rect.height)
  const span = document.createElement('span')
  span.style.position = 'absolute'
  span.style.width = span.style.height = radius * 2 + 'px'
  span.style.left = x - radius + 'px'
  span.style.top = y - radius + 'px'
  span.style.borderRadius = border > 0 ? border + 'px' : '50%'
  span.style.pointerEvents = 'none'
  span.style.transform = 'scale(0)'
  span.style.opacity = '0.35'
  span.style.background = 'currentColor'
  span.style.animation = 'ripple-drop 0.6s ease-out'
  span.style.zIndex = '0'

  if (!el._rippleContainer) {
    const pos = window.getComputedStyle(el).position
    if (pos === 'static') el.style.position = 'relative'
    el.style.overflow = 'hidden'
    el._rippleContainer = true
  }

  el.appendChild(span)
  setTimeout(() => span.remove(), 650)
}

const vRipple = {
  mounted(el) {
    el.addEventListener('click', (e) => createRipple(e, el))
  }
}

export default vRipple

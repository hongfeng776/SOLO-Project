import type { Directive, DirectiveBinding } from 'vue'

function debounceFn(el: HTMLElement, binding: DirectiveBinding) {
  const delay = binding.arg ? Number(binding.arg) : 300
  let timer: ReturnType<typeof setTimeout> | null = null

  const handler = binding.value

  el.addEventListener('click', () => {
    if (timer) return
    if (el.tagName === 'BUTTON') {
      ;(el as HTMLButtonElement).disabled = true
    }
    handler()
    timer = setTimeout(() => {
      timer = null
      if (el.tagName === 'BUTTON') {
        ;(el as HTMLButtonElement).disabled = false
      }
    }, delay)
  })
}

export const debounce: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    debounceFn(el, binding)
  }
}

import type { Directive } from 'vue';

interface RippleElement extends HTMLElement {
  __rippleHandler__?: (e: MouseEvent) => void;
}

interface RippleOptions {
  color?: string;
  duration?: number;
  opacity?: number;
}

export const vRipple: Directive<RippleElement, RippleOptions | string> = {
  mounted(el, binding) {
    const options = typeof binding.value === 'string'
      ? { color: binding.value }
      : (binding.value || {});

    const color = options.color || 'rgba(255, 255, 255, 0.4)';
    const duration = options.duration || 600;
    const baseOpacity = options.opacity ?? 0.4;

    el.style.position = el.style.position || 'relative';
    el.style.overflow = 'hidden';
    el.style.zIndex = el.style.zIndex || '1';

    const handler = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const radius = Math.max(rect.width, rect.height) * 1.4;

      const span = document.createElement('span');
      span.style.position = 'absolute';
      span.style.borderRadius = '50%';
      span.style.pointerEvents = 'none';
      span.style.left = `${x - radius / 2}px`;
      span.style.top = `${y - radius / 2}px`;
      span.style.width = `${radius}px`;
      span.style.height = `${radius}px`;
      span.style.background = color;
      span.style.opacity = `${baseOpacity}`;
      span.style.transform = 'scale(0)';
      span.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
      span.style.zIndex = (Number(el.style.zIndex || '1') - 1).toString();

      el.appendChild(span);

      requestAnimationFrame(() => {
        span.style.transform = 'scale(1)';
        span.style.opacity = '0';
      });

      setTimeout(() => {
        span.remove();
      }, duration);
    };

    el.addEventListener('click', handler);
    el.__rippleHandler__ = handler;
  },

  unmounted(el) {
    if (el.__rippleHandler__) {
      el.removeEventListener('click', el.__rippleHandler__);
      delete el.__rippleHandler__;
    }
  },
};

export default vRipple;

import { ref, watch, onBeforeUnmount, type Ref } from 'vue';
import { debounce } from '@/utils/common';

function useDebounce<T>(value: Ref<T> | (() => T), delay = 300): Ref<T> {
  const debounced = ref<T>(
    typeof value === 'function' ? (value as () => T)() : value.value,
  ) as Ref<T>;

  const update = debounce((val: T) => {
    debounced.value = val;
  }, delay);

  const unwatch = watch(
    () => (typeof value === 'function' ? (value as () => T)() : value.value),
    (newVal) => update(newVal),
    { immediate: true },
  );

  onBeforeUnmount(unwatch);

  return debounced;
}

export default useDebounce;

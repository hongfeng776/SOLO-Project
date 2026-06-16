import { ref, computed, onMounted, onBeforeUnmount, type Ref } from 'vue'

export interface UseVirtualListOptions<T> {
  list: T[] | Ref<T[]>
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  getItemHeight?: (item: T, index: number) => number
}

export interface UseVirtualListReturn<T> {
  visibleItems: Ref<T[]>
  containerProps: {
    ref: Ref<HTMLElement | null>
    onScroll: (e: Event) => void
    style: { overflowY: string; height: string }
  }
  wrapperStyle: Ref<{ height: string; paddingTop: string }>
  startIndex: Ref<number>
  endIndex: Ref<number>
  totalHeight: Ref<number>
}

export function useVirtualList<T>(options: UseVirtualListOptions<T>): UseVirtualListReturn<T> {
  const {
    itemHeight = 50,
    containerHeight = 500,
    overscan = 5,
    getItemHeight
  } = options

  const list = computed<T[]>(() =>
    isRef(options.list) ? options.list.value : options.list
  )

  const containerRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const startIndex = ref(0)
  const endIndex = ref(0)
  const itemHeights = ref<number[]>([])

  const totalHeight = computed(() => {
    if (getItemHeight) {
      return itemHeights.value.reduce((sum, h) => sum + h, 0)
    }
    return list.value.length * itemHeight
  })

  const calculateStartIndex = (scrollTopValue: number): number => {
    if (getItemHeight) {
      let accumulatedHeight = 0
      for (let i = 0; i < list.value.length; i++) {
        const h = itemHeights.value[i] || itemHeight
        if (accumulatedHeight + h > scrollTopValue) {
          return Math.max(0, i - overscan)
        }
        accumulatedHeight += h
      }
      return Math.max(0, list.value.length - 1)
    }
    return Math.max(0, Math.floor(scrollTopValue / itemHeight) - overscan)
  }

  const calculateEndIndex = (startIdx: number, viewportHeight: number): number => {
    if (getItemHeight) {
      let accumulatedHeight = 0
      for (let i = startIdx; i < list.value.length; i++) {
        const h = itemHeights.value[i] || itemHeight
        accumulatedHeight += h
        if (accumulatedHeight > viewportHeight) {
          return Math.min(list.value.length, i + overscan + 1)
        }
      }
      return list.value.length
    }
    const visibleCount = Math.ceil(viewportHeight / itemHeight)
    return Math.min(list.value.length, startIdx + visibleCount + overscan * 2)
  }

  const getOffsetY = (index: number): number => {
    if (getItemHeight) {
      let offset = 0
      for (let i = 0; i < index; i++) {
        offset += itemHeights.value[i] || itemHeight
      }
      return offset
    }
    return index * itemHeight
  }

  const visibleItems = computed(() => {
    return list.value.slice(startIndex.value, endIndex.value)
  })

  const wrapperStyle = computed(() => ({
    height: `${totalHeight.value}px`,
    paddingTop: `${getOffsetY(startIndex.value)}px`
  }))

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement
    scrollTop.value = target.scrollTop
    updateVisibleRange()
  }

  const updateVisibleRange = () => {
    const viewportHeight = containerHeight
    startIndex.value = calculateStartIndex(scrollTop.value)
    endIndex.value = calculateEndIndex(startIndex.value, viewportHeight + scrollTop.value - getOffsetY(startIndex.value))
  }

  const initItemHeights = () => {
    if (getItemHeight) {
      itemHeights.value = list.value.map((item, index) => getItemHeight(item, index))
    }
  }

  const containerProps = {
    ref: containerRef,
    onScroll: handleScroll,
    style: {
      overflowY: 'auto' as const,
      height: `${containerHeight}px`
    }
  }

  onMounted(() => {
    initItemHeights()
    updateVisibleRange()
  })

  onBeforeUnmount(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    visibleItems,
    containerProps,
    wrapperStyle,
    startIndex,
    endIndex,
    totalHeight
  }
}

function isRef<T>(val: unknown): val is Ref<T> {
  return (
    typeof val === 'object' &&
    val !== null &&
    'value' in val &&
    '__v_isRef' in val &&
    (val as { __v_isRef: boolean }).__v_isRef === true
  )
}

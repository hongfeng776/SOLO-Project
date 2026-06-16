<template>
  <div class="pie-chart" ref="chartRef">
    <canvas ref="canvasRef"></canvas>
    <div v-if="tooltip.show" class="chart-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="tooltip-item">
        <span class="tooltip-dot" :style="{ backgroundColor: tooltip.color }"></span>
        <span>{{ tooltip.name }}: {{ tooltip.value }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  width: { type: Number, default: 300 },
  height: { type: Number, default: 300 }
})

const chartRef = ref(null)
const canvasRef = ref(null)
const tooltip = ref({ show: false, x: 0, y: 0, name: '', value: 0, color: '' })

let ctx = null
let chartWidth = 0
let chartHeight = 0
let sliceCache = []
let resizeObserver = null

const initCanvas = () => {
  if (!canvasRef.value || !chartRef.value) return
  const dpr = window.devicePixelRatio || 1
  chartWidth = chartRef.value.clientWidth
  chartHeight = props.height
  canvasRef.value.width = chartWidth * dpr
  canvasRef.value.height = chartHeight * dpr
  canvasRef.value.style.width = chartWidth + 'px'
  canvasRef.value.style.height = chartHeight + 'px'
  ctx = canvasRef.value.getContext('2d')
  ctx.scale(dpr, dpr)
}

const draw = () => {
  if (!ctx || !props.data.length) return
  ctx.clearRect(0, 0, chartWidth, chartHeight)
  const cx = chartWidth / 2
  const cy = chartHeight / 2
  const radius = Math.min(cx, cy) - 20
  const total = props.data.reduce((sum, d) => sum + d.value, 0) || 1
  let startAngle = -Math.PI / 2

  sliceCache = []
  props.data.forEach((item) => {
    const sliceAngle = (item.value / total) * Math.PI * 2
    const endAngle = startAngle + sliceAngle

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = item.color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    const midAngle = startAngle + sliceAngle / 2
    const labelRadius = radius * 0.65
    const lx = cx + Math.cos(midAngle) * labelRadius
    const ly = cy + Math.sin(midAngle) * labelRadius
    const percentage = ((item.value / total) * 100).toFixed(1)
    if (percentage > 5) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${percentage}%`, lx, ly)
    }

    sliceCache.push({
      startAngle,
      endAngle,
      name: item.name,
      value: percentage,
      color: item.color
    })

    startAngle = endAngle
  })
}

const handleMouseMove = (e) => {
  if (!sliceCache.length) return
  const rect = canvasRef.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const cx = chartWidth / 2
  const cy = chartHeight / 2
  const dx = mx - cx
  const dy = my - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const radius = Math.min(cx, cy) - 20

  if (dist > radius) {
    tooltip.value.show = false
    return
  }

  let angle = Math.atan2(dy, dx)
  if (angle < -Math.PI / 2) angle += Math.PI * 2

  for (const slice of sliceCache) {
    if (angle >= slice.startAngle && angle < slice.endAngle) {
      tooltip.value = {
        show: true,
        x: mx + 10,
        y: my - 10,
        name: slice.name,
        value: slice.value,
        color: slice.color
      }
      return
    }
  }
  tooltip.value.show = false
}

const handleMouseLeave = () => {
  tooltip.value.show = false
}

const render = () => {
  nextTick(() => {
    initCanvas()
    draw()
  })
}

watch(() => [props.data, props.width, props.height], render, { deep: true })

onMounted(() => {
  render()
  resizeObserver = new ResizeObserver(() => render())
  if (chartRef.value) resizeObserver.observe(chartRef.value)
  if (canvasRef.value) {
    canvasRef.value.addEventListener('mousemove', handleMouseMove)
    canvasRef.value.addEventListener('mouseleave', handleMouseLeave)
  }
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('mousemove', handleMouseMove)
    canvasRef.value.removeEventListener('mouseleave', handleMouseLeave)
  }
})
</script>

<style lang="scss" scoped>
.pie-chart {
  position: relative;
  width: 100%;
}

.chart-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;

  .tooltip-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tooltip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
}
</style>

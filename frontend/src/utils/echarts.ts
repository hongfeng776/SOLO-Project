import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components'
import type { EChartsOption, EChartsType } from 'echarts'

let isInitialized = false

export function initECharts() {
  if (isInitialized) return
  use([
    CanvasRenderer,
    LineChart,
    PieChart,
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DatasetComponent,
    DataZoomComponent,
    ToolboxComponent
  ])
  isInitialized = true
}

export type { EChartsOption, EChartsType }

export default {
  init: initECharts
}

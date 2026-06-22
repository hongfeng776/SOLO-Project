<template>
  <div class="effect-batch-toolkit">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="批量导出报表" name="export">
        <div class="panel">
          <div class="panel-head">
            <h4>已选活动（{{ selected.length }}个）</h4>
            <el-button type="primary" size="small" @click="handleSelectAll">
              全选列表页
            </el-button>
          </div>
          <el-select
            v-model="selected"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="点击选择要导出的活动"
            style="width: 100%; margin-bottom: 14px"
          >
            <el-option
              v-for="c in campaignList"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>

          <div class="field-groups">
            <h5>选择导出字段（分组）</h5>
            <div
              v-for="(fs, g) in groupFields"
              :key="g"
              class="field-group-card"
            >
              <div class="fg-head">
                <el-checkbox
                  :model-value="isGroupAllSelected(g)"
                  @change="(v) => toggleGroupAll(g, v)"
                >
                  <b>{{ groupNameMap[g] }}</b>
                </el-checkbox>
                <span style="margin-left: auto; font-size: 12px; color: #909399">
                  {{ countGroupSelected(g) }} / {{ fs.length }}
                </span>
              </div>
              <div class="fg-list">
                <el-checkbox
                  v-for="f in fs"
                  :key="f.key"
                  :model-value="selectedFields.includes(f.key)"
                  @change="() => toggleField(f.key)"
                >
                  {{ f.label }}
                  <el-tag
                    v-if="f.sensitive"
                    size="small"
                    type="warning"
                    effect="plain"
                    style="margin-left: 4px"
                  >敏感</el-tag>
                </el-checkbox>
              </div>
            </div>
          </div>

          <div class="export-options">
            <el-form label-width="100px" size="default">
              <el-form-item label="排序字段">
                <el-select v-model="sortBy" style="width: 200px">
                  <el-option label="综合评分（高→低）" value="efficiencyScore" />
                  <el-option label="ROI（高→低）" value="roiValue" />
                  <el-option label="核销率（高→低）" value="redemptionRate" />
                  <el-option label="预算使用率" value="usedBudget" />
                  <el-option label="开始时间" value="startTime" />
                  <el-option label="活动ID" value="id" />
                </el-select>
                <el-select v-model="sortOrder" style="width: 120px; margin-left: 10px">
                  <el-option label="降序" value="desc" />
                  <el-option label="升序" value="asc" />
                </el-select>
              </el-form-item>
              <el-form-item label="脱敏导出">
                <el-switch v-model="maskSensitive" active-color="#e6a23c" />
                <span style="margin-left: 10px; font-size: 12px; color: #909399">
                  开启后创建人姓名、手机号等敏感字段将自动脱敏
                </span>
              </el-form-item>
            </el-form>
          </div>

          <div class="preview-box" v-if="previewRows.length">
            <h5>
              数据预览（前3行，共{{ previewRows.length }}行）
              <el-tag v-if="maskSensitive" size="small" type="warning" effect="plain">
                已应用脱敏
              </el-tag>
            </h5>
            <el-table :data="previewRows" size="small" border max-height="220">
              <el-table-column
                v-for="col in previewCols"
                :key="col.key"
                :label="col.label"
                :prop="col.key"
                min-width="110"
              />
            </el-table>
          </div>

          <div class="footer-actions">
            <el-button @click="previewExport">预览数据</el-button>
            <el-button type="primary" :disabled="!canExport" @click="doExport">
              <el-icon><Download /></el-icon>
              生成并下载CSV（{{ selected.length }}个活动）
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="活动横向对比" name="compare">
        <div class="panel">
          <div class="compare-select">
            <el-select
              v-model="compareIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择2~5个活动进行对比"
              style="width: 100%"
            >
              <el-option
                v-for="c in campaignList"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
            <el-button
              type="primary"
              :disabled="compareIds.length < 2 || compareIds.length > 5"
              @click="handleCompare"
              style="margin-top: 10px"
            >
              生成对比（{{ compareIds.length }}/5）
            </el-button>
          </div>

          <div v-if="compareResult" class="compare-result">
            <el-table :data="compareTableRows" border>
              <el-table-column label="对比维度" width="130" fixed>
                <template #default="{ row }">
                  <b>{{ row.dim }}</b>
                  <el-tooltip :content="row.tips" effect="light">
                    <el-icon style="color: #909399; margin-left: 4px"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column
                v-for="c in compareResult.list"
                :key="c.id"
                :label="c.name"
                align="center"
              >
                <template #default="{ row }">
                  <span :class="{ best: row.bestId === c.id, worst: row.worstId === c.id }">
                    {{ row.values[c.id] }}
                    <el-icon v-if="row.bestId === c.id" color="#67c23a"><Top /></el-icon>
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量标记低效" name="mark">
        <div class="panel">
          <el-alert
            title="批量标记将把选中活动效果等级调整为「低效」，便于后续筛选分析"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 16px"
          />
          <div class="auto-select">
            <h5>智能筛选建议</h5>
            <div class="filter-row">
              <el-checkbox v-model="filterRule.lowRoi">ROI < 1.0（投入未回本）</el-checkbox>
              <el-checkbox v-model="filterRule.lowRedemption">核销率 < 20%</el-checkbox>
              <el-checkbox v-model="filterRule.lowBudget">预算使用率 < 30%</el-checkbox>
              <el-checkbox v-model="filterRule.highFraud">拦截≥5次（高造假风险）</el-checkbox>
            </div>
            <el-button
              type="warning"
              plain
              size="small"
              @click="applyAutoFilter"
            >
              <el-icon><Search /></el-icon>
              按规则从列表中匹配
            </el-button>
            <span style="margin-left: 12px; font-size: 12px; color: #909399">
              已匹配 {{ markIds.length }} 个活动
            </span>
          </div>

          <el-select
            v-model="markIds"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="手动补充选择活动，或从上面智能匹配"
            style="width: 100%; margin-top: 12px"
          >
            <el-option
              v-for="c in campaignList"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>

          <div class="footer-actions">
            <el-button
              type="danger"
              :disabled="markIds.length === 0"
              @click="handleMark"
            >
              <el-icon><Warning /></el-icon>
              批量标记为低效活动（{{ markIds.length }}个）
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, QuestionFilled, Top, Search, Warning } from '@element-plus/icons-vue'
import {
  getMarketingListApi,
  getExportConfigApi,
  batchExportReportsApi,
  batchCompareCampaignsApi,
  batchMarkInefficientApi
} from '@/api/marketing'
import { ExportFieldGroupMap, EfficiencyLevelMap } from '@/enums/marketing'
import type { MarketingCampaign, ExportConfig, ExportReportResult, CompareResult, ExportField } from '@/types/marketing'

const emit = defineEmits<{
  (e: 'success', action: string): void;
}>()

const activeTab = ref('export')
const campaignList = ref<MarketingCampaign[]>([])
const exportConfig = ref<ExportConfig | null>(null)

const selected = ref<number[]>([])
const selectedFields = ref<string[]>([])
const sortBy = ref('efficiencyScore')
const sortOrder = ref('desc')
const maskSensitive = ref(true)
const previewResult = ref<ExportReportResult | null>(null)

const compareIds = ref<number[]>([])
const compareResult = ref<CompareResult | null>(null)

const markIds = ref<number[]>([])
const filterRule = reactive({
  lowRoi: true,
  lowRedemption: false,
  lowBudget: false,
  highFraud: false
})

const groupNameMap = ExportFieldGroupMap

const groupFields = computed<Record<string, ExportField[]>>(() => {
  const groups: Record<string, ExportField[]> = {}
  const fields = exportConfig.value?.fields || []
  fields.forEach(f => {
    if (!groups[f.group]) groups[f.group] = []
    groups[f.group].push(f)
  })
  return groups
})

const canExport = computed(() =>
  selected.value.length > 0 && selectedFields.value.length > 0
)

const previewCols = computed(() => previewResult.value?.columns || [])
const previewRows = computed(() => (previewResult.value?.rows || []).slice(0, 3))

const compareTableRows = computed(() => {
  if (!compareResult.value) return []
  const dims: { key: string; dim: string; tips: string; higherBetter: boolean }[] = [
    { key: 'roiValue',        dim: 'ROI',           tips: 'GMV / 已用预算，越高越好',        higherBetter: true },
    { key: 'redemptionRate',  dim: '核销率',         tips: '实际核销 / 领取权益',            higherBetter: true },
    { key: 'conversionRate',  dim: '转化率',         tips: '有效订单 / 领取权益',            higherBetter: true },
    { key: 'ctrValue',        dim: '点击率',         tips: '点击 / 曝光',                  higherBetter: true },
    { key: 'efficiencyScore', dim: '综合评分',        tips: '多维度加权评分（0-100）',        higherBetter: true },
    { key: 'participant',     dim: '参与人数',        tips: '参与活动独立用户数',             higherBetter: true },
    { key: 'conversion',      dim: '转化订单数',      tips: '产生的有效订单数',               higherBetter: true },
    { key: 'gmv',             dim: 'GMV(元)',        tips: '转化订单总额',                  higherBetter: true },
    { key: 'budgetUsage',     dim: '预算使用率(%)',   tips: '已用预算 / 总预算',              higherBetter: true }
  ]

  const list = compareResult.value.list
  return dims.map(d => {
    const values: Record<number, string> = {}
    let bestId: number | null = null
    let worstId: number | null = null
    let bestVal = d.higherBetter ? -Infinity : Infinity
    let worstVal = d.higherBetter ? Infinity : -Infinity

    list.forEach(c => {
      const m = c.metrics || {} as any
      const ev = c.evaluated || {} as any
      let raw: any = 0
      if (d.key === 'roiValue') raw = ev.roiValue || m.roiValue || 0
      else if (d.key === 'redemptionRate') raw = (ev.redemptionRate || m.redemptionRate || 0) * 100
      else if (d.key === 'conversionRate') raw = (ev.conversionRate || m.conversionRate || 0) * 100
      else if (d.key === 'ctrValue') raw = (ev.ctrValue || m.ctrValue || 0) * 100
      else if (d.key === 'efficiencyScore') raw = ev.efficiencyScore || 0
      else if (d.key === 'participant') raw = m.participant || 0
      else if (d.key === 'conversion') raw = m.conversion || 0
      else if (d.key === 'gmv') raw = m.gmv || 0
      else if (d.key === 'budgetUsage') raw = (m.budgetUsage || 0) * 100

      const num = Number(raw) || 0
      let display = ''
      if (d.key.includes('Rate') || d.key === 'ctrValue' || d.key === 'budgetUsage') display = `${num.toFixed(2)}%`
      else if (d.key === 'gmv') display = `¥${num.toLocaleString()}`
      else if (d.key === 'efficiencyScore') display = num.toFixed(1)
      else if (d.key === 'roiValue') display = num.toFixed(2)
      else display = num.toLocaleString()

      values[c.id] = display

      if (num > bestVal) { bestVal = num; bestId = c.id }
      if (num < worstVal) { worstVal = num; worstId = c.id }
    })

    return { dim: d.dim, tips: d.tips, values, bestId, worstId }
  })
})

const loadList = async () => {
  try {
    const res = await getMarketingListApi({ page: 1, pageSize: 500 } as any)
    campaignList.value = (res.data as any).list || res.data || []
  } catch (e) {}
}

const loadExportConfig = async () => {
  try {
    const res = await getExportConfigApi()
    exportConfig.value = res.data as ExportConfig
    const basic = ['name', 'code', 'sceneName', 'statusName', 'startTime', 'endTime']
    const metrics = ['participantCount', 'receiveCount', 'useCount', 'conversionCount', 'conversionAmount', 'ctrValue', 'redemptionRate', 'conversionRate', 'roiValue', 'efficiencyLevelName', 'efficiencyScore', 'dataAuthenticityName']
    selectedFields.value = [...basic, ...metrics]
  } catch (e) {}
}

const isGroupAllSelected = (g: string) => {
  const fs = groupFields.value[g] || []
  return fs.length > 0 && fs.every(f => selectedFields.value.includes(f.key))
}

const countGroupSelected = (g: string) =>
  (groupFields.value[g] || []).filter(f => selectedFields.value.includes(f.key)).length

const toggleGroupAll = (g: string, v: boolean) => {
  const fs = (groupFields.value[g] || []).map(f => f.key)
  if (v) {
    const next = [...new Set([...selectedFields.value, ...fs])]
    selectedFields.value = next
  } else {
    selectedFields.value = selectedFields.value.filter(k => !fs.includes(k))
  }
}

const toggleField = (k: string) => {
  if (selectedFields.value.includes(k)) {
    selectedFields.value = selectedFields.value.filter(x => x !== k)
  } else {
    selectedFields.value = [...selectedFields.value, k]
  }
}

const handleSelectAll = () => { selected.value = campaignList.value.map(c => c.id as number) }

const previewExport = async () => {
  if (!canExport.value) {
    ElMessage.warning('请选择至少1个活动与1个字段')
    return
  }
  try {
    const res = await batchExportReportsApi({
      ids: selected.value,
      fields: selectedFields.value,
      maskSensitive: maskSensitive.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    previewResult.value = res.data as ExportReportResult
    ElMessage.success(`预览生成成功，共 ${previewResult.value.total} 行`)
  } catch (e: any) {
    ElMessage.error(e.message || '生成失败')
  }
}

const doExport = async () => {
  if (!previewResult.value) await previewExport()
  if (!previewResult.value) return
  try {
    const rows = previewResult.value
    const headers = rows.columns.map(c => c.label).join(',')
    const lines = rows.rows.map(r =>
      rows.columns.map(c => {
        let v = String(r[c.key] ?? '')
        if (v.includes(',') || v.includes('"')) v = `"${v.replace(/"/g, '""')}"`
        return v
      }).join(',')
    )
    const csv = '\ufeff' + [headers, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `营销活动效果报表_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    ElMessage.success('已开始下载报表')
    emit('success', 'export')
  } catch (e: any) {
    ElMessage.error(e.message || '导出失败')
  }
}

const handleCompare = async () => {
  try {
    const res = await batchCompareCampaignsApi(compareIds.value)
    compareResult.value = res.data as CompareResult
  } catch (e: any) {
    ElMessage.error(e.message || '对比失败')
  }
}

const applyAutoFilter = () => {
  const matched = campaignList.value.filter(c => {
    const roi = Number(c.roiValue || 0)
    const redemption = Number(c.redemptionRate || 0)
    const budgetU = Number(c.usedBudget || 0) / Math.max(Number(c.budget || 1), 1)
    const fraud = Number(c.fraudWarningCount || 0)
    let hit = false
    if (filterRule.lowRoi && roi < 1.0) hit = true
    if (filterRule.lowRedemption && redemption < 0.20) hit = true
    if (filterRule.lowBudget && budgetU < 0.30) hit = true
    if (filterRule.highFraud && fraud >= 5) hit = true
    return hit
  }).map(c => c.id as number)
  markIds.value = [...new Set([...markIds.value, ...matched])]
  ElMessage.info(`按规则匹配到 ${matched.length} 个活动`)
}

const handleMark = async () => {
  try {
    await ElMessageBox.confirm(`确认将选中的 ${markIds.value.length} 个活动标记为「低效」？`, '操作确认', { type: 'warning' })
    await batchMarkInefficientApi(markIds.value)
    ElMessage.success('批量标记完成')
    emit('success', 'mark')
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '标记失败')
  }
}

onMounted(() => {
  loadList()
  loadExportConfig()
})
</script>

<style lang="scss" scoped>
.effect-batch-toolkit {
  .panel {
    padding: 4px 2px 10px 2px;
  }
  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    h4 { margin: 0; font-size: 14px; font-weight: 600; color: #303133; }
  }
  .field-groups {
    h5 { margin: 14px 0 10px 0; font-size: 13px; font-weight: 600; color: #606266; }
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;

    .field-group-card {
      background: #f5f7fa;
      border-radius: 10px;
      padding: 12px;

      .fg-head {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      .fg-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 14px;
        .el-checkbox { margin-right: 0; }
      }
    }
  }

  .export-options {
    background: #ecf5ff;
    border-radius: 10px;
    padding: 14px 16px;
    margin: 14px 0;

    .el-form-item { margin-bottom: 8px; }
  }

  .preview-box {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 14px;

    h5 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 10px 0;
      font-size: 13px;
      font-weight: 600;
      color: #606266;
    }
  }

  .footer-actions {
    text-align: right;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .compare-select {
    margin-bottom: 16px;
  }

  .compare-result {
    :deep(.el-table .best) {
      color: #67c23a;
      font-weight: 700;
      background: #f0f9eb;
    }
    :deep(.el-table .worst) {
      color: #f56c6c;
    }
  }

  .auto-select {
    background: #fdf6ec;
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 12px;

    h5 {
      margin: 0 0 10px 0;
      font-size: 13px;
      font-weight: 600;
      color: #b88230;
    }
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 18px;
      margin-bottom: 10px;
    }
  }
}
</style>

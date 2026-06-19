<template>
  <div class="channel-grade-page">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card" @click="activeTab = 'batch'">
          <div class="stat-card__label">渠道总数</div>
          <div class="stat-card__value">{{ statistics.totalChannels }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" @click="activeTab = 'trace'">
          <div class="stat-card__label">等级分布</div>
          <div class="stat-card__value">
            <span v-for="level in CHANNEL_LEVEL_ORDER" :key="level" class="dist-inline">
              {{ CHANNEL_LEVEL_MAP[level]?.label }}:{{ statistics.distribution?.[level] || 0 }}
            </span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card--danger" @click="activeTab = 'trace'">
          <div class="stat-card__label">异常变更</div>
          <div class="stat-card__value">{{ statistics.anomaliesCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card--success" @click="activeTab = 'adjust'">
          <div class="stat-card__label">待审批调整</div>
          <div class="stat-card__value">{{ statistics.totalChangeEvents }}</div>
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in CHANNEL_GRADE_TAB_OPTIONS" :key="tab.value" :label="tab.label" :name="tab.value" />
    </el-tabs>

    <el-card>
      <template v-if="activeTab === 'rules'">
        <el-row :gutter="16">
          <el-col :span="8" v-for="rule in rules" :key="rule.level">
            <el-card shadow="hover" class="rule-card" :class="{ 'rule-card--valid': rule._valid }">
              <div class="rule-card__header">
                <el-tag :type="(CHANNEL_LEVEL_MAP[rule.level] as any)?.type || 'info'">
                  {{ (CHANNEL_LEVEL_MAP[rule.level] as any)?.label || rule.level }}
                </el-tag>
                <el-icon v-if="rule._valid" color="#67c23a"><CircleCheck /></el-icon>
              </div>
              <el-form label-width="100px" size="small">
                <el-form-item label="渠道体量">
                  <div class="rule-field">
                    <el-input-number v-model="rule.minMonthlyAmount" :min="0" :controls="false" @change="validateSingleRule(rule)" />
                    <el-icon v-if="rule._thresholdValid?.minMonthlyAmount" color="#67c23a"><Check /></el-icon>
                  </div>
                </el-form-item>
                <el-form-item label="订单量">
                  <div class="rule-field">
                    <el-input-number v-model="rule.minMonthlyOrders" :min="0" :controls="false" @change="validateSingleRule(rule)" />
                    <el-icon v-if="rule._thresholdValid?.minMonthlyOrders" color="#67c23a"><Check /></el-icon>
                  </div>
                </el-form-item>
                <el-form-item label="合作时长(月)">
                  <div class="rule-field">
                    <el-input-number v-model="rule.minCooperationMonths" :min="0" :controls="false" @change="validateSingleRule(rule)" />
                    <el-icon v-if="rule._thresholdValid?.minCooperationMonths" color="#67c23a"><Check /></el-icon>
                  </div>
                </el-form-item>
                <el-form-item label="履约质量(%)">
                  <div class="rule-field">
                    <el-input-number v-model="rule.minFulfillmentRate" :min="0" :max="100" :controls="false" @change="validateSingleRule(rule)" />
                    <el-icon v-if="rule._thresholdValid?.minFulfillmentRate" color="#67c23a"><Check /></el-icon>
                  </div>
                </el-form-item>
                <el-form-item label="推广能力">
                  <div class="rule-field">
                    <el-input-number v-model="rule.minPromotionScore" :min="0" :max="100" :controls="false" @change="validateSingleRule(rule)" />
                    <el-icon v-if="rule._thresholdValid?.minPromotionScore" color="#67c23a"><Check /></el-icon>
                  </div>
                </el-form-item>
                <el-divider>权益配置</el-divider>
                <el-form-item label="佣金加成">
                  <el-input-number v-model="rule.commissionRateBonus" :min="0" :max="1" :step="0.01" :precision="4" :controls="false" @change="validateSingleRule(rule)" />
                </el-form-item>
                <el-form-item label="资源扶持">
                  <el-select v-model="rule.resourceSupportLevel">
                    <el-option v-for="opt in RESOURCE_SUPPORT_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="专属活动"><el-switch v-model="rule.canExclusiveActivity" /></el-form-item>
                <el-form-item label="自定义结算"><el-switch v-model="rule.canCustomSettle" /></el-form-item>
                <el-form-item label="优先支持"><el-switch v-model="rule.prioritySupport" /></el-form-item>
                <el-form-item label="专属经理"><el-switch v-model="rule.dedicatedManager" /></el-form-item>
              </el-form>
              <el-button type="primary" size="small" @click="saveRule(rule)" :loading="rule._saving">保存规则</el-button>
            </el-card>
          </el-col>
        </el-row>
      </template>

      <template v-if="activeTab === 'adjust'">
        <el-card class="adjust-form-card" shadow="never">
          <el-form :model="adjustForm" label-width="100px" ref="adjustFormRef">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="选择渠道" prop="channelId" :rules="[{ required: true, message: '请选择渠道' }]">
                  <el-select v-model="adjustForm.channelId" filterable remote :remote-method="searchChannels" :loading="channelSearching" placeholder="搜索渠道名称">
                    <el-option v-for="ch in channelOptions" :key="ch.id" :label="ch.name" :value="ch.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="目标等级" prop="targetLevel" :rules="[{ required: true, message: '请选择等级' }]">
                  <el-select v-model="adjustForm.targetLevel">
                    <el-option v-for="opt in CHANNEL_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="调整理由">
                  <el-input v-model="adjustForm.adjustReason" placeholder="未达标调整需填写理由" />
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-button type="primary" @click="submitAdjust" :loading="adjustSubmitting">提交调整</el-button>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <BaseTable
          :data="adjustList"
          :loading="adjustLoading"
          :total="adjustTotal"
          :page="adjustPagination.page"
          :page-size="adjustPagination.pageSize"
          :show-selection="false"
          @page-change="(v: number) => { adjustPagination.page = v; loadAdjustRequests() }"
          @size-change="(v: number) => { adjustPagination.pageSize = v; adjustPagination.page = 1; loadAdjustRequests() }"
        >
          <el-table-column prop="channelId" label="渠道ID" width="120" />
          <el-table-column prop="applicantName" label="申请人" width="100" />
          <el-table-column label="原等级" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="(CHANNEL_LEVEL_MAP[(row as any).fromLevel] as any)?.type || 'info'" size="small">
                {{ (CHANNEL_LEVEL_MAP[(row as any).fromLevel] as any)?.label || row.fromLevel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="目标等级" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="(CHANNEL_LEVEL_MAP[(row as any).toLevel] as any)?.type || 'info'" size="small">
                {{ (CHANNEL_LEVEL_MAP[(row as any).toLevel] as any)?.label || row.toLevel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="adjustReason" label="调整理由" min-width="150" show-overflow-tooltip />
          <el-table-column label="审批状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="(CHANNEL_GRADE_ADJUST_STATUS_MAP[(row as any).approveStatus] as any)?.type || 'info'" size="small">
                {{ (CHANNEL_GRADE_ADJUST_STATUS_MAP[(row as any).approveStatus] as any)?.label || row.approveStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="申请时间" width="170">
            <template #default="{ row }">{{ formatDateTime((row as any).createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <template v-if="(row as any).approveStatus === 0">
                <el-button type="success" link :icon="Check" @click="reviewAdjust(row as any, true)">通过</el-button>
                <el-button type="danger" link :icon="Close" @click="reviewAdjust(row as any, false)">拒绝</el-button>
              </template>
              <el-button v-else type="primary" link :icon="View" @click="viewAdjustDetail(row as any)">查看</el-button>
            </template>
          </el-table-column>
        </BaseTable>
      </template>

      <template v-if="activeTab === 'batch'">
        <BaseTable
          ref="batchTableRef"
          :data="channelList"
          :loading="channelLoading"
          :total="channelTotal"
          :page="channelPagination.page"
          :page-size="channelPagination.pageSize"
          show-selection
          @selection-change="handleBatchSelection"
          @page-change="(v: number) => { channelPagination.page = v; loadChannelList() }"
          @size-change="(v: number) => { channelPagination.pageSize = v; channelPagination.page = 1; loadChannelList() }"
          stripe
        >
          <el-table-column prop="code" label="渠道编码" width="140" />
          <el-table-column prop="name" label="渠道名称" min-width="140" />
          <el-table-column label="当前等级" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="(CHANNEL_LEVEL_MAP[(row as any).level] as any)?.type || 'info'" size="small">
                {{ (CHANNEL_LEVEL_MAP[(row as any).level] as any)?.label || row.level }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="monthlyAmount" label="月体量" width="110" align="right" />
          <el-table-column prop="monthlyOrders" label="月订单" width="100" align="right" />
          <el-table-column prop="cooperationMonths" label="合作月数" width="100" align="right" />
          <el-table-column prop="fulfillmentRate" label="履约率%" width="100" align="right" />
          <el-table-column prop="promotionScore" label="推广评分" width="100" align="right" />
          <el-table-column label="资源等级" width="110" align="center">
            <template #default="{ row }">
              <el-tag size="small">
                {{ RESOURCE_SUPPORT_LEVEL_OPTIONS.find(o => o.value === (row as any).resourceSupportLevel)?.label || '-' }}
              </el-tag>
            </template>
          </el-table-column>
        </BaseTable>

        <transition name="fade">
          <div class="batch-action-bar" v-if="selectedChannels.length > 0">
            <span>已选 {{ selectedChannels.length }} 个渠道</span>
            <el-select v-model="batchTargetLevel" placeholder="目标等级" style="width: 150px">
              <el-option v-for="opt in CHANNEL_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-button type="primary" @click="handleBatchLevel" :loading="batchLevelLoading">批量调整等级</el-button>
            <el-select v-model="batchResourceLevel" placeholder="资源扶持等级" style="width: 150px">
              <el-option v-for="opt in RESOURCE_SUPPORT_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-button type="warning" @click="handleBatchResource" :loading="batchResourceLoading">批量调整资源</el-button>
          </div>
        </transition>

        <BaseDialog v-model="batchResultVisible" title="批量操作结果" width="700px">
          <el-row :gutter="12">
            <el-col :span="6"><div class="result-stat" style="background: #e6f7ff; color: #1890ff">总数<br />{{ batchResult?.total }}</div></el-col>
            <el-col :span="6"><div class="result-stat" style="background: #f6ffed; color: #52c41a">成功<br />{{ batchResult?.regraded }}</div></el-col>
            <el-col :span="6"><div class="result-stat" style="background: #fffbe6; color: #faad14">跳过<br />{{ batchResult?.skipped }}</div></el-col>
            <el-col :span="6"><div class="result-stat" style="background: #fff2f0; color: #ff4d4f">失败<br />{{ batchResult?.failed }}</div></el-col>
          </el-row>
          <el-table :data="batchResult?.details" max-height="300" stripe>
            <el-table-column prop="name" label="渠道" />
            <el-table-column prop="originalLevel" label="原等级" />
            <el-table-column prop="newLevel" label="新等级" />
            <el-table-column label="是否变更" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="(row as any).changed ? 'success' : 'info'" size="small">{{ (row as any).changed ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" show-overflow-tooltip />
          </el-table>
          <template #footer><span></span></template>
        </BaseDialog>
      </template>

      <template v-if="activeTab === 'trace'">
        <el-form inline class="trace-filter">
          <el-form-item label="渠道">
            <el-input v-model="traceChannelId" placeholder="输入渠道ID" />
          </el-form-item>
          <el-button type="primary" @click="loadTraceLogs">查询</el-button>
        </el-form>
        <BaseTable
          :data="traceLogs"
          :loading="traceLoading"
          :total="traceTotal"
          :page="tracePagination.page"
          :page-size="tracePagination.pageSize"
          :show-selection="false"
          stripe
          @page-change="(v: number) => { tracePagination.page = v; loadTraceLogs() }"
          @size-change="(v: number) => { tracePagination.pageSize = v; tracePagination.page = 1; loadTraceLogs() }"
        >
          <el-table-column label="时间" width="170">
            <template #default="{ row }">{{ formatDateTime((row as any).createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="channelId" label="渠道ID" width="120" />
          <el-table-column label="原等级" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="(CHANNEL_LEVEL_MAP[(row as any).fromLevel] as any)?.type || 'info'" size="small">
                {{ (CHANNEL_LEVEL_MAP[(row as any).fromLevel] as any)?.label || row.fromLevel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="新等级" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="(CHANNEL_LEVEL_MAP[(row as any).toLevel] as any)?.type || 'info'" size="small">
                {{ (CHANNEL_LEVEL_MAP[(row as any).toLevel] as any)?.label || row.toLevel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="变更来源" width="130" align="center">
            <template #default="{ row }">
              <el-tag :type="(CHANNEL_GRADE_CHANGE_SOURCE_MAP[(row as any).changeSource] as any)?.type || 'info'" size="small">
                {{ (CHANNEL_GRADE_CHANGE_SOURCE_MAP[(row as any).changeSource] as any)?.label || row.changeSource }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="100" />
          <el-table-column label="达标" width="80" align="center">
            <template #default="{ row }">
              <el-icon v-if="(row as any).meetsThreshold" color="#67c23a"><Check /></el-icon>
              <el-icon v-else color="#f56c6c"><Close /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="异常" width="80" align="center">
            <template #default="{ row }">
              <el-icon v-if="(row as any).anomalyFlagged" color="#e6a23c"><WarningFilled /></el-icon>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="changeReason" label="原因" min-width="150" show-overflow-tooltip />
        </BaseTable>

        <div class="distribution-section">
          <h4>等级分布统计</h4>
          <el-row :gutter="12">
            <el-col :span="4" v-for="level in CHANNEL_LEVEL_ORDER" :key="level">
              <div class="dist-item">
                <el-tag :type="(CHANNEL_LEVEL_MAP[level] as any)?.type || 'info'">{{ (CHANNEL_LEVEL_MAP[level] as any)?.label }}</el-tag>
                <span class="dist-count">{{ statistics.distribution?.[level] || 0 }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Setting, Promotion, Operation, Connection, Check, Close, View, WarningFilled, CircleCheck } from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import { formatDateTime } from '@/utils/date'
import { getChannelList } from '@/api/channel'
import {
  getChannelGradeRules, saveChannelGradeRule, validateRuleParams,
  requestManualAdjust, reviewAdjustRequest, getAdjustRequests,
  batchAdjustLevels, batchAdjustResources, getChannelGradeStatistics,
  type ChannelGradeRule, type ChannelGradeAdjustRequestItem,
  type BatchGradeResult, type RuleValidationResult,
  type ChannelLevel,
} from '@/api/channel-grade'
import {
  CHANNEL_LEVEL_OPTIONS, CHANNEL_LEVEL_MAP, CHANNEL_LEVEL_ORDER,
  CHANNEL_GRADE_TAB_OPTIONS, CHANNEL_GRADE_CHANGE_SOURCE_MAP,
  CHANNEL_GRADE_ADJUST_STATUS_MAP,
  RESOURCE_SUPPORT_LEVEL_OPTIONS,
} from '@/constants'

void Setting
void Promotion
void Operation
void Connection

const activeTab = ref('rules')

const statistics = reactive<{
  distribution: Record<string, number>
  totalChangeEvents: number
  totalChannels: number
  anomaliesCount: number
}>({
  distribution: {},
  totalChangeEvents: 0,
  totalChannels: 0,
  anomaliesCount: 0,
})

const rules = ref<any[]>([])

async function loadRules() {
  try {
    const data = await getChannelGradeRules()
    const ruleMap = new Map(data.map((r: ChannelGradeRule) => [r.level, r]))
    rules.value = CHANNEL_LEVEL_ORDER.map(level => {
      const existing = ruleMap.get(level as ChannelLevel)
      return {
        level,
        minMonthlyAmount: 0,
        minMonthlyOrders: 0,
        minCooperationMonths: 0,
        minFulfillmentRate: 0,
        minPromotionScore: 0,
        commissionRateBonus: 0,
        resourceSupportLevel: 0,
        canExclusiveActivity: false,
        canCustomSettle: false,
        prioritySupport: false,
        dedicatedManager: false,
        ...existing,
        _valid: false,
        _thresholdValid: {} as Record<string, boolean>,
        _saving: false,
      }
    })
  } catch (error) {
    console.error(error)
  }
}

async function validateSingleRule(rule: any) {
  try {
    const result: RuleValidationResult = await validateRuleParams(rule as Partial<ChannelGradeRule>)
    rule._thresholdValid = {}
    if (result.valid) {
      const fields = ['minMonthlyAmount', 'minMonthlyOrders', 'minCooperationMonths', 'minFulfillmentRate', 'minPromotionScore']
      fields.forEach(f => { rule._thresholdValid[f] = true })
      rule._valid = true
    } else {
      const conflictFields = new Set(result.conflicts.map((c: any) => c.field))
      const fields = ['minMonthlyAmount', 'minMonthlyOrders', 'minCooperationMonths', 'minFulfillmentRate', 'minPromotionScore']
      fields.forEach(f => { rule._thresholdValid[f] = !conflictFields.has(f) })
      rule._valid = false
      if (result.conflicts.length > 0) {
        const messages = result.conflicts.map((c: any) => c.message).join('\n')
        ElMessageBox.alert(messages, '规则冲突', { type: 'warning' })
      }
    }
  } catch (error) {
    console.error(error)
  }
}

async function saveRule(rule: any) {
  rule._saving = true
  try {
    await saveChannelGradeRule(rule as Partial<ChannelGradeRule>)
    rule._valid = true
    ElMessage.success('规则保存成功')
  } catch (error) {
    console.error(error)
  } finally {
    rule._saving = false
  }
}

const adjustForm = reactive<{
  channelId: string
  targetLevel: ChannelLevel | ''
  adjustReason: string
}>({
  channelId: '',
  targetLevel: '',
  adjustReason: '',
})
const adjustFormRef = ref<FormInstance>()
const adjustSubmitting = ref(false)
const adjustList = ref<ChannelGradeAdjustRequestItem[]>([])
const adjustLoading = ref(false)
const adjustTotal = ref(0)
const adjustPagination = reactive({ page: 1, pageSize: 20 })

const channelOptions = ref<any[]>([])
const channelSearching = ref(false)

async function searchChannels(query: string) {
  if (!query) { channelOptions.value = []; return }
  channelSearching.value = true
  try {
    const res = await getChannelList({ keyword: query, page: 1, pageSize: 20 })
    channelOptions.value = res.list
  } catch (error) {
    console.error(error)
  } finally {
    channelSearching.value = false
  }
}

async function submitAdjust() {
  if (!adjustFormRef.value) return
  await adjustFormRef.value.validate(async (valid) => {
    if (!valid) return
    adjustSubmitting.value = true
    try {
      await requestManualAdjust({
        channelId: adjustForm.channelId,
        targetLevel: adjustForm.targetLevel as ChannelLevel,
        adjustReason: adjustForm.adjustReason,
      })
      ElMessage.success('调整申请已提交')
      adjustForm.channelId = ''
      adjustForm.targetLevel = ''
      adjustForm.adjustReason = ''
      loadAdjustRequests()
    } catch (error) {
      console.error(error)
    } finally {
      adjustSubmitting.value = false
    }
  })
}

async function loadAdjustRequests() {
  adjustLoading.value = true
  try {
    const res = await getAdjustRequests({
      page: adjustPagination.page,
      pageSize: adjustPagination.pageSize,
    })
    adjustList.value = res.list
    adjustTotal.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    adjustLoading.value = false
  }
}

async function reviewAdjust(row: ChannelGradeAdjustRequestItem, approved: boolean) {
  const action = approved ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(`确定${action}该调整申请？`, '审批确认', { type: 'warning' })
    await reviewAdjustRequest(row.id as string, { approved, approveRemark: '' })
    ElMessage.success(`已${action}`)
    loadAdjustRequests()
  } catch (error: any) {
    if (error !== 'cancel') console.error(error)
  }
}

function viewAdjustDetail(row: ChannelGradeAdjustRequestItem) {
  ElMessageBox.alert(
    `渠道: ${row.channelId}\n理由: ${row.adjustReason}\n状态: ${CHANNEL_GRADE_ADJUST_STATUS_MAP[row.approveStatus]?.label}`,
    '调整详情',
  )
}

const channelList = ref<any[]>([])
const channelLoading = ref(false)
const channelTotal = ref(0)
const channelPagination = reactive({ page: 1, pageSize: 20 })

async function loadChannelList() {
  channelLoading.value = true
  try {
    const res = await getChannelList({ page: channelPagination.page, pageSize: channelPagination.pageSize })
    channelList.value = res.list
    channelTotal.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    channelLoading.value = false
  }
}

const selectedChannels = ref<any[]>([])
const batchTargetLevel = ref('')
const batchResourceLevel = ref<number | ''>('')
const batchLevelLoading = ref(false)
const batchResourceLoading = ref(false)
const batchResult = ref<BatchGradeResult | null>(null)
const batchResultVisible = ref(false)
const batchTableRef = ref()

function handleBatchSelection(selection: any[]) {
  selectedChannels.value = selection
}

function validateBatchOperation(targetLevel?: string): boolean {
  if (selectedChannels.value.length === 0) {
    ElMessage.warning('请先选择渠道')
    return false
  }
  if (targetLevel && targetLevel !== '') {
    const targetIdx = CHANNEL_LEVEL_ORDER.indexOf(targetLevel)
    for (const ch of selectedChannels.value) {
      const currentIdx = CHANNEL_LEVEL_ORDER.indexOf(ch.level)
      if (targetIdx > currentIdx) {
        const metrics = ch as any
        if (metrics.fulfillmentRate < 80 || metrics.promotionScore < 60) {
          ElMessage.warning(`渠道"${ch.name}"履约率或推广评分不达标，无法升级`)
          return false
        }
      }
      if (targetIdx < currentIdx) {
        const metrics = ch as any
        if (metrics.fulfillmentRate >= 90 && metrics.promotionScore >= 80 && metrics.monthlyAmount > 50000) {
          ElMessage.warning(`优质渠道"${ch.name}"不建议降级`)
          return false
        }
      }
    }
  }
  return true
}

async function handleBatchLevel() {
  if (!batchTargetLevel.value) { ElMessage.warning('请选择目标等级'); return }
  if (!validateBatchOperation(batchTargetLevel.value)) return
  batchLevelLoading.value = true
  try {
    const ids = selectedChannels.value.map(ch => ch.id)
    const result = await batchAdjustLevels({ ids, targetLevel: batchTargetLevel.value as ChannelLevel })
    batchResult.value = result
    batchResultVisible.value = true
    loadChannelList()
  } catch (error) {
    console.error(error)
  } finally {
    batchLevelLoading.value = false
  }
}

async function handleBatchResource() {
  if (batchResourceLevel.value === '' || batchResourceLevel.value === undefined) { ElMessage.warning('请选择资源扶持等级'); return }
  if (!validateBatchOperation()) return
  batchResourceLoading.value = true
  try {
    const ids = selectedChannels.value.map(ch => ch.id)
    const result = await batchAdjustResources({ ids, resourceLevel: batchResourceLevel.value as number })
    batchResult.value = result
    batchResultVisible.value = true
    loadChannelList()
  } catch (error) {
    console.error(error)
  } finally {
    batchResourceLoading.value = false
  }
}

const traceChannelId = ref('')
const traceLogs = ref<any[]>([])
const traceLoading = ref(false)
const traceTotal = ref(0)
const tracePagination = reactive({ page: 1, pageSize: 20 })

async function loadTraceLogs() {
  if (!traceChannelId.value) { ElMessage.warning('请输入渠道ID'); return }
  traceLoading.value = true
  try {
    const { getChannelGradeChangeLogs } = await import('@/api/channel-grade')
    const res = await getChannelGradeChangeLogs({
      channelId: traceChannelId.value,
      page: tracePagination.page,
      pageSize: tracePagination.pageSize,
    })
    traceLogs.value = res.list
    traceTotal.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    traceLoading.value = false
  }
}

async function loadStatistics() {
  try {
    const data = await getChannelGradeStatistics()
    statistics.distribution = data.distribution
    statistics.totalChangeEvents = data.totalChangeEvents
    statistics.totalChannels = data.totalChannels
    statistics.anomaliesCount = data.anomaliesCount
  } catch (error) {
    console.error(error)
  }
}

function handleTabChange(tab: string | number) {
  if (tab === 'rules') loadRules()
  else if (tab === 'adjust') loadAdjustRequests()
  else if (tab === 'batch') loadChannelList()
  else if (tab === 'trace') { if (traceChannelId.value) loadTraceLogs() }
  loadStatistics()
}

onMounted(() => {
  loadRules()
  loadStatistics()
})
</script>

<style scoped lang="scss">
.channel-grade-page {
  padding: 0;
}

.stat-cards {
  margin-bottom: 16px;

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: transform 0.2s;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

    &:hover {
      transform: translateY(-2px);
    }

    &__label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    &__value {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    &--success .stat-card__value {
      color: #67c23a;
    }

    &--danger .stat-card__value {
      color: #f56c6c;
    }
  }
}

.dist-inline {
  font-size: 13px;
  margin-right: 8px;
}

.rule-card {
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;
  padding: 0;

  &--valid {
    border-color: #67c23a;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
}

.rule-field {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 4px;
}

.adjust-form-card {
  margin-bottom: 16px;
}

.batch-action-bar {
  position: fixed;
  bottom: 0;
  left: 210px;
  right: 0;
  background: #fff;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.distribution-section {
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;

  h4 {
    margin: 0 0 12px;
    font-size: 15px;
    color: #303133;
  }

  .dist-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .dist-count {
    font-size: 22px;
    font-weight: 600;
    color: #303133;
  }
}

.result-stat {
  text-align: center;
  padding: 16px 8px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.8;
}

.trace-filter {
  margin-bottom: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

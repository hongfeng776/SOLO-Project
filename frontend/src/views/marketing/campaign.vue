<template>
  <div class="campaign-management">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Promotion /></el-icon>
          出行营销活动管理
        </h2>
        <p class="page-desc">标准化管理出行福利活动配置，覆盖场景化规则适配、批量运维、全链路溯源</p>
      </div>
      <div class="header-stats">
        <div v-for="s in headerStats" :key="s.key" class="stat-item" :class="s.key">
          <div class="stat-icon" :style="{ background: s.gradient }">
            <el-icon><component :is="s.icon" /></el-icon>
          </div>
          <div class="stat-text">
            <h4>{{ s.count }}</h4>
            <span>{{ s.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="scene-quick-entry">
      <div
        v-for="scene in sceneList"
        :key="scene.value"
        class="scene-card"
        @click="handleQuickCreate(scene.value)"
      >
        <div class="scene-badge" :style="{ background: scene.gradient }">
          <el-icon><component :is="scene.icon" /></el-icon>
        </div>
        <div class="scene-info">
          <h4>{{ scene.label }}</h4>
          <p>{{ scene.desc }}</p>
          <div class="scene-tags">
            <el-tag size="small" type="info">人群: {{ scene.defaultTarget }}</el-tag>
            <el-tag size="small" type="danger">互斥保护</el-tag>
          </div>
        </div>
        <div class="scene-action">
          <el-button type="primary" size="small">
            <el-icon><Plus /></el-icon>
            新建
          </el-button>
        </div>
      </div>
    </div>

    <MarketingBatchOperation
      v-model:selected-items="selectedItems"
      @refresh="getList"
    />

    <CommonTable
      ref="tableRef"
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :search-fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #toolbar>
        <el-button type="primary" @click="handleAdd()">
          <el-icon><Plus /></el-icon>
          新建活动
        </el-button>
        <el-button @click="getList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="warning" @click="auditVisible = true">
          <el-icon><DataLine /></el-icon>
          风控拦截统计
        </el-button>
        <el-button type="success" @click="handleBatchReEvaluate" :loading="evaluating">
          <el-icon><TrendCharts /></el-icon>
          批量计算评级
        </el-button>
        <el-button type="info" @click="effectBatchVisible = true">
          <el-icon><DataAnalysis /></el-icon>
          效果数据运维
        </el-button>
      </template>

      <el-table-column type="selection" width="50" @selection-change="handleSelectionChange" />

      <el-table-column label="活动信息" min-width="220">
        <template #default="{ row }">
          <div class="campaign-cell">
            <div class="scene-tag" :style="{ background: getSceneColor(row.scene) }">
              {{ getSceneName(row.scene) }}
            </div>
            <div class="campaign-text">
              <h4 class="name" :title="row.name">{{ row.name }}</h4>
              <p class="code">编码: {{ row.code }}</p>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.status" :status-map="CampaignStatusMap" :color-map="CampaignStatusColorMap" />
        </template>
      </el-table-column>

      <el-table-column label="活动时段" width="200">
        <template #default="{ row }">
          <div class="time-cell">
            <div class="time-row">
              <el-icon><Sunny /></el-icon>
              <span>{{ formatDate(row.startTime, 'MM-DD HH:mm') }}</span>
            </div>
            <div class="time-row">
              <el-icon><Moon /></el-icon>
              <span>{{ formatDate(row.endTime, 'MM-DD HH:mm') }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="目标人群" width="110" align="center">
        <template #default="{ row }">
          <div class="target-cell">
            <el-tag
              size="small"
              :color="TargetUserColorMap[row.targetUser]"
              effect="dark"
              style="margin-bottom: 4px"
            >
              {{ getTargetUserName(row.targetUser) }}
            </el-tag>
            <el-tag
              v-if="row.audiencePurpose && row.audiencePurpose !== 0"
              size="small"
              :color="AudiencePurposeColorMap[row.audiencePurpose as number]"
              effect="plain"
            >
              {{ AudiencePurposeMap[row.audiencePurpose as number] }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="人群覆盖" width="140" align="center">
        <template #default="{ row }">
          <div v-if="row.audienceCoverage" class="coverage-cell">
            <div class="coverage-row">
              <span>有效:</span>
              <b class="valid">{{ (row.audienceCoverage as any).valid?.toLocaleString() || 0 }}</b>
            </div>
            <div class="coverage-row">
              <span>风险排除:</span>
              <b class="risk">{{ (row.audienceCoverage as any).riskExcluded?.toLocaleString() || 0 }}</b>
            </div>
          </div>
          <span v-else class="empty-coverage">未配置</span>
        </template>
      </el-table-column>

      <el-table-column label="补贴/门槛" width="110" align="center">
        <template #default="{ row }">
          <div class="amount-cell">
            <span class="amount">¥{{ Number(row.subsidyAmount).toFixed(0) }}</span>
            <span class="threshold">{{ row.minOrderAmount ? '满' + row.minOrderAmount : '无门槛' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="预算使用" width="150">
        <template #default="{ row }">
          <div class="budget-cell">
            <div class="budget-row">
              <span class="used">¥{{ formatAmount(row.usedBudget) }}</span>
              <span class="total">/ ¥{{ formatAmount(row.budget) }}</span>
            </div>
            <el-progress
              :percentage="getBudgetUsage(row)"
              :color="getProgressColor(row)"
              :stroke-width="6"
              :show-text="false"
            />
            <div class="usage-text">使用率 {{ getBudgetUsage(row) }}%</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="ROI/核销率" width="120" align="center">
        <template #default="{ row }">
          <div class="roi-cell">
            <div class="roi-row">
              <span class="label">ROI</span>
              <b class="roi" :class="{ warn: Number(row.roiValue) < 1 }">
                {{ Number(row.roiValue || 0).toFixed(2) }}
              </b>
            </div>
            <div class="roi-row">
              <span class="label">核销</span>
              <b class="rate">{{ (Number(row.redemptionRate || 0) * 100).toFixed(0) }}%</b>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="效果评级" width="110" align="center">
        <template #default="{ row }">
          <div v-if="row.efficiencyLevel" class="efficiency-cell" :style="{ background: EfficiencyLevelGradientMap[row.efficiencyLevel as number] }">
            <span class="l-name">{{ EfficiencyLevelMap[row.efficiencyLevel as number] }}</span>
            <span class="l-score">{{ Number(row.efficiencyScore || 0).toFixed(0) }}分</span>
          </div>
          <el-tag v-else type="info" size="small" effect="plain">未评级</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="数据校验" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            v-if="row.dataAuthenticity && row.dataAuthenticity !== 1"
            size="small"
            :color="DataAuthenticityColorMap[row.dataAuthenticity as number]"
            effect="dark"
          >
            {{ DataAuthenticityMap[row.dataAuthenticity as number] }}
          </el-tag>
          <el-tag v-else size="small" type="info" effect="plain">待校验</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="参与/领取" width="120" align="center">
        <template #default="{ row }">
          <div class="participation-cell">
            <div class="stat-row">
              <el-icon><User /></el-icon>
              <span>{{ row.participantCount || 0 }}人</span>
            </div>
            <div class="stat-row">
              <el-icon><Tickets /></el-icon>
              <span>{{ row.receiveCount || 0 }}次</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="适用城市" width="100" align="center">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.cities && row.cities.length > 0"
            :content="(row.cities as string[]).join('、')"
          >
            <el-tag size="small">{{ row.cities.length }}个城市</el-tag>
          </el-tooltip>
          <el-tag v-else size="small" type="success">全部</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="创建人" width="100" align="center">
        <template #default="{ row }">
          <span>{{ row.creatorName || '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="320" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-dropdown
            v-if="canChangeStatus(row)"
            trigger="click"
            @command="(cmd) => handleStatusChange(row, cmd)"
          >
            <el-button type="success" link size="small">状态<el-icon><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="row.status === 0 || row.status === 1"
                  :command="2"
                >立即上线</el-dropdown-item>
                <el-dropdown-item
                  v-if="row.status === 0"
                  :command="1"
                >提交待生效</el-dropdown-item>
                <el-dropdown-item
                  v-if="row.status === 2"
                  :command="3"
                >暂停活动</el-dropdown-item>
                <el-dropdown-item
                  v-if="row.status === 3"
                  :command="2"
                >恢复运行</el-dropdown-item>
                <el-dropdown-item
                  :command="5"
                >强制下线</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click" @command="(cmd) => handleAudienceCmd(row, cmd)">
            <el-button type="warning" link size="small">人群<el-icon><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="batch">批量运维</el-dropdown-item>
                <el-dropdown-item command="trace">定向溯源</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button link size="small" @click="handleCopy(row)">复制</el-button>
          <el-button type="info" link size="small" @click="handleEffect(row)">效果</el-button>
          <el-button
            type="danger"
            link
            size="small"
            :disabled="canNotDelete(row)"
            @click="handleDelete(row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <MarketingCampaignDialog
      v-model="dialogVisible"
      :edit-data="editData"
      @success="handleSuccess"
    />

    <el-dialog
      v-model="auditVisible"
      title="操作溯源记录"
      width="1200px"
      custom-class="audit-detail-dialog"
      destroy-on-close
    >
      <MarketingAuditTrace
        v-if="currentAuditCampaign"
        :campaign-id="currentAuditCampaign.id"
        :campaign-name="currentAuditCampaign.name"
        :scene="currentAuditCampaign.scene"
      />
    </el-dialog>

    <el-dialog
      v-model="effectVisible"
      :title="`「${currentEffectCampaign?.name || ''}」活动效果分析`"
      width="1280px"
      custom-class="effect-dialog-upgrade"
      destroy-on-close
    >
      <el-tabs v-model="effectActiveTab">
        <el-tab-pane label="效果总览" name="overview">
          <CampaignEffectDetail
            v-if="currentEffectCampaign?.id"
            :campaign-id="currentEffectCampaign.id as number"
            :campaign="currentEffectCampaign"
            @export="effectActiveTab = 'batch'"
          />
        </el-tab-pane>
        <el-tab-pane label="全链路溯源" name="funnel">
          <EffectFunnelTrace
            v-if="currentEffectCampaign?.id"
            :campaign-id="currentEffectCampaign.id as number"
          />
        </el-tab-pane>
        <el-tab-pane label="批量运维工具" name="batch">
          <EffectBatchToolkit @success="handleBatchSuccess" />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog
      v-model="riskVisible"
      title="风控拦截统计"
      width="560px"
      custom-class="risk-dialog"
      destroy-on-close
    >
      <div v-loading="riskLoading" class="risk-content">
        <div class="risk-summary">
          <div class="risk-card total">
            <el-icon><Warning /></el-icon>
            <div>
              <h4>{{ riskStats?.totalRisk || 0 }}</h4>
              <span>累计风险</span>
            </div>
          </div>
          <div class="risk-card blocked">
            <el-icon><CircleClose /></el-icon>
            <div>
              <h4>{{ riskStats?.totalBlocked || 0 }}</h4>
              <span>高风险拦截</span>
            </div>
          </div>
        </div>
        <div class="risk-by-action">
          <div class="list-title">风险类型分布</div>
          <div v-if="riskStats?.riskByAction?.length" class="risk-list">
            <div
              v-for="item in riskStats.riskByAction"
              :key="item.label"
              class="risk-row"
            >
              <span class="action-label">{{ item.label }}</span>
              <div class="progress-wrap">
                <el-progress
                  :percentage="item.count > 0 ? Math.round(item.blocked / item.count * 100) : 0"
                  :stroke-width="10"
                  :show-text="false"
                  color="#f56c6c"
                  style="width: 100%"
                />
              </div>
              <span class="action-stats">
                {{ item.blocked }}/{{ item.count }}
              </span>
            </div>
          </div>
          <el-empty v-else description="暂无风控数据" :image-size="80" />
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="audienceBatchVisible"
      :title="`「${currentAudienceCampaign?.name || ''}」人群批量运维`"
      width="820px"
      custom-class="audience-batch-dialog"
      destroy-on-close
    >
      <AudienceBatchOperation
        v-if="currentAudienceCampaign?.id"
        :campaign-id="currentAudienceCampaign.id as number"
        @cancel="audienceBatchVisible = false"
        @success="handleAudienceSuccess"
      />
    </el-dialog>

    <el-dialog
      v-model="audienceTraceVisible"
      :title="`「${currentAudienceCampaign?.name || ''}」人群定向溯源`"
      width="1200px"
      custom-class="audience-trace-dialog"
      destroy-on-close
    >
      <AudienceAuditTrace
        v-if="currentAudienceCampaign?.id"
        :campaign-id="currentAudienceCampaign.id as number"
      />
    </el-dialog>

    <el-dialog
      v-model="effectBatchVisible"
      title="效果数据批量运维"
      width="960px"
      custom-class="effect-batch-dialog"
      destroy-on-close
    >
      <EffectBatchToolkit @success="handleBatchSuccess" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Promotion, Plus, Refresh, Sunny, Moon, User, Tickets,
  ArrowDown, Wallet, TrendCharts, DataAnalysis, List,
  Warning, CircleClose, DataLine
} from '@element-plus/icons-vue'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import MarketingCampaignDialog from '@/components/MarketingCampaignDialog/index.vue'
import MarketingBatchOperation from '@/components/MarketingBatchOperation/index.vue'
import MarketingAuditTrace from '@/components/MarketingAuditTrace/index.vue'
import AudienceBatchOperation from '@/components/AudienceBatchOperation/index.vue'
import AudienceAuditTrace from '@/components/AudienceAuditTrace/index.vue'
import CampaignEffectDetail from '@/components/CampaignEffectDetail/index.vue'
import EffectFunnelTrace from '@/components/EffectFunnelTrace/index.vue'
import EffectBatchToolkit from '@/components/EffectBatchToolkit/index.vue'
import {
  getMarketingListApi,
  deleteMarketingApi,
  updateMarketingStatusApi,
  copyCampaignApi,
  getRiskStatsApi,
  getAudienceRiskStatsApi,
  batchEvaluateApi
} from '@/api/marketing'
import {
  CampaignScene,
  CampaignSceneMap,
  CampaignSceneColorMap,
  CampaignSceneGradientMap,
  CampaignStatus,
  CampaignStatusMap,
  CampaignStatusColorMap,
  TargetUser,
  TargetUserMap,
  TargetUserColorMap,
  SceneDefaultConfig,
  AudiencePurpose,
  AudiencePurposeMap,
  AudiencePurposeColorMap,
  EfficiencyLevel,
  EfficiencyLevelMap,
  EfficiencyLevelColorMap,
  EfficiencyLevelGradientMap,
  DataAuthenticityMap,
  DataAuthenticityColorMap
} from '@/enums/marketing'
import { formatDate } from '@/utils/format'
import type { MarketingCampaign, RiskStats } from '@/types/marketing'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<MarketingCampaign[]>([])
const total = ref(0)
const selectedItems = ref<MarketingCampaign[]>([])

const dialogVisible = ref(false)
const editData = ref<Partial<MarketingCampaign> | null>(null)
const auditVisible = ref(false)
const currentAuditCampaign = ref<MarketingCampaign | null>(null)
const effectVisible = ref(false)
const effectActiveTab = ref<'overview' | 'funnel' | 'batch'>('overview')
const currentEffectCampaign = ref<MarketingCampaign | null>(null)
const riskVisible = ref(false)
const riskLoading = ref(false)
const riskStats = ref<RiskStats | null>(null)
const audienceBatchVisible = ref(false)
const audienceTraceVisible = ref(false)
const currentAudienceCampaign = ref<MarketingCampaign | null>(null)
const effectBatchVisible = ref(false)
const evaluating = ref(false)

const sceneList = [
  { value: CampaignScene.NEW_USER_GIFT, label: '新人礼', desc: '新用户注册专享首单优惠', icon: 'StarFilled', gradient: CampaignSceneGradientMap[CampaignScene.NEW_USER_GIFT], defaultTarget: '仅新用户' },
  { value: CampaignScene.HOLIDAY_GIFT, label: '节日礼', desc: '节假日限定福利大礼包', icon: 'Present', gradient: CampaignSceneGradientMap[CampaignScene.HOLIDAY_GIFT], defaultTarget: '全部用户' },
  { value: CampaignScene.TRAVEL_SUBSIDY, label: '出行补贴', desc: '日常普惠出行立减补贴', icon: 'Van', gradient: CampaignSceneGradientMap[CampaignScene.TRAVEL_SUBSIDY], defaultTarget: '全部用户' },
  { value: CampaignScene.RECALL_WELFARE, label: '召回福利', desc: '流失用户回归专属权益', icon: 'UserFilled', gradient: CampaignSceneGradientMap[CampaignScene.RECALL_WELFARE], defaultTarget: '流失用户' }
]

const headerStats = computed(() => {
  const running = tableData.value.filter(i => i.status === CampaignStatus.RUNNING).length
  const pending = tableData.value.filter(i => i.status === CampaignStatus.PENDING).length
  const draft = tableData.value.filter(i => i.status === CampaignStatus.DRAFT).length
  const totalBudget = tableData.value.reduce((sum, i) => sum + (Number(i.usedBudget) || 0), 0)
  return [
    { key: 'running', label: '进行中', count: running, icon: 'VideoPlay', gradient: 'linear-gradient(135deg, #67c23a, #85ce61)' },
    { key: 'pending', label: '待生效', count: pending, icon: 'Clock', gradient: 'linear-gradient(135deg, #e6a23c, #f0c78a)' },
    { key: 'draft', label: '草稿数', count: draft, icon: 'Document', gradient: 'linear-gradient(135deg, #909399, #a6a9ad)' },
    { key: 'budget', label: '已用预算(万)', count: (totalBudget / 10000).toFixed(1), icon: 'Wallet', gradient: 'linear-gradient(135deg, #409eff, #66b1ff)' }
  ]
})

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  scene: undefined as number | undefined,
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  targetUser: undefined as number | undefined,
  keyword: '',
  startDate: '',
  endDate: ''
})

const searchFields = [
  { prop: 'keyword', label: '活动名称/编码', type: 'input', placeholder: '请输入关键词' },
  { prop: 'scene', label: '活动场景', type: 'select', options: [
    { value: 1, label: '新人礼' },
    { value: 2, label: '节日礼' },
    { value: 3, label: '出行补贴' },
    { value: 4, label: '召回福利' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: 0, label: '草稿' },
    { value: 1, label: '待生效' },
    { value: 2, label: '进行中' },
    { value: 3, label: '已暂停' },
    { value: 4, label: '已结束' },
    { value: 5, label: '已下线' }
  ]},
  { prop: 'targetUser', label: '目标人群', type: 'select', options: [
    { value: 1, label: '全部用户' },
    { value: 2, label: '新用户' },
    { value: 3, label: '老用户' },
    { value: 4, label: '流失用户' },
    { value: 5, label: '高价值用户' }
  ]}
]

const getSceneName = (scene: number) => CampaignSceneMap[scene] || '未知'
const getSceneColor = (scene: number) => CampaignSceneGradientMap[scene as CampaignScene] || CampaignSceneColorMap[scene] || '#909399'
const getTargetUserName = (t: number) => TargetUserMap[t as TargetUser] || '未知'
const formatAmount = (n: any) => Number(n || 0).toLocaleString()

const getBudgetUsage = (row: MarketingCampaign) => {
  if (!row.budget || Number(row.budget) === 0) return 0
  return Math.min(100, Math.round((Number(row.usedBudget) / Number(row.budget)) * 100))
}

const getProgressColor = (row: MarketingCampaign) => {
  const usage = getBudgetUsage(row)
  if (usage >= 90) return '#f56c6c'
  if (usage >= 70) return '#e6a23c'
  return '#67c23a'
}

const canChangeStatus = (row: MarketingCampaign) => [0, 1, 2, 3].includes(row.status)
const canNotDelete = (row: MarketingCampaign) => [1, 2].includes(row.status)

const getList = async () => {
  loading.value = true
  try {
    const res = await getMarketingListApi(queryParams)
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '获取活动列表失败')
  } finally {
    loading.value = false
  }
}

const loadRiskStats = async () => {
  riskLoading.value = true
  try {
    const res = await getRiskStatsApi()
    riskStats.value = res.data as RiskStats
  } catch (e) {} finally {
    riskLoading.value = false
  }
}

const handleSearch = (params: any) => {
  Object.assign(queryParams, params)
  queryParams.page = 1
  getList()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 10
  queryParams.scene = undefined
  queryParams.type = undefined
  queryParams.status = undefined
  queryParams.targetUser = undefined
  queryParams.keyword = ''
  getList()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  getList()
}

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  queryParams.page = 1
  getList()
}

const handleSelectionChange = (rows: MarketingCampaign[]) => {
  selectedItems.value = rows
}

const handleQuickCreate = (scene: number) => {
  const defaults = SceneDefaultConfig[scene] || {}
  editData.value = {
    scene,
    type: scene,
    ...defaults
  }
  nextTick(() => { dialogVisible.value = true })
}

const handleAdd = () => {
  editData.value = null
  dialogVisible.value = true
}

const handleEdit = (row: MarketingCampaign) => {
  editData.value = { ...row }
  dialogVisible.value = true
}

const handleSuccess = () => {
  getList()
}

const handleCopy = async (row: MarketingCampaign) => {
  try {
    await ElMessageBox.confirm(`确定复制活动「${row.name}」吗？`, '提示', {
      confirmButtonText: '确定复制',
      type: 'info'
    })
    const res = await copyCampaignApi(row.id)
    ElMessage.success('复制成功')
    if (res.data?.id) {
      editData.value = res.data as MarketingCampaign
      dialogVisible.value = true
    }
    getList()
  } catch (e) {}
}

const handleStatusChange = async (row: MarketingCampaign, status: number) => {
  try {
    const statusLabel = CampaignStatusMap[status as CampaignStatus] || ''
    await ElMessageBox.confirm(
      `确定将活动「${row.name}」${status === 5 ? '强制下线' : '更新为「' + statusLabel + '」'}吗？`,
      '提示',
      { type: 'warning' }
    )
    await updateMarketingStatusApi(row.id, status)
    ElMessage.success('状态更新成功')
    getList()
  } catch (e: any) {
    if (e?.message) ElMessage.error(e.message)
  }
}

const handleDelete = async (row: MarketingCampaign) => {
  try {
    await ElMessageBox.confirm(
      `确定删除活动「${row.name}」吗？删除后不可恢复。`,
      '警告',
      { type: 'warning', confirmButtonText: '确认删除', confirmButtonClass: 'el-button--danger' }
    )
    await deleteMarketingApi(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (e) {}
}

const handleShowAudit = (row: MarketingCampaign) => {
  currentAuditCampaign.value = row
  auditVisible.value = true
}

const handleAudienceCmd = (row: MarketingCampaign, cmd: string) => {
  currentAudienceCampaign.value = row
  if (cmd === 'batch') {
    audienceBatchVisible.value = true
  } else if (cmd === 'trace') {
    audienceTraceVisible.value = true
  }
}

const handleAudienceSuccess = () => {
  audienceBatchVisible.value = false
  getList()
}

const handleEffect = async (row: MarketingCampaign) => {
  currentEffectCampaign.value = row
  effectActiveTab.value = 'overview'
  effectVisible.value = true
}

const handleBatchSuccess = async (action: string) => {
  if (action === 'mark') {
    try {
      const ids = tableData.value.filter(c => c.status === 2).map(c => c.id as number)
      if (ids.length) await batchEvaluateApi(ids)
    } catch (e) {}
    getList()
  }
}

const handleBatchReEvaluate = async () => {
  const ids = tableData.value.filter(c => c.status === 2).map(c => c.id as number)
  if (ids.length === 0) {
    ElMessage.warning('当前列表中没有进行中的活动可计算评级')
    return
  }
  try {
    evaluating.value = true
    await batchEvaluateApi(ids)
    ElMessage.success(`已成功触发${ids.length}个活动的评级重算`)
    getList()
  } catch (e: any) {
    ElMessage.error(e.message || '批量计算评级失败')
  } finally {
    evaluating.value = false
  }
}

watch(riskVisible, (val) => {
  if (val) loadRiskStats()
})

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.campaign-management {
  padding: 20px;

  .page-header {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 50%, #409eff 100%);
    border-radius: 16px;
    padding: 24px 28px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fff;
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.25);

    .header-left {
      .page-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 700;
      }
      .page-desc {
        margin: 0;
        font-size: 13px;
        opacity: 0.85;
      }
    }

    .header-stats {
      display: flex;
      gap: 20px;

      .stat-item {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 12px;

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
        }

        .stat-text {
          h4 {
            margin: 0 0 2px 0;
            font-size: 20px;
            font-weight: 700;
          }
          span {
            font-size: 12px;
            opacity: 0.9;
          }
        }
      }
    }
  }

  .scene-quick-entry {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 16px;

    .scene-card {
      background: #fff;
      border-radius: 12px;
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: all 0.3s;
      border: 1px solid #ebeef5;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
      }

      .scene-badge {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 24px;
        flex-shrink: 0;
      }

      .scene-info {
        flex: 1;
        min-width: 0;
        h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }
        p {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #909399;
        }
        .scene-tags {
          display: flex;
          gap: 6px;
        }
      }
    }
  }

  .campaign-cell {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    .scene-tag {
      padding: 4px 10px;
      border-radius: 6px;
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .campaign-text {
      .name {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        line-height: 1.4;
      }
      .code {
        margin: 0;
        font-size: 12px;
        color: #c0c4cc;
      }
    }
  }

  .time-cell {
    .time-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #606266;
      line-height: 1.8;

      .el-icon {
        color: #909399;
        font-size: 12px;
      }
    }
  }

  .amount-cell {
    text-align: center;
    .amount {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: #f56c6c;
    }
    .threshold {
      font-size: 11px;
      color: #909399;
    }
  }

  .budget-cell {
    .budget-row {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 4px;
      .used {
        font-size: 13px;
        font-weight: 600;
        color: #409eff;
      }
      .total {
        font-size: 12px;
        color: #909399;
      }
    }
    .usage-text {
      margin-top: 4px;
      font-size: 11px;
      color: #909399;
      text-align: right;
    }
  }

  .participation-cell {
    .stat-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 12px;
      color: #606266;
      line-height: 1.8;

      .el-icon {
        color: #409eff;
        font-size: 12px;
      }
    }
  }

  .roi-cell {
    text-align: left;
    .roi-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 1.8;
      font-size: 12px;
      span.label { color: #909399; }
      b.roi { color: #1f7eff; font-weight: 600; }
      b.roi.warn { color: #f56c6c; }
      b.rate { color: #303133; font-weight: 600; }
    }
  }

  .efficiency-cell {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 84px;
    padding: 5px 10px;
    border-radius: 8px;
    color: #fff;
    .l-name { font-size: 12px; font-weight: 600; }
    .l-score { font-size: 11px; opacity: 0.92; margin-top: 2px; }
  }

  .target-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .coverage-cell {
    text-align: left;

    .coverage-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 1.8;
      font-size: 12px;

      span { color: #909399; }
      b { font-weight: 600; color: #303133; }
      b.valid { color: #67c23a; }
      b.risk { color: #f56c6c; }
    }
  }

  .empty-coverage {
    color: #c0c4cc;
    font-size: 12px;
  }

  .audience-batch-dialog,
  .audience-trace-dialog,
  .effect-batch-dialog {
    :deep(.el-dialog) {
      border-radius: 16px;
    }
    :deep(.el-dialog__header) {
      background: linear-gradient(135deg, #409eff, #66b1ff);
      margin: 0;
      .el-dialog__title { color: #fff; }
      .el-dialog__close { color: #fff; }
    }
    :deep(.el-dialog__body) {
      padding: 20px 24px;
      max-height: 75vh;
      overflow-y: auto;
    }
  }

  .audit-detail-dialog {
    :deep(.el-dialog) {
      border-radius: 16px;
      overflow: hidden;
    }
    :deep(.el-dialog__header) {
      background: linear-gradient(135deg, #409eff, #66b1ff);
      margin: 0;
      .el-dialog__title { color: #fff; }
      .el-dialog__close { color: #fff; }
    }
    :deep(.el-dialog__body) {
      padding: 0;
      max-height: 75vh;
      overflow: hidden;
    }
  }

  .effect-dialog {
    :deep(.el-dialog) {
      border-radius: 16px;
    }

    .effect-content {
      .effect-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 18px;

        .effect-card {
          background: linear-gradient(135deg, #ecf5ff, #d9ecff);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;

          .card-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, #409eff, #66b1ff);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }

          .card-text {
            h4 {
              margin: 0 0 2px 0;
              font-size: 20px;
              font-weight: 700;
              color: #303133;
            }
            span { font-size: 12px; color: #606266; }
          }
        }
      }

      .budget-chart-card, .order-card {
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 16px;
          .el-icon { color: #409eff; }
        }
      }

      .chart-content {
        display: flex;
        align-items: center;
        gap: 40px;
        padding: 0 20px;

        .chart-info {
          flex: 1;
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px dashed #ebeef5;

            &:last-child { border-bottom: none; }

            .label { color: #909399; font-size: 13px; }
            b { font-size: 16px; color: #303133; }
            .text-primary { color: #409eff; }
            .text-success { color: #67c23a; }
          }
        }
      }

      .order-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;

        .order-item {
          padding: 16px;
          background: #f5f7fa;
          border-radius: 10px;
          text-align: center;

          .label {
            display: block;
            margin-bottom: 10px;
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  .risk-dialog {
    :deep(.el-dialog) { border-radius: 16px; }

    .risk-content {
      .risk-summary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
        margin-bottom: 20px;

        .risk-card {
          padding: 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 14px;

          &.total {
            background: linear-gradient(135deg, #fdf6ec, #faecd8);
            .el-icon {
              width: 48px; height: 48px;
              border-radius: 12px;
              background: #e6a23c;
              color: #fff;
              font-size: 22px;
              display: flex; align-items: center; justify-content: center;
            }
          }

          &.blocked {
            background: linear-gradient(135deg, #fef0f0, #fde2e2);
            .el-icon {
              width: 48px; height: 48px;
              border-radius: 12px;
              background: #f56c6c;
              color: #fff;
              font-size: 22px;
              display: flex; align-items: center; justify-content: center;
            }
          }

          h4 {
            margin: 0 0 4px 0;
            font-size: 26px;
            font-weight: 700;
            color: #303133;
          }
          span { font-size: 13px; color: #606266; }
        }
      }

      .list-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid #ebeef5;
      }

      .risk-list {
        .risk-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;

          .action-label {
            width: 100px;
            font-size: 13px;
            color: #606266;
            flex-shrink: 0;
          }

          .progress-wrap {
            flex: 1;
          }

          .action-stats {
            width: 80px;
            text-align: right;
            font-size: 12px;
            color: #f56c6c;
            font-weight: 600;
          }
        }
      }
    }
  }
}
</style>

<template>
  <div class="user-behavior-monitor">
    <div class="page-header">
      <h2>用户行为数据监测</h2>
      <div>
        <el-button type="warning" :icon="Warning" :disabled="selectedIds.length === 0" @click="riskBatchVisible = true">
          批量风控处理
        </el-button>
      </div>
    </div>

    <div class="filter-section">
      <el-tabs v-model="filterForm.behaviorType" class="behavior-tabs">
        <el-tab-pane label="全部行为" name="" />
        <el-tab-pane label="浏览行为" name="browse" />
        <el-tab-pane label="下单行为" name="order" />
        <el-tab-pane label="售后行为" name="aftersale" />
        <el-tab-pane label="营销参与" name="marketing" />
      </el-tabs>

      <div class="filter-row">
        <div :class="['filter-field', { 'field-error': fieldErrors.dateRange }]">
          <div class="field-label">时间周期</div>
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="validateDateRange"
            style="width: 300px;"
          />
          <div v-if="fieldErrors.dateRange" class="field-error-tip">{{ fieldErrors.dateRange }}</div>
        </div>

        <div class="filter-field">
          <div class="field-label">用户等级</div>
          <el-select v-model="filterForm.userLevel" placeholder="全部等级" clearable style="width: 140px;">
            <el-option
              v-for="item in userLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="filter-field">
          <div class="field-label">注册渠道</div>
          <el-select v-model="filterForm.registerChannel" placeholder="全部渠道" clearable style="width: 140px;">
            <el-option
              v-for="item in registerChannelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="filter-field">
          <div class="field-label">风险等级</div>
          <el-select v-model="filterForm.riskLevel" placeholder="全部等级" clearable style="width: 140px;">
            <el-option
              v-for="item in riskLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="filter-field">
          <div class="field-label">仅异常</div>
          <el-switch v-model="filterForm.onlyAbnormal" />
        </div>

        <div class="filter-field">
          <div class="field-label">关键词</div>
          <el-input
            v-model="filterForm.keyword"
            placeholder="用户/IP/行为内容"
            clearable
            style="width: 200px;"
          />
        </div>

        <div style="display: flex; gap: 8px;">
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </div>
      </div>
    </div>

    <div class="stats-section" :key="statsRefreshKey">
      <div class="stat-card">
        <el-icon class="stat-icon" color="#1890ff"><DataLine /></el-icon>
        <div class="stat-label">行为总次数</div>
        <div class="stat-value">
          <span class="number-roll" :ref="el => registerStatRef('total', el)">{{ stats.totalBehaviors }}</span>
          <span class="stat-unit">次</span>
        </div>
        <div class="stat-sub">周期: {{ stats.periodDays }}天</div>
      </div>

      <div class="stat-card">
        <el-icon class="stat-icon" color="#52c41a"><User /></el-icon>
        <div class="stat-label">活跃用户数</div>
        <div class="stat-value">
          <span class="number-roll" :ref="el => registerStatRef('active', el)">{{ stats.activeUserCount }}</span>
          <span class="stat-unit">人</span>
        </div>
        <div class="stat-sub">日均: {{ stats.avgDailyActive }} 人</div>
      </div>

      <div class="stat-card">
        <el-icon class="stat-icon" color="#722ed1"><RefreshRight /></el-icon>
        <div class="stat-label">用户复购率</div>
        <div class="stat-value">
          <span class="number-roll" :ref="el => registerStatRef('repurchase', el)">{{ stats.repurchaseRate }}</span>
          <span class="stat-unit">%</span>
        </div>
        <div class="stat-sub">二次购买用户占比</div>
      </div>

      <div class="stat-card">
        <el-icon class="stat-icon" color="#faad14"><Warning /></el-icon>
        <div class="stat-label">异常行为次数</div>
        <div class="stat-value" :class="{ 'stat-highlight': stats.abnormalCount > 50 }">
          <span class="number-roll" :ref="el => registerStatRef('abnormal', el)">{{ stats.abnormalCount }}</span>
          <span class="stat-unit">次</span>
        </div>
        <div class="stat-sub">
          <span v-if="stats.abnormalByType?.fraud" style="color:#eb2f96">刷单{{ stats.abnormalByType.fraud }}</span>
          <span v-if="stats.abnormalByType?.abuse" style="color:#fa541c;margin-left:6px">售后{{ stats.abnormalByType.abuse }}</span>
          <span v-if="stats.abnormalByType?.wool" style="color:#722ed1;margin-left:6px">薅羊{{ stats.abnormalByType.wool }}</span>
        </div>
      </div>

      <div class="stat-card">
        <el-icon class="stat-icon" color="#ff4d4f"><CircleClose /></el-icon>
        <div class="stat-label">高危风险用户</div>
        <div class="stat-value stat-highlight">
          <span class="number-roll" :ref="el => registerStatRef('risk', el)">{{ stats.riskDistribution?.[3] || 0 }}</span>
          <span class="stat-unit">人</span>
        </div>
        <div class="stat-sub">
          预警: {{ stats.riskDistribution?.[1] || 0 }} / 关注: {{ stats.riskDistribution?.[2] || 0 }}
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="table-card">
        <div class="table-header">
          <div class="table-title">行为明细列表</div>
          <el-button size="small" :icon="Refresh" @click="fetchAll">刷新数据</el-button>
        </div>

        <el-table
          :data="tableData"
          v-loading="loading"
          border
          @selection-change="handleSelectionChange"
          :row-class-name="getRowClassName"
          size="small"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="用户" width="140">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-avatar :size="28">{{ row.user?.nickname?.charAt(0) || row.username?.charAt(0) }}</el-avatar>
                <div>
                  <div style="font-size: 13px; font-weight: 500;">{{ row.user?.nickname || row.username }}</div>
                  <div style="font-size: 11px; color: #909399;">Lv.{{ row.user?.userLevel || '-' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="行为大类" width="100">
            <template #default="{ row }">
              <el-tag size="small" :color="getBehaviorTypeColor(row.behaviorType)" effect="light">
                {{ getBehaviorTypeLabel(row.behaviorType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="behaviorName" label="行为" width="110" />
          <el-table-column prop="targetName" label="操作对象" min-width="140" show-overflow-tooltip />
          <el-table-column label="风险" width="100">
            <template #default="{ row }">
              <template v-if="row.isAbnormal">
                <span class="risk-tag-high">
                  <el-icon style="font-size: 11px; vertical-align: middle;"><WarningFilled /></el-icon>
                  {{ getAbnormalLabel(row.abnormalType) }}
                </span>
              </template>
              <el-tag v-else size="small" type="success" effect="plain">正常</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="90" />
          <el-table-column prop="ip" label="IP" width="130" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="时间" width="160" />
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleTrace(row)">行为溯源</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchList"
            @current-change="fetchList"
          />
        </div>
      </div>

      <div>
        <div class="side-card" style="margin-bottom: 16px;">
          <div class="card-title">偏好品类 TOP 5</div>
          <div v-if="preferences.length > 0">
            <div v-for="(p, idx) in preferences" :key="idx" class="preference-item">
              <span class="pref-name" :title="p.category">{{ p.category }}</span>
              <div class="pref-bar">
                <div
                  class="pref-fill"
                  :style="{ width: ((p.count / (preferences[0]?.count || 1)) * 100) + '%' }"
                ></div>
              </div>
              <span class="pref-count">{{ p.count }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="80" />
        </div>

        <div class="side-card">
          <div class="card-title">风险用户分布</div>
          <div class="risk-dist">
            <div class="risk-item">
              <div class="risk-num" style="color: #52c41a;">{{ stats.riskDistribution?.[0] || 0 }}</div>
              <div class="risk-label">正常</div>
            </div>
            <div class="risk-item">
              <div class="risk-num" style="color: #faad14;">{{ stats.riskDistribution?.[1] || 0 }}</div>
              <div class="risk-label">预警</div>
            </div>
            <div class="risk-item">
              <div class="risk-num" style="color: #fa8c16;">{{ stats.riskDistribution?.[2] || 0 }}</div>
              <div class="risk-label">关注</div>
            </div>
            <div class="risk-item">
              <div class="risk-num" style="color: #ff4d4f;">{{ stats.riskDistribution?.[3] || 0 }}</div>
              <div class="risk-label">高危</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="traceVisible"
      title="用户行为溯源"
      width="900px"
      :close-on-click-modal="false"
    >
      <UserBehaviorTrace
        v-if="traceUserId"
        :user-id="traceUserId"
        :start-time="filterForm.dateRange?.[0]"
        :end-time="filterForm.dateRange?.[1]"
      />
    </el-dialog>

    <el-dialog
      v-model="riskBatchVisible"
      title="批量风控处理"
      width="620px"
      :close-on-click-modal="false"
    >
      <UserRiskBatchPanel
        :selected-ids="selectedIds"
        :selected-rows="selectedRows"
        @success="handleRiskSuccess"
        @cancel="riskBatchVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Warning,
  WarningFilled,
  DataLine,
  User,
  RefreshRight,
  CircleClose
} from '@element-plus/icons-vue'
import {
  UserLevelEnum,
  RegisterChannelEnum,
  RiskLevelEnum,
  BehaviorTypeEnum,
  AbnormalTypeEnum,
  UserTagOptions,
  getEnumOptions,
  getEnumLabel,
  getEnumColor
} from '@/utils/enums'
import {
  getBehaviorList,
  getBehaviorStats
} from '@/api/behavior'
import UserBehaviorTrace from '@/components/Behavior/UserBehaviorTrace.vue'
import UserRiskBatchPanel from '@/components/Behavior/UserRiskBatchPanel.vue'

const loading = ref(false)
const statsRefreshKey = ref(0)
const traceVisible = ref(false)
const traceUserId = ref(null)
const riskBatchVisible = ref(false)
const selectedIds = ref([])
const selectedRows = ref([])

const filterForm = reactive({
  behaviorType: '',
  dateRange: [],
  userLevel: null,
  registerChannel: '',
  riskLevel: '',
  onlyAbnormal: false,
  keyword: ''
})

const fieldErrors = reactive({
  dateRange: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const stats = reactive({
  totalBehaviors: 0,
  activeUserCount: 0,
  avgDailyActive: 0,
  abnormalCount: 0,
  abnormalByType: {},
  repurchaseRate: 0,
  preferences: [],
  riskDistribution: {},
  periodDays: 30
})

const tableData = ref([])
const preferences = computed(() => stats.preferences || [])

const userLevelOptions = getEnumOptions(UserLevelEnum)
const registerChannelOptions = getEnumOptions(RegisterChannelEnum)
const riskLevelOptions = getEnumOptions(RiskLevelEnum)

const getBehaviorTypeLabel = (t) => getEnumLabel(BehaviorTypeEnum, t) || t
const getBehaviorTypeColor = (t) => getEnumColor(BehaviorTypeEnum, t) || '#909399'
const getAbnormalLabel = (t) => getEnumLabel(AbnormalTypeEnum, t) || '异常'

const registerStatRef = () => {}

const getRowClassName = ({ row }) => {
  if (row.isAbnormal) return 'risk-row'
  if (row.abnormalLevel >= 3) return 'risk-highlight'
  return ''
}

const validateDateRange = () => {
  fieldErrors.dateRange = ''
  if (filterForm.dateRange?.length === 2) {
    const diff = Math.ceil((new Date(filterForm.dateRange[1]) - new Date(filterForm.dateRange[0])) / (1000 * 60 * 60 * 24))
    if (diff > 90) {
      fieldErrors.dateRange = '查询周期不能超过90天'
    }
    if (diff < 0) {
      fieldErrors.dateRange = '结束日期不能早于开始日期'
    }
  }
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.userId || r.user?.id || r.id)
}

const handleSearch = async () => {
  validateDateRange()
  if (fieldErrors.dateRange) {
    ElMessage.warning(fieldErrors.dateRange)
    return
  }
  pagination.page = 1
  fetchAll()
}

const handleReset = () => {
  filterForm.behaviorType = ''
  filterForm.dateRange = []
  filterForm.userLevel = null
  filterForm.registerChannel = ''
  filterForm.riskLevel = ''
  filterForm.onlyAbnormal = false
  filterForm.keyword = ''
  fieldErrors.dateRange = ''
  pagination.page = 1
  fetchAll()
}

const handleTrace = (row) => {
  traceUserId.value = row.userId || row.user?.id
  traceVisible.value = true
}

const handleRiskSuccess = () => {
  riskBatchVisible.value = false
  selectedIds.value = []
  selectedRows.value = []
  fetchAll()
}

const animateNumber = (key, target) => {
  nextTick(() => {
    statsRefreshKey.value++
  })
}

const fetchStats = async () => {
  try {
    const params = {}
    if (filterForm.behaviorType) params.behaviorType = filterForm.behaviorType
    if (filterForm.userLevel) params.userLevel = filterForm.userLevel
    if (filterForm.registerChannel) params.registerChannel = filterForm.registerChannel
    if (filterForm.dateRange?.length === 2) {
      params.startTime = filterForm.dateRange[0]
      params.endTime = filterForm.dateRange[1]
    }
    const res = await getBehaviorStats(params)
    const data = res.data || {}
    animateNumber('total', data.totalBehaviors || 0)
    Object.assign(stats, data)
  } catch (e) {
    ElMessage.error(e.message || '统计加载失败')
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterForm.behaviorType) params.behaviorType = filterForm.behaviorType
    if (filterForm.userLevel) params.userLevel = filterForm.userLevel
    if (filterForm.registerChannel) params.registerChannel = filterForm.registerChannel
    if (filterForm.riskLevel !== '' && filterForm.riskLevel !== null && filterForm.riskLevel !== undefined) {
      params.riskLevel = filterForm.riskLevel
    }
    if (filterForm.onlyAbnormal) params.isAbnormal = 1
    if (filterForm.keyword) params.keyword = filterForm.keyword
    if (filterForm.dateRange?.length === 2) {
      params.startTime = filterForm.dateRange[0]
      params.endTime = filterForm.dateRange[1]
    }
    const res = await getBehaviorList(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    ElMessage.error(e.message || '列表加载失败')
  } finally {
    loading.value = false
  }
}

const fetchAll = () => {
  fetchStats()
  fetchList()
}

onMounted(() => {
  const now = new Date()
  const before = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
  filterForm.dateRange = [
    `${before.getFullYear()}-${String(before.getMonth() + 1).padStart(2, '0')}-${String(before.getDate()).padStart(2, '0')}`,
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  ]
  fetchAll()
})
</script>

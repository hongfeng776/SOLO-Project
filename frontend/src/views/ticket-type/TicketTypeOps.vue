<template>
  <div class="ticket-type-ops">
    <div class="page-header">
      <div>
        <h2>票种规则配置</h2>
        <div style="color: #909399; font-size: 13px; margin-top: 4px;">
          统一管控全景区票务品类、售卖与使用约束，联动前台展示与购买流程
        </div>
      </div>
      <div class="header-actions">
        <el-tooltip content="查看票种全流程操作记录">
          <el-button :icon="Clock" @click="openAllTrace" v-ripple>全流程溯源</el-button>
        </el-tooltip>
        <el-tooltip :content="canAdd ? '新增票种' : '无票种配置权限'">
          <el-button type="primary" :icon="Plus" :disabled="!canAdd" @click="handleAdd" v-ripple>新增票种</el-button>
        </el-tooltip>
      </div>
    </div>

    <el-alert v-if="!hasPermission" type="error" show-icon class="permission-alert"
      title="权限不足" :closable="false"
      description="您当前角色没有访问票种规则配置模块的权限，请联系管理员开通。"
    />

    <template v-else>
      <transition name="toast-fade">
        <div v-if="showUpdateToast" class="rule-update-toast">
          <div class="toast-info">
            <div class="toast-title">
              <el-icon><BellFilled /></el-icon>
              票种规则更新完成
            </div>
            <div class="toast-desc">{{ toastMessage }}，已同步至前台展示与购买权限，并推送给已下单用户</div>
          </div>
          <el-button size="small" link @click="showUpdateToast = false">知道了</el-button>
        </div>
      </transition>

      <div class="stats-overview">
        <div class="stat-card stat-total">
          <div class="stat-label">票种总数</div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-sub">当前分类</div>
        </div>
        <div class="stat-card stat-onsale">
          <div class="stat-label">在售票种</div>
          <div class="stat-value">{{ stats.onsale }}</div>
          <div class="stat-sub">已上架且启用</div>
        </div>
        <div class="stat-card stat-reservation">
          <div class="stat-label">需预约</div>
          <div class="stat-value">{{ stats.needReserve }}</div>
          <div class="stat-sub">启用预约规则</div>
        </div>
        <div class="stat-card stat-violation">
          <div class="stat-label">违规/存疑</div>
          <div class="stat-value">{{ stats.violation }}</div>
          <div class="stat-sub">虚假/违规/待审核</div>
        </div>
      </div>

      <div class="tab-section">
        <el-tabs v-model="activeCategory" type="card" @tab-change="onCategoryChange">
          <el-tab-pane v-for="c in categoryTabs" :key="c.value" :name="c.value">
            <template #label>
              <el-icon><component :is="c.icon" /></el-icon>
              <span>{{ c.label }}</span>
              <el-badge v-if="getCategoryCount(c.value) > 0"
                :value="getCategoryCount(c.value)"
                :style="{ background: c.color, marginLeft: '8px' }" />
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="search-form focus-glow">
        <el-form :inline="true" :model="searchForm" @submit.prevent size="default">
          <el-form-item label="票种名称">
            <el-input v-model="searchForm.keyword" placeholder="票种/人群/退改说明" clearable style="width: 220px;" @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="所属景点">
            <el-input v-model="searchForm.scenicSpotName" placeholder="景点名称" clearable style="width: 180px;" />
          </el-form-item>
          <el-form-item label="所在城市">
            <el-input v-model="searchForm.city" placeholder="城市" clearable style="width: 140px;" />
          </el-form-item>
          <el-form-item label="上下架">
            <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px;">
              <el-option label="已上架" :value="1" />
              <el-option label="已下架" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="启用状态">
            <el-select v-model="searchForm.enabled" placeholder="全部" clearable style="width: 120px;">
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch" v-ripple>搜索</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <TicketTypeBatchToolbar
        :selectedIds="Array.from(selectedIds)"
        :selectedTickets="selectedTickets"
        :activeCategory="activeCategory"
        @clear="clearSelection"
        @success="onBatchSuccess"
        @toast="(m) => triggerToast(m)"
      />

      <div class="ticket-list-area" v-loading="loading">
        <div class="ticket-card-grid" v-if="tableData.length > 0">
          <div v-for="t in tableData" :key="t.id"
            :class="['ticket-card', 'tt-' + t.ticketCategory, {
              selected: selectedIds.has(t.id),
              'partial-refresh': refreshId === t.id
            }]"
            @dblclick="handleEdit(t)"
          >
            <div class="card-checkbox" @click.stop="toggleSelect(t)">
              <el-checkbox v-model="t._checked" :checked="selectedIds.has(t.id)" />
            </div>

            <div class="card-header">
              <el-tooltip effect="dark" placement="top" :show-after="300">
                <template #content>
                  <div style="max-width: 300px; line-height: 1.7;">
                    <div style="font-weight: 600; margin-bottom: 6px;">{{ t.name }}</div>
                    <div>景点：{{ t.spotName || '-' }}</div>
                    <div>适用人群：{{ t.audienceDescription || '-' }}</div>
                    <div>使用时段：{{ t.timeDescription || '-' }}</div>
                    <div>退改规则：{{ t.refundDescription || '-' }}</div>
                    <div>购买须知：{{ t.purchaseInstructions || '-' }}</div>
                    <div v-if="t.ticketCategory === 'package' && t.includeItems">
                      包含项目：<span v-for="it in t.includeItems" :key="it.name">{{ it.name }}×{{ it.count }}，</span>
                    </div>
                  </div>
                </template>
                <div class="ticket-name">{{ t.name }}</div>
              </el-tooltip>
              <div class="ticket-id">ID: {{ t.id }}</div>
            </div>

            <div class="card-tags">
              <el-tag size="small" class="status-tag" :class="getCategoryTagClass(t.ticketCategory)">
                {{ getCategoryLabel(t.ticketCategory) }}
              </el-tag>
              <el-tag size="small" class="status-tag" :class="t.status === 1 ? 'tag-tt-on' : 'tag-tt-off'">
                {{ t.status === 1 ? '已上架' : '已下架' }}
              </el-tag>
              <el-tag size="small" class="status-tag" :class="t.enabled === 1 ? 'tag-tt-enabled' : 'tag-tt-disabled'" effect="plain">
                {{ t.enabled === 1 ? '启用' : '停用' }}
              </el-tag>
              <el-tag v-if="t.reservationRequired === 1" size="small" effect="plain" type="warning">
                需预约
              </el-tag>
              <el-tag v-else size="small" effect="plain" type="success">免预约</el-tag>
              <el-tag v-if="t.isFake" size="small" class="status-tag tag-fake" effect="dark">
                <el-icon><Warning /></el-icon>存疑/违规
              </el-tag>
            </div>

            <div class="card-spot">
              <span class="spot-label">景点：</span>
              <el-tooltip v-if="t.spotName" :content="'所属景点ID：' + t.scenicSpotId">
                <span class="spot-value">{{ t.spotName }}</span>
              </el-tooltip>
              <span v-else style="color: #bfbfbf;">未关联</span>
              <span style="margin-left: 10px; color: #909399;">{{ t.spotCity || '' }}</span>
            </div>

            <div class="card-price">
              <span class="price-cur">¥</span>
              <span class="price-value">{{ Number(t.price).toFixed(2) }}</span>
              <template v-if="t.originalPrice && Number(t.originalPrice) > Number(t.price)">
                <span class="price-original">¥{{ Number(t.originalPrice).toFixed(2) }}</span>
                <span class="price-save">
                  省 ¥{{ (Number(t.originalPrice) - Number(t.price)).toFixed(0) }}
                </span>
              </template>
            </div>

            <div class="card-info">
              <div class="info-row" v-if="t.audienceDescription">
                <span class="info-label">适用人群</span>
                <span class="info-value">{{ t.audienceDescription }}</span>
              </div>
              <div class="info-row" v-if="t.timeDescription">
                <span class="info-label">使用时段</span>
                <span class="info-value">{{ t.timeDescription }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">使用有效</span>
                <span class="info-value">购票后 {{ t.validityDays || 1 }} 天内</span>
              </div>
            </div>

            <div class="card-rules-summary">
              <span class="rule-chip"
                :class="getRefundChipClass(t.refundPolicy)">
                {{ getRefundText(t.refundPolicy) }}
              </span>
              <span v-if="t.dailyQuota > 0" class="rule-chip warn">每日配额 {{ t.dailyQuota }} 张</span>
              <span v-if="t.perOrderLimit > 0" class="rule-chip">每单限购 {{ t.perOrderLimit }} 张</span>
              <span v-if="t.violationFlags && t.violationFlags.length" class="rule-chip danger">
                {{ t.violationFlags.length }} 条违规提醒
              </span>
            </div>

            <div class="card-footer">
              <div class="weight-display">
                <span class="weight-label">展示排序</span>
                <div class="weight-bar">
                  <div class="weight-fill" :style="{ width: getWeightPct(t.displayOrder) + '%' }" />
                </div>
                <span class="weight-value">{{ t.displayOrder }}</span>
              </div>
              <div class="card-actions">
                <el-button size="small" type="primary" link @click.stop="handleEdit(t)">编辑</el-button>
                <el-button size="small" type="primary" link @click.stop="toggleStatus(t)">
                  {{ t.status === 1 ? '下架' : '上架' }}
                </el-button>
                <el-dropdown trigger="click" @command="c => onCardCmd(c, t)">
                  <el-button size="small" link>
                    更多 <el-icon><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="enabled">
                        {{ t.enabled === 1 ? '停用票种' : '启用票种' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="verify">
                        <el-icon><Stamp /></el-icon>
                        违规审核
                      </el-dropdown-item>
                      <el-dropdown-item command="trace">
                        <el-icon><Reading /></el-icon>
                        操作溯源
                      </el-dropdown-item>
                      <el-dropdown-item command="copy">
                        <el-icon><DocumentCopy /></el-icon>
                        复制票种
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无票种规则" />
      </div>

      <div v-if="total > 0" style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48, 96]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </template>

    <TicketTypeEditDialog
      v-model:visible="editVisible"
      :ticketId="currentTicketId"
      :copyFrom="copyFromData"
      :ticketCategory="activeCategory"
      @success="onEditSuccess"
      @toast="(m) => triggerToast(m)"
    />

    <TicketTypeTracePanel
      v-model:visible="traceVisible"
      :ticketId="currentTraceId"
      :isGlobal="isGlobalTrace"
    />

    <el-dialog v-model="verifyVisible" title="违规票种审核" width="560px">
      <el-form v-if="currentTicket" label-width="100px">
        <el-form-item label="票种名称">{{ currentTicket.name }}</el-form-item>
        <el-form-item label="所属景点">{{ currentTicket.spotName || '-' }}</el-form-item>
        <el-form-item label="违规标记">
          <el-alert v-if="currentTicket.violationFlags && currentTicket.violationFlags.length" type="warning" :closable="false">
            <div v-for="(f, i) in currentTicket.violationFlags" :key="i" style="line-height: 1.8;">
              · [{{ f.type }}] {{ f.field }}：{{ f.reason }}
            </div>
          </el-alert>
          <span v-else style="color: #909399;">暂无违规标记</span>
        </el-form-item>
        <el-form-item label="审核结论" required>
          <el-radio-group v-model="verifyType">
            <el-radio value="pass">合规通过，去除标记</el-radio>
            <el-radio value="warning">存疑标记（保留）</el-radio>
            <el-radio value="block">违规拦截（下架+停用）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="verifyReason" type="textarea" :rows="2" placeholder="请填写审核理由（记录日志）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifySubmitting" @click="confirmVerify" v-ripple>提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Clock, Search, Refresh, ArrowDown, Stamp, Reading, DocumentCopy, BellFilled, Warning
} from '@element-plus/icons-vue'
import {
  getTicketTypeList, changeTicketTypeStatus, setTicketTypeEnabled,
  verifyTicketType, checkTicketTypePermission
} from '@/api/ticketType'
import { TicketCategoryEnum } from '@/utils/enums'
import TicketTypeEditDialog from './TicketTypeEditDialog.vue'
import TicketTypeBatchToolbar from './TicketTypeBatchToolbar.vue'
import TicketTypeTracePanel from './TicketTypeTracePanel.vue'

const loading = ref(false)
const hasPermission = ref(true)
const canAdd = ref(true)
const activeCategory = ref('adult')
const categoryTabs = computed(() => Object.values(TicketCategoryEnum))

const searchForm = reactive({
  keyword: '', scenicSpotName: '', city: '', status: '', enabled: ''
})

const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const tableData = ref([])

const selectedIds = ref(new Set())
const selectedTickets = computed(() => tableData.value.filter(t => selectedIds.value.has(t.id)))

const refreshId = ref(null)
const copyFromData = ref(null)

const stats = reactive({ total: 0, onsale: 0, needReserve: 0, violation: 0 })

const editVisible = ref(false)
const currentTicketId = ref(null)

const traceVisible = ref(false)
const currentTraceId = ref(null)
const isGlobalTrace = ref(false)

const verifyVisible = ref(false)
const currentTicket = ref(null)
const verifyType = ref('pass')
const verifyReason = ref('')
const verifySubmitting = ref(false)

const showUpdateToast = ref(false)
const toastMessage = ref('')

const getCategoryLabel = (c) => TicketCategoryEnum[c]?.label || c
const getCategoryTagClass = (c) => TicketCategoryEnum[c]?.tagClass || ''
const getCategoryCount = (c) => tableData.value.filter(t => t.ticketCategory === c).length

const getWeightPct = (w) => Math.max(0, Math.min(100, ((Number(w) || 0) / 150) * 100))

const getRefundChipClass = (rp) => {
  if (!rp) return ''
  if (rp.refundable === false) return 'danger'
  if (rp.deductRate && rp.deductRate > 30) return 'warn'
  return ''
}

const getRefundText = (rp) => {
  if (!rp) return '退改规则未设置'
  if (rp.refundable === false) return '不可退票'
  if (rp.deductRate === 0 || !rp.deductRate) {
    return rp.beforeMinutes ? `提前${Math.round(rp.beforeMinutes / 60)}小时免费退` : '免费退票'
  }
  return `退款扣${rp.deductRate}%`
}

const toggleSelect = (t) => {
  if (selectedIds.value.has(t.id)) selectedIds.value.delete(t.id)
  else selectedIds.value.add(t.id)
  t._checked = selectedIds.value.has(t.id)
}

const clearSelection = () => {
  selectedIds.value = new Set()
  tableData.value.forEach(t => (t._checked = false))
}

const triggerFlash = (id) => {
  refreshId.value = id
  setTimeout(() => (refreshId.value = null), 700)
}

const triggerToast = (msg) => {
  toastMessage.value = msg || '规则已更新'
  showUpdateToast.value = true
  setTimeout(() => (showUpdateToast.value = false), 6000)
}

const checkPerm = async () => {
  try {
    const res = await checkTicketTypePermission('ticket_ops')
    canAdd.value = res.data?.canCreate !== false
  } catch (e) {
    hasPermission.value = false
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ticketCategory: activeCategory.value,
      ...searchForm
    }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
    })
    const res = await getTicketTypeList(params)
    tableData.value = (res.data?.list || []).map(t => ({
      ...t,
      _checked: selectedIds.value.has(t.id)
    }))
    total.value = res.data?.total || 0
    stats.total = tableData.value.length
    stats.onsale = tableData.value.filter(t => t.status === 1 && t.enabled === 1).length
    stats.needReserve = tableData.value.filter(t => t.reservationRequired === 1).length
    stats.violation = tableData.value.filter(t => t.isFake || (t.violationFlags && t.violationFlags.length)).length
  } finally {
    loading.value = false
  }
}

const onCategoryChange = () => {
  page.value = 1
  clearSelection()
  fetchList()
}
watch(activeCategory, onCategoryChange)

const handleSearch = () => { page.value = 1; fetchList() }
const handleReset = () => {
  Object.assign(searchForm, { keyword: '', scenicSpotName: '', city: '', status: '', enabled: '' })
  handleSearch()
}
const onSizeChange = (s) => { pageSize.value = s; page.value = 1; fetchList() }
const onPageChange = (p) => { page.value = p; fetchList() }

const handleAdd = () => {
  currentTicketId.value = null
  copyFromData.value = null
  editVisible.value = true
}
const handleEdit = (t) => {
  currentTicketId.value = t.id
  copyFromData.value = null
  editVisible.value = true
}

const onEditSuccess = (id, msg) => {
  triggerFlash(id)
  fetchList()
  if (msg) triggerToast(msg)
}

const onBatchSuccess = () => {
  clearSelection()
  fetchList()
  triggerToast('批量操作已完成，规则已同步更新')
}

const toggleStatus = async (t) => {
  const next = t.status === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(
      `确定${next === 1 ? '上架' : '下架'}票种「${t.name}」吗？${next === 0 ? '下架后将暂停对应票务售卖并通知已购买用户' : ''}`,
      '确认操作',
      { type: 'warning' }
    )
    await changeTicketTypeStatus(t.id, next, `手动${next === 1 ? '上架' : '下架'}`)
    ElMessage.success(next === 1 ? '上架成功' : '下架成功')
    triggerFlash(t.id)
    fetchList()
    if (next === 0) triggerToast(`票种「${t.name}」已下架`)
  } catch (e) { /* ignore */ }
}

const toggleEnabled = async (t) => {
  const next = t.enabled === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(`确定${next === 1 ? '启用' : '停用'}票种「${t.name}」吗？`, '确认', { type: 'warning' })
    await setTicketTypeEnabled(t.id, next, `手动${next === 1 ? '启用' : '停用'}`)
    ElMessage.success(next === 1 ? '启用成功' : '停用成功')
    triggerFlash(t.id)
    fetchList()
  } catch (e) { /* ignore */ }
}

const openAllTrace = () => {
  currentTraceId.value = null
  isGlobalTrace.value = true
  traceVisible.value = true
}

const openTicketTrace = (t) => {
  currentTraceId.value = t.id
  isGlobalTrace.value = false
  traceVisible.value = true
}

const openVerify = (t) => {
  currentTicket.value = t
  verifyType.value = t.isFake ? 'warning' : 'pass'
  verifyReason.value = ''
  verifyVisible.value = true
}

const confirmVerify = async () => {
  verifySubmitting.value = true
  try {
    await verifyTicketType(currentTicket.value.id, verifyType.value, verifyReason.value)
    ElMessage.success('审核完成')
    verifyVisible.value = false
    triggerFlash(currentTicket.value.id)
    fetchList()
  } finally {
    verifySubmitting.value = false
  }
}

const copyTicket = (t) => {
  currentTicketId.value = null
  copyFromData.value = t
  editVisible.value = true
}

const onCardCmd = (cmd, t) => {
  switch (cmd) {
    case 'enabled': toggleEnabled(t); break
    case 'verify': openVerify(t); break
    case 'trace': openTicketTrace(t); break
    case 'copy': copyTicket(t); break
  }
}

onMounted(() => {
  checkPerm()
  fetchList()
})
</script>

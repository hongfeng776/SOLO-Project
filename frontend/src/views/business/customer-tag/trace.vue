<template>
  <div class="ccb-customer-tag-trace">
    <CcbPageHeader
      title="标签溯源查询"
      description="通过客户ID溯源标签变更全记录，自动拦截越权修改与违规赋值，多维度校验标签与客户资质匹配度"
      icon="Search"
    >
      <template #extra>
        <el-button :icon="ArrowLeft" @click="goBack">
          返回标签列表
        </el-button>
      </template>
    </CcbPageHeader>

    <el-card class="trace-search-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18" color="#e6a23c"><Search /></el-icon>
          <span class="header-title">溯源条件</span>
        </div>
      </template>

      <el-form :model="searchForm" label-width="100px" inline @submit.prevent>
        <el-form-item label="客户ID" required>
          <el-input
            v-model="searchForm.customerId"
            placeholder="请输入客户ID"
            style="width: 320px"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="标签编码">
          <el-input
            v-model="searchForm.tagCode"
            placeholder="请输入标签编码（选填）"
            style="width: 240px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="searchLoading" @click="handleSearch">
            开始溯源查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="searchLoading" class="trace-skeleton">
      <el-skeleton :rows="12" animated>
        <template #template>
          <el-skeleton-paragraph :rows="3" />
          <el-skeleton-table :rows="6" :columns="7" animated />
          <el-skeleton-paragraph :rows="4" />
        </template>
      </el-skeleton>
    </div>

    <div v-else-if="traceResult">
      <el-card class="summary-card" :class="{ 'blocked-card': !traceResult.allowed }">
        <template #header>
          <div class="summary-header">
            <div class="header-left">
              <el-icon :size="20" :class="traceResult.matched ? 'icon-success' : 'icon-unknown'">
                <CircleCheckFilled v-if="traceResult.matched" />
                <QuestionFilled v-else />
              </el-icon>
              <span class="header-title">溯源综合结果</span>
              <el-tag type="info" effect="plain" size="small">
                客户ID：{{ maskCustomerId(traceResult.customerId) }}
              </el-tag>
              <el-tag v-if="traceResult.customerName" type="success" effect="plain" size="small">
                {{ traceResult.customerName }}
              </el-tag>
            </div>
            <div class="header-right">
              <el-tag
                v-if="traceResult.allowed"
                type="success"
                effect="dark"
                size="large"
                round
              >
                <el-icon><CircleCheckFilled /></el-icon>
                合规通过
              </el-tag>
              <el-tag v-else type="danger" effect="dark" size="large" round>
                <el-icon><CircleCloseFilled /></el-icon>
                已拦截
              </el-tag>
            </div>
          </div>
        </template>

        <el-row :gutter="16" class="summary-row">
          <el-col :span="4">
            <div class="stat-card stat-total">
              <div class="stat-num">{{ traceResult.totalTags }}</div>
              <div class="stat-label">总标签数</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card stat-active">
              <div class="stat-num">{{ traceResult.activeTags }}</div>
              <div class="stat-label">有效标签</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card stat-expired">
              <div class="stat-num">{{ traceResult.expiredTags }}</div>
              <div class="stat-label">失效标签</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card stat-removed">
              <div class="stat-num">{{ traceResult.removedTags }}</div>
              <div class="stat-label">已移除</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div :class="['stat-card', traceResult.hasUnauthorized ? 'stat-danger' : 'stat-safe']">
              <div class="stat-num">
                <el-icon v-if="traceResult.hasUnauthorized"><WarningFilled /></el-icon>
                <el-icon v-else><CircleCheckFilled /></el-icon>
              </div>
              <div class="stat-label">越权操作</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div :class="['stat-card', traceResult.hasViolation ? 'stat-danger' : 'stat-safe']">
              <div class="stat-num">
                <el-icon v-if="traceResult.hasViolation"><WarningFilled /></el-icon>
                <el-icon v-else><CircleCheckFilled /></el-icon>
              </div>
              <div class="stat-label">违规操作</div>
            </div>
          </el-col>
        </el-row>

        <div v-if="traceResult.blockReason || traceResult.riskPrompts.length > 0" class="risk-alerts">
          <el-alert
            v-if="traceResult.blockReason"
            :title="traceResult.blockReason"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
          <el-alert
            v-for="(prompt, idx) in traceResult.riskPrompts"
            :key="idx"
            :title="prompt"
            type="warning"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
        </div>
      </el-card>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-card class="records-card">
            <template #header>
              <div class="card-header">
                <el-icon :size="18" color="#409eff"><Document /></el-icon>
                <span class="header-title">历史标签记录</span>
                <el-tag type="info" effect="plain" size="small">
                  {{ traceResult.historyRecords.length }} 条
                </el-tag>
              </div>
            </template>

            <div v-if="traceResult.historyRecords.length === 0" class="empty-state">
              <el-empty description="未查询到历史标签记录" :image-size="80" />
            </div>
            <el-table
              v-else
              :data="traceResult.historyRecords"
              :stripe="true"
              border
              size="small"
            >
              <el-table-column prop="tagCode" label="标签编码" width="120" />
              <el-table-column prop="tagName" label="标签名称" min-width="120" show-overflow-tooltip />
              <el-table-column prop="tagStatusText" label="标签状态" width="90">
                <template #default="{ row }">
                  <el-tag
                    :type="getTagStatusTagType(row.tagStatus)"
                    effect="light"
                    size="small"
                  >
                    {{ row.tagStatusText || getTagStatusText(row.tagStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="changeTypeName" label="变更类型" width="100">
                <template #default="{ row }">
                  <el-tag
                    v-if="row.changeType"
                    :type="getChangeTypeTagType(row.changeType)"
                    effect="dark"
                    size="small"
                  >
                    {{ row.changeTypeName || getChangeTypeName(row.changeType) }}
                  </el-tag>
                  <el-text v-else type="info">-</el-text>
                </template>
              </el-table-column>
              <el-table-column prop="operateTime" label="操作时间" width="150" />
              <el-table-column prop="operatorName" label="操作人" width="90" show-overflow-tooltip />
              <el-table-column label="风险" width="80" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.isUnauthorized === 1" color="#f56c6c" :size="16"><WarningFilled /></el-icon>
                  <el-icon v-else-if="row.isViolation === 1" color="#e6a23c" :size="16"><WarningFilled /></el-icon>
                  <el-icon v-else color="#67c23a" :size="16"><CircleCheckFilled /></el-icon>
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-text v-if="row.blockReason" type="danger">{{ row.blockReason }}</el-text>
                  <el-text v-else type="info">-</el-text>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="logs-card">
            <template #header>
              <div class="card-header">
                <el-icon :size="18" color="#67c23a"><Tickets /></el-icon>
                <span class="header-title">标签变更流水</span>
                <el-tag type="info" effect="plain" size="small">
                  {{ traceResult.changeLogs.length }} 条
                </el-tag>
              </div>
            </template>

            <div v-if="traceResult.changeLogs.length === 0" class="empty-state">
              <el-empty description="未查询到变更流水" :image-size="80" />
            </div>
            <el-timeline v-else class="logs-timeline">
              <el-timeline-item
                v-for="log in traceResult.changeLogs.slice(0, 30)"
                :key="log.id"
                :timestamp="log.operateTime"
                :type="isHighRiskLog(log) ? 'danger' : getLogTimelineType(log.changeType)"
                placement="top"
                :hollow="log.changeType === '7'"
              >
                <div
                  class="log-item-card"
                  :class="[
                    `log-type-${log.changeType}`,
                    { 'log-type-danger': isHighRiskLog(log) }
                  ]"
                >
                  <div class="log-item-header">
                    <el-tag
                      :type="isHighRiskLog(log) ? 'danger' : getLogTagType(log.changeType)"
                      effect="dark"
                      size="small"
                    >
                      {{ log.changeTypeName || getChangeTypeName(log.changeType) }}
                    </el-tag>
                    <span v-if="log.isUnauthorized === 1" class="risk-badge badge-unauthorized">
                      <el-icon><WarningFilled /></el-icon>
                      越权操作
                    </span>
                    <span v-if="log.isViolation === 1" class="risk-badge badge-violation">
                      <el-icon><WarningFilled /></el-icon>
                      违规操作
                    </span>
                    <span class="log-operator">
                      {{ log.operatorName || '系统' }}
                      <span v-if="log.operatorOrgName">@{{ log.operatorOrgName }}</span>
                    </span>
                  </div>
                  <div class="log-tag-info">
                    <el-tag effect="plain" size="small" type="info">{{ log.tagCode }}</el-tag>
                    <span class="tag-name">{{ log.tagName }}</span>
                  </div>
                  <div v-if="log.beforeContent && log.afterContent" class="tampering-detail">
                    <div class="tampering-before">
                      <span class="tampering-label">变更前：</span>
                      <span class="tampering-value">{{ log.beforeContent }}</span>
                    </div>
                    <div class="tampering-after">
                      <span class="tampering-label">变更后：</span>
                      <span class="tampering-value">{{ log.afterContent }}</span>
                    </div>
                  </div>
                  <div v-else-if="log.changeRemark" class="log-item-remark">
                    {{ log.changeRemark }}
                  </div>
                  <div v-if="log.blockReason" class="log-item-block">
                    <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
                    拦截原因：{{ log.blockReason }}
                  </div>
                  <div v-if="log.reviewerName" class="log-item-review">
                    <el-icon color="#e6a23c"><Stamp /></el-icon>
                    复核：{{ log.reviewerName }} / {{ log.reviewTime }}
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="action-card">
        <template #header>
          <div class="card-header">
            <el-icon :size="18" color="#f56c6c"><Setting /></el-icon>
            <span class="header-title">风险提示与合规操作区</span>
          </div>
        </template>

        <div class="action-content">
          <div v-if="traceResult.hasUnauthorized" class="unauthorized-warning">
            <el-alert
              title="检测到越权标签修改操作，存在未授权变更客户标签行为，请立即核查处理"
              type="error"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>建议措施：</p>
                <ol>
                  <li>核查越权操作的操作人与审批流程是否合规</li>
                  <li>对越权变更的标签执行回退或锁定操作</li>
                  <li>上报风控部门对相关责任人进行追责</li>
                </ol>
              </template>
            </el-alert>
          </div>

          <div v-if="traceResult.hasViolation" class="violation-warning">
            <el-alert
              title="检测到违规高端标签赋值行为，客户资质与标签等级不匹配，请核查处理"
              type="error"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>合规要求：</p>
                <ol>
                  <li>核实客户资产水平与客户等级是否与标签匹配</li>
                  <li>对违规赋值的标签执行撤销或降级处理</li>
                  <li>完善标签赋值审批机制，防止违规赋值再次发生</li>
                </ol>
              </template>
            </el-alert>
          </div>

          <div v-if="traceResult.hasTampering" class="tampering-warning">
            <el-alert
              title="检测到标签数据存在篡改痕迹，标签与客户资质、资产水平匹配度异常，请核实变更合法性"
              type="error"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>核查要点：</p>
                <ol>
                  <li>比对标签变更前后的客户资质与资产数据</li>
                  <li>核实变更是否经有权审批人审批通过</li>
                  <li>对涉嫌篡改的标签执行锁定并上报风控部门</li>
                </ol>
              </template>
            </el-alert>
          </div>

          <div v-if="traceResult.blockReason" class="block-warning">
            <el-alert
              title="该客户标签变更已被系统自动拦截，请查看拦截原因并处理"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #default>
                <el-button type="warning" @click="showBlockDetail">
                  <el-icon><View /></el-icon>
                  查看拦截详情
                </el-button>
              </template>
            </el-alert>
          </div>

          <div class="action-buttons">
            <CcbPermissionButton permission="customer:tag:create">
              <el-button
                type="primary"
                :icon="Plus"
                :disabled="!traceResult.allowed"
                @click="goToAssign"
              >
                合规赋值标签
              </el-button>
            </CcbPermissionButton>
            <el-button
              v-if="!traceResult.allowed"
              type="warning"
              :icon="Warning"
              @click="showBlockDetail"
            >
              查看拦截原因
            </el-button>
            <el-button
              v-if="traceResult.hasUnauthorized || traceResult.hasViolation || traceResult.hasTampering"
              type="danger"
              :icon="Stamp"
              @click="goToReview"
            >
              前往风险复核
            </el-button>
            <el-button :icon="Download" @click="exportTraceReport">
              导出溯源报告
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div v-else class="empty-state-page">
      <el-empty :image-size="160" description="请输入客户ID开始标签溯源查询">
        <template #image>
          <el-icon :size="120" color="#c0c4cc"><Search /></el-icon>
        </template>
        <el-button type="primary" :icon="Search" @click="focusSearch">
          立即查询
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Search,
  Refresh,
  CircleCheckFilled,
  CircleCloseFilled,
  QuestionFilled,
  WarningFilled,
  Document,
  Tickets,
  Setting,
  Plus,
  Warning,
  Download,
  Stamp,
  View
} from '@element-plus/icons-vue'
import { traceCustomerTagApi } from '@api/business'

const router = useRouter()

const searchLoading = ref(false)
const traceResult = ref(null)

const searchForm = reactive({
  customerId: '',
  tagCode: ''
})

const CHANGE_TYPE_MAP = {
  '1': '标签新增',
  '2': '标签调整',
  '3': '标签移除',
  '4': '标签替换',
  '5': '等级变更',
  '6': '批量赋值',
  '7': '系统自动更新',
  '8': '锁定',
  '9': '解锁'
}

const TAG_STATUS_MAP = {
  1: '有效',
  2: '失效',
  3: '待生效',
  4: '已移除'
}

const CUSTOMER_LEVEL_MAP = {
  1: '普通',
  2: '银卡',
  3: '金卡',
  4: '白金',
  5: '钻石'
}

const transformKeys = (obj) => {
  if (!obj) return obj
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (typeof obj !== 'object') return obj
  const result = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
    result[camelKey] = transformKeys(obj[key])
  }
  return result
}

const getChangeTypeName = (changeType) => {
  return CHANGE_TYPE_MAP[changeType] || '未知'
}

const getTagStatusText = (status) => {
  return TAG_STATUS_MAP[status] || '未知'
}

const getCustomerLevelText = (level) => {
  return CUSTOMER_LEVEL_MAP[level] || '未知'
}

const handleSearch = async () => {
  if (!searchForm.customerId.trim()) {
    ElMessage.warning('请输入客户ID')
    return
  }

  searchLoading.value = true
  traceResult.value = null
  try {
    const res = await traceCustomerTagApi({
      customer_id: searchForm.customerId,
      tag_code: searchForm.tagCode || undefined
    })
    traceResult.value = transformKeys(res.data)
  } catch (_e) {
    ElMessage.error('溯源查询失败')
  } finally {
    searchLoading.value = false
  }
}

const handleReset = () => {
  searchForm.customerId = ''
  searchForm.tagCode = ''
  traceResult.value = null
}

const focusSearch = async () => {
  await nextTick()
  const input = document.querySelector('.trace-search-card input')
  input?.focus()
}

const maskCustomerId = (id) => {
  if (!id) return ''
  if (id.length <= 8) return id
  return id.substring(0, 4) + '****' + id.substring(id.length - 4)
}

const goBack = () => {
  router.push('/business/customer-tag')
}

const goToAssign = () => {
  router.push({
    path: '/business/customer-tag',
    query: { customerId: searchForm.customerId }
  })
}

const goToReview = () => {
  router.push({ path: '/business/customer-tag', query: { review: '1' } })
}

const showBlockDetail = () => {
  if (!traceResult.value) return
  ElMessageBox.alert(
    `
      <div>
        <p><strong>拦截原因：</strong></p>
        <p>${traceResult.value.blockReason || '未知原因'}</p>
        <hr style="margin:12px 0" />
        <p><strong>风险提示：</strong></p>
        <ul>
          ${traceResult.value.riskPrompts.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    `,
    '拦截详情',
    { dangerouslyUseHTMLString: true, confirmButtonText: '我已知晓' }
  )
}

const exportTraceReport = () => {
  ElMessage.success('溯源报告导出任务已提交')
}

const isHighRiskLog = (log) => {
  return log.isUnauthorized === 1 || log.isViolation === 1
}

const getTagStatusTagType = (status) => {
  const map = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger' }
  return map[status] || 'info'
}

const getChangeTypeTagType = (changeType) => {
  const map = {
    '1': 'primary',
    '2': 'warning',
    '3': 'success',
    '4': 'info',
    '5': 'danger',
    '6': '',
    '7': 'info',
    '8': 'warning',
    '9': 'success'
  }
  return map[changeType] || ''
}

const CHANGE_TYPE_TIMELINE_COLORS = {
  '1': 'primary',
  '2': 'warning',
  '3': 'success',
  '4': 'info',
  '5': 'danger',
  '6': '',
  '7': 'info',
  '8': 'warning',
  '9': 'success'
}

const CHANGE_TYPE_TAG_COLORS = {
  '1': 'primary',
  '2': 'warning',
  '3': 'success',
  '4': 'info',
  '5': 'danger',
  '6': '',
  '7': 'info',
  '8': 'warning',
  '9': 'success'
}

const getLogTimelineType = (changeType) => {
  return CHANGE_TYPE_TIMELINE_COLORS[changeType] || 'primary'
}

const getLogTagType = (changeType) => {
  return CHANGE_TYPE_TAG_COLORS[changeType] || ''
}
</script>

<style lang="scss" scoped>
.ccb-customer-tag-trace {
  .trace-search-card,
  .summary-card,
  .records-card,
  .logs-card,
  .action-card {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .header-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-right: 12px;
    }
  }

  .trace-skeleton {
    padding: 20px;
    background: #fff;
    border-radius: 4px;
  }

  .summary-card {
    border-radius: 6px;

    &.blocked-card {
      border: 2px solid #f56c6c;
      background: linear-gradient(135deg, #fff8f8, #fff0f0);
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .icon-success {
          color: #67c23a;
        }
        .icon-unknown {
          color: #909399;
        }

        .header-title {
          font-size: 16px;
          font-weight: 600;
        }
      }
    }

    .summary-row {
      margin-bottom: 12px;

      .stat-card {
        padding: 16px 12px;
        border-radius: 6px;
        text-align: center;

        .stat-num {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .stat-label {
          font-size: 12px;
          color: #606266;
        }

        &.stat-total {
          background: linear-gradient(135deg, #ecf5ff, #d9ecff);
          .stat-num { color: #409eff; }
        }
        &.stat-active {
          background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
          .stat-num { color: #67c23a; }
        }
        &.stat-expired {
          background: linear-gradient(135deg, #fdf6ec, #faecd8);
          .stat-num { color: #e6a23c; }
        }
        &.stat-removed {
          background: linear-gradient(135deg, #f4f4f5, #e9e9eb);
          .stat-num { color: #909399; }
        }
        &.stat-safe {
          background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
          .stat-num { color: #67c23a; }
        }
        &.stat-danger {
          background: linear-gradient(135deg, #fef0f0, #fab6b6);
          .stat-num { color: #c0392b; }
        }
      }
    }

    .risk-alerts {
      margin-top: 8px;
    }
  }

  .records-card,
  .logs-card {
    height: 520px;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      overflow: auto;
    }
  }

  .logs-timeline {
    padding: 4px 0;

    .log-item-card {
      padding: 10px 12px;
      border-radius: 4px;
      background: #fafafa;
      border-left: 3px solid #409eff;

      &.log-type-1 {
        border-left-color: #409eff;
        background: #ecf5ff;
      }
      &.log-type-2 {
        border-left-color: #e6a23c;
        background: #fdf6ec;
      }
      &.log-type-3 {
        border-left-color: #67c23a;
        background: #f0f9eb;
      }
      &.log-type-4 {
        border-left-color: #00bcd4;
        background: #e0f7fa;
      }
      &.log-type-5 {
        border-left-color: #f56c6c;
        background: #fef0f0;
      }
      &.log-type-6 {
        border-left-color: #9c27b0;
        background: #f3e5f5;
      }
      &.log-type-7 {
        border-left-color: #909399;
        background: #f4f4f5;
      }
      &.log-type-8 {
        border-left-color: #ff9800;
        background: #fff3e0;
      }
      &.log-type-9 {
        border-left-color: #4caf50;
        background: #e8f5e9;
      }

      &.log-type-danger {
        border-left-color: #f56c6c !important;
        background: #fef0f0 !important;
      }

      .log-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        flex-wrap: wrap;
        gap: 6px;

        .risk-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: 600;
        }

        .badge-unauthorized {
          color: #f56c6c;
          background: rgba(245, 108, 108, 0.1);
        }

        .badge-violation {
          color: #e6a23c;
          background: rgba(230, 162, 60, 0.1);
        }

        .log-operator {
          font-size: 12px;
          color: #909399;
        }
      }

      .log-tag-info {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;

        .tag-name {
          font-size: 13px;
          color: #303133;
          font-weight: 500;
        }
      }

      .tampering-detail {
        padding: 6px 10px;
        background: rgba(245, 108, 108, 0.06);
        border-radius: 3px;
        margin-bottom: 6px;

        .tampering-before,
        .tampering-after {
          font-size: 13px;
          line-height: 1.6;

          .tampering-label {
            color: #909399;
            font-weight: 500;
          }
          .tampering-value {
            color: #303133;
          }
        }
        .tampering-before {
          .tampering-value {
            text-decoration: line-through;
            color: #f56c6c;
          }
        }
        .tampering-after {
          .tampering-value {
            color: #e6a23c;
            font-weight: 600;
          }
        }
      }

      .log-item-remark {
        font-size: 13px;
        color: #606266;
        margin-bottom: 4px;
      }

      .log-item-block {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #f56c6c;
        padding: 4px 8px;
        background: rgba(245, 108, 108, 0.1);
        border-radius: 3px;
        margin-bottom: 4px;
      }

      .log-item-review {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #e6a23c;
        padding: 4px 8px;
        background: rgba(230, 162, 60, 0.1);
        border-radius: 3px;
      }
    }
  }

  .action-card {
    .action-content {
      .unauthorized-warning,
      .violation-warning,
      .tampering-warning,
      .block-warning {
        margin-bottom: 16px;
      }

      .action-buttons {
        display: flex;
        gap: 12px;
      }
    }
  }

  .empty-state {
    padding: 40px 0;
  }

  .empty-state-page {
    margin-top: 80px;
  }
}
</style>

<template>
  <div class="visibility-page">
    <div class="page-header">
      <h2 class="page-title">作品状态管控中心</h2>
    </div>

    <el-tabs v-model="activeTab" class="visibility-tabs">
      <el-tab-pane label="状态管控" name="control">
        <div class="card-wrapper">
          <div class="overview-section">
            <div v-if="statsLoading" class="skeleton-overview">
              <div v-for="i in 6" :key="i" class="skeleton-card">
                <div class="skeleton-line short" />
                <div class="skeleton-line long" />
              </div>
            </div>
            <div v-else class="overview-cards">
              <div class="overview-card card-public" @click="quickFilter('public')">
                <div class="overview-label">公开可见</div>
                <div class="overview-value">{{ stats?.visibilityDistribution?.public || 0 }}</div>
                <div class="overview-desc">正常公开分发</div>
              </div>
              <div class="overview-card card-private" @click="quickFilter('private')">
                <div class="overview-label">私密作品</div>
                <div class="overview-value">{{ stats?.visibilityDistribution?.private || 0 }}</div>
                <div class="overview-desc">仅作者本人可见</div>
              </div>
              <div class="overview-card card-friends" @click="quickFilter('friends_only')">
                <div class="overview-label">仅好友可见</div>
                <div class="overview-value">{{ stats?.visibilityDistribution?.friends_only || 0 }}</div>
                <div class="overview-desc">好友关系可见</div>
              </div>
              <div class="overview-card card-violation" @click="quickFilter('violation_hidden')">
                <div class="overview-label">违规隐藏</div>
                <div class="overview-value violation-glow">
                  {{ stats?.visibilityDistribution?.violation_hidden || 0 }}
                </div>
                <div class="overview-desc">违规已隐藏处理</div>
              </div>
              <div class="overview-card card-pending" @click="activeTab = 'audit'">
                <div class="overview-label">待审核</div>
                <div class="overview-value">{{ stats?.pendingAudit || 0 }}</div>
                <div class="overview-desc">等待审核生效</div>
              </div>
              <div class="overview-card card-today">
                <div class="overview-label">今日变更</div>
                <div class="overview-value">{{ stats?.todayChanges || 0 }}</div>
                <div class="overview-desc">今日状态变更次数</div>
              </div>
            </div>
          </div>

          <div class="card-title">作品状态管理</div>

          <el-form :inline="true" :model="filterForm" class="filter-form">
            <el-form-item label="关键词">
              <el-input v-model="filterForm.keyword" placeholder="标题/素材编码" clearable style="width: 200px">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="可见性">
              <el-select v-model="filterForm.visibility" placeholder="全部" clearable style="width: 140px">
                <el-option label="公开可见" value="public" />
                <el-option label="私密作品" value="private" />
                <el-option label="仅好友可见" value="friends_only" />
                <el-option label="违规隐藏" value="violation_hidden" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="filterForm.fileType" placeholder="全部" clearable style="width: 120px">
                <el-option label="图片" value="image" />
                <el-option label="视频" value="video" />
                <el-option label="音频" value="audio" />
                <el-option label="模板" value="template" />
              </el-select>
            </el-form-item>
            <el-form-item label="筛选条件">
              <el-checkbox v-model="filterForm.violationOnly" border>仅违规</el-checkbox>
              <el-checkbox v-model="filterForm.abnormalOnly" border>风控异常</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchResourceList" :loading="listLoading">查询</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-tag v-if="selected.length > 0" type="primary" effect="light">
                已选 {{ selected.length }} 项
              </el-tag>
              <el-tag v-if="batchProgress.visible" type="warning" effect="dark">
                批量进度: {{ batchProgress.done }}/{{ batchProgress.total }}
              </el-tag>
            </div>
            <div class="toolbar-right">
              <el-select v-model="batchTargetVisibility" placeholder="批量设置为" style="width: 160px">
                <el-option label="设为公开" value="public" />
                <el-option label="设为私密" value="private" />
                <el-option label="设为好友可见" value="friends_only" />
                <el-option label="违规隐藏" value="violation_hidden" />
              </el-select>
              <el-button
                type="primary"
                :icon="Promotion"
                :disabled="selected.length === 0 || !batchTargetVisibility"
                @click="handleBatchChange"
                :loading="batchLoading"
                class="batch-btn"
              >
                批量设置
              </el-button>
            </div>
          </div>

          <el-table
            ref="tableRef"
            v-loading="listLoading"
            :data="resourceList"
            stripe
            border
            class="visibility-table"
            @selection-change="handleSelectionChange"
            :row-class-name="tableRowClassName"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="id" label="ID" width="80" align="center" />
            <el-table-column prop="title" label="作品标题" min-width="200">
              <template #default="{ row }">
                <div class="title-cell">
                  <el-image
                    v-if="row.coverUrl"
                    :src="row.coverUrl"
                    fit="cover"
                    class="cover-thumb"
                    :preview-src-list="[row.coverUrl]"
                  />
                  <span class="title-text">{{ row.title }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="fileType" label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="fileTypeTagType[row.fileType] || 'info'">
                  {{ fileTypeLabel[row.fileType] || row.fileType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="visibility" label="可见性" width="110" align="center">
              <template #default="{ row }">
                <div :class="['visibility-tag', `tag-${row.visibility}`]">
                  <span class="visibility-dot" />
                  <span>{{ visibilityLabel[row.visibility] }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="violationCount" label="违规次数" width="90" align="center">
              <template #default="{ row }">
                <span :class="{ 'violation-count': row.violationCount > 0 }">
                  {{ row.violationCount || 0 }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="isBlocked" label="风控状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isBlocked" type="danger" size="small" effect="dark">已拦截</el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="visibilityAuditStatus" label="审核状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.visibilityAuditStatus === 'pending'" type="warning" size="small">待审核</el-tag>
                <el-tag v-else-if="row.visibilityAuditStatus === 'approved'" type="success" size="small">已通过</el-tag>
                <el-tag v-else-if="row.visibilityAuditStatus === 'rejected'" type="danger" size="small">已拒绝</el-tag>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="authorName" label="作者" width="100" align="center" />
            <el-table-column prop="visibilityChangedAt" label="最近变更" width="170" align="center">
              <template #default="{ row }">
                <span class="time-text">{{ formatTime(row.visibilityChangedAt) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="openChangeDialog(row)"
                  class="change-btn"
                >
                  调整状态
                </el-button>
                <el-button type="info" link size="small" @click="viewDetail(row)">变更记录</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="fetchResourceList"
              @current-change="fetchResourceList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="变更日志" name="logs">
        <div class="card-wrapper">
          <el-form :inline="true" :model="logFilter" class="filter-form">
            <el-form-item label="关键词">
              <el-input v-model="logFilter.keyword" placeholder="作品/操作人" clearable style="width: 180px">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="变更类型">
              <el-select v-model="logFilter.changeType" placeholder="全部" clearable style="width: 130px">
                <el-option label="手动变更" value="manual" />
                <el-option label="自动变更" value="auto" />
                <el-option label="批量变更" value="batch" />
                <el-option label="审核变更" value="audit" />
              </el-select>
            </el-form-item>
            <el-form-item label="目标状态">
              <el-select v-model="logFilter.newVisibility" placeholder="全部" clearable style="width: 130px">
                <el-option label="公开" value="public" />
                <el-option label="私密" value="private" />
                <el-option label="好友可见" value="friends_only" />
                <el-option label="违规隐藏" value="violation_hidden" />
              </el-select>
            </el-form-item>
            <el-form-item label="审核状态">
              <el-select v-model="logFilter.auditStatus" placeholder="全部" clearable style="width: 120px">
                <el-option label="无需审核" value="none" />
                <el-option label="待审核" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已拒绝" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作时间">
              <el-date-picker
                v-model="logDateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                style="width: 340px"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchLogList" :loading="logLoading">查询</el-button>
              <el-button @click="resetLogFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <div v-if="logLoading" class="skeleton-logs">
            <div v-for="i in 8" :key="i" class="skeleton-log-item">
              <div class="skeleton-line short" />
              <div class="skeleton-line long" />
              <div class="skeleton-line medium" />
            </div>
          </div>

          <el-table
            v-else
            v-loading="logLoading"
            :data="logList"
            stripe
            border
            class="log-table"
          >
            <el-table-column prop="id" label="ID" width="70" align="center" />
            <el-table-column prop="resourceTitle" label="作品标题" min-width="200" />
            <el-table-column label="状态变更" width="200" align="center">
              <template #default="{ row }">
                <div class="status-transition">
                  <span :class="['mini-tag', `tag-${row.oldVisibility}`]">
                    {{ visibilityLabel[row.oldVisibility] || '-' }}
                  </span>
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                  <span :class="['mini-tag', `tag-${row.newVisibility}`]">
                    {{ visibilityLabel[row.newVisibility] }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="changeType" label="变更类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="changeTypeTag[row.changeType] || 'info'">
                  {{ changeTypeLabel[row.changeType] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="100" align="center" />
            <el-table-column prop="auditStatus" label="审核" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.auditStatus === 'pending'" type="warning" size="small">待审核</el-tag>
                <el-tag v-else-if="row.auditStatus === 'approved'" type="success" size="small">已通过</el-tag>
                <el-tag v-else-if="row.auditStatus === 'rejected'" type="danger" size="small">已拒绝</el-tag>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="isHighFrequency" label="高频" width="70" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isHighFrequency" type="danger" size="small" effect="dark">是</el-tag>
                <span v-else class="text-muted">否</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="150" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="操作时间" width="170" align="center">
              <template #default="{ row }">
                <span class="time-text">{{ formatTime(row.createdAt) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="logPage"
              v-model:page-size="logPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="logTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="fetchLogList"
              @current-change="fetchLogList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="待审核" name="audit">
        <div class="card-wrapper">
          <div class="card-title">违规隐藏转公开审核</div>

          <el-form :inline="true" :model="auditFilter" class="filter-form">
            <el-form-item label="关键词">
              <el-input v-model="auditFilter.keyword" placeholder="作品/操作人" clearable style="width: 200px">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchAuditList" :loading="auditLoading">查询</el-button>
              <el-button @click="resetAuditFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-tag v-if="auditSelected.length > 0" type="warning" effect="light">
                已选 {{ auditSelected.length }} 项
              </el-tag>
            </div>
            <div class="toolbar-right">
              <el-button
                type="success"
                :icon="Check"
                :disabled="auditSelected.length === 0"
                @click="handleBatchAudit(true)"
                :loading="batchAuditLoading"
              >
                批量通过
              </el-button>
              <el-button
                type="danger"
                :icon="Close"
                :disabled="auditSelected.length === 0"
                @click="handleBatchAudit(false)"
                :loading="batchAuditLoading"
              >
                批量拒绝
              </el-button>
            </div>
          </div>

          <el-table
            ref="auditTableRef"
            v-loading="auditLoading"
            :data="auditList"
            stripe
            border
            @selection-change="handleAuditSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="id" label="申请ID" width="80" align="center" />
            <el-table-column prop="resourceTitle" label="作品标题" min-width="200" />
            <el-table-column label="状态变更" width="180" align="center">
              <template #default="{ row }">
                <div class="status-transition">
                  <span :class="['mini-tag', `tag-${row.oldVisibility}`]">
                    {{ visibilityLabel[row.oldVisibility] }}
                  </span>
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                  <span :class="['mini-tag', `tag-${row.newVisibility}`]">
                    {{ visibilityLabel[row.newVisibility] }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="申请人" width="100" align="center" />
            <el-table-column prop="reason" label="申请理由" min-width="150" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="申请时间" width="170" align="center">
              <template #default="{ row }">
                <span class="time-text">{{ formatTime(row.createdAt) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link size="small" @click="handleAudit(row, true)">通过</el-button>
                <el-button type="danger" link size="small" @click="handleAudit(row, false)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="auditPage"
              v-model:page-size="auditPageSize"
              :page-sizes="[10, 20, 50]"
              :total="auditTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="fetchAuditList"
              @current-change="fetchAuditList"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="changeDialogVisible"
      title="调整可见性状态"
      width="500px"
      :close-on-click-modal="false"
      class="change-dialog"
      @closed="onDialogClosed"
    >
      <div v-if="validateTarget" class="dialog-content">
        <div class="current-state">
          <span class="label">当前状态：</span>
          <span :class="['visibility-tag', `tag-${validateTarget.visibility}`]">
            <span class="visibility-dot" />
            <span>{{ visibilityLabel[validateTarget.visibility] }}</span>
          </span>
        </div>

        <el-divider />

        <div class="target-section">
          <div class="section-label">目标状态</div>
          <div class="visibility-options">
            <div
              v-for="opt in visibilityOptions"
              :key="opt.value"
              :class="['visibility-option', { active: changeForm.newVisibility === opt.value, disabled: !opt.allowed }]"
              @click="opt.allowed && selectVisibility(opt.value)"
            >
              <span :class="['option-dot', `dot-${opt.value}`]" />
              <span class="option-label">{{ opt.label }}</span>
              <el-tooltip v-if="!opt.allowed" :content="opt.blockReason" placement="top">
                <el-icon class="lock-icon"><Lock /></el-icon>
              </el-tooltip>
            </div>
          </div>
        </div>

        <el-form :model="changeForm" ref="changeFormRef" :rules="changeFormRules" label-width="80px">
          <el-form-item label="变更原因" prop="reason">
            <el-input
              v-model="changeForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入变更原因（选填）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>

        <div v-if="preValidateResult?.needsAudit" class="audit-notice">
          <el-alert
            title="该操作需要审核"
            type="warning"
            :closable="false"
            show-icon
            description="违规隐藏作品转公开需审核通过后生效"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="changeDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitChange"
          :loading="changeSubmitting"
          :disabled="!changeForm.newVisibility || submitBtnDisabled"
          class="submit-btn"
        >
          确认调整
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="作品状态变更详情"
      width="650px"
      class="detail-dialog"
    >
      <div v-if="detailData" class="detail-content">
        <div class="detail-header">
          <span class="detail-title">{{ detailData.resource?.title }}</span>
          <span :class="['visibility-tag', `tag-${detailData.currentVisibility}`]">
            <span class="visibility-dot" />
            <span>{{ visibilityLabel[detailData.currentVisibility] }}</span>
          </span>
        </div>

        <div class="detail-stats">
          <div class="stat-item">
            <span class="stat-value">{{ detailData.changeCount24h }}</span>
            <span class="stat-label">24小时变更次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ detailData.changeLogs?.length || 0 }}</span>
            <span class="stat-label">历史变更记录</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ detailData.resource?.violationCount || 0 }}</span>
            <span class="stat-label">违规次数</span>
          </div>
        </div>

        <el-divider>变更记录</el-divider>

        <div class="log-timeline">
          <el-timeline>
            <el-timeline-item
              v-for="log in detailData.changeLogs?.slice(0, 10)"
              :key="log.id"
              :timestamp="formatTime(log.createdAt)"
              :type="timelineType(log.changeType)"
            >
              <div class="timeline-content">
                <div class="timeline-title">
                  <span :class="['mini-tag', `tag-${log.newVisibility}`]">
                    {{ visibilityLabel[log.newVisibility] }}
                  </span>
                  <span class="timeline-operator">{{ log.operatorName || '系统' }}</span>
                  <span v-if="log.isHighFrequency" class="hf-tag">高频</span>
                </div>
                <div v-if="log.reason" class="timeline-reason">原因：{{ log.reason }}</div>
                <div v-if="log.auditStatus !== 'none'" class="timeline-audit">
                  审核：{{ auditLabel[log.auditStatus] }}
                  <span v-if="log.auditorName">（{{ log.auditorName }}）</span>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="highFreqDialogVisible"
      title="高频操作拦截"
      width="400px"
      class="highfreq-dialog"
      center
    >
      <div class="highfreq-content">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <div class="highfreq-title">操作过于频繁</div>
        <div class="highfreq-desc">{{ highFreqMessage }}</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="highFreqDialogVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Promotion,
  Check,
  Close,
  Lock,
  ArrowRight,
  Warning
} from '@element-plus/icons-vue'
import type { VisibilityType, VisibilityPreValidateResult, VisibilityStats } from '@/types'
import {
  getVisibilityStats,
  getVisibilityResourceList,
  getVisibilityLogs,
  preValidateVisibility,
  changeVisibility,
  batchChangeVisibility,
  auditVisibilityChange,
  getResourceVisibilityDetail
} from '@/api/resourceVisibility'

const activeTab = ref('control')

const stats = ref<VisibilityStats | null>(null)
const statsLoading = ref(false)

const resourceList = ref<any[]>([])
const listLoading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selected = ref<any[]>([])
const tableRef = ref<any>(null)

const filterForm = reactive({
  keyword: '',
  visibility: '',
  fileType: '',
  violationOnly: false,
  abnormalOnly: false
})

const batchTargetVisibility = ref<VisibilityType | ''>('')
const batchLoading = ref(false)
const batchProgress = reactive({
  visible: false,
  total: 0,
  done: 0
})

const logList = ref<any[]>([])
const logLoading = ref(false)
const logTotal = ref(0)
const logPage = ref(1)
const logPageSize = ref(20)
const logFilter = reactive({
  keyword: '',
  changeType: '',
  newVisibility: '',
  auditStatus: ''
})
const logDateRange = ref<string[]>([])

const auditList = ref<any[]>([])
const auditLoading = ref(false)
const auditTotal = ref(0)
const auditPage = ref(1)
const auditPageSize = ref(20)
const auditSelected = ref<any[]>([])
const auditTableRef = ref<any>(null)
const auditFilter = reactive({
  keyword: ''
})
const batchAuditLoading = ref(false)

const changeDialogVisible = ref(false)
const validateTarget = ref<any>(null)
const preValidateResult = ref<VisibilityPreValidateResult | null>(null)
const changeSubmitting = ref(false)
const submitBtnDisabled = ref(false)

const changeForm = reactive({
  newVisibility: '' as VisibilityType | '',
  reason: ''
})

const changeFormRef = ref<FormInstance>()
const changeFormRules: FormRules = {}

const detailDialogVisible = ref(false)
const detailData = ref<any>(null)

const highFreqDialogVisible = ref(false)
const highFreqMessage = ref('')

const visibilityLabel: Record<string, string> = {
  public: '公开可见',
  private: '私密作品',
  friends_only: '仅好友可见',
  violation_hidden: '违规隐藏'
}

const fileTypeLabel: Record<string, string> = {
  image: '图片',
  video: '视频',
  audio: '音频',
  template: '模板'
}

const fileTypeTagType: Record<string, string> = {
  image: 'success',
  video: 'primary',
  audio: 'warning',
  template: 'info'
}

const changeTypeLabel: Record<string, string> = {
  manual: '手动变更',
  auto: '自动变更',
  batch: '批量变更',
  audit: '审核变更'
}

const changeTypeTag: Record<string, string> = {
  manual: '',
  auto: 'info',
  batch: 'warning',
  audit: 'success'
}

const auditLabel: Record<string, string> = {
  none: '无需审核',
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

const visibilityOptions = computed(() => {
  if (!preValidateResult.value) return []

  const options = [
    { value: 'public', label: '公开可见', allowed: true, blockReason: '' },
    { value: 'private', label: '私密作品', allowed: true, blockReason: '' },
    { value: 'friends_only', label: '仅好友可见', allowed: true, blockReason: '' },
    { value: 'violation_hidden', label: '违规隐藏', allowed: true, blockReason: '' }
  ]

  return options.map(opt => {
    if (opt.value === preValidateResult.value?.currentVisibility) {
      return { ...opt, allowed: false, blockReason: '当前状态' }
    }
    if (!preValidateResult.value?.checks.transition.valid) {
      const target = opt.value
      const currentVis = preValidateResult.value?.currentVisibility
      const allowed = ['private', 'friends_only'].includes(target) ||
        (target === 'violation_hidden' && currentVis === 'public')
      return { ...opt, allowed: !!allowed, blockReason: allowed ? '' : '状态不允许直接变更' }
    }
    return opt
  })
})

const fetchStats = async () => {
  statsLoading.value = true
  try {
    const res = await getVisibilityStats()
    stats.value = res.data
  } finally {
    statsLoading.value = false
  }
}

const fetchResourceList = async () => {
  listLoading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      visibility: filterForm.visibility || undefined,
      fileType: filterForm.fileType || undefined,
      violationOnly: filterForm.violationOnly,
      abnormalOnly: filterForm.abnormalOnly,
      sortBy: 'visibilityChangedAt',
      sortOrder: 'desc'
    }
    const res = await getVisibilityResourceList(params)
    resourceList.value = res.data.list
    total.value = res.data.total
  } finally {
    listLoading.value = false
  }
}

const fetchLogList = async () => {
  logLoading.value = true
  try {
    const params: any = {
      page: logPage.value,
      pageSize: logPageSize.value,
      keyword: logFilter.keyword || undefined,
      changeType: logFilter.changeType || undefined,
      newVisibility: logFilter.newVisibility || undefined,
      auditStatus: logFilter.auditStatus || undefined
    }
    if (logDateRange.value && logDateRange.value.length === 2) {
      params.startTime = logDateRange.value[0]
      params.endTime = logDateRange.value[1]
    }
    const res = await getVisibilityLogs(params)
    logList.value = res.data.list
    logTotal.value = res.data.total
  } finally {
    logLoading.value = false
  }
}

const fetchAuditList = async () => {
  auditLoading.value = true
  try {
    const params: any = {
      page: auditPage.value,
      pageSize: auditPageSize.value,
      auditStatus: 'pending',
      keyword: auditFilter.keyword || undefined
    }
    const res = await getVisibilityLogs(params)
    auditList.value = res.data.list
    auditTotal.value = res.data.total
  } finally {
    auditLoading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.visibility = ''
  filterForm.fileType = ''
  filterForm.violationOnly = false
  filterForm.abnormalOnly = false
  page.value = 1
  fetchResourceList()
}

const resetLogFilter = () => {
  logFilter.keyword = ''
  logFilter.changeType = ''
  logFilter.newVisibility = ''
  logFilter.auditStatus = ''
  logDateRange.value = []
  logPage.value = 1
  fetchLogList()
}

const resetAuditFilter = () => {
  auditFilter.keyword = ''
  auditPage.value = 1
  fetchAuditList()
}

const quickFilter = (visibility: string) => {
  filterForm.visibility = visibility as any
  page.value = 1
  fetchResourceList()
}

const handleSelectionChange = (selection: any[]) => {
  selected.value = selection
}

const handleAuditSelectionChange = (selection: any[]) => {
  auditSelected.value = selection
}

const tableRowClassName = ({ row, rowIndex }: any) => {
  if (row.visibility === 'violation_hidden') return 'row-violation'
  if (row.isBlocked) return 'row-blocked'
  if (rowIndex % 2 === 1) return 'row-stripe'
  return ''
}

const openChangeDialog = async (row: any) => {
  validateTarget.value = row
  changeForm.newVisibility = ''
  changeForm.reason = ''
  preValidateResult.value = null
  changeDialogVisible.value = true

  try {
    const res = await preValidateVisibility(row.id, 'public')
    preValidateResult.value = res.data
  } catch (e: any) {
    // 继续打开对话框，只是不显示校验结果
  }
}

const selectVisibility = async (visibility: string) => {
  changeForm.newVisibility = visibility as VisibilityType

  if (validateTarget.value) {
    try {
      const res = await preValidateVisibility(validateTarget.value.id, visibility as VisibilityType)
      preValidateResult.value = res.data

      if (!res.data.canChange && res.data.blockReasons?.length > 0) {
        const isHighFreq = res.data.checks.highFrequency?.reason?.includes('频繁')
        if (isHighFreq) {
          highFreqMessage.value = res.data.blockReasons[0]
          highFreqDialogVisible.value = true
        }
      }
    } catch (e: any) {
      // ignore
    }
  }
}

const submitChange = async () => {
  if (!validateTarget.value || !changeForm.newVisibility) return

  submitBtnDisabled.value = true
  changeSubmitting.value = true

  try {
    const res = await changeVisibility(validateTarget.value.id, {
      newVisibility: changeForm.newVisibility as VisibilityType,
      reason: changeForm.reason || undefined
    })

    if (res.data.pendingAudit) {
      ElMessage.warning('已提交审核，等待审核通过后生效')
    } else {
      ElMessage.success('状态变更成功')
    }

    changeDialogVisible.value = false
    fetchResourceList()
    fetchStats()
    fetchAuditList()
    fetchLogList()
  } catch (e: any) {
    if (e?.message?.includes('频繁')) {
      highFreqMessage.value = e.message
      highFreqDialogVisible.value = true
    } else {
      ElMessage.error(e?.message || '操作失败')
    }
  } finally {
    changeSubmitting.value = false
    setTimeout(() => {
      submitBtnDisabled.value = false
    }, 300)
  }
}

const onDialogClosed = () => {
  validateTarget.value = null
  preValidateResult.value = null
  changeForm.newVisibility = ''
  changeForm.reason = ''
}

const handleBatchChange = async () => {
  if (selected.value.length === 0 || !batchTargetVisibility.value) return

  try {
    await ElMessageBox.confirm(
      `确定将选中的 ${selected.value.length} 个作品设置为「${visibilityLabel[batchTargetVisibility.value]}」吗？`,
      '批量状态变更',
      { type: 'warning' }
    )
  } catch {
    return
  }

  batchLoading.value = true
  batchProgress.visible = true
  batchProgress.total = selected.value.length
  batchProgress.done = 0

  try {
    const ids = selected.value.map(r => r.id)
    const res = await batchChangeVisibility({
      ids,
      newVisibility: batchTargetVisibility.value as VisibilityType,
      reason: '批量操作'
    })

    const msg = `批量操作完成：成功${res.data.successCount}个，待审核${res.data.pendingCount}个，过滤${res.data.filteredCount}个，失败${res.data.failedCount}个`
    ElMessage.success(msg)

    fetchResourceList()
    fetchStats()
    fetchAuditList()
    fetchLogList()

    tableRef.value?.clearSelection()
  } catch (e: any) {
    ElMessage.error(e?.message || '批量操作失败')
  } finally {
    batchLoading.value = false
    setTimeout(() => {
      batchProgress.visible = false
    }, 1000)
  }
}

const viewDetail = async (row: any) => {
  detailData.value = null
  detailDialogVisible.value = true

  try {
    const res = await getResourceVisibilityDetail(row.id)
    detailData.value = res.data
  } catch (e: any) {
    ElMessage.error(e?.message || '获取详情失败')
  }
}

const handleAudit = async (row: any, pass: boolean) => {
  const action = pass ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(`确定${action}该变更申请吗？`, '审核确认', {
      type: pass ? 'success' : 'warning'
    })
  } catch {
    return
  }

  try {
    await auditVisibilityChange(row.id, { pass })
    ElMessage.success(`审核${action}成功`)
    fetchAuditList()
    fetchResourceList()
    fetchStats()
    fetchLogList()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const handleBatchAudit = async (pass: boolean) => {
  if (auditSelected.value.length === 0) return

  const action = pass ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(
      `确定批量${action}选中的 ${auditSelected.value.length} 条申请吗？`,
      '批量审核',
      { type: pass ? 'success' : 'warning' }
    )
  } catch {
    return
  }

  batchAuditLoading.value = true
  try {
    let success = 0
    let failed = 0

    for (const item of auditSelected.value) {
      try {
        await auditVisibilityChange(item.id, { pass })
        success++
      } catch {
        failed++
      }
    }

    ElMessage.success(`批量${action}完成：成功${success}个，失败${failed}个`)
    fetchAuditList()
    fetchResourceList()
    fetchStats()
    fetchLogList()
    auditTableRef.value?.clearSelection()
  } finally {
    batchAuditLoading.value = false
  }
}

const timelineType = (type: string) => {
  const map: Record<string, string> = {
    manual: 'primary',
    auto: 'info',
    batch: 'warning',
    audit: 'success'
  }
  return map[type] || 'primary'
}

const formatTime = (time: string) => {
  if (!time) return '-'
  const d = new Date(time)
  const pad = (n: number) => (n < 10 ? '0' + n : n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => {
  fetchStats()
  fetchResourceList()
})
</script>

<style scoped lang="scss">
.visibility-page {
  padding: 16px;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.visibility-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.card-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 16px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.overview-section {
  margin-bottom: 24px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.overview-card {
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }
}

.card-public {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  .overview-label { color: #409eff; }
  .overview-value { color: #2b85e4; }
}

.card-private {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  .overview-label { color: #67c23a; }
  .overview-value { color: #529b2e; }
}

.card-friends {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  .overview-label { color: #e6a23c; }
  .overview-value { color: #b88230; }
}

.card-violation {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  .overview-label { color: #f56c6c; }
  .overview-value { color: #dd6161; }
}

.violation-glow {
  animation: violation-blink 2s ease-in-out infinite;
}

@keyframes violation-blink {
  0%, 100% { text-shadow: 0 0 5px rgba(245, 108, 108, 0.3); }
  50% { text-shadow: 0 0 15px rgba(245, 108, 108, 0.8); }
}

.card-pending {
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
  .overview-label { color: #909399; }
  .overview-value { color: #6c6e72; }
}

.card-today {
  background: linear-gradient(135deg, #f0faff 0%, #e0f0ff 100%);
  .overview-label { color: #36cfc9; }
  .overview-value { color: #2bb3ae; }
}

.overview-label {
  font-size: 13px;
  margin-bottom: 8px;
  font-weight: 500;
}

.overview-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 6px;
}

.overview-desc {
  font-size: 12px;
  color: #909399;
}

.filter-form {
  margin-bottom: 16px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.batch-btn {
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    transform: translateY(-1px);
  }
}

.visibility-table {
  :deep(.el-table__row.row-violation) {
    background-color: #fef0f0 !important;
  }

  :deep(.el-table__row.row-blocked) {
    background-color: #fdf6ec !important;
  }

  :deep(.el-table__row:hover) {
    background-color: #ecf5ff !important;
    transition: background-color 0.2s;
  }

  :deep(.el-table__body tr.current-row > td) {
    background-color: #d9ecff !important;
  }
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cover-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  flex-shrink: 0;
}

.title-text {
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visibility-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;

  &.tag-public {
    background: #ecf5ff;
    color: #409eff;
    .visibility-dot { background: #409eff; }
  }

  &.tag-private {
    background: #f0f9eb;
    color: #67c23a;
    .visibility-dot { background: #67c23a; }
  }

  &.tag-friends_only {
    background: #fdf6ec;
    color: #e6a23c;
    .visibility-dot { background: #e6a23c; }
  }

  &.tag-violation_hidden {
    background: #fef0f0;
    color: #f56c6c;
    .visibility-dot { background: #f56c6c; }
    animation: tag-glow 2s ease-in-out infinite;
  }
}

@keyframes tag-glow {
  0%, 100% { box-shadow: 0 0 0 rgba(245, 108, 108, 0); }
  50% { box-shadow: 0 0 12px rgba(245, 108, 108, 0.6); }
}

.visibility-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.violation-count {
  color: #f56c6c;
  font-weight: 600;
}

.time-text {
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.status-transition {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.mini-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;

  &.tag-public {
    background: #ecf5ff;
    color: #409eff;
  }
  &.tag-private {
    background: #f0f9eb;
    color: #67c23a;
  }
  &.tag-friends_only {
    background: #fdf6ec;
    color: #e6a23c;
  }
  &.tag-violation_hidden {
    background: #fef0f0;
    color: #f56c6c;
  }
}

.arrow-icon {
  font-size: 14px;
  color: #c0c4cc;
}

.skeleton-overview {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.skeleton-card {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;

  &.short { width: 60%; margin-bottom: 10px; height: 12px; }
  &.long { width: 90%; margin-bottom: 8px; height: 24px; }
  &.medium { width: 75%; height: 12px; }
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-logs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-log-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    animation: dialog-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

@keyframes dialog-scale-in {
  0% { opacity: 0; transform: scale(0.9) translateY(-20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.dialog-content {
  .current-state {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;

    .label {
      color: #606266;
      font-weight: 500;
    }
  }

  .section-label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 14px;
  }

  .target-section {
    margin-bottom: 20px;
  }
}

.visibility-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.visibility-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover:not(.disabled) {
    border-color: #409eff;
    background: #f5faff;
    transform: translateX(3px);
  }

  &.active {
    border-color: #409eff;
    background: #ecf5ff;
    box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f5f7fa;
  }
}

.option-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;

  &.dot-public { background: #409eff; }
  &.dot-private { background: #67c23a; }
  &.dot-friends_only { background: #e6a23c; }
  &.dot-violation_hidden { background: #f56c6c; }
}

.option-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  flex: 1;
}

.lock-icon {
  font-size: 14px;
  color: #c0c4cc;
}

.submit-btn {
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateX(2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }
}

.audit-notice {
  margin-top: 16px;
}

.detail-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.detail-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;

  .stat-value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: #409eff;
    margin-bottom: 6px;
  }

  .stat-label {
    font-size: 12px;
    color: #909399;
  }
}

.log-timeline {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.timeline-content {
  .timeline-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    margin-bottom: 6px;
  }

  .timeline-operator {
    color: #606266;
    font-weight: 500;
  }

  .hf-tag {
    display: inline-block;
    padding: 1px 6px;
    background: #fef0f0;
    color: #f56c6c;
    font-size: 11px;
    border-radius: 3px;
  }

  .timeline-reason {
    font-size: 13px;
    color: #606266;
    margin-bottom: 4px;
  }

  .timeline-audit {
    font-size: 12px;
    color: #909399;
  }
}

.highfreq-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    animation: dialog-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }
}

@keyframes dialog-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.highfreq-content {
  text-align: center;
  padding: 20px 0;

  .warning-icon {
    font-size: 48px;
    color: #e6a23c;
    margin-bottom: 16px;
    animation: warning-pulse 1.5s ease-in-out infinite;
  }
}

@keyframes warning-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.highfreq-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.highfreq-desc {
  font-size: 14px;
  color: #606266;
}

.text-muted {
  color: #c0c4cc;
  font-size: 12px;
}

@media screen and (max-width: 1400px) {
  .overview-cards {
    grid-template-columns: repeat(3, 1fr);
  }
  .skeleton-overview {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

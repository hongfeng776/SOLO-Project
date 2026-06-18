<template>
  <div class="page-container">
    <el-row :gutter="16" class="mb-20">
      <el-col :xs="12" :sm="4" v-for="item in statCards" :key="item.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: item.color + '15', color: item.color }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCompact(item.value) }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索内容/用户名"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
          >
            <el-option v-for="(label, value) in COMMENT_STATUS_NAMES" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select
            v-model="queryParams.riskLevel"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in COMMENT_RISK_LEVEL_NAMES" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="笔记ID">
          <el-input
            v-model="queryParams.noteId"
            placeholder="笔记ID"
            clearable
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">评论列表</span>
        </div>
      </template>

      <BatchActions
        v-model:selected-ids="selectedIds"
        :selected-rows="selectedRows"
        :total="total"
        :delete-api="handleBatchDeleteApi"
        @select-all="handleSelectAll"
        @clear="clearSelection"
        @delete="handleBatchDeleted"
      >
        <el-button type="success" plain size="small" :icon="CircleCheck" :disabled="!hasSelection" @click="handleBatchAudit(1)">
          批量通过
        </el-button>
        <el-button type="warning" plain size="small" :icon="Warning" :disabled="!hasSelection" @click="handleBatchMarkReview">
          批量标记复核
        </el-button>
        <el-button type="danger" plain size="small" :icon="Delete" :disabled="!hasSelection" @click="handleBatchAudit(2)">
          批量驳回
        </el-button>
      </BatchActions>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        selectable
        show-index
        row-key="id"
        :row-class-name="getRowClassName"
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Comment[])"
        @paginate="handlePaginate"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="noteTitle" label="笔记标题" min-width="160" show-overflow-tooltip />
        <el-table-column label="评论用户" width="140">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="32" :src="row.userAvatar">{{ row.userName?.charAt(0) }}</el-avatar>
              <span class="user-name">{{ row.userName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评论内容" min-width="240">
          <template #default="{ row }">
            <span
              v-for="(part, idx) in getHighlightParts(row)"
              :key="idx"
              :class="{ 'sensitive-highlight': part.isSensitive }"
            >{{ part.text }}</span>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.riskLevel > 0"
              :color="COMMENT_RISK_LEVEL_COLORS[row.riskLevel]"
              effect="dark"
              size="small"
              style="border: none; color: #fff"
            >
              {{ COMMENT_RISK_LEVEL_NAMES[row.riskLevel] }}
            </el-tag>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <transition name="fade" mode="out-in">
              <el-tag
                :key="row.status"
                :type="COMMENT_STATUS_TAG_TYPES[row.status] || 'info'"
                size="small"
              >
                {{ COMMENT_STATUS_NAMES[row.status] }}
              </el-tag>
            </transition>
          </template>
        </el-table-column>
        <el-table-column label="评论时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-popover
              placement="left"
              :width="380"
              trigger="hover"
              @before-enter="loadTrace(row.id)"
            >
              <template #reference>
                <el-button link type="info" size="small">溯源</el-button>
              </template>
              <div class="trace-popover" v-loading="traceLoading">
                <template v-if="traceData">
                  <el-descriptions :column="1" border size="small">
                    <el-descriptions-item label="发布IP">{{ traceData.source.ip || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="用户账号">{{ traceData.source.userName }} (ID: {{ traceData.source.userId }})</el-descriptions-item>
                    <el-descriptions-item label="发布时间">{{ formatDateTime(traceData.source.publishTime) }}</el-descriptions-item>
                    <el-descriptions-item label="所属笔记">{{ traceData.note?.title || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="24h评论数">{{ traceData.riskAnalysis.sameUserRecentCount }}</el-descriptions-item>
                    <el-descriptions-item label="相同内容数">{{ traceData.riskAnalysis.sameContentCount }}</el-descriptions-item>
                    <el-descriptions-item label="同IP评论数">{{ traceData.riskAnalysis.sameIpCount }}</el-descriptions-item>
                  </el-descriptions>
                  <div v-if="traceData.riskAnalysis.reasons.length > 0" class="trace-risk-reasons">
                    <div class="risk-title">风险提示：</div>
                    <el-tag
                      v-for="(reason, idx) in traceData.riskAnalysis.reasons"
                      :key="idx"
                      type="danger"
                      size="small"
                      class="risk-tag"
                    >{{ reason }}</el-tag>
                  </div>
                </template>
              </div>
            </el-popover>
            <el-button
              v-if="row.status === 0"
              link
              type="success"
              size="small"
              @click="handleAuditPass(row)"
            >
              审核通过
            </el-button>
            <el-button
              v-if="row.status !== 2"
              link
              type="warning"
              size="small"
              @click="handleAuditReject(row)"
            >
              审核驳回
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="auditVisible"
      :title="auditDialogTitle"
      :width="auditForm.action === 2 ? '620px' : '520px'"
      :close-on-click-modal="false"
      destroy-on-close
      :class="{ 'dialog-shake': dialogShaking }"
      @close="handleAuditClose"
    >
      <el-form
        ref="auditFormRef"
        :model="auditForm"
        :rules="auditRules"
        label-width="100px"
      >
        <el-form-item label="审核结果" prop="action">
          <el-radio-group v-model="auditForm.action">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="评论内容">
          <div class="audit-content-preview">
            <span
              v-for="(part, idx) in currentHighlightParts"
              :key="idx"
              :class="{ 'sensitive-highlight': part.isSensitive }"
            >{{ part.text }}</span>
          </div>
        </el-form-item>
        <el-form-item label="评论信息">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="评论用户">{{ currentUserName }}</el-descriptions-item>
            <el-descriptions-item label="评论时间">{{ formatDateTime(currentTime) }}</el-descriptions-item>
            <el-descriptions-item v-if="currentViolationType" label="违规类型">
              <el-tag type="danger" size="small">{{ currentViolationType }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentRiskLevel > 0" label="风险等级">
              <el-tag :color="COMMENT_RISK_LEVEL_COLORS[currentRiskLevel]" effect="dark" size="small" style="border: none; color: #fff">
                {{ COMMENT_RISK_LEVEL_NAMES[currentRiskLevel] }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-form-item>
        <el-form-item
          v-if="auditForm.action === 2"
          label="违规类型"
          prop="violationType"
        >
          <el-select
            v-model="auditForm.violationType"
            placeholder="请选择违规类型"
            style="width: 100%"
          >
            <el-option v-for="(label, key) in COMPLIANCE_VIOLATION_TYPE_NAMES" :key="key" :label="label" :value="key" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="auditForm.action === 2"
          label="驳回原因"
          prop="reason"
        >
          <el-input
            v-model="auditForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入驳回原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="auditSubmitting"
          @click="handleAuditSubmit"
        >
          确认提交
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="complianceVisible"
      title="合规校验结果"
      width="560px"
      destroy-on-close
      :class="{ 'dialog-shake': dialogShaking }"
    >
      <template v-if="complianceResult">
        <el-alert
          :title="complianceResult.intercepted ? '评论已被自动拦截' : '评论存在风险，需人工审核'"
          :type="complianceResult.intercepted ? 'error' : 'warning'"
          show-icon
          :closable="false"
          class="mb-16"
        />
        <div class="compliance-violations">
          <div class="violation-title">违规详情：</div>
          <div
            v-for="(v, idx) in complianceResult.violations"
            :key="idx"
            class="violation-item"
          >
            <el-tag :type="v.level >= 3 ? 'danger' : v.level >= 2 ? 'warning' : 'info'" size="small">
              {{ v.typeName }}
            </el-tag>
            <span class="violation-msg">{{ v.message }}</span>
          </div>
        </div>
        <div v-if="complianceResult.sensitiveMatches.length > 0" class="compliance-highlight">
          <div class="violation-title">内容高亮：</div>
          <div class="highlight-content-box">
            <span
              v-for="(part, idx) in complianceHighlightParts"
              :key="idx"
              :class="{ 'sensitive-highlight': part.isSensitive }"
            >{{ part.text }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="complianceVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Refresh,
  ChatDotRound,
  CircleCheck,
  CircleClose,
  Warning,
  Delete,
  WarningFilled
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  getCommentList,
  auditComment,
  batchAuditComments,
  batchDeleteComments,
  batchMarkReviewComments,
  getCommentStats,
  deleteComment,
  getCommentTrace,
  checkCommentCompliance,
  highlightCommentContent
} from '@api/comment'
import {
  CommentStatus,
  COMMENT_STATUS_NAMES,
  COMMENT_STATUS_TAG_TYPES,
  CommentRiskLevel,
  COMMENT_RISK_LEVEL_NAMES,
  COMMENT_RISK_LEVEL_COLORS,
  COMPLIANCE_VIOLATION_TYPE_NAMES
} from '@enums/business'
import type { Comment, ComplianceCheckResult, CommentTraceResult, HighlightPart } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'

const { formatCompact } = useNumberFormat()

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Comment, { keyword?: string; status?: number; noteId?: string; riskLevel?: number }>({
  fetchApi: getCommentList,
  defaultParams: { keyword: '', status: undefined, noteId: '', riskLevel: undefined },
  immediate: false
})

const { selectedRows, selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<Comment>()

const statCards = ref([
  { key: 'total', label: '评论总数', value: 0, icon: ChatDotRound, color: '#409eff' },
  { key: 'pending', label: '待审核', value: 0, icon: Warning, color: '#e6a23c' },
  { key: 'approved', label: '已通过', value: 0, icon: CircleCheck, color: '#67c23a' },
  { key: 'rejected', label: '已驳回', value: 0, icon: CircleClose, color: '#f56c6c' },
  { key: 'riskHigh', label: '高风险', value: 0, icon: WarningFilled, color: '#c45656' },
  { key: 'todayNew', label: '今日新增', value: 0, icon: ChatDotRound, color: '#909399' }
])

const loadStats = async () => {
  try {
    const stats = await getCommentStats()
    statCards.value.forEach((item) => {
      if (stats[item.key] != null) {
        item.value = stats[item.key]
      }
    })
  } catch (error) {
    console.error(error)
  }
}

const getRowClassName = ({ row }: { row: Comment }) => {
  if (row.riskLevel >= 2) return 'row-risk-high'
  if (row.riskLevel >= 1) return 'row-risk-low'
  return ''
}

const getHighlightParts = (row: Comment): HighlightPart[] => {
  if (!row.violationType && row.riskLevel === 0) {
    return [{ text: row.content, isSensitive: false }]
  }
  return computeHighlight(row.content, row.violationType ? row.violationType.split(',') : [])
}

const computeHighlight = (content: string, matchedTypes: string[]): HighlightPart[] => {
  if (!content) return []
  const sensitivePatterns = /加微|加V|加Q|私聊|兼职|赚钱|免费领|扫码|红包返|色情|赌博|毒品|枪支|诈骗|传销|侮辱|歧视|代孕|刷单|黑客|贷款无需|博彩|淫秽|卖淫|嫖娼|冰毒|摇头丸|弹药|爆炸物|法轮|反动|颠覆|杀人|自杀|暴力|非法集资|器官买卖|政治敏感|分裂|恶意造谣|人身攻击|恶意辱骂|加我微信|加我VX|加我QQ|私聊赚钱|带你赚钱|日入过万|月入十万|轻松月入|躺赚|免费领取|扫码领取|限量免费|点击链接领取|下载APP领取|代开发票|出售账号|出租账号|刷好评|代刷|色情直播|成人直播|代孕服务|买卖器官|黑客服务|破解密码|黑户贷款|赌博平台|下注返利|月赚|日赚|领红包|返利|佣金|微信搜索|公众号|小程序码|淘宝搜索|抖音搜索|进群|拉群|群号|客服微信|咨询微信|低价出售|清仓处理|招代理|招募代理|项目合作|商务合作私聊/g

  const matches: string[] = []
  let match: RegExpExecArray | null
  const regex = new RegExp(sensitivePatterns.source, 'g')
  while ((match = regex.exec(content)) !== null) {
    if (!matches.includes(match[0])) {
      matches.push(match[0])
    }
  }

  if (matches.length === 0) {
    return [{ text: content, isSensitive: false }]
  }

  const sorted = [...matches].sort((a, b) => b.length - a.length)
  const parts: HighlightPart[] = []
  let remaining = content

  while (remaining.length > 0) {
    let earliestIndex = remaining.length
    let earliestMatch = ''

    for (const m of sorted) {
      const idx = remaining.indexOf(m)
      if (idx !== -1 && idx < earliestIndex) {
        earliestIndex = idx
        earliestMatch = m
      }
    }

    if (earliestMatch === '') {
      parts.push({ text: remaining, isSensitive: false })
      break
    }

    if (earliestIndex > 0) {
      parts.push({ text: remaining.substring(0, earliestIndex), isSensitive: false })
    }
    parts.push({ text: earliestMatch, isSensitive: true })
    remaining = remaining.substring(earliestIndex + earliestMatch.length)
  }

  return parts
}

const auditVisible = ref(false)
const auditFormRef = ref<FormInstance>()
const auditSubmitting = ref(false)
const dialogShaking = ref(false)
const currentId = ref<number | null>(null)
const currentContent = ref('')
const currentUserName = ref('')
const currentTime = ref('')
const currentViolationType = ref('')
const currentRiskLevel = ref(0)

const auditForm = ref({
  action: 1,
  violationType: '',
  reason: ''
})

const auditDialogTitle = computed(() => {
  return auditForm.value.action === 1 ? '审核通过' : '审核驳回'
})

const currentHighlightParts = computed(() => {
  return computeHighlight(currentContent.value, currentViolationType.value ? currentViolationType.value.split(',') : [])
})

const auditRules: FormRules = {
  action: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  violationType: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (auditForm.value.action === 2 && !value) {
          callback(new Error('请选择违规类型'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  reason: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (auditForm.value.action === 2 && !value?.trim()) {
          callback(new Error('请输入驳回原因'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const triggerShake = () => {
  dialogShaking.value = true
  setTimeout(() => {
    dialogShaking.value = false
  }, 500)
}

const handleView = (row: Comment) => {
  currentId.value = row.id
  currentContent.value = row.content
  currentUserName.value = row.userName
  currentTime.value = row.createTime
  currentViolationType.value = row.violationType || ''
  currentRiskLevel.value = row.riskLevel || 0
  auditForm.value = {
    action: row.status === 0 ? 1 : 2,
    violationType: row.violationType || '',
    reason: ''
  }
  auditVisible.value = true
}

const handleAuditPass = (row: Comment) => {
  currentId.value = row.id
  currentContent.value = row.content
  currentUserName.value = row.userName
  currentTime.value = row.createTime
  currentViolationType.value = row.violationType || ''
  currentRiskLevel.value = row.riskLevel || 0
  auditForm.value = { action: 1, violationType: '', reason: '' }
  auditVisible.value = true
}

const handleAuditReject = (row: Comment) => {
  currentId.value = row.id
  currentContent.value = row.content
  currentUserName.value = row.userName
  currentTime.value = row.createTime
  currentViolationType.value = row.violationType || ''
  currentRiskLevel.value = row.riskLevel || 0
  auditForm.value = { action: 2, violationType: row.violationType || '', reason: '' }
  auditVisible.value = true
  if (row.riskLevel >= 2) {
    triggerShake()
  }
}

const handleAuditClose = () => {
  auditVisible.value = false
  auditForm.value = { action: 1, violationType: '', reason: '' }
}

const handleAuditSubmit = async () => {
  if (!auditFormRef.value || !currentId.value) return
  const valid = await auditFormRef.value.validate().catch(() => false)
  if (!valid) return

  auditSubmitting.value = true
  try {
    const status = auditForm.value.action === 1 ? 1 : 2
    await auditComment(currentId.value, {
      status,
      violationType: auditForm.value.violationType || undefined,
      reason: auditForm.value.reason || undefined
    })
    ElMessage.success(auditForm.value.action === 1 ? '审核通过' : '已驳回')
    auditVisible.value = false
    fetchData()
    loadStats()
  } catch (error) {
    console.error(error)
  } finally {
    auditSubmitting.value = false
  }
}

const handleBatchAudit = async (status: number) => {
  if (!hasSelection.value) return
  const actionName = status === 1 ? '通过' : '驳回'
  try {
    await ElMessageBox.confirm(
      `确认批量${actionName}选中的 ${selectedIds.value.length} 条评论吗？`,
      '批量操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await batchAuditComments(selectedIds.value, { status })
    ElMessage.success(`批量${actionName}成功`)
    clearSelection()
    fetchData()
    loadStats()
  } catch {
    // canceled
  }
}

const handleBatchMarkReview = async () => {
  if (!hasSelection.value) return
  try {
    await ElMessageBox.confirm(
      `确认将选中的 ${selectedIds.value.length} 条评论标记为疑似违规待复核吗？`,
      '批量标记确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await batchMarkReviewComments(selectedIds.value)
    ElMessage.success('批量标记复核成功')
    clearSelection()
    fetchData()
    loadStats()
  } catch {
    // canceled
  }
}

const handleDelete = async (row: Comment) => {
  try {
    await ElMessageBox.confirm('确认删除该评论吗？删除后将记录违规日志。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteComment(row.id)
    ElMessage.success('删除成功')
    fetchData()
    loadStats()
  } catch {
    // canceled
  }
}

const handleSelectAll = (val: boolean) => {
  console.log('select all', val)
}

const handleBatchDeleteApi = (ids: number[]) => {
  return batchDeleteComments(ids)
}

const handleBatchDeleted = () => {
  clearSelection()
  fetchData()
  loadStats()
}

const traceLoading = ref(false)
const traceData = ref<CommentTraceResult | null>(null)

const loadTrace = async (id: number) => {
  traceLoading.value = true
  traceData.value = null
  try {
    traceData.value = await getCommentTrace(id)
  } catch (error) {
    console.error(error)
  } finally {
    traceLoading.value = false
  }
}

const complianceVisible = ref(false)
const complianceResult = ref<ComplianceCheckResult | null>(null)

const complianceHighlightParts = computed(() => {
  if (!complianceResult.value) return []
  const content = complianceResult.value.violations.map(v => v.matched.join(' ')).join(' ')
  if (!content) return [{ text: '', isSensitive: false }]
  return computeHighlight(content, [])
})

onMounted(() => {
  fetchData()
  loadStats()
})
</script>

<style lang="scss" scoped>
.page-container {
  .stat-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: $border-radius;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 4px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-name {
    font-size: 14px;
    color: $text-primary;
  }

  .text-secondary {
    color: $text-secondary;
  }

  .sensitive-highlight {
    color: #f56c6c;
    font-weight: 600;
    background: rgba(245, 108, 108, 0.1);
    padding: 0 2px;
    border-radius: 2px;
  }

  .audit-content-preview {
    max-height: 120px;
    overflow-y: auto;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    line-height: 1.6;
    word-break: break-all;
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  .mb-20 {
    margin-bottom: 20px;
  }

  .compliance-violations {
    margin-bottom: 16px;

    .violation-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: $text-primary;
    }

    .violation-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      .violation-msg {
        font-size: 13px;
        color: $text-regular;
      }
    }
  }

  .compliance-highlight {
    .violation-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: $text-primary;
    }

    .highlight-content-box {
      padding: 8px 12px;
      background: #f5f7fa;
      border-radius: 4px;
      line-height: 1.8;
      word-break: break-all;
    }
  }

  .trace-popover {
    .trace-risk-reasons {
      margin-top: 8px;

      .risk-title {
        font-weight: 600;
        font-size: 13px;
        color: #f56c6c;
        margin-bottom: 4px;
      }

      .risk-tag {
        margin-right: 4px;
        margin-bottom: 4px;
      }
    }
  }
}

:deep(.row-risk-high) {
  td {
    border-color: rgba(245, 108, 108, 0.3) !important;
  }
  box-shadow: inset 0 0 8px rgba(245, 108, 108, 0.15);
  animation: glow-border-red 2s ease-in-out infinite alternate;
}

:deep(.row-risk-low) {
  td {
    border-color: rgba(230, 162, 60, 0.2) !important;
  }
  box-shadow: inset 0 0 6px rgba(230, 162, 60, 0.1);
  animation: glow-border-orange 2s ease-in-out infinite alternate;
}

@keyframes glow-border-red {
  from {
    box-shadow: inset 0 0 6px rgba(245, 108, 108, 0.1);
  }
  to {
    box-shadow: inset 0 0 12px rgba(245, 108, 108, 0.25);
  }
}

@keyframes glow-border-orange {
  from {
    box-shadow: inset 0 0 4px rgba(230, 162, 60, 0.08);
  }
  to {
    box-shadow: inset 0 0 10px rgba(230, 162, 60, 0.18);
  }
}

.dialog-shake {
  animation: dialog-shake 0.4s ease-in-out;
}

@keyframes dialog-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
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

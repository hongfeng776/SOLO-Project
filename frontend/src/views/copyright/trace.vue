<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { useUserStore } from '@/stores'
import {
  COPYRIGHT_TYPE,
  COPYRIGHT_CONTENT_TYPE,
  COPYRIGHT_BIND_STATUS,
  COPYRIGHT_OWNERSHIP_STATUS,
  COPYRIGHT_COMPLIANCE_STATUS,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  traceCopyrightApi,
  checkCopyrightConflictApi,
  getCopyrightDetailApi,
} from '@/api/copyright'
import type { CopyrightItem, CopyrightDetail, CopyrightTraceItem, CopyrightConflictCheckResult } from '@/types'
import { formatDate } from '@/utils'
import {
  Search, Refresh, Bell, WarningFilled, CircleCheck, CircleClose,
  Document, View, Top, Aim, Close,
} from '@element-plus/icons-vue'

const loading = ref(false)
const traceList = ref<any[]>([])
const total = ref(0)
const showBackTop = ref(false)
const tableBodyRef = ref<any>(null)

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  copyrightCode: '',
  contentId: '' as number | string,
  supplierName: '',
  supplierContact: '',
  supplierPhone: '',
  type: null as number | null,
  contentType: null as number | null,
  ownershipStatus: null as number | null,
  complianceStatus: null as number | null,
  bindStatus: null as number | null,
  hasConflict: null as boolean | null,
})

const loadData = async () => {
  loading.value = true
  try {
    const result = await traceCopyrightApi({ ...queryParams })
    traceList.value = result.list || []
    total.value = result.pagination?.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  queryParams.copyrightCode = ''
  queryParams.contentId = ''
  queryParams.supplierName = ''
  queryParams.supplierContact = ''
  queryParams.supplierPhone = ''
  queryParams.type = null
  queryParams.contentType = null
  queryParams.ownershipStatus = null
  queryParams.complianceStatus = null
  queryParams.bindStatus = null
  queryParams.hasConflict = null
  handleSearch()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
  scrollTableTop()
}

const handleSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  showBackTop.value = (target?.scrollTop || 0) > 300
}

const scrollTableTop = () => {
  if (tableBodyRef.value) {
    tableBodyRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const onMountedAssign = () => {
  nextTick(() => {
    const wrapper = document.querySelector('.trace-table-wrapper .el-scrollbar__wrap')
    if (wrapper) {
      wrapper.addEventListener('scroll', handleScroll, { passive: true })
      tableBodyRef.value = wrapper
    }
  })
}

onBeforeUnmount(() => {
  if (tableBodyRef.value) {
    tableBodyRef.value.removeEventListener('scroll', handleScroll)
  }
})

const detailVisible = ref(false)
const currentDetail = ref<CopyrightDetail | null>(null)
const conflictResult = ref<CopyrightConflictCheckResult | null>(null)
const checkingConflict = ref(false)

const openTraceDetail = async (row: any) => {
  detailVisible.value = true
  currentDetail.value = null
  conflictResult.value = null
  try {
    const detail = await getCopyrightDetailApi(row.copyrightId || row.id)
    currentDetail.value = detail
    await checkConflictForDetail()
  } catch (err: any) {
    ElMessage.error(err?.message || '加载详情失败')
  }
}

const checkConflictForDetail = async () => {
  if (!currentDetail.value) return
  checkingConflict.value = true
  conflictResult.value = null
  try {
    const contentIds = currentDetail.value.relatedContents?.map((c) => c.id) || []
    const result = await checkCopyrightConflictApi({
      code: currentDetail.value.code,
      copyrightId: currentDetail.value.id,
      contentIds,
    })
    conflictResult.value = result
  } catch (err: any) {
    // 不弹出错误
  } finally {
    checkingConflict.value = false
  }
}

const consistencyInfo = computed(() => {
  if (!conflictResult.value) return null
  const info: any = {
    codeOk: !conflictResult.value.duplicateCode,
    contentOk: !conflictResult.value.contentConflicts?.length,
    scopeOk: true,
    periodOk: true,
    ownershipOk: true,
  }
  if (conflictResult.value.details?.inconsistency) {
    info.scopeOk = !conflictResult.value.details.inconsistency.includes('scope')
    info.periodOk = !conflictResult.value.details.inconsistency.includes('period')
    info.ownershipOk = !conflictResult.value.details.inconsistency.includes('ownership')
  }
  info.overallOk = info.codeOk && info.contentOk && info.scopeOk && info.periodOk && info.ownershipOk
  return info
})

const traceColumns = [
  { prop: 'traceId', label: '溯源ID', width: 100, align: 'center', fixed: 'left' as const },
  { prop: 'copyrightCode', label: '版权编号', width: 140, fixed: 'left' as const },
  { prop: 'copyrightName', label: '版权名称', minWidth: 180, showOverflowTooltip: true },
  {
    prop: 'type', label: '版权类型', width: 100, align: 'center', slot: 'type',
  },
  {
    prop: 'contentType', label: '内容类型', width: 90, align: 'center', slot: 'contentType',
  },
  { prop: 'contentId', label: '绑定内容ID', width: 110, align: 'center', slot: 'contentId' },
  { prop: 'contentTitle', label: '绑定内容标题', minWidth: 180, showOverflowTooltip: true },
  { prop: 'supplierName', label: '授权方/供应方', minWidth: 140, showOverflowTooltip: true },
  { prop: 'supplierContact', label: '联系人', width: 100 },
  { prop: 'supplierPhone', label: '联系电话', width: 120 },
  { label: '授权有效期', width: 200, align: 'center', slot: 'period' },
  {
    prop: 'ownershipStatus', label: '权属', width: 90, align: 'center', slot: 'ownership',
  },
  {
    prop: 'complianceStatus', label: '合规', width: 90, align: 'center', slot: 'compliance',
  },
  {
    prop: 'bindStatus', label: '绑定状态', width: 110, align: 'center', slot: 'bindStatus',
  },
  {
    label: '一致性校验', width: 110, align: 'center', slot: 'consistency', fixed: 'right' as const,
  },
  {
    label: '溯源详情', width: 90, align: 'center', slot: 'actions', fixed: 'right' as const,
  },
]

const timelineActions = computed(() => {
  if (!currentDetail.value) return []
  const events: any[] = []
  if (currentDetail.value.createdAt) {
    events.push({
      time: formatDate(currentDetail.value.createdAt, 'YYYY-MM-DD HH:mm:ss'),
      action: '版权录入',
      detail: `系统创建版权记录，编号：${currentDetail.value.code}`,
      type: 'primary',
    })
  }
  if (currentDetail.value.qualificationFiles?.length) {
    currentDetail.value.qualificationFiles.forEach((f: any) => {
      if (f.uploadedAt) {
        events.push({
          time: formatDate(f.uploadedAt, 'YYYY-MM-DD HH:mm:ss'),
          action: '资质文件上传',
          detail: `上传${f.fileName || '资质文件'}，核验状态：${f.validityStatus === 1 ? '通过' : f.validityStatus === 2 ? '过期' : f.validityStatus === 3 ? '不清晰' : '待核验'}`,
          type: f.validityStatus === 1 ? 'success' : f.validityStatus === 2 || f.validityStatus === 3 ? 'danger' : 'warning',
        })
      }
    })
  }
  if (currentDetail.value.relatedContents?.length) {
    currentDetail.value.relatedContents.forEach((c: any, idx: number) => {
      if (c.bindAt || currentDetail.value?.updatedAt) {
        events.push({
          time: formatDate(c.bindAt || currentDetail.value!.updatedAt, 'YYYY-MM-DD HH:mm:ss'),
          action: `内容绑定 #${idx + 1}`,
          detail: `绑定内容[ID:${c.id}] ${c.title}，状态：${c.status === 1 ? (c.auditStatus === 2 ? '已上架' : '待上架') : '已下架'}`,
          type: c.status === 1 && c.auditStatus === 2 ? 'success' : 'info',
        })
      }
    })
  }
  if (currentDetail.value.auditTrail?.length) {
    currentDetail.value.auditTrail.forEach((a: any) => {
      events.push({
        time: formatDate(a.time, 'YYYY-MM-DD HH:mm:ss'),
        action: a.action,
        detail: a.detail,
        type: a.action.includes('失效') ? 'danger' : a.action.includes('续期') ? 'success' : 'warning',
      })
    })
  }
  return events.sort((a, b) => (a.time < b.time ? -1 : 1))
})

onMounted(() => {
  loadData()
  onMountedAssign()
})
</script>

<template>
  <div class="copyright-trace-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-row :gutter="8" style="width: 100%;">
          <el-col :span="6">
            <el-form-item label="版权编号" style="width: 100%; justify-content: flex-end;">
              <el-input
                v-model="queryParams.copyrightCode"
                placeholder="精准输入版权编号"
                clearable
                style="width: 170px;"
                :prefix-icon="Aim"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="内容ID" style="width: 100%; justify-content: flex-end;">
              <el-input-number
                v-model="queryParams.contentId"
                :min="0"
                :controls="false"
                placeholder="内容ID"
                style="width: 140px;"
                @change="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="授权方名称" style="width: 100%; justify-content: flex-end;">
              <el-input
                v-model="queryParams.supplierName"
                placeholder="供应方/授权方"
                clearable
                style="width: 170px;"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="联系电话" style="width: 100%; justify-content: flex-end;">
              <el-input
                v-model="queryParams.supplierPhone"
                placeholder="授权方电话"
                clearable
                style="width: 140px;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="2" style="display: flex; align-items: center;">
            <el-form-item style="margin: 0; width: 100%;">
              <el-button type="primary" :icon="Search" @click="handleSearch" style="width: 100%;">溯源</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8" style="width: 100%;">
          <el-col :span="3">
            <el-form-item label="版权类型" style="width: 100%; justify-content: flex-end;">
              <el-select v-model="queryParams.type" placeholder="全部" clearable style="width: 90px;">
                <el-option v-for="item in getEnumOptions(COPYRIGHT_TYPE)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="内容类型" style="width: 100%; justify-content: flex-end;">
              <el-select v-model="queryParams.contentType" placeholder="全部" clearable style="width: 85px;">
                <el-option v-for="item in getEnumOptions(COPYRIGHT_CONTENT_TYPE)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="权属状态" style="width: 100%; justify-content: flex-end;">
              <el-select v-model="queryParams.ownershipStatus" placeholder="全部" clearable style="width: 85px;">
                <el-option v-for="item in getEnumOptions(COPYRIGHT_OWNERSHIP_STATUS)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="合规状态" style="width: 100%; justify-content: flex-end;">
              <el-select v-model="queryParams.complianceStatus" placeholder="全部" clearable style="width: 85px;">
                <el-option v-for="item in getEnumOptions(COPYRIGHT_COMPLIANCE_STATUS)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="绑定状态" style="width: 100%; justify-content: flex-end;">
              <el-select v-model="queryParams.bindStatus" placeholder="全部" clearable style="width: 95px;">
                <el-option v-for="item in getEnumOptions(COPYRIGHT_BIND_STATUS)" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="冲突筛选" style="width: 100%; justify-content: flex-end;">
              <el-select v-model="queryParams.hasConflict" placeholder="全部" clearable style="width: 95px;">
                <el-option label="仅冲突" :value="true" />
                <el-option label="无冲突" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6" style="display: flex; align-items: center;">
            <el-form-item style="margin: 0;">
              <el-button :icon="Refresh" @click="handleReset">重置条件</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="card-content trace-table-wrapper">
      <QyTableToolbar :loading="loading" @refresh="loadData">
        <template #left>
          <span style="font-size: 13px; color: #909399;">
            提示：系统会自动拦截重复版权编号、内容冲突绑定，确保版权信息一致性
          </span>
        </template>
      </QyTableToolbar>

      <el-table
        v-loading="loading"
        :data="traceList"
        border
        stripe
        height="calc(100vh - 360px)"
        class="trace-el-table"
        :header-cell-style="{ background: '#FAFBFC', fontWeight: 600 }"
      >
        <el-table-column type="index" label="序号" width="55" align="center" fixed="left" />
        <template v-for="col in traceColumns" :key="col.prop || col.slot">
          <el-table-column
            v-if="col.slot !== 'type' && col.slot !== 'contentType' && col.slot !== 'contentId'
              && col.slot !== 'period' && col.slot !== 'ownership' && col.slot !== 'compliance'
              && col.slot !== 'bindStatus' && col.slot !== 'consistency' && col.slot !== 'actions'"
            v-bind="col"
            show-overflow-tooltip
          />
          <el-table-column v-else-if="col.slot === 'type'" v-bind="col">
            <template #default="{ row }">
              <el-tag :type="getEnumItem(COPYRIGHT_TYPE, row.type)?.type || 'info'" size="small">
                {{ getEnumLabel(COPYRIGHT_TYPE, row.type) || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-else-if="col.slot === 'contentType'" v-bind="col">
            <template #default="{ row }">
              <el-tag size="small" type="info" effect="plain">
                {{ getEnumLabel(COPYRIGHT_CONTENT_TYPE, row.contentType) || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-else-if="col.slot === 'contentId'" v-bind="col">
            <template #default="{ row }">
              <span v-if="row.contentId" class="content-id-cell">#{{ row.contentId }}</span>
              <span v-else style="color: #C0C4CC;">未绑定</span>
            </template>
          </el-table-column>
          <el-table-column v-else-if="col.slot === 'period'" v-bind="col">
            <template #default="{ row }">
              <div style="font-size: 12px; line-height: 1.4;">
                <div>{{ formatDate(row.startDate, 'MM-DD') || '-' }}</div>
                <div style="color: #909399;">至 {{ formatDate(row.endDate, 'YYYY-MM-DD') || '-' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-else-if="col.slot === 'ownership'" v-bind="col">
            <template #default="{ row }">
              <el-tag
                :type="getEnumItem(COPYRIGHT_OWNERSHIP_STATUS, row.ownershipStatus)?.type || 'info'"
                size="small"
              >
                {{ getEnumLabel(COPYRIGHT_OWNERSHIP_STATUS, row.ownershipStatus) || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-else-if="col.slot === 'compliance'" v-bind="col">
            <template #default="{ row }">
              <el-tag
                :type="getEnumItem(COPYRIGHT_COMPLIANCE_STATUS, row.complianceStatus)?.type || 'info'"
                size="small"
              >
                {{ getEnumLabel(COPYRIGHT_COMPLIANCE_STATUS, row.complianceStatus) || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-else-if="col.slot === 'bindStatus'" v-bind="col">
            <template #default="{ row }">
              <el-tag
                :type="getEnumItem(COPYRIGHT_BIND_STATUS, row.bindStatus)?.type || 'info'"
                size="small"
              >
                {{ getEnumLabel(COPYRIGHT_BIND_STATUS, row.bindStatus) || '未绑定' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-else-if="col.slot === 'consistency'" v-bind="col">
            <template #default="{ row }">
              <el-tooltip
                v-if="row.hasConflict || row.conflictFlags?.length"
                effect="dark"
                placement="top"
              >
                <template #content>
                  <div style="white-space: pre-line;">
                    <div v-if="row.conflictFlags?.includes('code')">⚠ 版权编号重复</div>
                    <div v-if="row.conflictFlags?.includes('content')">⚠ 内容绑定冲突</div>
                    <div v-if="row.conflictFlags?.includes('scope')">⚠ 授权范围不一致</div>
                    <div v-if="row.conflictFlags?.includes('period')">⚠ 有效期冲突</div>
                    <div v-if="row.conflictFlags?.includes('ownership')">⚠ 权属信息不一致</div>
                  </div>
                </template>
                <el-tag type="danger" size="small" effect="dark">
                  <el-icon style="margin-right: 2px;"><WarningFilled /></el-icon>
                  {{ row.conflictFlags?.length || 1 }}处冲突
                </el-tag>
              </el-tooltip>
              <el-tag v-else type="success" size="small" effect="light">
                <el-icon style="margin-right: 2px;"><CircleCheck /></el-icon>
                一致
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-else-if="col.slot === 'actions'" v-bind="col">
            <template #default="{ row }">
              <el-button type="primary" link :icon="View" size="small" @click="openTraceDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </template>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <transition name="back-top-fade">
      <div v-show="showBackTop" class="back-top-btn" @click="scrollTableTop">
        <el-tooltip content="返回顶部" placement="left">
          <el-button :icon="Top" circle type="primary" :size="'default'" />
        </el-tooltip>
      </div>
    </transition>

    <el-drawer
      v-model="detailVisible"
      title="版权溯源详情"
      direction="rtl"
      size="720px"
      append-to-body
    >
      <div v-loading="!currentDetail" class="trace-detail">
        <div v-if="currentDetail" class="detail-section">
          <div class="section-header">
            <h4>基础信息</h4>
            <el-tag
              :type="getEnumItem(COPYRIGHT_COMPLIANCE_STATUS, currentDetail.complianceStatus)?.type || 'info'"
            >
              {{ getEnumLabel(COPYRIGHT_COMPLIANCE_STATUS, currentDetail.complianceStatus) || '-' }}
            </el-tag>
          </div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="版权编号">{{ currentDetail.code }}</el-descriptions-item>
            <el-descriptions-item label="版权名称">{{ currentDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="版权类型">
              {{ getEnumLabel(COPYRIGHT_TYPE, currentDetail.type) }}
            </el-descriptions-item>
            <el-descriptions-item label="内容类型">
              {{ getEnumLabel(COPYRIGHT_CONTENT_TYPE, currentDetail.contentType) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="授权开始">{{ formatDate(currentDetail.startDate, 'YYYY-MM-DD') }}</el-descriptions-item>
            <el-descriptions-item label="授权结束">{{ formatDate(currentDetail.endDate, 'YYYY-MM-DD') }}</el-descriptions-item>
            <el-descriptions-item label="供应方">{{ currentDetail.supplierName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentDetail.supplierPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="授权地区">{{ currentDetail.territories || '-' }}</el-descriptions-item>
            <el-descriptions-item label="权属状态">
              {{ getEnumLabel(COPYRIGHT_OWNERSHIP_STATUS, currentDetail.ownershipStatus) }}
            </el-descriptions-item>
            <el-descriptions-item label="授权范围" :span="2">
              <el-tag
                v-for="(s, idx) in (currentDetail.licenseScope || [])"
                :key="idx"
                size="small"
                style="margin: 2px 4px;"
              >
                {{ s }}
              </el-tag>
              <span v-if="!currentDetail.licenseScope?.length" style="color: #C0C4CC;">未设置</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="conflictResult || checkingConflict" class="detail-section">
          <div class="section-header">
            <h4>多维度一致性校验</h4>
            <el-button
              size="small"
              :icon="Refresh"
              :loading="checkingConflict"
              @click="checkConflictForDetail"
            >
              重新校验
            </el-button>
          </div>
          <div v-if="checkingConflict" class="checking-state">
            <el-icon class="is-loading" style="margin-right: 6px;"><Refresh /></el-icon>
            正在校验版权编号、内容绑定、授权范围、有效期、权属信息...
          </div>
          <div v-else-if="consistencyInfo" class="consistency-grid">
            <div class="consistency-item" :class="{ ok: consistencyInfo.codeOk, bad: !consistencyInfo.codeOk }">
              <el-icon><CircleCheck v-if="consistencyInfo.codeOk" /><CircleClose v-else /></el-icon>
              <div>
                <div class="ci-title">版权编号唯一性</div>
                <div class="ci-detail">
                  {{ consistencyInfo.codeOk ? '系统中无重复版权编号' : `检测到重复编号：${conflictResult?.duplicateCodeInfo?.existingCopyrightIds?.length || 0} 条重复记录` }}
                </div>
              </div>
            </div>
            <div class="consistency-item" :class="{ ok: consistencyInfo.contentOk, bad: !consistencyInfo.contentOk }">
              <el-icon><CircleCheck v-if="consistencyInfo.contentOk" /><CircleClose v-else /></el-icon>
              <div>
                <div class="ci-title">内容绑定冲突</div>
                <div class="ci-detail">
                  <template v-if="consistencyInfo.contentOk">未检测到同一内容绑定多份版权</template>
                  <template v-else>
                    发现 {{ conflictResult?.contentConflicts?.length || 0 }} 条内容冲突绑定：
                    <div style="margin-top: 4px;">
                      <el-tag
                        v-for="(c, idx) in (conflictResult?.contentConflicts || []).slice(0, 3)"
                        :key="idx"
                        size="small"
                        type="danger"
                        style="margin: 2px;"
                      >
                        内容ID#{{ c.contentId }} → 版权{{ c.existingCopyrightCode }}
                      </el-tag>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <div class="consistency-item" :class="{ ok: consistencyInfo.periodOk, bad: !consistencyInfo.periodOk }">
              <el-icon><CircleCheck v-if="consistencyInfo.periodOk" /><WarningFilled v-else /></el-icon>
              <div>
                <div class="ci-title">授权有效期</div>
                <div class="ci-detail">
                  {{ consistencyInfo.periodOk ? '当前授权有效期有效且与合同匹配' : '检测到授权有效期与资质文件中日期不一致' }}
                </div>
              </div>
            </div>
            <div class="consistency-item" :class="{ ok: consistencyInfo.scopeOk, bad: !consistencyInfo.scopeOk }">
              <el-icon><CircleCheck v-if="consistencyInfo.scopeOk" /><WarningFilled v-else /></el-icon>
              <div>
                <div class="ci-title">授权范围一致性</div>
                <div class="ci-detail">
                  {{ consistencyInfo.scopeOk ? '授权范围字段与资质协议内容一致' : '授权范围与协议中OCR识别内容存在差异，请复核' }}
                </div>
              </div>
            </div>
            <div class="consistency-item" :class="{ ok: consistencyInfo.ownershipOk, bad: !consistencyInfo.ownershipOk }">
              <el-icon><CircleCheck v-if="consistencyInfo.ownershipOk" /><WarningFilled v-else /></el-icon>
              <div>
                <div class="ci-title">权属信息一致性</div>
                <div class="ci-detail">
                  {{ consistencyInfo.ownershipOk ? '权属证明、授权方、版权登记信息一致' : '权属登记信息与授权方名称不一致，请核实是否有转授权' }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="consistencyInfo && !consistencyInfo.overallOk" class="consistency-warning">
            <el-alert type="warning" :closable="false" show-icon>
              检测到版权信息不一致/冲突，以上异常已被系统自动拦截，录入/编辑操作将无法通过，请核实修正后重试。
            </el-alert>
          </div>
        </div>

        <div v-if="currentDetail" class="detail-section">
          <div class="section-header">
            <h4>关联内容资源（{{ currentDetail.relatedContents?.length || 0 }}）</h4>
          </div>
          <el-table
            v-if="currentDetail.relatedContents?.length"
            :data="currentDetail.relatedContents"
            size="small"
            border
            max-height="260"
          >
            <el-table-column prop="id" label="内容ID" width="80" align="center" />
            <el-table-column prop="title" label="内容标题" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? (row.auditStatus === 2 ? 'success' : 'warning') : 'info'" size="small">
                  {{ row.status === 1 ? (row.auditStatus === 2 ? '已上架' : '待上架') : '已下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="绑定时间" width="150" align="center">
              <template #default="{ row }">
                {{ formatDate(row.bindAt || currentDetail?.createdAt, 'YYYY-MM-DD') }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无关联内容" :image-size="80" />
        </div>

        <div v-if="currentDetail" class="detail-section">
          <div class="section-header">
            <h4>变更时间线（{{ timelineActions.length }}）</h4>
          </div>
          <el-timeline v-if="timelineActions.length">
            <el-timeline-item
              v-for="(e, idx) in timelineActions"
              :key="idx"
              :timestamp="e.time"
              :type="e.type"
              :hollow="idx === timelineActions.length - 1"
              placement="top"
            >
              <div class="timeline-action">{{ e.action }}</div>
              <div class="timeline-detail">{{ e.detail }}</div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无变更记录" :image-size="80" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.copyright-trace-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.trace-table-wrapper {
  position: relative;
}

.trace-el-table {
  margin-top: 12px;
  border-radius: 4px;
  overflow: hidden;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}

.content-id-cell {
  font-family: Menlo, Consolas, monospace;
  font-weight: 500;
  color: $primary-color;
  background: rgba(64, 158, 255, 0.06);
  padding: 1px 6px;
  border-radius: 3px;
}

.back-top-btn {
  position: fixed;
  right: 40px;
  bottom: 60px;
  z-index: 100;
}

.back-top-fade-enter-active,
.back-top-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.back-top-fade-enter-from,
.back-top-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.trace-detail {
  padding: 8px 4px 20px;

  .detail-section {
    margin-bottom: 20px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid $border-color-lighter;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: $text-primary;
      }
    }
  }

  .checking-state {
    padding: 16px;
    background: rgba(64, 158, 255, 0.04);
    color: $primary-color;
    border-radius: 6px;
    font-size: $font-sm;
    display: flex;
    align-items: center;
  }

  .consistency-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;

    .consistency-item {
      display: flex;
      gap: 10px;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid $border-color-lighter;
      transition: all 0.25s;

      > .el-icon {
        font-size: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .ci-title {
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 3px;
      }

      .ci-detail {
        font-size: 12px;
        color: $text-secondary;
        line-height: 1.5;
      }

      &.ok {
        > .el-icon { color: $success-color; }
        background: rgba(103, 194, 58, 0.03);
        border-color: rgba(103, 194, 58, 0.2);
      }

      &.bad {
        > .el-icon { color: $danger-color; }
        background: rgba(245, 108, 108, 0.03);
        border-color: rgba(245, 108, 108, 0.2);

        &:has(.el-icon > svg path[d*="Warning"]) {
          > .el-icon { color: $warning-color; }
          background: rgba(230, 162, 60, 0.03);
          border-color: rgba(230, 162, 60, 0.2);
        }
      }
    }
  }

  .consistency-warning {
    margin-top: 12px;
  }

  .timeline-action {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 2px;
  }

  .timeline-detail {
    font-size: 12px;
    color: $text-secondary;
    line-height: 1.5;
  }
}
</style>

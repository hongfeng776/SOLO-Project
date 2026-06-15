<template>
  <div class="page-container user-work-page">
    <div class="page-header">
      <h2 class="page-title">用户作品管理</h2>
      <div class="header-actions">
        <el-tag type="warning" effect="plain" class="stat-tag">
          待审核：<b>{{ pendingCount }}</b>
        </el-tag>
        <el-tag type="success" effect="plain" class="stat-tag">
          已通过：<b>{{ passedCount }}</b>
        </el-tag>
        <el-tag type="info" effect="plain" class="stat-tag">
          置顶中：<b>{{ toppingCount }}</b>
        </el-tag>
      </div>
    </div>

    <div class="quick-filter-bar">
      <div
        v-for="tab in quickFilterTabs"
        :key="tab.key"
        class="quick-filter-tab"
        :class="{ 'is-active': activeQuickFilter === tab.key }"
        @click="handleQuickFilter(tab.key)"
      >
        <el-icon v-if="tab.icon" :size="14"><component :is="tab.icon" /></el-icon>
        <span>{{ tab.label }}</span>
        <b v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</b>
      </div>
    </div>

    <el-form :inline="true" :model="queryForm" class="filter-bar" @submit.prevent>
      <el-form-item label="作品名称">
        <el-input
          v-model="queryForm.name"
          placeholder="请输入作品名称"
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item label="创作用户">
        <el-input
          v-model="queryForm.username"
          placeholder="请输入用户名"
          clearable
          style="width: 150px"
        />
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select
          v-model="queryForm.audit_status"
          placeholder="全部"
          clearable
          style="width: 130px"
          popper-class="select-fade"
        >
          <el-option
            v-for="(item, key) in AUDIT_STATUS_MAP"
            :key="key"
            :label="item.text"
            :value="Number(key)"
          >
            <span class="status-option">
              <span class="status-dot" :class="`status-dot-${item.type}`"></span>
              {{ item.text }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="置顶状态">
        <el-select
          v-model="queryForm.is_top"
          placeholder="全部"
          clearable
          style="width: 110px"
          popper-class="select-fade"
        >
          <el-option label="已置顶" :value="1" />
          <el-option label="未置顶" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="创作时间">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 340px"
        />
      </el-form-item>
      <el-form-item label="点赞量">
        <div class="like-count-range">
          <el-input-number
            v-model="queryForm.like_min"
            :min="0"
            :max="999999"
            placeholder="最小"
            controls-position="right"
            size="default"
            style="width: 100px"
          />
          <span class="range-separator">至</span>
          <el-input-number
            v-model="queryForm.like_max"
            :min="0"
            :max="999999"
            placeholder="最大"
            controls-position="right"
            size="default"
            style="width: 100px"
          />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" v-ripple :icon="Search" @click="handleSearch">查询</el-button>
        <el-button v-ripple :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button
          type="success"
          v-ripple
          :icon="CircleCheck"
          :disabled="!canBatchPass"
          :loading="batchAuditLoading"
          @click="handleBatchAudit(1)"
        >
          批量通过
        </el-button>
        <el-button
          type="danger"
          v-ripple
          :icon="CircleClose"
          :disabled="!canBatchReject"
          :loading="batchAuditLoading"
          @click="openBatchAuditDialog(2)"
        >
          批量驳回
        </el-button>
        <el-button
          type="warning"
          v-ripple
          :icon="Top"
          :disabled="!selectedIds.length"
          :loading="batchTopLoading"
          @click="openBatchTopDialog"
        >
          批量置顶
        </el-button>
        <el-button
          type="danger"
          v-ripple
          plain
          :icon="Delete"
          :disabled="!selectedIds.length"
          :loading="batchDeleteLoading"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </div>
      <div class="toolbar-right">
        <span class="total-text">共 <b>{{ total }}</b> 条作品</span>
      </div>
    </div>

    <div class="table-wrapper">
      <template v-if="listLoading && tableData.length === 0">
        <div class="skeleton-wrapper">
          <div v-for="i in 8" :key="i" class="skeleton-row">
            <el-skeleton-item variant="image" style="width: 60px; height: 60px; margin-right: 16px;" />
            <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
              <el-skeleton-item variant="h3" style="width: 30%;" />
              <el-skeleton-item variant="text" style="width: 60%;" />
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="tableData.length > 0">
        <el-table
          ref="tableRef"
          :data="tableData"
          border
          stripe
          height="calc(100vh - 470px)"
          style="width: 100%"
          :row-class-name="rowClassName"
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
          highlight-current-row
        >
          <el-table-column type="selection" width="50" align="center" fixed="left" />
          <el-table-column prop="id" label="ID" width="70" align="center" fixed="left" :resizable="true" />
          <el-table-column label="封面" width="100" align="center" fixed="left" :resizable="true">
            <template #default="{ row }">
              <div class="cover-cell" :class="{ 'has-top': row.is_top }">
                <el-image
                  v-if="row.cover"
                  :src="getImageUrl(row.cover)"
                  :preview-src-list="[getImageUrl(row.cover)]"
                  fit="cover"
                  class="cover-image"
                  preview-teleported
                  @click.stop
                />
                <span v-else class="no-cover">暂无</span>
                <span v-if="row.is_top" class="top-badge-row">
                  <el-icon :size="10"><Top /></el-icon>
                  置顶
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="作品名称" min-width="180" show-overflow-tooltip :resizable="true">
            <template #default="{ row }">
              <span class="work-name" @click.stop="openDetailDrawer(row)">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创作用户" width="150" align="center" :resizable="true">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :src="getImageUrl(row.user_avatar)" :size="28" class="user-avatar">
                  {{ row.username?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <span class="username" :title="row.username">{{ row.username }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创作时间" width="160" align="center" :resizable="true">
            <template #default="{ row }">
              <FormattedDate :value="row.created_at" format="YYYY-MM-DD HH:mm" />
            </template>
          </el-table-column>
          <el-table-column prop="like_count" label="点赞量" width="100" align="center" :resizable="true">
            <template #default="{ row }">
              <span class="like-count">
                <el-icon :size="14" class="like-icon"><Star /></el-icon>
                {{ row.like_count }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="审核状态" width="110" align="center" :resizable="true">
            <template #default="{ row }">
              <el-tag :type="auditStatusType(row.audit_status)" size="small" round>
                {{ auditStatusText(row.audit_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="置顶状态" width="140" align="center" :resizable="true">
            <template #default="{ row }">
              <template v-if="row.is_top">
                <el-tag type="danger" size="small" effect="dark">
                  <el-icon :size="12"><Top /></el-icon>
                  置顶中
                </el-tag>
                <div v-if="row.top_expire_at" class="top-expire">
                  至 {{ formatDate(row.top_expire_at, 'MM-DD') }}
                </div>
              </template>
              <span v-else style="color: #c0c4cc">未置顶</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="310" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link v-ripple @click="openDetailDrawer(row)">详情</el-button>
              <template v-if="row.audit_status === 0">
                <el-button type="success" link v-ripple :loading="singleAuditLoading[row.id]" @click="handleSingleAudit(row, 1)">通过</el-button>
                <el-button type="danger" link v-ripple @click="openSingleAuditDialog(row, 2)">驳回</el-button>
              </template>
              <template v-else>
                <el-button type="primary" link v-ripple @click="openSingleAuditDialog(row, row.audit_status)">
                  审核详情
                </el-button>
              </template>
              <el-button
                :type="row.is_top ? 'info' : 'warning'"
                link
                v-ripple
                :loading="singleTopLoading[row.id]"
                @click="openSingleTopDialog(row)"
              >
                {{ row.is_top ? '取消置顶' : '置顶' }}
              </el-button>
              <el-button type="danger" link v-ripple :loading="singleDeleteLoading[row.id]" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <EmptyState
        v-else
        description="暂无用户作品数据"
        icon="PictureFilled"
      />
    </div>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        :disabled="listLoading"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <Teleport to="body">
      <transition name="modal-scale">
        <div v-if="auditDialogVisible" class="modal-overlay" @click.self="closeAuditDialog">
          <div class="modal-dialog audit-modal">
            <div class="modal-header">
              <h3 class="modal-title">{{ auditDialogTitle }}</h3>
              <button class="modal-close" @click="closeAuditDialog">
                <el-icon :size="18"><Close /></el-icon>
              </button>
            </div>
            <div class="modal-body">
              <div v-if="auditMode === 'view'" class="audit-detail">
                <div class="detail-item">
                  <span class="detail-label">作品名称</span>
                  <span class="detail-value">{{ auditTarget?.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">审核结果</span>
                  <el-tag :type="auditStatusType(auditTarget?.audit_status ?? 0)" round>
                    {{ auditStatusText(auditTarget?.audit_status ?? 0) }}
                  </el-tag>
                </div>
                <div v-if="auditTarget?.audit_reason" class="detail-item">
                  <span class="detail-label">驳回原因</span>
                  <span class="detail-value">{{ auditTarget.audit_reason }}</span>
                </div>
                <div v-if="auditTarget?.audit_remark" class="detail-item">
                  <span class="detail-label">审核备注</span>
                  <EllipsisText :text="auditTarget.audit_remark" :lines="2" />
                </div>
              </div>

              <template v-else>
                <div class="audit-work-info">
                  <el-image
                    v-if="auditTarget?.cover"
                    :src="getImageUrl(auditTarget.cover)"
                    fit="cover"
                    class="audit-cover"
                  />
                  <div class="audit-info">
                    <p class="audit-name">{{ auditTarget?.name || `批量审核 (${batchAuditIds.length} 条)` }}</p>
                    <p v-if="!isBatchAudit" class="audit-user">
                      作者：{{ auditTarget?.username }}
                    </p>
                    <p v-if="!isBatchAudit" class="audit-time">
                      提交时间：{{ formatDate(auditTarget?.created_at ?? '', 'YYYY-MM-DD HH:mm') }}
                    </p>
                  </div>
                </div>

                <el-form
                  ref="auditFormRef"
                  :model="auditForm"
                  :rules="auditFormRules"
                  label-width="100px"
                  status-icon
                >
                  <el-form-item label="审核结果">
                    <el-radio-group v-model="auditForm.audit_status" :disabled="isViewMode">
                      <el-radio :value="1">
                        <el-icon :size="16" color="#67c23a"><CircleCheck /></el-icon>
                        审核通过
                      </el-radio>
                      <el-radio :value="2">
                        <el-icon :size="16" color="#f56c6c"><CircleClose /></el-icon>
                        审核驳回
                      </el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item
                    v-if="auditForm.audit_status === 2"
                    label="驳回原因"
                    prop="audit_reason"
                  >
                    <el-select
                      v-model="auditForm.audit_reason"
                      placeholder="请选择驳回原因"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="reason in AUDIT_REJECT_REASONS"
                        :key="reason"
                        :label="reason"
                        :value="reason"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item
                    v-if="auditForm.audit_status === 2"
                    label="备注说明"
                    prop="audit_remark"
                  >
                    <el-input
                      v-model="auditForm.audit_remark"
                      type="textarea"
                      :rows="3"
                      placeholder="请输入详细备注说明"
                      maxlength="200"
                      show-word-limit
                      resize="none"
                    />
                  </el-form-item>
                </el-form>
              </template>
            </div>
            <div class="modal-footer">
              <el-button v-ripple @click="closeAuditDialog">
                {{ auditMode === 'view' ? '关闭' : '取消' }}
              </el-button>
              <el-button
                v-if="auditMode !== 'view'"
                type="primary"
                v-ripple
                :loading="auditSubmitLoading"
                @click="handleAuditSubmit"
              >
                确认提交
              </el-button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="modal-scale">
        <div v-if="topDialogVisible" class="modal-overlay" @click.self="closeTopDialog">
          <div class="modal-dialog top-modal">
            <div class="modal-header">
              <h3 class="modal-title">{{ topDialogTitle }}</h3>
              <button class="modal-close" @click="closeTopDialog">
                <el-icon :size="18"><Close /></el-icon>
              </button>
            </div>
            <div class="modal-body">
              <div v-if="!isBatchTop" class="top-work-info">
                <el-image
                  v-if="topTarget?.cover"
                  :src="getImageUrl(topTarget.cover)"
                  fit="cover"
                  class="top-cover"
                />
                <div class="top-info">
                  <p class="top-name">{{ topTarget?.name }}</p>
                  <p class="top-user">作者：{{ topTarget?.username }}</p>
                </div>
              </div>
              <p v-else class="batch-top-tip">
                批量设置置顶，共 <b>{{ batchTopIds.length }}</b> 条作品
              </p>

              <el-form
                ref="topFormRef"
                :model="topForm"
                :rules="topFormRules"
                label-width="100px"
                status-icon
              >
                <el-form-item label="置顶操作">
                  <el-radio-group v-model="topForm.is_top">
                    <el-radio :value="1">
                      <el-icon :size="16" color="#e6a23c"><Top /></el-icon>
                      设置置顶
                    </el-radio>
                    <el-radio :value="0">
                      <el-icon :size="16" color="#909399"><Bottom /></el-icon>
                      取消置顶
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item
                  v-if="topForm.is_top === 1"
                  label="置顶时长"
                  prop="top_duration"
                >
                  <el-select
                    v-model="topForm.top_duration"
                    placeholder="请选择置顶时长"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="opt in TOP_DURATION_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="topForm.is_top === 1"
                  label="置顶备注"
                  prop="top_remark"
                >
                  <el-input
                    v-model="topForm.top_remark"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入置顶备注（选填）"
                    maxlength="100"
                    show-word-limit
                    resize="none"
                  />
                </el-form-item>
              </el-form>
            </div>
            <div class="modal-footer">
              <el-button v-ripple @click="closeTopDialog">取消</el-button>
              <el-button
                type="primary"
                v-ripple
                :loading="topSubmitLoading"
                @click="handleTopSubmit"
              >
                确认提交
              </el-button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <el-drawer
      v-model="detailDrawerVisible"
      title="作品详情"
      size="560px"
      :destroy-on-close="true"
      class="detail-drawer"
    >
      <template v-if="detailData">
        <div class="detail-section detail-cover-section">
          <el-image
            v-if="detailData.cover"
            :src="getImageUrl(detailData.cover)"
            :preview-src-list="[getImageUrl(detailData.cover)]"
            fit="contain"
            class="detail-original-image"
            preview-teleported
          />
          <div v-else class="detail-no-cover">暂无封面</div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">作品名称</span>
              <span class="info-value">{{ detailData.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">作品ID</span>
              <span class="info-value">{{ detailData.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">作品尺寸</span>
              <span class="info-value">{{ detailData.width && detailData.height ? `${detailData.width} × ${detailData.height}` : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创作时间</span>
              <span class="info-value"><FormattedDate :value="detailData.created_at" format="YYYY-MM-DD HH:mm" /></span>
            </div>
            <div class="info-item full-width" v-if="detailData.description">
              <span class="info-label">作品描述</span>
              <EllipsisText :text="detailData.description" :lines="3" />
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">创作者信息</h4>
          <div class="creator-card">
            <el-avatar :src="getImageUrl(detailData.user_avatar)" :size="44" class="creator-avatar">
              {{ detailData.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <div class="creator-info">
              <p class="creator-name">{{ detailData.username }}</p>
              <p class="creator-id">用户ID：{{ detailData.user_id }}</p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">互动数据</h4>
          <div class="interact-grid">
            <div class="interact-item">
              <el-icon :size="22" color="#f56c6c"><Star /></el-icon>
              <b class="interact-num">{{ detailData.like_count }}</b>
              <span class="interact-label">点赞</span>
            </div>
            <div class="interact-item">
              <el-icon :size="22" color="#409eff"><ChatDotRound /></el-icon>
              <b class="interact-num">{{ detailData.comment_count }}</b>
              <span class="interact-label">评论</span>
            </div>
            <div class="interact-item">
              <el-icon :size="22" color="#67c23a"><View /></el-icon>
              <b class="interact-num">{{ detailData.view_count }}</b>
              <span class="interact-label">浏览</span>
            </div>
            <div class="interact-item">
              <el-icon :size="22" color="#e6a23c"><Share /></el-icon>
              <b class="interact-num">{{ detailData.share_count }}</b>
              <span class="interact-label">分享</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">审核记录</h4>
          <div v-if="detailData.audit_records && detailData.audit_records.length" class="audit-timeline">
            <div
              v-for="(record, idx) in detailData.audit_records"
              :key="idx"
              class="audit-record-item"
            >
              <div class="record-dot" :class="`record-dot-${auditStatusType(record.audit_status)}`"></div>
              <div class="record-content">
                <div class="record-header">
                  <el-tag :type="auditStatusType(record.audit_status)" size="small" round>
                    {{ auditStatusText(record.audit_status) }}
                  </el-tag>
                  <span class="record-time">{{ formatDate(record.audited_at, 'YYYY-MM-DD HH:mm') }}</span>
                </div>
                <div v-if="record.audit_reason" class="record-reason">
                  驳回原因：<b>{{ record.audit_reason }}</b>
                </div>
                <div v-if="record.audit_remark" class="record-remark">
                  <EllipsisText :text="record.audit_remark" :lines="2" />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-record">暂无审核记录</div>
        </div>

        <div class="detail-section" v-if="detailData.is_top || detailData.top_remark">
          <h4 class="section-title">置顶信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">置顶状态</span>
              <el-tag :type="detailData.is_top ? 'danger' : 'info'" size="small" effect="dark">
                {{ detailData.is_top ? '置顶中' : '未置顶' }}
              </el-tag>
            </div>
            <div class="info-item" v-if="detailData.top_expire_at">
              <span class="info-label">到期时间</span>
              <span class="info-value"><FormattedDate :value="detailData.top_expire_at" format="YYYY-MM-DD HH:mm" /></span>
            </div>
            <div class="info-item full-width" v-if="detailData.top_remark">
              <span class="info-label">置顶备注</span>
              <EllipsisText :text="detailData.top_remark" :lines="2" />
            </div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import {
  Search,
  Refresh,
  Delete,
  Top,
  Bottom,
  Close,
  CircleCheck,
  CircleClose,
  Star,
  ChatDotRound,
  View,
  Share,
  Clock,
  Warning
} from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import FormattedDate from '@/components/FormattedDate.vue';
import EllipsisText from '@/components/EllipsisText.vue';
import EmptyState from '@/components/EmptyState.vue';
import {
  getUserWorkList,
  getUserWorkDetail,
  auditUserWork,
  batchAuditUserWork,
  setUserWorkTop,
  deleteUserWork,
  batchDeleteUserWork
} from '@/api/userWork';
import type {
  UserWorkItem,
  UserWorkQuery,
  UserWorkAuditStatus,
  UserWorkAuditForm,
  UserWorkTopForm
} from '@/types';
import {
  AUDIT_STATUS_MAP,
  AUDIT_REJECT_REASONS,
  TOP_DURATION_OPTIONS
} from '@/types';
import { confirmDialog, showSuccess, showWarning, getImageUrl, formatDate } from '@/utils';

const tableRef = ref();
const listLoading = ref(false);
const tableData = ref<UserWorkItem[]>([]);
const total = ref(0);
const selectedIds = ref<number[]>([]);
const selectedRows = ref<UserWorkItem[]>([]);
const currentRowId = ref<number | null>(null);

const pendingCount = ref(0);
const passedCount = ref(0);
const toppingCount = ref(0);

const singleAuditLoading = ref<Record<number, boolean>>({});
const singleTopLoading = ref<Record<number, boolean>>({});
const singleDeleteLoading = ref<Record<number, boolean>>({});

const activeQuickFilter = ref('all');

const quickFilterTabs = computed(() => [
  { key: 'all', label: '全部', icon: null, count: total.value },
  { key: 'pending', label: '待审核', icon: 'Clock', count: pendingCount.value },
  { key: 'passed', label: '已通过', icon: 'CircleCheck', count: passedCount.value },
  { key: 'rejected', label: '已驳回', icon: 'CircleClose' },
  { key: 'topping', label: '已置顶', icon: 'Top', count: toppingCount.value }
]);

const dateRange = ref<string[]>([]);

const queryForm = reactive<UserWorkQuery>({
  page: 1,
  pageSize: 20,
  name: '',
  username: '',
  audit_status: '',
  is_top: '',
  start_time: '',
  end_time: '',
  like_min: '',
  like_max: ''
});

const detailDrawerVisible = ref(false);
const detailData = ref<UserWorkItem | null>(null);
const detailLoading = ref(false);

const auditDialogVisible = ref(false);
const auditMode = ref<'view' | 'edit'>('edit');
const isBatchAudit = ref(false);
const batchAuditIds = ref<number[]>([]);
const auditTarget = ref<UserWorkItem | null>(null);
const auditSubmitLoading = ref(false);
const auditFormRef = ref<FormInstance>();

const auditForm = reactive<UserWorkAuditForm>({
  audit_status: 1,
  audit_reason: '',
  audit_remark: ''
});

const validateRejectReason = (_rule: any, value: any, callback: any) => {
  if (auditForm.audit_status === 2 && !value) {
    callback(new Error('请选择驳回原因'));
  } else {
    callback();
  }
};

const auditFormRules = reactive<FormRules>({
  audit_reason: [{ validator: validateRejectReason, trigger: 'change' }]
});

const topDialogVisible = ref(false);
const isBatchTop = ref(false);
const batchTopIds = ref<number[]>([]);
const topTarget = ref<UserWorkItem | null>(null);
const topSubmitLoading = ref(false);
const batchTopLoading = ref(false);
const topFormRef = ref<FormInstance>();

const topForm = reactive<UserWorkTopForm>({
  is_top: 1,
  top_duration: 7,
  top_remark: ''
});

const validateTopDuration = (_rule: any, value: any, callback: any) => {
  if (topForm.is_top === 1 && (value === undefined || value === null || value === '')) {
    callback(new Error('请选择置顶时长'));
  } else {
    callback();
  }
};

const topFormRules = reactive<FormRules>({
  top_duration: [{ validator: validateTopDuration, trigger: 'change' }]
});

const batchDeleteLoading = ref(false);
const batchAuditLoading = ref(false);

const canBatchPass = computed(() => {
  return selectedRows.value.some(r => r.audit_status === 0);
});

const canBatchReject = computed(() => {
  return selectedRows.value.some(r => r.audit_status === 0);
});

const isViewMode = computed(() => auditMode.value === 'view');

const auditDialogTitle = computed(() => {
  if (auditMode.value === 'view') return '审核详情';
  if (isBatchAudit.value) {
    return auditForm.audit_status === 1 ? '批量审核通过' : '批量审核驳回';
  }
  return auditForm.audit_status === 1 ? '审核通过' : '审核驳回';
});

const topDialogTitle = computed(() => {
  if (isBatchTop.value) return '批量置顶设置';
  return topForm.is_top === 1 ? '设置置顶' : '取消置顶';
});

function auditStatusText(status: UserWorkAuditStatus) {
  return AUDIT_STATUS_MAP[status]?.text || '未知';
}

function auditStatusType(status: UserWorkAuditStatus) {
  return AUDIT_STATUS_MAP[status]?.type || 'info';
}

function rowClassName({ row }: { row: UserWorkItem }) {
  const classes: string[] = [];
  if (currentRowId.value === row.id) classes.push('row-highlight');
  if (row.is_top) classes.push('row-is-top');
  return classes.join(' ');
}

function handleQuickFilter(key: string) {
  activeQuickFilter.value = key;
  queryForm.audit_status = '';
  queryForm.is_top = '';
  switch (key) {
    case 'pending':
      queryForm.audit_status = 0;
      break;
    case 'passed':
      queryForm.audit_status = 1;
      break;
    case 'rejected':
      queryForm.audit_status = 2;
      break;
    case 'topping':
      queryForm.is_top = 1;
      break;
  }
  queryForm.page = 1;
  fetchList();
}

function buildQueryParams(): UserWorkQuery {
  const params: UserWorkQuery = { ...queryForm };
  if (dateRange.value && dateRange.value.length === 2) {
    params.start_time = dateRange.value[0];
    params.end_time = dateRange.value[1];
  }
  return params;
}

async function fetchList() {
  listLoading.value = true;
  try {
    const params = buildQueryParams();
    const res = await getUserWorkList(params);
    tableData.value = res.list;
    total.value = res.total;

    pendingCount.value = res.list.filter(r => r.audit_status === 0).length;
    passedCount.value = res.list.filter(r => r.audit_status === 1).length;
    toppingCount.value = res.list.filter(r => r.is_top === 1).length;
  } catch {
  } finally {
    listLoading.value = false;
  }
}

function handleSearch() {
  queryForm.page = 1;
  activeQuickFilter.value = 'all';
  fetchList();
}

function handleReset() {
  queryForm.name = '';
  queryForm.username = '';
  queryForm.audit_status = '';
  queryForm.is_top = '';
  queryForm.start_time = '';
  queryForm.end_time = '';
  queryForm.like_min = '';
  queryForm.like_max = '';
  queryForm.page = 1;
  dateRange.value = [];
  activeQuickFilter.value = 'all';
  fetchList();
}

function handleSelectionChange(rows: UserWorkItem[]) {
  selectedRows.value = rows;
  selectedIds.value = rows.map(r => r.id);
}

function handleRowClick(row: UserWorkItem) {
  currentRowId.value = row.id;
}

async function openDetailDrawer(row: UserWorkItem) {
  detailDrawerVisible.value = true;
  detailLoading.value = true;
  try {
    const res = await getUserWorkDetail(row.id);
    detailData.value = res;
  } catch {
    detailData.value = row;
  } finally {
    detailLoading.value = false;
  }
}

function resetAuditForm() {
  auditForm.audit_status = 1;
  auditForm.audit_reason = '';
  auditForm.audit_remark = '';
  auditFormRef.value?.clearValidate();
}

function openSingleAuditDialog(row: UserWorkItem, status: UserWorkAuditStatus) {
  auditTarget.value = row;
  isBatchAudit.value = false;
  batchAuditIds.value = [];

  if (row.audit_status !== 0) {
    auditMode.value = 'view';
  } else {
    auditMode.value = 'edit';
    resetAuditForm();
    auditForm.audit_status = status;
  }
  auditDialogVisible.value = true;
}

async function handleSingleAudit(row: UserWorkItem, status: UserWorkAuditStatus) {
  if (status === 1) {
    const confirmed = await confirmDialog(
      `确定要通过作品「${row.name}」的审核吗？`,
      '审核通过确认'
    );
    if (!confirmed) return;
    singleAuditLoading.value[row.id] = true;
    try {
      await auditUserWork(row.id, { audit_status: 1 });
      showSuccess('审核通过成功');
      fetchList();
    } catch {
    } finally {
      singleAuditLoading.value[row.id] = false;
    }
  } else {
    openSingleAuditDialog(row, status);
  }
}

function openBatchAuditDialog(status: UserWorkAuditStatus) {
  const pendingRows = selectedRows.value.filter(r => r.audit_status === 0);
  if (pendingRows.length === 0) {
    showWarning('请选择待审核的作品');
    return;
  }
  auditTarget.value = null;
  isBatchAudit.value = true;
  batchAuditIds.value = pendingRows.map(r => r.id);
  auditMode.value = 'edit';
  resetAuditForm();
  auditForm.audit_status = status;
  auditDialogVisible.value = true;
}

async function handleBatchAudit(status: UserWorkAuditStatus) {
  const pendingRows = selectedRows.value.filter(r => r.audit_status === 0);
  if (pendingRows.length === 0) {
    showWarning('请选择待审核的作品');
    return;
  }
  if (status === 1) {
    const confirmed = await confirmDialog(
      `确定要通过选中的 ${pendingRows.length} 条作品的审核吗？`,
      '批量审核通过确认'
    );
    if (!confirmed) return;
    batchAuditLoading.value = true;
    try {
      await batchAuditUserWork(pendingRows.map(r => r.id), { audit_status: 1 });
      showSuccess('批量通过成功');
      fetchList();
    } catch {
    } finally {
      batchAuditLoading.value = false;
    }
  } else {
    openBatchAuditDialog(status);
  }
}

function closeAuditDialog() {
  auditDialogVisible.value = false;
}

async function submitAudit(ids: number[], data: UserWorkAuditForm, isBatch = false) {
  auditSubmitLoading.value = true;
  if (isBatch) batchAuditLoading.value = true;
  try {
    if (isBatch) {
      await batchAuditUserWork(ids, data);
      showSuccess(`批量${data.audit_status === 1 ? '通过' : '驳回'}成功`);
    } else {
      await auditUserWork(ids[0], data);
      showSuccess(data.audit_status === 1 ? '审核通过成功' : '审核驳回成功');
    }
    closeAuditDialog();
    fetchList();
  } catch {
  } finally {
    auditSubmitLoading.value = false;
    if (isBatch) batchAuditLoading.value = false;
  }
}

async function handleAuditSubmit() {
  if (auditMode.value === 'view') {
    closeAuditDialog();
    return;
  }
  const valid = await auditFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  const ids = isBatchAudit.value ? batchAuditIds.value : [auditTarget.value!.id];
  const data: UserWorkAuditForm = { audit_status: auditForm.audit_status };
  if (auditForm.audit_status === 2) {
    data.audit_reason = auditForm.audit_reason;
    data.audit_remark = auditForm.audit_remark;
  }

  const actionText = isBatchAudit.value
    ? `${auditForm.audit_status === 1 ? '批量通过' : '批量驳回'} ${ids.length} 条作品`
    : `${auditForm.audit_status === 1 ? '通过' : '驳回'}作品`;

  const confirmed = await confirmDialog(
    `确定要${actionText}吗？`,
    '审核确认'
  );
  if (!confirmed) return;

  await submitAudit(ids, data, isBatchAudit.value);
}

function resetTopForm() {
  topForm.is_top = 1;
  topForm.top_duration = 7;
  topForm.top_remark = '';
  topFormRef.value?.clearValidate();
}

function openSingleTopDialog(row: UserWorkItem) {
  topTarget.value = row;
  isBatchTop.value = false;
  batchTopIds.value = [];
  resetTopForm();
  if (row.is_top === 1) {
    topForm.is_top = 0;
  }
  topDialogVisible.value = true;
}

function openBatchTopDialog() {
  if (selectedIds.value.length === 0) {
    showWarning('请选择要操作的作品');
    return;
  }
  topTarget.value = null;
  isBatchTop.value = true;
  batchTopIds.value = [...selectedIds.value];
  resetTopForm();
  topDialogVisible.value = true;
}

function closeTopDialog() {
  topDialogVisible.value = false;
}

async function handleTopSubmit() {
  const valid = await topFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  const ids = isBatchTop.value ? batchTopIds.value : [topTarget.value!.id];
  const actionText = isBatchTop.value
    ? `${topForm.is_top === 1 ? '批量置顶' : '批量取消置顶'} ${ids.length} 条作品`
    : `${topForm.is_top === 1 ? '置顶' : '取消置顶'}作品`;

  const confirmed = await confirmDialog(
    `确定要${actionText}吗？`,
    '置顶确认'
  );
  if (!confirmed) return;

  topSubmitLoading.value = true;
  if (isBatchTop.value) batchTopLoading.value = true;
  try {
    const data: UserWorkTopForm = { is_top: topForm.is_top };
    if (topForm.is_top === 1) {
      data.top_duration = topForm.top_duration;
      data.top_remark = topForm.top_remark;
    }
    for (const id of ids) {
      await setUserWorkTop(id, data);
    }
    showSuccess(
      `${isBatchTop.value ? '批量' : ''}${topForm.is_top === 1 ? '置顶设置' : '取消置顶'}成功`
    );
    closeTopDialog();
    fetchList();
  } catch {
  } finally {
    topSubmitLoading.value = false;
    if (isBatchTop.value) batchTopLoading.value = false;
  }
}

async function handleDelete(row: UserWorkItem) {
  const confirmed = await confirmDialog(
    `确定要删除作品「${row.name}」吗？删除后将永久清除数据和文件资源，且无法恢复！`,
    '删除确认',
    { type: 'error', confirmButtonClass: 'el-button--danger' }
  );
  if (!confirmed) return;
  singleDeleteLoading.value[row.id] = true;
  try {
    await deleteUserWork(row.id);
    showSuccess('删除成功');
    fetchList();
  } catch {
  } finally {
    singleDeleteLoading.value[row.id] = false;
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    showWarning('请选择要删除的作品');
    return;
  }
  const confirmed = await confirmDialog(
    `确定要删除选中的 ${selectedIds.value.length} 条作品吗？删除后将永久清除所有数据和文件资源，且无法恢复！此操作不可逆！`,
    '批量删除确认',
    { type: 'error', confirmButtonClass: 'el-button--danger' }
  );
  if (!confirmed) return;
  batchDeleteLoading.value = true;
  try {
    await batchDeleteUserWork(selectedIds.value);
    showSuccess('批量删除成功');
    fetchList();
  } catch {
  } finally {
    batchDeleteLoading.value = false;
  }
}

onMounted(() => {
  fetchList();
});

watch(
  () => auditForm.audit_status,
  (val) => {
    if (val !== 2) {
      auditForm.audit_reason = '';
      auditForm.audit_remark = '';
      nextTick(() => auditFormRef.value?.clearValidate(['audit_reason', 'audit_remark']));
    }
  }
);

watch(
  () => topForm.is_top,
  (val) => {
    if (val !== 1) {
      topForm.top_duration = undefined;
      topForm.top_remark = '';
      nextTick(() => topFormRef.value?.clearValidate(['top_duration', 'top_remark']));
    }
  }
);
</script>

<style scoped>
.user-work-page {
  --highlight-bg: #E8F3FF;
}

.stat-tag {
  margin-left: 12px;
  font-size: 13px;
}

.stat-tag b {
  font-size: 15px;
  margin-left: 4px;
}

.quick-filter-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  padding: 4px;
  background: #f5f7fa;
  border-radius: 8px;
  width: fit-content;
}

.quick-filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.25s ease;
  user-select: none;
  white-space: nowrap;
}

.quick-filter-tab:hover {
  background: #e8eaed;
  color: #303133;
}

.quick-filter-tab.is-active {
  background: #fff;
  color: var(--color-primary, #1677FF);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.tab-count {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 6px;
  border-radius: 10px;
  color: #909399;
  font-weight: 500;
}

.quick-filter-tab.is-active .tab-count {
  background: rgba(22, 119, 255, 0.1);
  color: var(--color-primary, #1677FF);
}

.like-count-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-separator {
  color: #909399;
  font-size: 13px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  flex-shrink: 0;
}

.total-text {
  font-size: 13px;
  color: #606266;
}

.total-text b {
  color: var(--color-primary, #409eff);
  font-weight: 600;
  margin: 0 2px;
}

.table-wrapper {
  position: relative;
  min-height: 300px;
}

:deep(.el-table .row-highlight td) {
  background-color: var(--highlight-bg) !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr.row-highlight:hover > td.el-table__cell) {
  background-color: var(--highlight-bg) !important;
}

:deep(.el-table__body tr.current-row > td.el-table__cell) {
  background-color: var(--highlight-bg) !important;
}

:deep(.el-table .row-is-top) {
  position: relative;
}

:deep(.el-table .row-is-top td:first-child) {
  position: relative;
}

:deep(.el-table .row-is-top td:first-child::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #f56c6c, #e6a23c);
  border-radius: 0 2px 2px 0;
}

.cover-cell {
  position: relative;
  display: inline-block;
}

.cover-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  cursor: zoom-in;
}

.no-cover {
  display: inline-flex;
  width: 60px;
  height: 60px;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
  color: #c0c4cc;
  font-size: 12px;
}

.top-badge-row {
  position: absolute;
  top: -2px;
  right: -2px;
  display: inline-flex;
  align-items: center;
  gap: 1px;
  background: linear-gradient(135deg, #f56c6c, #e6a23c);
  color: #fff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 0 4px 0 6px;
  line-height: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.work-name {
  font-weight: 500;
  color: #303133;
  cursor: pointer;
  transition: color 0.2s;
}

.work-name:hover {
  color: var(--color-primary, #1677FF);
}

.user-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

.username {
  font-size: 13px;
  color: #606266;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.like-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #e6a23c;
}

.like-icon {
  color: #f56c6c;
}

.top-expire {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.skeleton-wrapper {
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
}

.skeleton-row:last-child {
  border-bottom: none;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot-warning {
  background-color: #e6a23c;
}

.status-dot-success {
  background-color: #67c23a;
}

.status-dot-danger {
  background-color: #f56c6c;
}

.status-dot-info {
  background-color: #909399;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(2px);
}

.modal-dialog {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.audit-modal {
  width: 560px;
}

.top-modal {
  width: 500px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.modal-close {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #909399;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f0f2f5;
  color: #303133;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 12px 24px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
}

.audit-detail {
  padding: 8px 0;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px dashed #ebeef5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  width: 90px;
  flex-shrink: 0;
  color: #909399;
  font-size: 13px;
}

.detail-value {
  flex: 1;
  color: #303133;
  font-size: 14px;
  word-break: break-all;
}

.audit-work-info,
.top-work-info {
  display: flex;
  gap: 16px;
  padding: 14px;
  background: linear-gradient(135deg, #f5f9ff 0%, #eef6ff 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.audit-cover,
.top-cover {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  flex-shrink: 0;
  background: #fff;
}

.audit-info,
.top-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-width: 0;
}

.audit-name,
.top-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-user,
.top-user {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

.audit-time {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.batch-top-tip {
  padding: 14px;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  color: #606266;
  font-size: 14px;
  text-align: center;
}

.batch-top-tip b {
  color: #e6a23c;
  font-size: 16px;
  margin: 0 2px;
}

:deep(.el-radio) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.modal-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-scale-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0, 0.55, 0.2);
}

.modal-scale-enter-from {
  opacity: 0;
}

.modal-scale-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.modal-scale-enter-from .modal-dialog {
  opacity: 0;
  transform: scale(0.85);
}

.modal-scale-enter-to .modal-dialog {
  opacity: 1;
  transform: scale(1);
}

.modal-scale-leave-from .modal-dialog {
  opacity: 1;
  transform: translateY(0);
}

.modal-scale-leave-to .modal-dialog {
  opacity: 0;
  transform: translateY(30px);
}

.header-actions {
  display: flex;
  align-items: center;
}

.detail-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
}

.detail-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.detail-section {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f2f5;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-cover-section {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eaed 100%);
}

.detail-original-image {
  max-width: 100%;
  max-height: 360px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  cursor: zoom-in;
}

.detail-no-cover {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 14px;
}

.section-title {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  padding-left: 10px;
  border-left: 3px solid var(--color-primary, #1677FF);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.creator-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: linear-gradient(135deg, #f5f9ff 0%, #eef6ff 100%);
  border-radius: 8px;
}

.creator-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

.creator-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.creator-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.creator-id {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.interact-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.interact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  background: #f9fafc;
  border-radius: 8px;
  transition: background 0.2s;
}

.interact-item:hover {
  background: #f0f2f5;
}

.interact-num {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.interact-label {
  font-size: 12px;
  color: #909399;
}

.audit-timeline {
  position: relative;
  padding-left: 20px;
}

.audit-timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #ebeef5;
}

.audit-record-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
}

.audit-record-item:last-child {
  padding-bottom: 0;
}

.record-dot {
  position: absolute;
  left: -20px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #ebeef5;
}

.record-dot-warning {
  background: #e6a23c;
  box-shadow: 0 0 0 2px #e6a23c33;
}

.record-dot-success {
  background: #67c23a;
  box-shadow: 0 0 0 2px #67c23a33;
}

.record-dot-danger {
  background: #f56c6c;
  box-shadow: 0 0 0 2px #f56c6c33;
}

.record-dot-info {
  background: #909399;
  box-shadow: 0 0 0 2px #90939933;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.record-time {
  font-size: 12px;
  color: #909399;
}

.record-reason {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.record-reason b {
  color: #f56c6c;
}

.record-remark {
  font-size: 13px;
  color: #909399;
}

.no-record {
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
  padding: 20px 0;
}
</style>

<style>
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

.el-button--default .ripple-effect,
.el-button.is-plain .ripple-effect {
  background: rgba(64, 158, 255, 0.15);
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style>

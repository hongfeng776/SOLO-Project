<template>
  <div class="audit-page">
    <!-- 顶部 Tabs -->
    <el-card shadow="never" class="tabs-card">
      <el-tabs v-model="activeTab" class="audit-tabs" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="tab in AUDIT_TAB_OPTIONS"
          :key="tab.value"
          :label="tab.label"
          :name="tab.value"
        />
      </el-tabs>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card stat-card--pending-first" @click="switchTab('first')">
          <div class="stat-card__icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ statistics.pendingFirst || 0 }}</div>
            <div class="stat-card__label">待初审</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card--pending-second" @click="switchTab('second')">
          <div class="stat-card__icon">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ statistics.pendingSecond || 0 }}</div>
            <div class="stat-card__label">待复审</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card--rejected" @click="switchTab('rejected')">
          <div class="stat-card__icon">
            <el-icon><CloseBold /></el-icon>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ statistics.rejected || 0 }}</div>
            <div class="stat-card__label">已驳回</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card--passed" @click="switchTab('passed')">
          <div class="stat-card__icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ statistics.passed || 0 }}</div>
            <div class="stat-card__label">已通过</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="推客编号/姓名"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="queryParams.phone"
            placeholder="精确检索"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input
            v-model="queryParams.idCard"
            placeholder="精确检索"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="申请日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="queryParams.riskFlagged" :indeterminate="false">
            仅看风险标记
          </el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" class="scale-btn" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="RefreshRight" class="scale-btn" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格区 -->
    <el-card shadow="never" class="table-card">
      <!-- 批量操作栏 -->
      <div class="batch-operation-bar" v-if="selectedIds.length > 0">
        <span class="batch-selected-count">
          已选择 <em>{{ selectedIds.length }}</em> 条
        </span>
        <div class="batch-buttons">
          <el-button
            v-if="activeTab === 'first' || activeTab === 'all'"
            type="success"
            size="small"
            :icon="CircleCheck"
            class="scale-btn"
            :disabled="submittingFirstPass"
            @click="handleBatchFirstPass"
          >
            批量初审通过
          </el-button>
          <el-button
            v-if="activeTab === 'first' || activeTab === 'all'"
            type="danger"
            size="small"
            :icon="CloseBold"
            class="scale-btn"
            :disabled="submittingFirstReject"
            @click="openBatchReject('first')"
          >
            批量初审驳回
          </el-button>
          <el-button
            v-if="activeTab === 'second' || activeTab === 'all'"
            type="success"
            size="small"
            :icon="CircleCheck"
            class="scale-btn"
            :disabled="submittingSecondPass"
            @click="handleBatchSecondPass"
          >
            批量复审通过
          </el-button>
          <el-button
            v-if="activeTab === 'second' || activeTab === 'all'"
            type="danger"
            size="small"
            :icon="CloseBold"
            class="scale-btn"
            :disabled="submittingSecondReject"
            @click="openBatchReject('second')"
          >
            批量复审驳回
          </el-button>
        </div>
        <el-button size="small" text @click="handleClearSelection">取消选择</el-button>
      </div>

      <!-- 表格 -->
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="dataList"
        border
        stripe
        style="width: 100%"
        header-dragend-style="color: #409eff;font-weight: bold;"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" reserve-selection />
        <el-table-column label="风险标" width="70" align="center" fixed="left">
          <template #default="{ row }">
            <el-tooltip
              v-if="(row as AuditListItem).riskFlagged"
              :content="(row as AuditListItem).riskReason || '存在风险'"
            >
              <el-tag type="danger" size="small" effect="dark">
                <el-icon><Warning /></el-icon>
              </el-tag>
            </el-tooltip>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="推客编号" width="120" align="center" />
        <el-table-column prop="name" label="姓名" width="100" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="idCard" label="身份证号" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ maskIdCard((row as AuditListItem).idCard) }}
          </template>
        </el-table-column>
        <el-table-column prop="channelName" label="渠道" width="120" show-overflow-tooltip />
        <el-table-column label="等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="PROMOTER_LEVEL_MAP[(row as AuditListItem).level as any]?.type || 'info'"
              size="small"
            >
              {{ PROMOTER_LEVEL_MAP[(row as AuditListItem).level as any]?.label || 'L1' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核阶段" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="AUDIT_STAGE_MAP[(row as AuditListItem).auditStage]?.type || 'info'"
              size="small"
            >
              {{ AUDIT_STAGE_MAP[(row as AuditListItem).auditStage]?.label || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="AUDIT_STATUS_MAP[(row as AuditListItem).auditStatus]?.type || 'info'"
              size="small"
            >
              {{ AUDIT_STATUS_MAP[(row as AuditListItem).auditStatus]?.label || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="初审人" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row as AuditListItem).firstAuditor?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="初审时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime((row as AuditListItem).firstAuditAt) }}
          </template>
        </el-table-column>
        <el-table-column label="复审人" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row as AuditListItem).secondAuditor?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="复审时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime((row as AuditListItem).secondAuditAt) }}
          </template>
        </el-table-column>
        <el-table-column label="驳回原因" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getRejectReasonLabel((row as AuditListItem).rejectReasonCode) }}
          </template>
        </el-table-column>
        <el-table-column label="锁定剩余小时" width="120" align="center">
          <template #default="{ row }">
            <span
              v-if="(row as AuditListItem).lockRemainingHours && (row as AuditListItem).lockRemainingHours > 0"
              class="text-warning"
            >
              {{ (row as AuditListItem).lockRemainingHours }}h
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime((row as AuditListItem).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              class="scale-btn"
              :icon="View"
              @click="handleDetail(row as AuditListItem)"
            >
              详情
            </el-button>
            <template v-if="canAudit(row as AuditListItem)">
              <el-button
                v-if="(row as AuditListItem).auditStage === 1"
                type="success"
                link
                size="small"
                class="scale-btn"
                :icon="CircleCheck"
                :disabled="submittingFirstPass"
                @click="handleFirstPass(row as AuditListItem)"
              >
                初审通过
              </el-button>
              <el-button
                v-if="(row as AuditListItem).auditStage === 2"
                type="success"
                link
                size="small"
                class="scale-btn"
                :icon="CircleCheck"
                :disabled="submittingSecondPass"
                @click="handleSecondPass(row as AuditListItem)"
              >
                复审通过
              </el-button>
              <el-button
                v-if="(row as AuditListItem).auditStage === 1"
                type="danger"
                link
                size="small"
                class="scale-btn"
                :icon="CloseBold"
                :disabled="submittingFirstReject"
                @click="openReject(row as AuditListItem, 'first')"
              >
                初审驳回
              </el-button>
              <el-button
                v-if="(row as AuditListItem).auditStage === 2"
                type="danger"
                link
                size="small"
                class="scale-btn"
                :icon="CloseBold"
                :disabled="submittingSecondReject"
                @click="openReject(row as AuditListItem, 'second')"
              >
                复审驳回
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="table-pagination">
        <el-button
          class="refresh-btn"
          type="primary"
          plain
          link
          :icon="Refresh"
          :loading="loading"
          @click="fetchData"
        >
          刷新
        </el-button>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[...PAGE_SIZE_OPTIONS]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <BaseDialog
      v-model="detailVisible"
      title="推客审核详情"
      width="900px"
      :show-footer="true"
      :loading="detailLoading"
      @confirm="handleDetailAuditAction"
    >
      <template v-if="detailData">
        <!-- 推客资料 -->
        <div class="detail-section">
          <div class="section-title">
            <el-icon><User /></el-icon>
            推客基本资料
          </div>
          <el-descriptions :column="3" border size="default">
            <el-descriptions-item label="推客编号">{{ detailData.code }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ detailData.name }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ detailData.nickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ detailData.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="微信号">{{ detailData.wechatId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="身份证号" :span="3">
              {{ maskIdCard(detailData.idCard) }}
            </el-descriptions-item>
            <el-descriptions-item label="渠道">{{ detailData.channelName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="等级">
              <el-tag
                :type="PROMOTER_LEVEL_MAP[detailData.level as any]?.type || 'info'"
              >
                {{ PROMOTER_LEVEL_MAP[detailData.level as any]?.label || 'L1' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="风险标记">
              <el-tag
                v-if="detailData.riskFlagged"
                type="danger"
                effect="dark"
              >
                <el-icon class="mr-4"><Warning /></el-icon>
                {{ detailData.riskReason || '存在风险' }}
              </el-tag>
              <span v-else>无</span>
            </el-descriptions-item>
            <el-descriptions-item label="审核阶段">
              <el-tag :type="AUDIT_STAGE_MAP[detailData.auditStage]?.type || 'info'">
                {{ AUDIT_STAGE_MAP[detailData.auditStage]?.label || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag :type="AUDIT_STATUS_MAP[detailData.auditStatus]?.type || 'info'">
                {{ AUDIT_STATUS_MAP[detailData.auditStatus]?.label || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="申请次数">
              {{ detailData.applyCount || 0 }} 次
            </el-descriptions-item>
            <el-descriptions-item label="锁定状态">
              <span v-if="detailData.isLocked" class="text-warning">
                锁定中，剩余 {{ detailData.lockRemainingHours }} 小时
              </span>
              <span v-else>未锁定</span>
            </el-descriptions-item>
            <el-descriptions-item label="申请时间" :span="2">
              {{ formatDateTime(detailData.createdAt) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 证件图片 -->
          <div class="id-images" v-if="detailData.idCardFrontImg || detailData.idCardBackImg">
            <div class="id-images__title">证件图片</div>
            <div class="id-images__list">
              <div class="id-images__item" v-if="detailData.idCardFrontImg">
                <div class="id-images__label">身份证正面</div>
                <el-image :src="detailData.idCardFrontImg" fit="contain" style="width: 260px; height: 170px; border: 1px solid #ebeef5; border-radius: 4px;" />
              </div>
              <div class="id-images__item" v-if="detailData.idCardBackImg">
                <div class="id-images__label">身份证反面</div>
                <el-image :src="detailData.idCardBackImg" fit="contain" style="width: 260px; height: 170px; border: 1px solid #ebeef5; border-radius: 4px;" />
              </div>
            </div>
          </div>
        </div>

        <!-- 审核流程 -->
        <div class="detail-section">
          <div class="section-title">
            <el-icon><Document /></el-icon>
            审核流程记录
          </div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="初审人">{{ detailData.firstAuditor?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="初审时间">{{ formatDateTime(detailData.firstAuditAt) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="初审备注" :span="2">
              {{ detailData.firstAuditRemark || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="复审人">{{ detailData.secondAuditor?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="复审时间">{{ formatDateTime(detailData.secondAuditAt) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="复审备注" :span="2">
              {{ detailData.secondAuditRemark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 驳回记录列表 -->
        <div class="detail-section" v-if="detailData.rejectRecords && detailData.rejectRecords.length > 0">
          <div class="section-title">
            <el-icon><CircleClose /></el-icon>
            驳回记录（共 {{ detailData.rejectRecords.length }} 条）
          </div>
          <el-table :data="detailData.rejectRecords" border size="default">
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="action" label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ AUDIT_ACTION_LABELS[row.action] || row.action }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="阶段" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small">{{ AUDIT_STAGE_MAP[row.stage as any]?.label || row.stage }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="reasonLabel" label="驳回原因" min-width="160" show-overflow-tooltip />
            <el-table-column prop="customRemark" label="自定义备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="锁定情况" width="180" align="center">
              <template #default="{ row }">
                <span v-if="row.locked" class="text-warning">
                  锁定至 {{ formatDateTime(row.lockUntil) }}（剩{{ row.remainingHours }}h）
                </span>
                <span v-else>未锁定</span>
              </template>
            </el-table-column>
            <el-table-column label="操作时间" width="170">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <template v-if="detailData && canAudit(detailData)">
          <el-button
            v-if="detailData.auditStage === 1"
            type="success"
            class="scale-btn"
            :icon="CircleCheck"
            :loading="submittingFirstPass"
            :disabled="submittingFirstPass"
            @click="handleFirstPassFromDetail"
          >
            初审通过
          </el-button>
          <el-button
            v-if="detailData.auditStage === 2"
            type="success"
            class="scale-btn"
            :icon="CircleCheck"
            :loading="submittingSecondPass"
            :disabled="submittingSecondPass"
            @click="handleSecondPassFromDetail"
          >
            复审通过
          </el-button>
          <el-button
            v-if="detailData.auditStage === 1"
            type="danger"
            class="scale-btn"
            :icon="CloseBold"
            :disabled="submittingFirstReject"
            @click="openRejectFromDetail('first')"
          >
            初审驳回
          </el-button>
          <el-button
            v-if="detailData.auditStage === 2"
            type="danger"
            class="scale-btn"
            :icon="CloseBold"
            :disabled="submittingSecondReject"
            @click="openRejectFromDetail('second')"
          >
            复审驳回
          </el-button>
        </template>
      </template>
    </BaseDialog>

    <!-- 驳回弹窗 -->
    <BaseDialog
      v-model="rejectVisible"
      :title="rejectDialogTitle"
      width="500px"
      :loading="rejectLoading"
      @confirm="handleRejectConfirm"
    >
      <el-form ref="rejectFormRef" :model="rejectFormData" :rules="rejectFormRules" label-width="110px">
        <el-form-item label="驳回原因" prop="reasonCode">
          <el-select
            v-model="rejectFormData.reasonCode"
            placeholder="请选择标准化驳回原因"
            style="width: 100%"
          >
            <el-option
              v-for="item in rejectReasonOptions"
              :key="item.code"
              :label="item.label"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="自定义备注">
          <el-input
            v-model="rejectFormData.customRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入详细说明（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="锁定窗口期" prop="lockDays">
          <el-select
            v-model="rejectFormData.lockDays"
            placeholder="请选择锁定时间"
            style="width: 100%"
          >
            <el-option
              v-for="item in LOCK_WINDOW_DAYS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div class="form-tip">选择锁定期间该用户无法再次提交申请</div>
        </el-form-item>
      </el-form>
    </BaseDialog>

    <!-- 批量结果弹窗 -->
    <BaseDialog
      v-model="batchResultVisible"
      title="批量操作结果"
      width="700px"
      :show-footer="true"
      confirm-text="确定"
    >
      <div v-if="batchResult">
        <!-- 统计摘要 -->
        <el-row :gutter="12" class="batch-result-stats">
          <el-col :span="6">
            <div class="result-stat total">
              <div class="result-stat__value">{{ batchResult.total }}</div>
              <div class="result-stat__label">总数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat success">
              <div class="result-stat__value">{{ batchResult.success }}</div>
              <div class="result-stat__label">成功</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat failed">
              <div class="result-stat__value">{{ batchResult.failed }}</div>
              <div class="result-stat__label">失败</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat skipped">
              <div class="result-stat__value">{{ batchResult.skipped }}</div>
              <div class="result-stat__label">跳过</div>
            </div>
          </el-col>
        </el-row>
        <!-- 明细表格 -->
        <div class="batch-result-detail">
          <div class="detail-title">操作明细</div>
          <el-table :data="batchResult.details" border size="default" max-height="400">
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="id" label="推客编号" width="120" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  v-if="row.status === 'success'"
                  type="success"
                  size="small"
                >
                  成功
                </el-tag>
                <el-tag
                  v-else-if="row.status === 'failed'"
                  type="danger"
                  size="small"
                >
                  失败
                </el-tag>
                <el-tag
                  v-else
                  type="info"
                  size="small"
                >
                  跳过
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="说明" min-width="200" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  RefreshRight,
  Refresh,
  View,
  CircleCheck,
  CloseBold,
  Warning,
  Clock,
  Timer,
  User,
  Document,
  CircleClose,
} from '@element-plus/icons-vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import { formatDateTime } from '@/utils/date'
import {
  AUDIT_STAGE_MAP,
  AUDIT_STATUS_MAP,
  AUDIT_TAB_OPTIONS,
  PROMOTER_LEVEL_MAP,
  REJECT_REASON_OPTIONS,
  LOCK_WINDOW_DAYS_OPTIONS,
  AUDIT_ACTION_LABELS,
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
} from '@/constants'
import {
  getAuditList,
  getAuditDetail,
  getAuditStatistics,
  getRejectReasons,
  firstAuditPass,
  firstAuditReject,
  secondAuditPass,
  secondAuditReject,
  batchFirstPass,
  batchSecondPass,
  batchFirstReject,
  batchSecondReject,
  type AuditListItem,
  type AuditDetailItem,
  type AuditQueryParams,
  type RejectSubmitData,
  type BatchAuditResult,
  type RejectReasonOption,
} from '@/api/promoter-audit'

// ==================== 基础状态 ====================

const tableRef = ref()
const activeTab = ref<string>('first')
const loading = ref(false)
const dataList = ref<AuditListItem[]>([])
const total = ref(0)
const selectedIds = ref<(string | number)[]>([])
const dateRange = ref<string[]>([])
const statistics = reactive({
  pendingFirst: 0,
  pendingSecond: 0,
  rejected: 0,
  passed: 0,
})

const pagination = reactive({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
})

const queryParams = reactive<AuditQueryParams>({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  keyword: undefined,
  auditStageList: undefined,
  auditStatusList: undefined,
  channelId: undefined,
  level: undefined,
  phone: undefined,
  idCard: undefined,
  riskFlagged: undefined,
  startDate: undefined,
  endDate: undefined,
})

// ==================== 防重复提交状态 ====================

const submittingFirstPass = ref(false)
const submittingFirstReject = ref(false)
const submittingSecondPass = ref(false)
const submittingSecondReject = ref(false)

// ==================== 驳回原因 ====================

const rejectReasonOptions = ref<RejectReasonOption[]>([])

// ==================== 详情弹窗 ====================

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<AuditDetailItem | null>(null)

// ==================== 驳回弹窗 ====================

const rejectVisible = ref(false)
const rejectLoading = ref(false)
const rejectFormRef = ref<FormInstance>()
const rejectMode = ref<'first' | 'second'>('first')
const rejectTarget = ref<AuditListItem | AuditDetailItem | null>(null)
const isBatchReject = ref(false)
const rejectFormData = reactive<RejectSubmitData & { lockDays?: number }>({
  reasonCode: '',
  customRemark: '',
  lockDays: undefined,
})

const rejectFormRules: FormRules = {
  reasonCode: [
    { required: true, message: '请选择驳回原因', trigger: 'change' },
  ],
  lockDays: [
    { required: true, message: '请选择锁定窗口期', trigger: 'change' },
  ],
}

const rejectDialogTitle = computed(() => {
  const actionType = isBatchReject.value ? '批量' : ''
  const stageType = rejectMode.value === 'first' ? '初审' : '复审'
  return `${actionType}${stageType}驳回`
})

// ==================== 批量结果弹窗 ====================

const batchResultVisible = ref(false)
const batchResult = ref<BatchAuditResult | null>(null)

// ==================== 工具方法 ====================

/** 身份证号脱敏 */
function maskIdCard(idCard?: string): string {
  if (!idCard) return '-'
  if (idCard.length < 10) return idCard
  return idCard.substring(0, 6) + '********' + idCard.substring(idCard.length - 4)
}

/** 获取驳回原因标签 */
function getRejectReasonLabel(code?: string): string {
  if (!code) return '-'
  const option = rejectReasonOptions.value.find((item) => item.code === code)
  if (option) return option.label
  const defaultOption = REJECT_REASON_OPTIONS.find((item) => item.code === code)
  return defaultOption?.label || code
}

/** 判断是否可审核 */
function canAudit(row: AuditListItem | AuditDetailItem): boolean {
  const auditStage = (row as any).auditStage
  return auditStage === 1 || auditStage === 2
}

// ==================== 数据加载 ====================

async function fetchStatistics() {
  try {
    const res = await getAuditStatistics()
    Object.assign(statistics, {
      pendingFirst: res.pendingFirst,
      pendingSecond: res.pendingSecond,
      rejected: res.rejected,
      passed: res.passed,
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

async function fetchRejectReasons() {
  try {
    const res = await getRejectReasons()
    if (res && res.length > 0) {
      rejectReasonOptions.value = res
    } else {
      rejectReasonOptions.value = [...REJECT_REASON_OPTIONS]
    }
  } catch (error) {
    rejectReasonOptions.value = [...REJECT_REASON_OPTIONS]
    console.error('获取驳回原因失败:', error)
  }
}

async function fetchData() {
  loading.value = true
  try {
    const currentTab = AUDIT_TAB_OPTIONS.find((item) => item.value === activeTab.value)
    const params: AuditQueryParams = {
      ...queryParams,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (currentTab?.auditStageList) {
      params.auditStageList = currentTab.auditStageList.join(',')
    }
    if (currentTab?.auditStatusList) {
      params.auditStatusList = currentTab.auditStatusList.join(',')
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getAuditList(params)
    dataList.value = res.list
    total.value = res.total
  } catch (error) {
    console.error('获取列表数据失败:', error)
    ElMessage.error('获取列表数据失败')
  } finally {
    loading.value = false
  }
}

// ==================== 搜索和分页 ====================

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(queryParams).forEach((key) => {
    if (key !== 'page' && key !== 'pageSize') {
      ;(queryParams as any)[key] = undefined
    }
  })
  dateRange.value = []
  pagination.page = 1
  fetchData()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

// ==================== Tabs ====================

function handleTabChange(tabName: string) {
  activeTab.value = tabName
  pagination.page = 1
  fetchData()
}

function switchTab(tabName: string) {
  if (activeTab.value !== tabName) {
    activeTab.value = tabName
    pagination.page = 1
    fetchData()
  }
}

// ==================== 选择 ====================

function handleSelectionChange(selection: any[]) {
  selectedIds.value = selection.map((item) => item.id)
}

function handleClearSelection() {
  selectedIds.value = []
  if (tableRef.value?.tableRef) {
    tableRef.value.tableRef.clearSelection()
  }
}

// ==================== 防重复提交包装 ====================

/** 包装一个异步操作，防止 300ms 内重复提交 */
async function withAntiDuplicate(
  stateRef: { value: boolean },
  operation: () => Promise<void>
): Promise<void> {
  if (stateRef.value) return
  stateRef.value = true
  const timer = setTimeout(() => {
    stateRef.value = false
  }, 300)
  try {
    await operation()
  } finally {
    clearTimeout(timer)
    stateRef.value = false
  }
}

// ==================== 审核操作 - 初审通过 ====================

async function handleFirstPass(row: AuditListItem) {
  await withAntiDuplicate(submittingFirstPass, async () => {
    try {
      await ElMessageBox.confirm(
        `确定要初审通过推客【${row.name}】吗？`,
        '初审通过确认',
        { type: 'warning' }
      )
      await firstAuditPass(row.id)
      ElMessage.success('初审通过成功')
      await Promise.all([fetchData(), fetchStatistics()])
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        console.error(error)
      }
    }
  })
}

async function handleFirstPassFromDetail() {
  if (!detailData.value) return
  await withAntiDuplicate(submittingFirstPass, async () => {
    try {
      await ElMessageBox.confirm(
        `确定要初审通过推客【${detailData.value!.name}】吗？`,
        '初审通过确认',
        { type: 'warning' }
      )
      await firstAuditPass(detailData.value!.id)
      ElMessage.success('初审通过成功')
      detailVisible.value = false
      await Promise.all([fetchData(), fetchStatistics()])
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        console.error(error)
      }
    }
  })
}

async function handleBatchFirstPass() {
  if (selectedIds.value.length === 0) return
  await withAntiDuplicate(submittingFirstPass, async () => {
    try {
      await ElMessageBox.confirm(
        `确定要批量初审通过选中的 ${selectedIds.value.length} 条数据吗？`,
        '批量初审通过确认',
        { type: 'warning' }
      )
      const res = await batchFirstPass(selectedIds.value)
      batchResult.value = res
      batchResultVisible.value = true
      handleClearSelection()
      await Promise.all([fetchData(), fetchStatistics()])
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        console.error(error)
      }
    }
  })
}

// ==================== 审核操作 - 复审通过 ====================

async function handleSecondPass(row: AuditListItem) {
  await withAntiDuplicate(submittingSecondPass, async () => {
    try {
      await ElMessageBox.confirm(
        `确定要复审通过推客【${row.name}】吗？`,
        '复审通过确认',
        { type: 'warning' }
      )
      await secondAuditPass(row.id)
      ElMessage.success('复审通过成功')
      await Promise.all([fetchData(), fetchStatistics()])
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        console.error(error)
      }
    }
  })
}

async function handleSecondPassFromDetail() {
  if (!detailData.value) return
  await withAntiDuplicate(submittingSecondPass, async () => {
    try {
      await ElMessageBox.confirm(
        `确定要复审通过推客【${detailData.value!.name}】吗？`,
        '复审通过确认',
        { type: 'warning' }
      )
      await secondAuditPass(detailData.value!.id)
      ElMessage.success('复审通过成功')
      detailVisible.value = false
      await Promise.all([fetchData(), fetchStatistics()])
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        console.error(error)
      }
    }
  })
}

async function handleBatchSecondPass() {
  if (selectedIds.value.length === 0) return
  await withAntiDuplicate(submittingSecondPass, async () => {
    try {
      await ElMessageBox.confirm(
        `确定要批量复审通过选中的 ${selectedIds.value.length} 条数据吗？`,
        '批量复审通过确认',
        { type: 'warning' }
      )
      const res = await batchSecondPass(selectedIds.value)
      batchResult.value = res
      batchResultVisible.value = true
      handleClearSelection()
      await Promise.all([fetchData(), fetchStatistics()])
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        console.error(error)
      }
    }
  })
}

// ==================== 审核操作 - 驳回 ====================

function openReject(row: AuditListItem, mode: 'first' | 'second') {
  rejectTarget.value = row
  rejectMode.value = mode
  isBatchReject.value = false
  resetRejectForm()
  rejectVisible.value = true
}

function openRejectFromDetail(mode: 'first' | 'second') {
  if (!detailData.value) return
  rejectTarget.value = detailData.value
  rejectMode.value = mode
  isBatchReject.value = false
  resetRejectForm()
  rejectVisible.value = true
}

function openBatchReject(mode: 'first' | 'second') {
  if (selectedIds.value.length === 0) return
  rejectTarget.value = null
  rejectMode.value = mode
  isBatchReject.value = true
  resetRejectForm()
  rejectVisible.value = true
}

function resetRejectForm() {
  rejectFormData.reasonCode = ''
  rejectFormData.customRemark = ''
  rejectFormData.lockDays = undefined
  rejectFormRef.value?.clearValidate()
}

async function handleRejectConfirm() {
  if (!rejectFormRef.value) return
  try {
    await rejectFormRef.value.validate()
  } catch {
    return
  }

  const submitData: RejectSubmitData = {
    reasonCode: rejectFormData.reasonCode,
    customRemark: rejectFormData.customRemark || undefined,
    lockDays: rejectFormData.lockDays,
  }

  const stateRef = rejectMode.value === 'first' ? submittingFirstReject : submittingSecondReject

  await withAntiDuplicate(stateRef, async () => {
    rejectLoading.value = true
    try {
      if (isBatchReject.value) {
        const res =
          rejectMode.value === 'first'
            ? await batchFirstReject(selectedIds.value, submitData)
            : await batchSecondReject(selectedIds.value, submitData)
        batchResult.value = res
        batchResultVisible.value = true
        handleClearSelection()
      } else {
        if (!rejectTarget.value) return
        if (rejectMode.value === 'first') {
          await firstAuditReject((rejectTarget.value as AuditListItem).id, submitData)
        } else {
          await secondAuditReject((rejectTarget.value as AuditListItem).id, submitData)
        }
        ElMessage.success('驳回成功')
        // 如果是从详情弹窗打开，关闭详情弹窗
        if (detailVisible.value) {
          detailVisible.value = false
        }
      }
      rejectVisible.value = false
      await Promise.all([fetchData(), fetchStatistics()])
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.message || '操作失败')
    } finally {
      rejectLoading.value = false
    }
  })
}

// ==================== 详情 ====================

async function handleDetail(row: AuditListItem) {
  detailLoading.value = true
  try {
    const res = await getAuditDetail(row.id)
    detailData.value = res
    detailVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败')
  } finally {
    detailLoading.value = false
  }
}

function handleDetailAuditAction() {
  // 占位，实际操作在 footer 的按钮中触发
}

// ==================== 初始化 ====================

onMounted(async () => {
  await fetchRejectReasons()
  await fetchStatistics()
  await fetchData()
})
</script>

<style scoped lang="scss">
.audit-page {
  .tabs-card {
    margin-bottom: 16px;

    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
      height: 44px;
      line-height: 44px;
    }

    :deep(.el-tabs__active-bar) {
      height: 3px;
    }
  }

  .stats-row {
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      }

      &__icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        margin-right: 16px;

        .el-icon {
          color: #fff;
        }
      }

      &__content {
        flex: 1;
      }

      &__value {
        font-size: 28px;
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: 4px;
      }

      &__label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }

      &--pending-first {
        .stat-card__icon {
          background: linear-gradient(135deg, #409eff, #66b1ff);
        }
        .stat-card__value {
          color: #409eff;
        }
      }

      &--pending-second {
        .stat-card__icon {
          background: linear-gradient(135deg, #e6a23c, #ebb563);
        }
        .stat-card__value {
          color: #e6a23c;
        }
      }

      &--rejected {
        .stat-card__icon {
          background: linear-gradient(135deg, #f56c6c, #f78989);
        }
        .stat-card__value {
          color: #f56c6c;
        }
      }

      &--passed {
        .stat-card__icon {
          background: linear-gradient(135deg, #67c23a, #85ce61);
        }
        .stat-card__value {
          color: #67c23a;
        }
      }
    }
  }

  .search-card {
    margin-bottom: 16px;

    .search-form {
      margin-bottom: 0;

      :deep(.el-form-item) {
        margin-bottom: 12px;
        margin-right: 0;
      }
    }
  }

  .table-card {
    .batch-operation-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--el-color-primary-light-9);
      border-radius: 4px;
      margin-bottom: 16px;

      .batch-selected-count {
        font-size: 14px;
        color: var(--el-text-color-primary);
        flex-shrink: 0;

        em {
          color: var(--el-color-primary);
          font-weight: 600;
          font-style: normal;
          margin: 0 2px;
        }
      }

      .batch-buttons {
        display: flex;
        gap: 8px;
        flex: 1;
      }
    }

    .table-pagination {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      .refresh-btn {
        margin-right: auto;
      }
    }
  }

  .text-warning {
    color: var(--el-color-warning);
    font-weight: 500;
  }

  // 详情弹窗样式
  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
    padding-left: 8px;
    border-left: 3px solid var(--el-color-primary);

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .id-images {
    margin-top: 16px;

    &__title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 10px;
    }

    &__list {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    &__item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    &__label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      text-align: center;
    }
  }

  .form-tip {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
  }

  .mr-4 {
    margin-right: 4px;
  }

  // 批量结果弹窗
  .batch-result-stats {
    margin-bottom: 20px;

    .result-stat {
      text-align: center;
      padding: 16px;
      border-radius: 8px;
      background: #f5f7fa;

      &__value {
        font-size: 26px;
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: 4px;
      }

      &__label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }

      &.total {
        background: #ecf5ff;
        .result-stat__value { color: #409eff; }
      }

      &.success {
        background: #f0f9eb;
        .result-stat__value { color: #67c23a; }
      }

      &.failed {
        background: #fef0f0;
        .result-stat__value { color: #f56c6c; }
      }

      &.skipped {
        background: #f4f4f5;
        .result-stat__value { color: #909399; }
      }
    }
  }

  .batch-result-detail {
    .detail-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
    }
  }

  // 按钮悬停放大效果
  .scale-btn {
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover:not(:disabled) {
      transform: scale(1.05);
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }
  }
}
</style>

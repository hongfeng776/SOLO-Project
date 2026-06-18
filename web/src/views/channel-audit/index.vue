<template>
  <div class="page-container channel-audit-page">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="4">
        <el-card shadow="never" class="stat-card" @click="handleTabClick('data')">
          <div class="stat-card__label">待资料初审</div>
          <div class="stat-card__value" :class="{ highlight: statistics.dataReview > 0 }">
            {{ statistics.dataReview }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card" @click="handleTabClick('qualification')">
          <div class="stat-card__label">待资质核验</div>
          <div class="stat-card__value" :class="{ highlight: statistics.qualificationVerify > 0 }">
            {{ statistics.qualificationVerify }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card" @click="handleTabClick('permission')">
          <div class="stat-card__label">待权限开通</div>
          <div class="stat-card__value" :class="{ highlight: statistics.permissionActivate > 0 }">
            {{ statistics.permissionActivate }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card">
          <div class="stat-card__label">待审核总数</div>
          <div class="stat-card__value">{{ statistics.pendingTotal }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card stat-card--success">
          <div class="stat-card__label">已通过</div>
          <div class="stat-card__value">{{ statistics.passed }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card stat-card--danger">
          <div class="stat-card__label">已驳回</div>
          <div class="stat-card__value">{{ statistics.rejected }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="filter-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="tab in CHANNEL_AUDIT_TAB_OPTIONS"
          :key="tab.value"
          :label="tab.label"
          :name="tab.value"
        />
      </el-tabs>

      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="渠道名称/联系人/企业名称"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input
            v-model="queryParams.contactPhone"
            placeholder="请输入联系电话"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select
            v-model="queryParams.priority"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in CHANNEL_PRIORITY_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险标记">
          <el-select
            v-model="queryParams.riskFlagged"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="有风险" :value="true" />
            <el-option label="无风险" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="重点合作">
          <el-select
            v-model="queryParams.isKeyChannel"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
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
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <BaseBatchOperation
        :selected-count="selectedIds.length"
        @clear="handleClearSelection"
      >
        <template v-if="currentTabStage === 1">
          <el-button
            type="success"
            size="small"
            :icon="Check"
            :disabled="selectedIds.length === 0 || batchSubmitting"
            :loading="batchSubmitting"
            @click="handleBatchPass('data')"
          >
            批量通过初审
          </el-button>
          <el-button
            type="warning"
            size="small"
            :icon="Close"
            :disabled="selectedIds.length === 0 || batchSubmitting"
            @click="openBatchRejectDialog('data')"
          >
            批量驳回初审
          </el-button>
        </template>
        <template v-else-if="currentTabStage === 2">
          <el-button
            type="success"
            size="small"
            :icon="Check"
            :disabled="selectedIds.length === 0 || batchSubmitting"
            :loading="batchSubmitting"
            @click="handleBatchPass('qualification')"
          >
            批量通过核验
          </el-button>
          <el-button
            type="warning"
            size="small"
            :icon="Close"
            :disabled="selectedIds.length === 0 || batchSubmitting"
            @click="openBatchRejectDialog('qualification')"
          >
            批量驳回核验
          </el-button>
        </template>
        <template v-else-if="currentTabStage === 3">
          <el-button
            type="success"
            size="small"
            :icon="Check"
            :disabled="selectedIds.length === 0 || batchSubmitting"
            :loading="batchSubmitting"
            @click="handleBatchPass('permission')"
          >
            批量开通权限
          </el-button>
          <el-button
            type="warning"
            size="small"
            :icon="Close"
            :disabled="selectedIds.length === 0 || batchSubmitting"
            @click="openBatchRejectDialog('permission')"
          >
            批量驳回开通
          </el-button>
        </template>
        <el-button
          type="primary"
          size="small"
          :icon="Download"
          @click="handleExport"
        >
          导出
        </el-button>
      </BaseBatchOperation>

      <BaseTable
        :data="dataList"
        :loading="loading"
        :total="total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        show-selection
        height="calc(100vh - 440px)"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @refresh="handleRefresh"
      >
        <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
        <el-table-column label="渠道编码" width="140" fixed="left">
          <template #default="{ row }">
            <span class="code-text">{{ (row as ChannelAuditItem).code || '-' }}</span>
            <el-tag
              v-if="(row as ChannelAuditItem).isKeyChannel"
              type="danger"
              size="small"
              effect="dark"
              style="margin-left: 4px"
            >
              重点
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="渠道名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="优先级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(CHANNEL_PRIORITY_MAP as any)[(row as ChannelAuditItem).priority]?.type || 'info'">
              {{ (CHANNEL_PRIORITY_MAP as any)[(row as ChannelAuditItem).priority]?.label || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="companyName" label="合作主体" min-width="160" show-overflow-tooltip />
        <el-table-column label="联系人/电话" width="160">
          <template #default="{ row }">
            <div>{{ (row as ChannelAuditItem).contactName }}</div>
            <div class="text-muted">{{ (row as ChannelAuditItem).contactPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="审核阶段" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="(CHANNEL_AUDIT_STAGE_MAP as any)[(row as ChannelAuditItem).auditStage]?.type || 'info'">
              {{ (CHANNEL_AUDIT_STAGE_MAP as any)[(row as ChannelAuditItem).auditStage]?.label || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="(CHANNEL_AUDIT_STATUS_MAP as any)[(row as ChannelAuditItem).auditStatus]?.type || 'info'">
              {{ (CHANNEL_AUDIT_STATUS_MAP as any)[(row as ChannelAuditItem).auditStatus]?.label || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风险" width="80" align="center">
          <template #default="{ row }">
            <el-tooltip
              v-if="(row as ChannelAuditItem).riskFlagged"
              :content="(row as ChannelAuditItem).riskReason || '存在风险标记'"
              placement="top"
            >
              <el-icon :size="18" color="#f56c6c"><WarningFilled /></el-icon>
            </el-tooltip>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="锁定" width="80" align="center">
          <template #default="{ row }">
            <el-tooltip
              v-if="(row as ChannelAuditItem).isLocked"
              :content="`剩余${(row as ChannelAuditItem).lockRemainingHours}小时解锁`"
              placement="top"
            >
              <el-icon :size="16" color="#e6a23c"><Lock /></el-icon>
            </el-tooltip>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="驳回记录" width="100" align="center">
          <template #default="{ row }">
            <el-popover
              v-if="((row as ChannelAuditItem).applyCount ?? 0) > 1"
              placement="top"
              trigger="hover"
              :width="320"
            >
              <template #reference>
                <span class="reject-count">{{ (row as ChannelAuditItem).applyCount }} 次</span>
              </template>
              <div class="reject-hint">
                该渠道已提交 {{ (row as ChannelAuditItem).applyCount }} 次申请，请在详情中查看完整驳回记录。
              </div>
            </el-popover>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime((row as ChannelAuditItem).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleViewDetail(row as ChannelAuditItem)">
              详情
            </el-button>
            <template v-if="canAudit((row as ChannelAuditItem))">
              <el-button
                type="success"
                link
                :icon="Check"
                :disabled="submittingIds.includes((row as ChannelAuditItem).id)"
                :loading="submittingIds.includes((row as ChannelAuditItem).id)"
                @click="handlePass(row as ChannelAuditItem)"
              >
                通过
              </el-button>
              <el-button
                type="warning"
                link
                :icon="Close"
                @click="openRejectDialog(row as ChannelAuditItem)"
              >
                驳回
              </el-button>
            </template>
          </template>
        </el-table-column>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="detailVisible"
      :title="detailTitle"
      width="900px"
      :footer="false"
    >
      <template v-if="currentDetail">
        <el-steps :active="getStepActive()" finish-status="success" align-center class="audit-steps">
          <el-step
            v-for="(stage, idx) in CHANNEL_AUDIT_STAGES"
            :key="stage.key"
            :title="stage.label"
            :description="getStepDescription(idx)"
            :status="getStepStatus(idx)"
          />
        </el-steps>

        <el-tabs v-model="detailActiveTab" class="detail-tabs">
          <el-tab-pane label="基本资料" name="base">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="渠道编码">
                {{ currentDetail.code || '-' }}
                <el-tag
                  v-if="currentDetail.isKeyChannel"
                  type="danger"
                  size="small"
                  style="margin-left: 8px"
                >
                  重点合作
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="渠道名称">{{ currentDetail.name }}</el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag :type="(CHANNEL_PRIORITY_MAP as any)[currentDetail.priority]?.type || 'info'">
                  {{ (CHANNEL_PRIORITY_MAP as any)[currentDetail.priority]?.label || '-' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="渠道类型">
                {{ getChannelTypeLabel(currentDetail.type) || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="企业名称" :span="2">
                {{ currentDetail.companyName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="统一社会信用代码">
                {{ currentDetail.creditCode || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="法人代表">
                {{ currentDetail.legalPerson || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="联系人">{{ currentDetail.contactName }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ currentDetail.contactPhone }}</el-descriptions-item>
              <el-descriptions-item label="联系邮箱">{{ currentDetail.contactEmail || '-' }}</el-descriptions-item>
              <el-descriptions-item label="详细地址" :span="2">
                {{ currentDetail.address || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="佣金比例">
                {{ currentDetail.commissionRate !== undefined ? `${currentDetail.commissionRate}%` : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="申请次数">
                {{ currentDetail.applyCount || 1 }} 次
              </el-descriptions-item>
              <el-descriptions-item label="风险标记" :span="2">
                <el-tag v-if="currentDetail.riskFlagged" type="danger">
                  {{ currentDetail.riskReason || '存在风险' }}
                </el-tag>
                <span v-else class="text-muted">无</span>
              </el-descriptions-item>
              <el-descriptions-item label="征信检查" v-if="currentDetail.creditCheckResult">
                <el-tag :type="currentDetail.creditCheckResult.status === 'normal' ? 'success' : currentDetail.creditCheckResult.status === 'warning' ? 'warning' : 'danger'">
                  评分：{{ currentDetail.creditCheckResult.score || '-' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="黑名单" v-if="currentDetail.blacklistMatched">
                <el-tag type="danger">匹配黑名单</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">
                {{ currentDetail.remark || '-' }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="section-title">资质文件</div>
            <el-row :gutter="12" class="qualification-list">
              <el-col :span="8" v-if="currentDetail.businessLicenseImg">
                <div class="qualification-item">
                  <div class="qualification-item__label">营业执照</div>
                  <el-image
                    :src="currentDetail.businessLicenseImg"
                    fit="cover"
                    :preview-src-list="[currentDetail.businessLicenseImg]"
                    class="qualification-img"
                  />
                </div>
              </el-col>
              <el-col :span="8" v-if="currentDetail.idCardFrontImg">
                <div class="qualification-item">
                  <div class="qualification-item__label">身份证人像面</div>
                  <el-image
                    :src="currentDetail.idCardFrontImg"
                    fit="cover"
                    :preview-src-list="[currentDetail.idCardFrontImg]"
                    class="qualification-img"
                  />
                </div>
              </el-col>
              <el-col :span="8" v-if="currentDetail.idCardBackImg">
                <div class="qualification-item">
                  <div class="qualification-item__label">身份证国徽面</div>
                  <el-image
                    :src="currentDetail.idCardBackImg"
                    fit="cover"
                    :preview-src-list="[currentDetail.idCardBackImg]"
                    class="qualification-img"
                  />
                </div>
              </el-col>
              <el-col
                :span="8"
                v-for="(img, idx) in (currentDetail.otherQualificationImgs || [])"
                :key="idx"
              >
                <div class="qualification-item">
                  <div class="qualification-item__label">{{ img.title || '其他资质' }}</div>
                  <el-image
                    :src="img.fileUrl || img.url"
                    fit="cover"
                    :preview-src-list="[img.fileUrl || img.url]"
                    class="qualification-img"
                  />
                </div>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="审核进度" name="progress">
            <el-timeline class="audit-timeline">
              <el-timeline-item
                v-for="(item, idx) in (currentDetail.timeline || [])"
                :key="idx"
                :timestamp="item.time ? formatDateTime(item.time) : ''"
                :type="item.status === 'rejected' ? 'danger' : item.status === 'current' ? 'primary' : 'success'"
                :hollow="item.status === 'pending'"
              >
                <div class="timeline-item__title">{{ item.stage }}</div>
                <div v-if="item.operator" class="timeline-item__operator">操作人：{{ item.operator }}</div>
                <div class="timeline-item__desc">{{ item.description }}</div>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>

          <el-tab-pane label="驳回记录" name="reject">
            <el-empty v-if="!currentDetail.rejectRecords || currentDetail.rejectRecords.length === 0" description="暂无驳回记录" />
            <div v-else class="reject-records">
              <el-card
                v-for="(record, idx) in currentDetail.rejectRecords"
                :key="idx"
                shadow="never"
                class="reject-card"
              >
                <div class="reject-card__header">
                  <span class="reject-card__stage">{{ record.stage }}</span>
                  <span class="reject-card__time">{{ formatDateTime(record.createdAt) }}</span>
                </div>
                <div class="reject-card__issues">
                  <el-tag
                    v-for="(label, i) in (record.issueLabels || [])"
                    :key="i"
                    type="warning"
                    size="small"
                    style="margin-right: 6px"
                  >
                    {{ label }}
                  </el-tag>
                </div>
                <div class="reject-card__remark">
                  <strong>详细说明：</strong>{{ record.customRemark || '无' }}
                </div>
                <div class="reject-card__lock" v-if="record.locked">
                  <el-icon><Lock /></el-icon>
                  整改锁定中，剩余 {{ record.remainingHours }} 小时
                </div>
              </el-card>
            </div>
          </el-tab-pane>

          <el-tab-pane label="整改项" name="rectify" v-if="currentDetail.auditStage === -1">
            <el-empty
              v-if="!currentDetail.rejectIssueTypes || currentDetail.rejectIssueTypes.length === 0"
              description="暂无待整改项"
            />
            <div v-else>
              <el-alert
                v-if="currentDetail.isLocked"
                type="warning"
                show-icon
                :closable="false"
                class="lock-alert"
              >
                <template #title>
                  整改锁定中，剩余 {{ currentDetail.lockRemainingHours }} 小时后可重新提交
                </template>
              </el-alert>
              <div class="section-title">待整改问题</div>
              <ul class="rectify-list">
                <li v-for="(issue, idx) in currentDetail.rejectIssueTypes" :key="idx">
                  <el-icon color="#f56c6c"><WarningFilled /></el-icon>
                  <span>{{ (CHANNEL_REJECT_ISSUE_OPTIONS as any).find((o: any) => o.code === issue)?.label || issue }}</span>
                </li>
              </ul>
              <div class="section-title" v-if="currentDetail.rejectCustomRemark">审核备注</div>
              <div v-if="currentDetail.rejectCustomRemark" class="rectify-remark">
                {{ currentDetail.rejectCustomRemark }}
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="detail-footer">
          <template v-if="canAudit(currentDetail)">
            <el-button
              type="success"
              :icon="Check"
              :disabled="submittingIds.includes(currentDetail.id)"
              :loading="submittingIds.includes(currentDetail.id)"
              @click="handlePass(currentDetail)"
            >
              {{ getPassButtonText(currentDetail) }}
            </el-button>
            <el-button
              type="warning"
              :icon="Close"
              @click="openRejectDialog(currentDetail)"
            >
              驳回
            </el-button>
          </template>
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="rejectVisible"
      title="审核驳回"
      width="520px"
      :loading="rejectSubmitting"
      @confirm="handleRejectSubmit"
    >
      <el-form
        ref="rejectFormRef"
        :model="rejectFormData"
        :rules="rejectFormRules"
        label-width="100px"
      >
        <el-form-item label="驳回问题" prop="issueTypes">
          <el-checkbox-group v-model="rejectFormData.issueTypes">
            <el-checkbox
              v-for="item in CHANNEL_REJECT_ISSUE_OPTIONS"
              :key="item.code"
              :value="item.code"
              :label="item.code"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="详细说明" prop="customRemark">
          <el-input
            v-model="rejectFormData.customRemark"
            type="textarea"
            :rows="3"
            placeholder="请详细说明驳回原因，便于渠道整改"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="整改锁定" prop="lockDays">
          <el-select v-model="rejectFormData.lockDays" style="width: 100%">
            <el-option
              v-for="item in CHANNEL_LOCK_DAYS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div class="form-hint">锁定期间渠道无法重新提交入驻申请</div>
        </el-form-item>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="batchRejectVisible"
      title="批量审核驳回"
      width="520px"
      :loading="batchRejectSubmitting"
      @confirm="handleBatchRejectSubmit"
    >
      <el-alert
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #title>
          已选择 {{ batchRejectIds.length }} 条记录进行批量驳回，系统将自动过滤高风险主体渠道和阶段不匹配的记录。
        </template>
      </el-alert>
      <el-form
        ref="batchRejectFormRef"
        :model="batchRejectFormData"
        :rules="rejectFormRules"
        label-width="100px"
      >
        <el-form-item label="驳回问题" prop="issueTypes">
          <el-checkbox-group v-model="batchRejectFormData.issueTypes">
            <el-checkbox
              v-for="item in CHANNEL_REJECT_ISSUE_OPTIONS"
              :key="item.code"
              :value="item.code"
              :label="item.code"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="详细说明" prop="customRemark">
          <el-input
            v-model="batchRejectFormData.customRemark"
            type="textarea"
            :rows="3"
            placeholder="请详细说明驳回原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="整改锁定" prop="lockDays">
          <el-select v-model="batchRejectFormData.lockDays" style="width: 100%">
            <el-option
              v-for="item in CHANNEL_LOCK_DAYS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="resultVisible"
      title="批量操作结果"
      width="640px"
      :footer="false"
    >
      <template v-if="batchResult">
        <el-row :gutter="12" class="result-stats">
          <el-col :span="6">
            <div class="result-stat result-stat--total">
              <div class="stat-num">{{ batchResult.total }}</div>
              <div class="stat-label">总数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat result-stat--success">
              <div class="stat-num">{{ batchResult.success }}</div>
              <div class="stat-label">成功</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat result-stat--skipped">
              <div class="stat-num">{{ batchResult.skipped }}</div>
              <div class="stat-label">跳过</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat result-stat--failed">
              <div class="stat-num">{{ batchResult.failed }}</div>
              <div class="stat-label">失败</div>
            </div>
          </el-col>
        </el-row>
        <div class="section-title">操作明细</div>
        <el-table
          :data="batchResult.details"
          size="small"
          max-height="300"
          border
          stripe
        >
          <el-table-column prop="name" label="渠道名称" min-width="140" />
          <el-table-column prop="contactPhone" label="联系电话" width="130" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'success'" type="success" size="small">成功</el-tag>
              <el-tag v-else-if="row.status === 'skipped'" type="warning" size="small">跳过</el-tag>
              <el-tag v-else type="danger" size="small">失败</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="说明" min-width="200" show-overflow-tooltip />
        </el-table>
        <div class="result-footer">
          <el-button type="primary" @click="resultVisible = false">确定</el-button>
        </div>
      </template>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  RefreshRight,
  Download,
  View,
  Check,
  Close,
  Lock,
  WarningFilled,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import { useTable } from '@/composables/useTable'
import {
  CHANNEL_AUDIT_TAB_OPTIONS,
  CHANNEL_AUDIT_STAGE_MAP,
  CHANNEL_AUDIT_STATUS_MAP,
  CHANNEL_PRIORITY_MAP,
  CHANNEL_PRIORITY_OPTIONS,
  CHANNEL_REJECT_ISSUE_OPTIONS,
  CHANNEL_LOCK_DAYS_OPTIONS,
  CHANNEL_AUDIT_STAGES,
  CHANNEL_TYPE_OPTIONS,
} from '@/constants'
import { formatDateTime } from '@/utils/date'
import {
  getChannelAuditList,
  getChannelAuditDetail,
  getChannelAuditStatistics,
  channelDataPass,
  channelDataReject,
  channelQualificationPass,
  channelQualificationReject,
  channelPermissionPass,
  channelPermissionReject,
  batchChannelDataPass,
  batchChannelQualificationPass,
  batchChannelPermissionPass,
  batchChannelDataReject,
  batchChannelQualificationReject,
  batchChannelPermissionReject,
  type ChannelAuditItem,
  type ChannelAuditQueryParams,
  type ChannelRejectIssueType,
  type BatchAuditResult,
} from '@/api/channel-audit'

const {
  loading,
  dataList,
  total,
  selectedIds,
  pagination,
  queryParams,
  handleSearch,
  handleReset: doReset,
  handlePageChange,
  handleSizeChange,
  handleSelectionChange,
  handleRefresh,
  clearSelection,
  fetchData,
} = useTable<ChannelAuditItem, ChannelAuditQueryParams>({
  fetchApi: getChannelAuditList,
  immediate: false,
})

const statistics = reactive({
  dataReview: 0,
  qualificationVerify: 0,
  permissionActivate: 0,
  pendingTotal: 0,
  rejected: 0,
  passed: 0,
  total: 0,
  riskFlagged: 0,
  keyChannels: 0,
})

const activeTab = ref('data')
const dateRange = ref<string[]>([])
const submittingIds = ref<Array<string | number>>([])
const batchSubmitting = ref(false)

const detailVisible = ref(false)
const currentDetail = ref<ChannelAuditItem | null>(null)
const detailActiveTab = ref('base')
const detailTitle = computed(() => {
  return currentDetail.value ? `渠道审核详情 - ${currentDetail.value.name}` : '渠道审核详情'
})

const rejectVisible = ref(false)
const rejectSubmitting = ref(false)
const rejectFormRef = ref<FormInstance>()
const rejectRow = ref<ChannelAuditItem | null>(null)
const rejectFormData = reactive<{
  issueTypes: ChannelRejectIssueType[]
  customRemark: string
  lockDays: number
}>({
  issueTypes: [],
  customRemark: '',
  lockDays: 7,
})
const rejectFormRules: FormRules = {
  issueTypes: [
    { required: true, type: 'array', min: 1, message: '请至少选择一个驳回问题类型', trigger: 'change' },
  ],
  lockDays: [{ required: true, message: '请选择整改锁定天数', trigger: 'change' }],
}

const batchRejectVisible = ref(false)
const batchRejectSubmitting = ref(false)
const batchRejectFormRef = ref<FormInstance>()
const batchRejectStage = ref<'data' | 'qualification' | 'permission'>('data')
const batchRejectIds = ref<Array<string | number>>([])
const batchRejectFormData = reactive<{
  issueTypes: ChannelRejectIssueType[]
  customRemark: string
  lockDays: number
}>({
  issueTypes: [],
  customRemark: '',
  lockDays: 7,
})

const resultVisible = ref(false)
const batchResult = ref<BatchAuditResult | null>(null)

const currentTabStage = computed(() => {
  const tab = CHANNEL_AUDIT_TAB_OPTIONS.find((t) => t.value === activeTab.value)
  return tab?.auditStageList?.[0] ?? null
})

function handleTabClick(tabValue: string) {
  activeTab.value = tabValue
  handleTabChange(tabValue)
}

function handleTabChange(tabValue: string) {
  const tab = CHANNEL_AUDIT_TAB_OPTIONS.find((t) => t.value === tabValue)
  ;(queryParams as any).auditStageList = tab?.auditStageList
  ;(queryParams as any).auditStatusList = tab?.auditStatusList
  handleSearch()
}

function handleReset() {
  dateRange.value = []
  doReset()
}

function handleClearSelection() {
  clearSelection()
}

function handleExport() {
  ElMessage.info('导出功能开发中')
}

async function loadStatistics() {
  try {
    const data = await getChannelAuditStatistics()
    Object.assign(statistics, data)
  } catch (e) {
    console.error(e)
  }
}

function getChannelTypeLabel(type?: string): string {
  if (!type) return '-'
  const opt = CHANNEL_TYPE_OPTIONS.find((o: any) => o.value === type)
  return opt?.label || type || '-'
}

function canAudit(row: ChannelAuditItem): boolean {
  if (row.isLocked) return false
  return row.auditStage === 1 || row.auditStage === 2 || row.auditStage === 3
}

function getPassButtonText(row: ChannelAuditItem): string {
  if (row.auditStage === 1) return '通过资料初审'
  if (row.auditStage === 2) return '通过资质核验'
  if (row.auditStage === 3) return '开通权限'
  return '通过'
}

function getStepActive(): number {
  if (!currentDetail.value) return 0
  const stage = currentDetail.value.auditStage
  if (stage >= 4) return 3
  if (stage === 3) return 3
  if (stage === 2) return 2
  if (stage === 1) return 1
  if (stage === -1) return 0
  return 0
}

function getStepStatus(idx: number): string {
  if (!currentDetail.value) return 'wait'
  const stage = currentDetail.value.auditStage
  if (stage === -1) {
    const rejectStage = currentDetail.value.rejectRecords?.[0]?.stage
    if (rejectStage === '资料初审' && idx === 0) return 'error'
    if (rejectStage === '资质核验' && idx <= 1) return idx === 1 ? 'error' : 'success'
    if (idx < 2) return 'success'
    if (rejectStage === '权限开通' && idx === 2) return 'error'
    return 'wait'
  }
  if (stage >= 4) return 'success'
  const currentStep = stage - 1
  if (idx < currentStep) return 'success'
  if (idx === currentStep) return 'process'
  return 'wait'
}

function getStepDescription(idx: number): string {
  if (!currentDetail.value) return ''
  if (idx === 0 && currentDetail.value.dataAuditAt) {
    return formatDateTime(currentDetail.value.dataAuditAt)
  }
  if (idx === 1 && currentDetail.value.qualificationAuditAt) {
    return formatDateTime(currentDetail.value.qualificationAuditAt)
  }
  if (idx === 2 && currentDetail.value.permissionAuditAt) {
    return formatDateTime(currentDetail.value.permissionAuditAt)
  }
  return ''
}

async function handleViewDetail(row: ChannelAuditItem) {
  try {
    const data = await getChannelAuditDetail(row.id)
    currentDetail.value = data
    detailActiveTab.value = 'base'
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

async function handlePass(row: ChannelAuditItem) {
  const actionText = getPassButtonText(row)
  try {
    await ElMessageBox.confirm(`确定执行「${actionText}」操作吗？`, '确认审核', {
      type: 'warning',
    })
  } catch {
    return
  }

  submittingIds.value.push(row.id)
  try {
    if (row.auditStage === 1) {
      await channelDataPass(row.id)
    } else if (row.auditStage === 2) {
      await channelQualificationPass(row.id)
    } else if (row.auditStage === 3) {
      await channelPermissionPass(row.id)
    }
    ElMessage.success(`${actionText}成功`)
    if (currentDetail.value?.id === row.id) {
      const data = await getChannelAuditDetail(row.id)
      currentDetail.value = data
    }
    await Promise.all([fetchData(), loadStatistics()])
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submittingIds.value = submittingIds.value.filter((id) => id !== row.id)
  }
}

function openRejectDialog(row: ChannelAuditItem) {
  rejectRow.value = row
  rejectFormData.issueTypes = []
  rejectFormData.customRemark = ''
  rejectFormData.lockDays = 7
  rejectVisible.value = true
}

async function handleRejectSubmit() {
  if (!rejectFormRef.value || !rejectRow.value) return
  const row = rejectRow.value
  await rejectFormRef.value.validate(async (valid) => {
    if (!valid) return
    rejectSubmitting.value = true
    try {
      if (row.auditStage === 1) {
        await channelDataReject(row.id, { ...rejectFormData })
      } else if (row.auditStage === 2) {
        await channelQualificationReject(row.id, { ...rejectFormData })
      } else if (row.auditStage === 3) {
        await channelPermissionReject(row.id, { ...rejectFormData })
      }
      ElMessage.success('驳回成功')
      rejectVisible.value = false
      if (currentDetail.value?.id === row.id) {
        const data = await getChannelAuditDetail(row.id)
        currentDetail.value = data
      }
      await Promise.all([fetchData(), loadStatistics()])
    } catch (e: any) {
      ElMessage.error(e.message || '操作失败')
    } finally {
      rejectSubmitting.value = false
    }
  })
}

async function handleBatchPass(stage: 'data' | 'qualification' | 'permission') {
  try {
    await ElMessageBox.confirm(
      `确定批量通过选中的 ${selectedIds.value.length} 条记录吗？系统将自动过滤高风险主体渠道。`,
      '批量审核确认',
      { type: 'warning' }
    )
  } catch {
    return
  }

  batchSubmitting.value = true
  try {
    let result: BatchAuditResult
    if (stage === 'data') {
      result = await batchChannelDataPass(selectedIds.value)
    } else if (stage === 'qualification') {
      result = await batchChannelQualificationPass(selectedIds.value)
    } else {
      result = await batchChannelPermissionPass(selectedIds.value)
    }
    batchResult.value = result
    resultVisible.value = true
    clearSelection()
    await Promise.all([fetchData(), loadStatistics()])
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    batchSubmitting.value = false
  }
}

function openBatchRejectDialog(stage: 'data' | 'qualification' | 'permission') {
  batchRejectStage.value = stage
  batchRejectIds.value = [...selectedIds.value]
  batchRejectFormData.issueTypes = []
  batchRejectFormData.customRemark = ''
  batchRejectFormData.lockDays = 7
  batchRejectVisible.value = true
}

async function handleBatchRejectSubmit() {
  if (!batchRejectFormRef.value) return
  await batchRejectFormRef.value.validate(async (valid) => {
    if (!valid) return
    batchRejectSubmitting.value = true
    try {
      let result: BatchAuditResult
      const stage = batchRejectStage.value
      const data = { ...batchRejectFormData }
      if (stage === 'data') {
        result = await batchChannelDataReject(batchRejectIds.value, data)
      } else if (stage === 'qualification') {
        result = await batchChannelQualificationReject(batchRejectIds.value, data)
      } else {
        result = await batchChannelPermissionReject(batchRejectIds.value, data)
      }
      batchResult.value = result
      batchRejectVisible.value = false
      resultVisible.value = true
      clearSelection()
      await Promise.all([fetchData(), loadStatistics()])
    } catch (e: any) {
      ElMessage.error(e.message || '操作失败')
    } finally {
      batchRejectSubmitting.value = false
    }
  })
}

onMounted(() => {
  handleTabChange(activeTab.value)
  loadStatistics()
})
</script>

<style scoped lang="scss">
.channel-audit-page {
  .stat-cards {
    margin-bottom: 16px;

    .stat-card {
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &__label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 8px;
      }

      &__value {
        font-size: 28px;
        font-weight: 600;
        color: #303133;

        &.highlight {
          color: #409eff;
        }
      }

      &--success &__value {
        color: #67c23a;
      }

      &--danger &__value {
        color: #f56c6c;
      }
    }
  }

  .filter-card {
    .search-form {
      margin-bottom: 0;
    }
  }

  .code-text {
    font-family: monospace;
    color: #606266;
  }

  .text-muted {
    color: #909399;
    font-size: 12px;
  }

  .reject-count {
    color: #e6a23c;
    font-weight: 500;
    cursor: pointer;
  }

  .reject-hint {
    color: #606266;
    font-size: 13px;
  }

  .audit-steps {
    margin-bottom: 20px;
  }

  .detail-tabs {
    margin-top: 8px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    margin: 20px 0 12px;
    color: #303133;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }

  .qualification-list {
    .qualification-item {
      margin-bottom: 12px;

      &__label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
      }
    }

    .qualification-img {
      width: 100%;
      height: 140px;
      border-radius: 4px;
      border: 1px solid #ebeef5;
    }
  }

  .audit-timeline {
    padding: 8px 0;

    :deep(.el-timeline-item__content) {
      font-size: 13px;
    }
  }

  .timeline-item {
    &__title {
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    &__operator {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }

    &__desc {
      color: #606266;
    }
  }

  .reject-records {
    .reject-card {
      margin-bottom: 12px;
      border: 1px solid #fde2e2;
      background: #fef0f0;

      &__header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      &__stage {
        font-weight: 600;
        color: #f56c6c;
      }

      &__time {
        color: #909399;
        font-size: 12px;
      }

      &__issues {
        margin-bottom: 8px;
      }

      &__remark {
        font-size: 13px;
        color: #606266;
      }

      &__lock {
        margin-top: 8px;
        color: #e6a23c;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .lock-alert {
    margin-bottom: 16px;
  }

  .rectify-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #fef0f0;
      border-radius: 4px;
      margin-bottom: 8px;
      color: #f56c6c;
    }
  }

  .rectify-remark {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
    color: #606266;
    line-height: 1.6;
  }

  .detail-footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .form-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .result-stats {
    margin-bottom: 20px;

    .result-stat {
      text-align: center;
      padding: 16px;
      border-radius: 6px;

      &--total {
        background: #ecf5ff;
        .stat-num { color: #409eff; }
      }
      &--success {
        background: #f0f9eb;
        .stat-num { color: #67c23a; }
      }
      &--skipped {
        background: #fdf6ec;
        .stat-num { color: #e6a23c; }
      }
      &--failed {
        background: #fef0f0;
        .stat-num { color: #f56c6c; }
      }

      .stat-num {
        font-size: 32px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 13px;
        color: #606266;
      }
    }
  }

  .result-footer {
    margin-top: 20px;
    text-align: right;
  }
}
</style>

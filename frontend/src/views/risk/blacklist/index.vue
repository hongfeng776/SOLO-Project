<template>
  <div class="ccb-blacklist">
    <CcbPageHeader
      title="黑名单客户管控"
      description="黑名单客户的录入、审核、复核与管理"
      icon="UserFilled"
    />

    <div class="stat-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card success">
            <div class="stat-card-content">
              <div class="stat-card-icon">
                <el-icon :size="36" color="#67c23a"><User /></el-icon>
              </div>
              <div class="stat-card-info">
                <div class="stat-card-value">{{ statistics.active_count }}</div>
                <div class="stat-card-label">生效中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card warning">
            <div class="stat-card-content">
              <div class="stat-card-icon">
                <el-icon :size="36" color="#e6a23c"><Clock /></el-icon>
              </div>
              <div class="stat-card-info">
                <div class="stat-card-value">{{ statistics.pending_review_count }}</div>
                <div class="stat-card-label">待审核</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card danger">
            <div class="stat-card-content">
              <div class="stat-card-icon">
                <el-icon :size="36" color="#f56c6c"><Warning /></el-icon>
              </div>
              <div class="stat-card-info">
                <div class="stat-card-value">{{ statistics.expire_soon_count }}</div>
                <div class="stat-card-label">即将到期</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card info">
            <div class="stat-card-content">
              <div class="stat-card-icon">
                <el-icon :size="36" color="#909399"><Document /></el-icon>
              </div>
              <div class="stat-card-info">
                <div class="stat-card-value">{{ statistics.review_due_count }}</div>
                <div class="stat-card-label">待复核</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="客户信息" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="客户姓名/编号/身份证号" clearable />
      </el-form-item>
      <el-form-item label="黑名单编号" prop="blacklist_no">
        <el-input v-model="searchForm.blacklist_no" placeholder="请输入黑名单编号" clearable />
      </el-form-item>
      <el-form-item label="黑名单等级" prop="grade">
        <el-select v-model="searchForm.grade" placeholder="请选择等级" clearable>
          <el-option v-for="item in BlacklistGradeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in BlacklistStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="违规类型" prop="violation_type">
        <el-select v-model="searchForm.violation_type" placeholder="请选择违规类型" clearable>
          <el-option v-for="item in ViolationTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="到期提醒" prop="is_auto_remind">
        <el-select v-model="searchForm.is_auto_remind" placeholder="请选择" clearable>
          <el-option label="自动提醒" :value="1" />
          <el-option label="不提醒" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="录入时间" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <CcbPermissionButton
          label="前置校验"
          type="warning"
          :icon="Search"
          permission="blacklist:record:create"
          @click="openPreCheck"
        />
        <CcbPermissionButton
          label="录入黑名单"
          type="primary"
          :icon="Plus"
          permission="blacklist:record:create"
          @click="openCreateDialog"
        />
        <CcbPermissionButton
          label="刷新数据"
          type="success"
          :icon="Refresh"
          @click="fetchData"
        />
      </div>
      <div class="ccb-table-toolbar-right">
        <div class="grade-filter">
          <el-tag
            v-for="item in BlacklistGradeOptions"
            :key="item.value"
            :type="item.color"
            effect="dark"
            class="filter-tag"
            :class="{ active: searchForm.grade === item.value }"
            @click="filterByGrade(item.value)"
          >
            {{ item.label }}: {{ getGradeCount(item.value) }}
          </el-tag>
        </div>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="blacklist_no" label="黑名单编号" width="180" fixed="left" />
      <el-table-column prop="customer_name" label="客户姓名" width="100" />
      <el-table-column prop="customer_no" label="客户编号" width="140" />
      <el-table-column prop="grade" label="等级" width="120">
        <template #default="{ row }">
          <el-tag :type="getGradeColor(row.grade)" effect="dark" size="small">
            {{ row.grade_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusColor(row.status)" effect="light" size="small">
            {{ row.status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="violation_type_text" label="违规类型" width="120" />
      <el-table-column prop="evidence_count" label="证据数量" width="90" align="center" />
      <el-table-column prop="effective_date" label="生效日期" width="120" />
      <el-table-column prop="expire_date" label="到期日期" width="120">
        <template #default="{ row }">
          <span v-if="row.expire_date">
            {{ row.expire_date }}
            <el-tag v-if="row.remaining_days && row.remaining_days <= 7" type="danger" size="small" class="ml-2">
              {{ row.remaining_days }}天
            </el-tag>
          </span>
          <span v-else class="text-muted">永久</span>
        </template>
      </el-table-column>
      <el-table-column prop="next_review_date" label="下次复核" width="120" />
      <el-table-column prop="creator_name" label="录入人" width="100" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button
            v-if="row.status === 0"
            type="warning"
            link
            size="small"
            permission="blacklist:record:review"
            @click="openReviewDialog(row)"
          >
            审核
          </el-button>
          <el-button
            v-if="row.status === 1"
            type="danger"
            link
            size="small"
            permission="blacklist:record:remove"
            @click="openRemoveDialog(row)"
          >
            移除
          </el-button>
          <el-button
            v-if="row.status === 1 && row.grade !== 4"
            type="success"
            link
            size="small"
            permission="blacklist:record:update"
            @click="openExtendDialog(row)"
          >
            延期
          </el-button>
          <el-button
            v-if="row.status === 1"
            type="info"
            link
            size="small"
            permission="blacklist:record:update"
            @click="openGradeChangeDialog(row)"
          >
            调级
          </el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-drawer
      v-model="detailDrawerVisible"
      title="黑名单详情"
      size="900px"
      direction="rtl"
    >
      <div v-if="detailData" class="detail-content">
        <CcbDetailPanel :data="detailData" :items="detailItems" />

        <el-divider content-position="left">业务限制规则</el-divider>
        <div v-if="detailData.business_restrictions && detailData.business_restrictions.length > 0" class="restriction-list">
          <el-tag
            v-for="item in detailData.business_restrictions"
            :key="item.restriction_type"
            :type="item.is_enabled ? 'danger' : 'info'"
            effect="dark"
            class="restriction-tag"
          >
            {{ getRestrictionLabel(item.restriction_type) }} - {{ item.is_enabled ? '已启用' : '未启用' }}
          </el-tag>
        </div>
        <div v-else class="text-muted">无限制规则</div>

        <el-divider content-position="left">风控证据</el-divider>
        <div v-if="detailData.evidence_items && detailData.evidence_items.length > 0" class="evidence-list">
          <el-card
            v-for="(item, index) in detailData.evidence_items"
            :key="index"
            shadow="never"
            class="evidence-card"
          >
            <div class="evidence-header">
              <el-tag :type="getEvidenceTypeColor(item.evidence_type)" effect="dark" size="small">
                {{ getEvidenceTypeLabel(item.evidence_type) }}
              </el-tag>
              <span class="evidence-name">{{ item.evidence_name }}</span>
            </div>
            <div class="evidence-meta">
              <span v-if="item.evidence_no">凭证号: {{ item.evidence_no }}</span>
              <span v-if="item.upload_time">上传时间: {{ item.upload_time }}</span>
            </div>
          </el-card>
        </div>
        <div v-else class="text-muted">无证据材料</div>

        <el-divider content-position="left">关联溯源记录</el-divider>
        <el-table :data="traceData" size="small" max-height="300">
          <el-table-column prop="trace_type_text" label="操作类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getTraceTypeColor(row.trace_type)" effect="dark" size="small">
                {{ row.trace_type_text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operator_name" label="操作人" width="100" />
          <el-table-column prop="before_grade" label="变更前等级" width="110">
            <template #default="{ row }">
              <span v-if="row.before_grade">{{ getGradeLabel(row.before_grade) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="after_grade" label="变更后等级" width="110">
            <template #default="{ row }">
              <span v-if="row.after_grade">{{ getGradeLabel(row.after_grade) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="is_compliant" label="合规性" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_compliant === 1 ? 'success' : 'danger'" effect="light" size="small">
                {{ row.is_compliant === 1 ? '合规' : '异常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
          <el-table-column prop="created_at" label="时间" width="160" />
        </el-table>
      </div>
    </el-drawer>

    <el-dialog
      v-model="createDialogVisible"
      title="录入黑名单"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="客户选择" prop="customer_id">
          <el-input v-model="createForm.customer_name" placeholder="请输入客户姓名搜索" readonly style="width: 60%" />
          <el-button type="primary" @click="openCustomerSelect">选择客户</el-button>
        </el-form-item>
        <el-form-item label="违规类型" prop="violation_type">
          <el-select v-model="createForm.violation_type" placeholder="请选择违规类型" style="width: 100%">
            <el-option v-for="item in ViolationTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规级别" prop="violation_level">
          <el-select v-model="createForm.violation_level" placeholder="请选择违规级别" style="width: 100%">
            <el-option label="轻微" :value="1" />
            <el-option label="一般" :value="2" />
            <el-option label="严重" :value="3" />
            <el-option label="特别严重" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="黑名单等级" prop="grade">
          <el-select v-model="createForm.grade" placeholder="请选择黑名单等级" style="width: 100%">
            <el-option v-for="item in BlacklistGradeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入违规描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="生效日期" prop="effective_date">
          <el-date-picker
            v-model="createForm.effective_date"
            type="date"
            placeholder="请选择生效日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="createForm.grade !== 4" label="到期日期" prop="expire_date">
          <el-date-picker
            v-model="createForm.expire_date"
            type="date"
            placeholder="请选择到期日期（不选则按默认时长）"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="到期提醒" prop="auto_remind">
          <el-switch v-model="createForm.auto_remind" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-muted">到期前7天自动提醒复核</span>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" placeholder="请输入备注" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>

      <div v-if="preCheckResult && !preCheckResult.passed" class="precheck-error">
        <el-alert
          v-for="(reason, index) in preCheckResult.failed_reasons"
          :key="index"
          :title="reason"
          type="error"
          :closable="false"
          show-icon
          class="mb-2"
        />
        <el-checkbox v-model="createForm.force">强制录入（不推荐）</el-checkbox>
      </div>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreateSubmit">
          确认录入
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reviewDialogVisible"
      title="审核黑名单"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="reviewForm" :rules="reviewRules" ref="reviewFormRef" label-width="100px">
        <el-form-item label="黑名单编号">
          <span>{{ currentRecord?.blacklist_no }}</span>
        </el-form-item>
        <el-form-item label="客户姓名">
          <span>{{ currentRecord?.customer_name }}</span>
        </el-form-item>
        <el-form-item label="黑名单等级">
          <span>{{ getGradeLabel(currentRecord?.grade || 0) }}</span>
        </el-form-item>
        <el-form-item label="审核结果" prop="review_result">
          <el-radio-group v-model="reviewForm.review_result">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见" prop="review_opinion">
          <el-input
            v-model="reviewForm.review_opinion"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleReviewSubmit">
          确认审核
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="removeDialogVisible"
      title="移除黑名单"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="移除黑名单将解除该客户名下的所有业务限制，请谨慎操作"
        type="warning"
        :closable="false"
        show-icon
        class="mb-4"
      />
      <el-form :model="removeForm" :rules="removeRules" ref="removeFormRef" label-width="100px">
        <el-form-item label="黑名单编号">
          <span>{{ currentRecord?.blacklist_no }}</span>
        </el-form-item>
        <el-form-item label="客户姓名">
          <span>{{ currentRecord?.customer_name }}</span>
        </el-form-item>
        <el-form-item label="移除原因" prop="remove_reason">
          <el-input
            v-model="removeForm.remove_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入移除原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="整改完成" prop="release_conditions_met">
          <el-switch v-model="removeForm.release_conditions_met" />
          <span class="ml-2 text-muted">确认违规事项已整改完毕</span>
        </el-form-item>
      </el-form>

      <div v-if="removeCheckResult && !removeCheckResult.passed" class="precheck-error">
        <el-alert
          v-for="(reason, index) in removeCheckResult.failed_reasons"
          :key="index"
          :title="reason"
          type="error"
          :closable="false"
          show-icon
          class="mb-2"
        />
        <el-checkbox v-model="removeForm.force">强制移除（不推荐）</el-checkbox>
      </div>

      <template #footer>
        <el-button @click="removeDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="handleRemoveSubmit">
          确认移除
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="extendDialogVisible"
      title="黑名单延期"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="extendForm" :rules="extendRules" ref="extendFormRef" label-width="100px">
        <el-form-item label="黑名单编号">
          <span>{{ currentRecord?.blacklist_no }}</span>
        </el-form-item>
        <el-form-item label="当前到期日期">
          <span>{{ currentRecord?.expire_date }}</span>
        </el-form-item>
        <el-form-item label="延期天数" prop="extend_days">
          <el-input-number
            v-model="extendForm.extend_days"
            :min="1"
            :max="365"
            style="width: 100%"
          />
          <div class="form-tip">新到期日期: {{ getNewExpireDate() }}</div>
        </el-form-item>
        <el-form-item label="延期原因" prop="extend_reason">
          <el-input
            v-model="extendForm.extend_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入延期原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="extendDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleExtendSubmit">
          确认延期
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="gradeChangeDialogVisible"
      title="调整黑名单等级"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="gradeChangeForm" :rules="gradeChangeRules" ref="gradeChangeFormRef" label-width="100px">
        <el-form-item label="黑名单编号">
          <span>{{ currentRecord?.blacklist_no }}</span>
        </el-form-item>
        <el-form-item label="当前等级">
          <el-tag :type="getGradeColor(currentRecord?.grade || 0)" effect="dark">
            {{ getGradeLabel(currentRecord?.grade || 0) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="目标等级" prop="target_grade">
          <el-select v-model="gradeChangeForm.target_grade" placeholder="请选择目标等级" style="width: 100%">
            <el-option v-for="item in BlacklistGradeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因" prop="change_reason">
          <el-input
            v-model="gradeChangeForm.change_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="gradeChangeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleGradeChangeSubmit">
          确认调整
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="preCheckDialogVisible"
      title="前置校验"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="preCheckForm" label-width="100px">
        <el-form-item label="客户选择">
          <el-input v-model="preCheckForm.customer_name" placeholder="请输入客户姓名搜索" readonly style="width: 60%" />
          <el-button type="primary" @click="openCustomerSelectForPreCheck">选择客户</el-button>
        </el-form-item>
      </el-form>

      <div v-if="preCheckResult" class="precheck-result">
        <el-alert
          :title="preCheckResult.passed ? '前置校验通过，可以加入黑名单' : '前置校验未通过'"
          :type="preCheckResult.passed ? 'success' : 'error'"
          :closable="false"
          show-icon
          class="mb-4"
        />

        <el-divider content-position="left">违规记录 ({{ preCheckResult.violation_records.length }})</el-divider>
        <div v-if="preCheckResult.violation_records.length > 0" class="list-box">
          <div v-for="(record, index) in preCheckResult.violation_records" :key="index" class="list-item">
            <span class="item-label">{{ record.violation_type_text }}</span>
            <span class="item-value">{{ record.description }}</span>
          </div>
        </div>
        <div v-else class="text-muted">无违规记录</div>

        <el-divider content-position="left">证据材料 ({{ preCheckResult.evidence_items.length }})</el-divider>
        <div v-if="preCheckResult.evidence_items.length > 0" class="list-box">
          <div v-for="(item, index) in preCheckResult.evidence_items" :key="index" class="list-item">
            <el-tag :type="getEvidenceTypeColor(item.evidence_type)" effect="dark" size="small" class="mr-2">
              {{ getEvidenceTypeLabel(item.evidence_type) }}
            </el-tag>
            <span>{{ item.evidence_name }}</span>
          </div>
        </div>
        <div v-else class="text-muted">无证据材料</div>

        <el-divider content-position="left">缺失证据</el-divider>
        <div v-if="preCheckResult.missing_evidence.length > 0" class="list-box">
          <div v-for="(item, index) in preCheckResult.missing_evidence" :key="index" class="list-item warning">
            <el-icon color="#e6a23c"><Warning /></el-icon>
            <span>{{ item }}</span>
          </div>
        </div>
        <div v-else class="text-muted">无缺失证据</div>

        <el-divider content-position="left">账户与业务状态</el-divider>
        <el-table :data="preCheckResult.business_statuses" size="small">
          <el-table-column prop="account_no" label="账户编号" width="160" />
          <el-table-column prop="account_type" label="账户类型" width="100" />
          <el-table-column prop="account_status" label="账户状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.account_status === 1 ? 'success' : 'danger'" effect="light" size="small">
                {{ row.account_status === 1 ? '正常' : '异常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="is_locked" label="锁定状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_locked ? 'danger' : 'success'" effect="light" size="small">
                {{ row.is_locked ? '已锁' : '未锁' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="preCheckDialogVisible = false">关闭</el-button>
        <el-button
          v-if="preCheckResult && preCheckResult.passed"
          type="primary"
          @click="continueToCreateFromPreCheck"
        >
          继续录入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Refresh, Search, User, Clock, Warning, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import dayjs from 'dayjs'
import {
  getBlacklistList,
  getBlacklistDetail,
  createBlacklist,
  reviewBlacklist,
  removeBlacklist,
  extendBlacklist,
  changeBlacklistGrade,
  checkBlacklistCompliance,
  getBlacklistTraces,
  getBlacklistStatistics,
  preCheckBlacklist,
  BlacklistGradeOptions,
  BlacklistStatusOptions,
  ViolationTypeOptions,
  BusinessRestrictionOptions,
  EvidenceTypeOptions,
  BlacklistTraceTypeOptions,
  type BlacklistRecord,
  type BlacklistTrace,
  type BlacklistStatistics,
  type PreCheckResult
} from '@api/blacklist'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<BlacklistRecord[]>([])
const total = ref(0)
const selectedRows = ref<BlacklistRecord[]>([])
const statistics = ref<BlacklistStatistics>({
  total_count: 0,
  active_count: 0,
  pending_review_count: 0,
  expired_count: 0,
  removed_count: 0,
  temporary_count: 0,
  short_term_count: 0,
  long_term_count: 0,
  permanent_count: 0,
  today_add_count: 0,
  today_remove_count: 0,
  expire_soon_count: 0,
  review_due_count: 0,
  grade_distribution: [],
  violation_type_distribution: []
})

const searchForm = reactive({
  keyword: '',
  blacklist_no: '',
  grade: undefined as number | undefined,
  status: undefined as number | undefined,
  violation_type: undefined as number | undefined,
  is_auto_remind: undefined as number | undefined,
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 20
})

const detailDrawerVisible = ref(false)
const detailData = ref<BlacklistRecord | null>(null)
const traceData = ref<BlacklistTrace[]>([])

const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  customer_id: '',
  customer_name: '',
  violation_type: undefined as number | undefined,
  violation_level: undefined as number | undefined,
  grade: undefined as number | undefined,
  description: '',
  effective_date: dayjs().format('YYYY-MM-DD'),
  expire_date: '',
  auto_remind: 1,
  remark: '',
  force: false
})

const createRules: FormRules = {
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  violation_type: [{ required: true, message: '请选择违规类型', trigger: 'change' }],
  violation_level: [{ required: true, message: '请选择违规级别', trigger: 'change' }],
  grade: [{ required: true, message: '请选择黑名单等级', trigger: 'change' }],
  description: [{ required: true, message: '请输入违规描述', trigger: 'blur' }],
  effective_date: [{ required: true, message: '请选择生效日期', trigger: 'change' }]
}

const reviewDialogVisible = ref(false)
const reviewFormRef = ref<FormInstance>()
const reviewForm = reactive({
  review_result: undefined as number | undefined,
  review_opinion: ''
})

const reviewRules: FormRules = {
  review_result: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  review_opinion: [{ required: true, message: '请输入审核意见', trigger: 'blur' }]
}

const removeDialogVisible = ref(false)
const removeFormRef = ref<FormInstance>()
const removeForm = reactive({
  remove_reason: '',
  release_conditions_met: false,
  force: false
})

const removeRules: FormRules = {
  remove_reason: [{ required: true, message: '请输入移除原因', trigger: 'blur' }],
  release_conditions_met: [{ validator: (_, value, callback) => {
    if (!value) return callback(new Error('请确认整改完成'))
    callback()
  }, trigger: 'change' }]
}

const extendDialogVisible = ref(false)
const extendFormRef = ref<FormInstance>()
const extendForm = reactive({
  extend_days: 30,
  extend_reason: ''
})

const extendRules: FormRules = {
  extend_days: [{ required: true, message: '请输入延期天数', trigger: 'blur' }],
  extend_reason: [{ required: true, message: '请输入延期原因', trigger: 'blur' }]
}

const gradeChangeDialogVisible = ref(false)
const gradeChangeFormRef = ref<FormInstance>()
const gradeChangeForm = reactive({
  target_grade: undefined as number | undefined,
  change_reason: '',
  force: false
})

const gradeChangeRules: FormRules = {
  target_grade: [{ required: true, message: '请选择目标等级', trigger: 'change' }],
  change_reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

const preCheckDialogVisible = ref(false)
const preCheckForm = reactive({
  customer_id: '',
  customer_name: ''
})

const preCheckResult = ref<PreCheckResult | null>(null)
const removeCheckResult = ref<any>(null)
const currentRecord = ref<BlacklistRecord | null>(null)

const detailItems = [
  { prop: 'blacklist_no', label: '黑名单编号', span: 2 },
  { prop: 'customer_no', label: '客户编号' },
  { prop: 'customer_name', label: '客户姓名' },
  { prop: 'grade_text', label: '黑名单等级' },
  { prop: 'status_text', label: '状态' },
  { prop: 'violation_type_text', label: '违规类型' },
  { prop: 'evidence_count', label: '证据数量' },
  { prop: 'effective_date', label: '生效日期', type: 'date' as const },
  { prop: 'expire_date', label: '到期日期', type: 'date' as const },
  { prop: 'remaining_days', label: '剩余天数' },
  { prop: 'auto_remind', label: '自动提醒', type: 'boolean' as const },
  { prop: 'review_count', label: '复核次数' },
  { prop: 'next_review_date', label: '下次复核日期', type: 'date' as const },
  { prop: 'description', label: '违规描述', span: 2 },
  { prop: 'creator_name', label: '录入人' },
  { prop: 'created_at', label: '录入时间', type: 'datetime' as const },
  { prop: 'reviewer_name', label: '审核人' },
  { prop: 'review_time', label: '审核时间', type: 'datetime' as const },
  { prop: 'review_opinion', label: '审核意见', span: 2 },
  { prop: 'remover_name', label: '移除人' },
  { prop: 'remove_time', label: '移除时间', type: 'datetime' as const },
  { prop: 'remove_reason', label: '移除原因', span: 2 },
  { prop: 'violation_details', label: '违规详情', span: 2 }
]

const getGradeLabel = (grade: number) => {
  const item = BlacklistGradeOptions.find(i => i.value === grade)
  return item?.label || '-'
}

const getGradeColor = (grade: number) => {
  const item = BlacklistGradeOptions.find(i => i.value === grade)
  return item?.color || 'info'
}

const getStatusColor = (status: number) => {
  const item = BlacklistStatusOptions.find(i => i.value === status)
  return item?.color || 'info'
}

const getEvidenceTypeLabel = (type: number) => {
  const item = EvidenceTypeOptions.find(i => i.value === type)
  return item?.label || '-'
}

const getEvidenceTypeColor = (type: number) => {
  const colors: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    4: 'danger',
    5: 'info'
  }
  return colors[type] || 'info'
}

const getRestrictionLabel = (type: number) => {
  const item = BusinessRestrictionOptions.find(i => i.value === type)
  return item?.label || '-'
}

const getTraceTypeColor = (type: number) => {
  const item = BlacklistTraceTypeOptions.find(i => i.value === type)
  return item?.color || 'info'
}

const getGradeCount = (grade: number) => {
  const dist = statistics.value.grade_distribution || []
  const item = dist.find(i => i.grade === grade)
  return item?.count || 0
}

const getNewExpireDate = () => {
  if (!currentRecord.value?.expire_date || !extendForm.extend_days) return '-'
  return dayjs(currentRecord.value.expire_date).add(extendForm.extend_days, 'day').format('YYYY-MM-DD')
}

const fetchStatistics = async () => {
  try {
    const res = await getBlacklistStatistics()
    statistics.value = res.data
  } catch (error: any) {
    console.error('获取统计数据失败', error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.keyword || undefined,
      blacklist_no: searchForm.blacklist_no || undefined,
      grade: searchForm.grade,
      status: searchForm.status,
      violation_type: searchForm.violation_type,
      is_auto_remind: searchForm.is_auto_remind
    }

    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_date = searchForm.timeRange[0]
      params.end_date = searchForm.timeRange[1]
    }

    const res = await getBlacklistList(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.blacklist_no = ''
  searchForm.grade = undefined
  searchForm.status = undefined
  searchForm.violation_type = undefined
  searchForm.is_auto_remind = undefined
  searchForm.timeRange = []
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (rows: BlacklistRecord[]) => {
  selectedRows.value = rows
}

const filterByGrade = (grade: number) => {
  if (searchForm.grade === grade) {
    searchForm.grade = undefined
  } else {
    searchForm.grade = grade
  }
  handleSearch()
}

const handleView = async (row: BlacklistRecord) => {
  try {
    const res = await getBlacklistDetail(row.id)
    detailData.value = res.data
    detailDrawerVisible.value = true

    const traceRes = await getBlacklistTraces(row.id)
    traceData.value = traceRes.data || []
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败')
  }
}

const openCreateDialog = () => {
  createForm.customer_id = ''
  createForm.customer_name = ''
  createForm.violation_type = undefined
  createForm.violation_level = undefined
  createForm.grade = undefined
  createForm.description = ''
  createForm.effective_date = dayjs().format('YYYY-MM-DD')
  createForm.expire_date = ''
  createForm.auto_remind = 1
  createForm.remark = ''
  createForm.force = false
  preCheckResult.value = null
  createDialogVisible.value = true
}

const openCustomerSelect = () => {
  ElMessage.info('请集成客户选择组件')
  createForm.customer_id = 'mock_customer_' + Date.now()
  createForm.customer_name = '测试客户'
  runPreCheckForCreate()
}

const openCustomerSelectForPreCheck = () => {
  ElMessage.info('请集成客户选择组件')
  preCheckForm.customer_id = 'mock_customer_' + Date.now()
  preCheckForm.customer_name = '测试客户'
  runPreCheck()
}

const runPreCheck = async () => {
  if (!preCheckForm.customer_id) return
  try {
    const res = await preCheckBlacklist(preCheckForm.customer_id)
    preCheckResult.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '前置校验失败')
  }
}

const runPreCheckForCreate = async () => {
  if (!createForm.customer_id) return
  try {
    const res = await preCheckBlacklist(createForm.customer_id)
    preCheckResult.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '前置校验失败')
  }
}

const openPreCheck = () => {
  preCheckForm.customer_id = ''
  preCheckForm.customer_name = ''
  preCheckResult.value = null
  preCheckDialogVisible.value = true
}

const continueToCreateFromPreCheck = () => {
  createForm.customer_id = preCheckForm.customer_id
  createForm.customer_name = preCheckForm.customer_name
  preCheckDialogVisible.value = false
  createDialogVisible.value = true
}

const handleCreateSubmit = async () => {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    await createBlacklist({
      customer_id: createForm.customer_id,
      violation_type: createForm.violation_type!,
      violation_level: createForm.violation_level!,
      grade: createForm.grade!,
      description: createForm.description,
      effective_date: createForm.effective_date,
      expire_date: createForm.expire_date || undefined,
      auto_remind: createForm.auto_remind,
      remark: createForm.remark || undefined,
      force: createForm.force || undefined
    })
    ElMessage.success('录入成功')
    createDialogVisible.value = false
    fetchData()
    fetchStatistics()
  } catch (error: any) {
    ElMessage.error(error.message || '录入失败')
  } finally {
    submitting.value = false
  }
}

const openReviewDialog = (row: BlacklistRecord) => {
  currentRecord.value = row
  reviewForm.review_result = undefined
  reviewForm.review_opinion = ''
  reviewDialogVisible.value = true
}

const handleReviewSubmit = async () => {
  if (!reviewFormRef.value || !currentRecord.value) return
  try {
    await reviewFormRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    await reviewBlacklist(currentRecord.value.id, {
      review_result: reviewForm.review_result!,
      review_opinion: reviewForm.review_opinion
    })
    ElMessage.success('审核成功')
    reviewDialogVisible.value = false
    fetchData()
    fetchStatistics()
  } catch (error: any) {
    ElMessage.error(error.message || '审核失败')
  } finally {
    submitting.value = false
  }
}

const openRemoveDialog = async (row: BlacklistRecord) => {
  currentRecord.value = row
  removeForm.remove_reason = ''
  removeForm.release_conditions_met = false
  removeForm.force = false
  removeCheckResult.value = null

  try {
    const res = await checkBlacklistCompliance(row.id, 2)
    if (!res.data.passed) {
      removeCheckResult.value = res.data
    }
  } catch (error: any) {
    console.error('合规校验失败', error)
  }

  removeDialogVisible.value = true
}

const handleRemoveSubmit = async () => {
  if (!removeFormRef.value || !currentRecord.value) return
  try {
    await removeFormRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    await removeBlacklist(currentRecord.value.id, {
      remove_reason: removeForm.remove_reason,
      release_conditions_met: removeForm.release_conditions_met,
      force: removeForm.force || undefined
    })
    ElMessage.success('移除成功')
    removeDialogVisible.value = false
    fetchData()
    fetchStatistics()
  } catch (error: any) {
    ElMessage.error(error.message || '移除失败')
  } finally {
    submitting.value = false
  }
}

const openExtendDialog = (row: BlacklistRecord) => {
  currentRecord.value = row
  extendForm.extend_days = 30
  extendForm.extend_reason = ''
  extendDialogVisible.value = true
}

const handleExtendSubmit = async () => {
  if (!extendFormRef.value || !currentRecord.value) return
  try {
    await extendFormRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    await extendBlacklist(currentRecord.value.id, {
      extend_days: extendForm.extend_days,
      extend_reason: extendForm.extend_reason
    })
    ElMessage.success('延期成功')
    extendDialogVisible.value = false
    fetchData()
    fetchStatistics()
  } catch (error: any) {
    ElMessage.error(error.message || '延期失败')
  } finally {
    submitting.value = false
  }
}

const openGradeChangeDialog = (row: BlacklistRecord) => {
  currentRecord.value = row
  gradeChangeForm.target_grade = undefined
  gradeChangeForm.change_reason = ''
  gradeChangeForm.force = false
  gradeChangeDialogVisible.value = true
}

const handleGradeChangeSubmit = async () => {
  if (!gradeChangeFormRef.value || !currentRecord.value) return
  try {
    await gradeChangeFormRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    await changeBlacklistGrade(currentRecord.value.id, {
      target_grade: gradeChangeForm.target_grade!,
      change_reason: gradeChangeForm.change_reason,
      force: gradeChangeForm.force || undefined
    })
    ElMessage.success('等级调整成功')
    gradeChangeDialogVisible.value = false
    fetchData()
    fetchStatistics()
  } catch (error: any) {
    ElMessage.error(error.message || '等级调整失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchStatistics()
})
</script>

<style scoped lang="scss">
.ccb-blacklist {
  .stat-cards {
    margin-bottom: 16px;

    .stat-card {
      border-radius: 8px;

      .stat-card-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .stat-card-icon {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(103, 194, 58, 0.1);
      }

      &.success .stat-card-icon {
        background: rgba(103, 194, 58, 0.1);
      }

      &.warning .stat-card-icon {
        background: rgba(230, 162, 60, 0.1);
      }

      &.danger .stat-card-icon {
        background: rgba(245, 108, 108, 0.1);
      }

      &.info .stat-card-icon {
        background: rgba(144, 147, 153, 0.1);
      }

      .stat-card-info {
        text-align: right;
      }

      .stat-card-value {
        font-size: 28px;
        font-weight: bold;
        line-height: 1.2;
      }

      .stat-card-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .grade-filter {
    display: flex;
    gap: 8px;

    .filter-tag {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.05);
      }

      &.active {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .detail-content {
    padding: 0 10px;
  }

  .restriction-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .restriction-tag {
      font-size: 13px;
    }
  }

  .evidence-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .evidence-card {
      border: 1px solid #ebeef5;
      border-radius: 4px;

      .evidence-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .evidence-name {
        font-weight: 500;
      }

      .evidence-meta {
        display: flex;
        gap: 20px;
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .precheck-error {
    margin-top: 16px;
    padding: 12px;
    background: #fef0f0;
    border-radius: 4px;
  }

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
  }

  .precheck-result {
    margin-top: 16px;
  }

  .list-box {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .list-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #f5f7fa;
      border-radius: 4px;

      .item-label {
        font-weight: 500;
        min-width: 100px;
      }

      &.warning {
        background: #fdf6ec;
        color: #e6a23c;
      }
    }
  }

  .text-muted {
    color: #909399;
    font-size: 13px;
  }

  .ml-2 {
    margin-left: 8px;
  }

  .mr-2 {
    margin-right: 8px;
  }

  .mb-2 {
    margin-bottom: 8px;
  }

  .mb-4 {
    margin-bottom: 16px;
  }
}
</style>

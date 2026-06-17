<template>
  <div class="company-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="企业名称" prop="name">
        <el-input v-model="searchForm.name" placeholder="请输入企业名称" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="所属行业" prop="industry">
        <el-select v-model="searchForm.industry" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="item in INDUSTRY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="企业规模" prop="scale">
        <el-select v-model="searchForm.scale" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="item in SCALE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="招聘状态" prop="recruitStatus">
        <el-select v-model="searchForm.recruitStatus" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="item in RECRUIT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </SearchForm>

    <ProTable
      ref="proTableRef"
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      show-selection
      highlight-current-row
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @row-click="handleRowClick"
    >
      <template #toolbar>
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增企业</el-button>
          <el-button type="primary" :icon="Edit" :disabled="selectedIds.length === 0" @click="showBatchUpdate = true">
            批量修改
          </el-button>
          <el-button type="primary" :icon="Document" @click="showChangeLogs = true">变更记录</el-button>
          <el-button type="danger" :icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </template>

      <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
      <el-table-column prop="name" label="企业名称" min-width="180" fixed="left" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="name-cell">
            <span>{{ row.name }}</span>
            <el-tag
              v-if="row.changeAuditStatus === 'pending'"
              type="warning"
              size="small"
              effect="plain"
              class="ml-sm"
            >待审核</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="shortName" label="简称" width="120" />
      <el-table-column prop="industry" label="行业" width="120" />
      <el-table-column prop="scale" label="规模" width="110" />
      <el-table-column prop="officeAddress" label="办公地址" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tooltip v-if="(row.officeAddress || row.address || '').length > 10" :content="row.officeAddress || row.address || '-'">
            {{ (row.officeAddress || row.address || '').substring(0, 10) }}...
          </el-tooltip>
          <span v-else>{{ row.officeAddress || row.address || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="contactPerson" label="联系人" width="90" />
      <el-table-column prop="contactPhone" label="联系电话" width="130" />
      <el-table-column label="招聘状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="RecruitStatusType[row.recruitStatus as RecruitStatus]" size="small">
            {{ RecruitStatusLabel[row.recruitStatus as RecruitStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="资质审核" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isQualificationApproved ? 'success' : 'warning'" size="small">
            {{ row.isQualificationApproved ? '已通过' : '未通过' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column label="操作" width="280" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click.stop="handleView(row)">查看</el-button>
          <el-button type="primary" link size="small" @click.stop="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.changeAuditStatus === 'pending' && isAdmin"
            type="success" link size="small"
            @click.stop="handleApprove(row)"
          >审核通过</el-button>
          <el-button
            v-if="row.changeAuditStatus === 'pending' && isAdmin"
            type="warning" link size="small"
            @click.stop="handleReject(row)"
          >审核驳回</el-button>
          <el-button type="danger" link size="small" @click.stop="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </ProTable>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <div v-if="isEdit && !qualificationApproved" class="qualification-block">
        <el-alert
          title="该企业资质未审核通过，无法编辑基础信息"
          type="error"
          :closable="false"
          show-icon
          class="mb-base"
        />
      </div>

      <div v-if="isEdit && formData.changeAuditStatus === 'pending' && !isAdmin" class="pending-block">
        <el-alert
          title="该企业有变更正在审核中，请等待审核完成后再操作"
          type="warning"
          :closable="false"
          show-icon
          class="mb-base"
        />
      </div>

      <div v-if="isAdmin && isEdit && formData.changeAuditStatus === 'pending' && formData.pendingChanges" class="pending-block">
        <el-alert type="info" :closable="false" show-icon class="mb-base">
          <template #title>有HR提交的变更待审核</template>
          <template #default>
            <div>变更内容：{{ getPendingChangesSummary() }}</div>
            <div class="pending-actions">
              <el-button type="success" size="small" @click="handleApprove(formData)">通过</el-button>
              <el-button type="warning" size="small" @click="handleReject(formData)">驳回</el-button>
            </div>
          </template>
        </el-alert>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        :disabled="(isEdit && !qualificationApproved) || (isEdit && formData.changeAuditStatus === 'pending' && !isAdmin)"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="企业名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入企业名称"
                class="custom-input"
                @focus="handleInputFocus($event)"
                @blur="handleInputBlur($event)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企业简称" prop="shortName">
              <el-input
                v-model="formData.shortName"
                placeholder="请输入企业简称"
                class="custom-input"
                @focus="handleInputFocus($event)"
                @blur="handleInputBlur($event)"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属行业" prop="industry">
              <el-select
                v-model="formData.industry"
                placeholder="请选择"
                style="width: 100%"
                class="custom-input"
                @focus="handleInputFocus($event)"
                @blur="handleInputBlur($event)"
                @change="handleIndustryChange"
              >
                <el-option v-for="item in INDUSTRY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企业规模" prop="scale">
              <el-select
                v-model="formData.scale"
                placeholder="请选择"
                style="width: 100%"
                class="custom-input"
                @focus="handleInputFocus($event)"
                @blur="handleInputBlur($event)"
                @change="handleScaleChange"
              >
                <el-option v-for="item in SCALE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="企业性质" prop="nature">
              <el-select
                v-model="formData.nature"
                placeholder="请选择"
                style="width: 100%"
                class="custom-input"
                @focus="handleInputFocus($event)"
                @blur="handleInputBlur($event)"
              >
                <el-option v-for="item in NATURE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="招聘状态" prop="recruitStatus">
              <el-select
                v-model="formData.recruitStatus"
                placeholder="请选择"
                style="width: 100%"
                class="custom-input"
                @focus="handleInputFocus($event)"
                @blur="handleInputBlur($event)"
              >
                <el-option v-for="item in RECRUIT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="注册地址" prop="address">
          <el-input
            v-model="formData.address"
            placeholder="请输入注册地址"
            class="custom-input"
            @focus="handleInputFocus($event)"
            @blur="handleInputBlur($event); handleValidate"
          />
        </el-form-item>
        <el-form-item label="办公地址" prop="officeAddress">
          <el-input
            v-model="formData.officeAddress"
            placeholder="请输入办公地址"
            class="custom-input"
            @focus="handleInputFocus($event)"
            @blur="handleInputBlur($event); handleValidate"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input
                v-model="formData.contactPerson"
                placeholder="请输入联系人"
                class="custom-input"
                @focus="handleInputFocus($event)"
                @blur="handleInputBlur($event)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input
                v-model="formData.contactPhone"
                placeholder="请输入联系电话"
                class="custom-input"
                @focus="handleInputFocus($event)"
                @blur="handleInputBlur($event); handleValidate"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input
                v-model="formData.contactEmail"
                placeholder="请输入联系邮箱"
                class="custom-input"
                @focus="handleInputFocus($event)"
                @blur="handleInputBlur($event)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number
                v-model="formData.sort"
                :min="0"
                :max="999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="资质审核通过">
              <el-tag :type="formData.isQualificationApproved ? 'success' : 'warning'">
                {{ formData.isQualificationApproved ? '已通过' : '未通过' }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="企业简介" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入企业简介"
            class="custom-input"
            @focus="handleInputFocus($event)"
            @blur="handleInputBlur($event)"
          />
        </el-form-item>

        <div v-if="matchedCategories.length > 0 && formData.industry" class="matched-info">
          <el-alert type="info" :closable="false" class="mb-base">
            <template #title>行业匹配的可招聘岗位分类</template>
            <template #default>
              <div class="category-list">
                <el-tag
                  v-for="cat in matchedCategories"
                  :key="cat"
                  type="info"
                  effect="plain"
                  class="mr-sm"
                >{{ JobCategoryLabel[cat as JobCategory] }}</el-tag>
              </div>
            </template>
          </el-alert>
        </div>

        <div v-if="matchedRecruitRange.length > 0 && formData.scale" class="matched-info">
          <el-alert type="info" :closable="false">
            <template #title>规模匹配的招聘范围</template>
            <template #default>
              <span>{{ matchedRecruitRange.join('、') }}</span>
            </template>
          </el-alert>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          :disabled="(isEdit && !qualificationApproved) || (isEdit && formData.changeAuditStatus === 'pending' && !isAdmin)"
          @click="handleSubmit"
        >
          {{ isEdit ? (isAdmin ? '更新' : '提交审核') : '提交' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="企业详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="企业名称" :span="2">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="企业简称">{{ detailData.shortName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所属行业">{{ detailData.industry || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业规模">{{ detailData.scale || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企业性质">{{ detailData.nature || '-' }}</el-descriptions-item>
        <el-descriptions-item label="招聘状态">
          <el-tag :type="RecruitStatusType[detailData.recruitStatus as RecruitStatus]">
            {{ RecruitStatusLabel[detailData.recruitStatus as RecruitStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册地址" :span="2">{{ detailData.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="办公地址" :span="2">{{ detailData.officeAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailData.contactPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailData.contactPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系邮箱">{{ detailData.contactEmail || '-' }}</el-descriptions-item>
        <el-descriptions-item label="资质审核">
          <el-tag :type="detailData.isQualificationApproved ? 'success' : 'warning'">
            {{ detailData.isQualificationApproved ? '已通过' : '未通过' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'">
            {{ detailData.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="变更审核状态" v-if="detailData.changeAuditStatus">
          <el-tag :type="AuditStatusType[detailData.changeAuditStatus]">
            {{ AuditStatusLabel[detailData.changeAuditStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="变更提交人" v-if="detailData.changeOperatorName">
          {{ detailData.changeOperatorName }}
        </el-descriptions-item>
        <el-descriptions-item label="企业简介" :span="2">
          {{ detailData.description || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="changeLogs.length > 0" class="change-logs-section mt-lg">
        <h4 class="logs-title">变更历史记录</h4>
        <el-timeline>
          <el-timeline-item
            v-for="log in changeLogs"
            :key="log.id"
            :timestamp="log.created_at"
            placement="top"
          >
            <div class="log-card">
              <div class="log-header">
                <el-tag size="small" :type="AuditStatusType[log.auditStatus || 'approved']">
                  {{ CompanyChangeActionLabel[log.action as CompanyChangeAction] || log.action }}
                </el-tag>
                <span class="log-operator">{{ log.operatorName || '系统' }}</span>
                <span v-if="log.auditStatus" class="log-audit">
                  审核：<el-tag size="small" :type="AuditStatusType[log.auditStatus]">
                    {{ AuditStatusLabel[log.auditStatus] }}
                  </el-tag>
                </span>
              </div>
              <div class="log-fields">变更字段：{{ log.changedFields || '-' }}</div>
              <div v-if="log.auditRemark" class="log-remark">审核备注：{{ log.auditRemark }}</div>
              <el-collapse v-if="log.oldValues && log.newValues" class="log-collapse">
                <el-collapse-item title="查看变更详情">
                  <div class="log-detail">
                    <div class="log-old">
                      <span class="label">变更前：</span>
                      <pre>{{ formatJson(log.oldValues) }}</pre>
                    </div>
                    <div class="log-new">
                      <span class="label">变更后：</span>
                      <pre>{{ formatJson(log.newValues) }}</pre>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <el-dialog v-model="showBatchUpdate" title="批量修改" width="650px" @close="handleBatchUpdateClose">
      <el-alert
        v-if="!isAdmin"
        title="普通HR仅可修改本人创建的企业数据，批量修改后需提交审核"
        type="warning"
        :closable="false"
        show-icon
        class="mb-base"
      />
      <el-form ref="batchFormRef" :model="batchForm" :rules="batchFormRules" label-width="120px">
        <el-form-item label="修改字段">
          <el-checkbox-group v-model="selectedBatchFields">
            <el-checkbox label="officeAddress">办公地址</el-checkbox>
            <el-checkbox label="contactPhone">联系电话</el-checkbox>
            <el-checkbox label="recruitStatus">招聘状态</el-checkbox>
            <el-checkbox label="status">启用状态</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item
          v-if="selectedBatchFields.includes('officeAddress')"
          label="办公地址"
          prop="officeAddress"
        >
          <el-input v-model="batchForm.officeAddress" placeholder="请输入办公地址" />
        </el-form-item>
        <el-form-item
          v-if="selectedBatchFields.includes('contactPhone')"
          label="联系电话"
          prop="contactPhone"
        >
          <el-input v-model="batchForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item
          v-if="selectedBatchFields.includes('recruitStatus')"
          label="招聘状态"
          prop="recruitStatus"
        >
          <el-select v-model="batchForm.recruitStatus" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in RECRUIT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="selectedBatchFields.includes('status')"
          label="启用状态"
          prop="status"
        >
          <el-radio-group v-model="batchForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="isAdmin" label="生效模式">
          <el-radio-group v-model="batchForm.effectiveMode">
            <el-radio value="global">全局生效</el-radio>
            <el-radio value="backend_only">仅后台生效</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="筛选条件">
          <span class="field-hint">将对已选中的 {{ selectedIds.length }} 家企业执行批量修改</span>
        </el-form-item>
      </el-form>

      <div v-if="batchUpdateResult" class="batch-result mt-base">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="总计">{{ batchUpdateResult.total }}</el-descriptions-item>
          <el-descriptions-item label="成功">
            <span style="color: #10b981">{{ batchUpdateResult.success }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="待审核">
            <span style="color: #f59e0b">{{ batchUpdateResult.needAudit }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败">
            <span style="color: #ef4444">{{ batchUpdateResult.failed }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="batchUpdateResult.errors.length > 0" class="error-list mt-sm">
          <div v-for="(err, idx) in batchUpdateResult.errors" :key="idx" class="error-item">
            {{ err.companyName }}: {{ err.message }}
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showBatchUpdate = false">取消</el-button>
        <el-button
          type="primary"
          :loading="batchUpdateLoading"
          :disabled="selectedBatchFields.length === 0"
          @click="handleDoBatchUpdate"
          :class="{ 'btn-ripple': showRipple }"
          @mousedown="handleRippleStart"
        >
          {{ batchUpdateLoading ? '执行中...' : '执行批量修改' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showChangeLogs" title="变更记录" width="900px">
      <el-form :inline="true" class="log-search-form mb-base">
        <el-form-item label="变更时间">
          <el-date-picker
            v-model="logDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="logSearch.operatorName" placeholder="请输入" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="变更字段">
          <el-input v-model="logSearch.changedFields" placeholder="请输入" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="logSearch.auditStatus" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchChangeLogs">查询</el-button>
          <el-button @click="resetLogSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="changeLogList" border stripe max-height="500" class="log-table">
        <el-table-column prop="companyId" label="企业ID" width="80" />
        <el-table-column label="企业名称" width="160">
          <template #default="{ row }">
            {{ getCompanyName(row.companyId) }}
          </template>
        </el-table-column>
        <el-table-column label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ CompanyChangeActionLabel[row.action as CompanyChangeAction] || row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="changedFields" label="变更字段" min-width="150" show-overflow-tooltip />
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column label="审核状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.auditStatus" size="small" :type="AuditStatusType[row.auditStatus]">
              {{ AuditStatusLabel[row.auditStatus] }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="生效模式" width="100" align="center">
          <template #default="{ row }">
            {{ row.effectiveMode === 'backend_only' ? '仅后台' : '全局' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="160" />
        <el-table-column label="详情" width="80" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showLogDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="changeLogTotal > 10" class="pagination-wrap mt-base">
        <el-pagination
          v-model:current-page="logPage"
          v-model:page-size="logPageSize"
          :total="changeLogTotal"
          layout="total, prev, pager, next"
          @current-change="fetchChangeLogs"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="logDetailVisible" title="变更详情" width="600px">
      <el-descriptions :column="2" border v-if="currentLogDetail">
        <el-descriptions-item label="企业名称" :span="2">
          {{ getCompanyName(currentLogDetail.companyId) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          {{ CompanyChangeActionLabel[currentLogDetail.action as CompanyChangeAction] || currentLogDetail.action }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLogDetail.operatorName || '系统' }}</el-descriptions-item>
        <el-descriptions-item label="变更字段" :span="2">{{ currentLogDetail.changedFields }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag v-if="currentLogDetail.auditStatus" size="small" :type="AuditStatusType[currentLogDetail.auditStatus]">
            {{ AuditStatusLabel[currentLogDetail.auditStatus] }}
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="审核人">{{ currentLogDetail.auditorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核备注" :span="2" v-if="currentLogDetail.auditRemark">
          {{ currentLogDetail.auditRemark }}
        </el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ currentLogDetail.created_at }}</el-descriptions-item>
        <el-descriptions-item label="变更前" :span="2">
          <pre class="json-pre">{{ formatJson(currentLogDetail.oldValues) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="变更后" :span="2">
          <pre class="json-pre">{{ formatJson(currentLogDetail.newValues) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="审核驳回" width="500px">
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="80px">
        <el-form-item label="驳回原因" prop="rejectReason">
          <el-input v-model="rejectForm.rejectReason" type="textarea" :rows="4" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import {
  ElMessage, ElMessageBox, type FormInstance, type FormRules,
  type ElTable,
} from 'element-plus';
import { Plus, Delete, Edit, Document } from '@element-plus/icons-vue';
import { SearchForm, ProTable } from '@/components';
import { useUserStore } from '@/store/modules/user';
import {
  getCompanyListApi,
  createCompanyApi,
  updateCompanyApi,
  deleteCompanyApi,
  batchDeleteCompanyApi,
  getCompanyDetailApi,
  checkCompanyQualificationApi,
  getMatchingJobCategoriesApi,
  getMatchingRecruitRangeApi,
  validateCompanyDataApi,
  approveCompanyChangeApi,
  rejectCompanyChangeApi,
  batchUpdateCompanyApi,
  getCompanyChangeLogsApi,
  type CompanyItem,
  type CompanyChangeLogItem,
  type BatchUpdateResult,
} from '@/api/company';
import {
  RecruitStatus,
  RecruitStatusLabel,
  RecruitStatusType,
  CompanyChangeAction,
  CompanyChangeActionLabel,
  AuditStatusLabel,
  AuditStatusType,
  JobCategory,
  JobCategoryLabel,
  INDUSTRY_OPTIONS,
  SCALE_OPTIONS,
  NATURE_OPTIONS,
  RECRUIT_STATUS_OPTIONS,
  INDUSTRY_JOB_CATEGORY_MAP,
} from '@/constants/recruitment';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userInfo?.role === 'admin');

const proTableRef = ref<InstanceType<typeof ElTable>>();
const loading = ref(false);
const tableData = ref<CompanyItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);
const currentEditingId = ref<number | null>(null);

const searchForm = reactive({
  name: '',
  industry: '',
  scale: '',
  recruitStatus: '',
  status: undefined as number | undefined,
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const qualificationApproved = ref(true);

const formData = reactive<Partial<CompanyItem>>({
  name: '',
  shortName: '',
  industry: '',
  scale: '',
  nature: '',
  address: '',
  officeAddress: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  recruitStatus: 'active',
  description: '',
  isQualificationApproved: false,
  status: 1,
  sort: 0,
});

const matchedCategories = ref<string[]>([]);
const matchedRecruitRange = ref<string[]>([]);

const formRules: FormRules = {
  name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
};

const detailVisible = ref(false);
const detailData = ref<CompanyItem>({} as CompanyItem);
const changeLogs = ref<CompanyChangeLogItem[]>([]);

const rejectVisible = ref(false);
const rejectLoading = ref(false);
const rejectFormRef = ref<FormInstance>();
const currentRejectId = ref(0);
const rejectForm = reactive({ rejectReason: '' });
const rejectRules: FormRules = {
  rejectReason: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }],
};

const showBatchUpdate = ref(false);
const batchUpdateLoading = ref(false);
const batchFormRef = ref<FormInstance>();
const selectedBatchFields = ref<string[]>([]);
const batchForm = reactive({
  officeAddress: '',
  contactPhone: '',
  recruitStatus: '',
  status: 1,
  effectiveMode: 'global' as 'global' | 'backend_only',
});
const batchFormRules: FormRules = {
  officeAddress: [{ required: true, message: '请输入办公地址', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号码', trigger: 'blur' },
  ],
  recruitStatus: [{ required: true, message: '请选择招聘状态', trigger: 'change' }],
  status: [{ required: true, message: '请选择启用状态', trigger: 'change' }],
};
const batchUpdateResult = ref<BatchUpdateResult | null>(null);
const showRipple = ref(false);

const showChangeLogs = ref(false);
const changeLogList = ref<CompanyChangeLogItem[]>([]);
const changeLogTotal = ref(0);
const logPage = ref(1);
const logPageSize = ref(10);
const logDateRange = ref<string[]>([]);
const logSearch = reactive({
  operatorName: '',
  changedFields: '',
  auditStatus: '',
  startTime: '',
  endTime: '',
});
const logDetailVisible = ref(false);
const currentLogDetail = ref<CompanyChangeLogItem | null>(null);

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getCompanyListApi({
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    });
    tableData.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => { page.value = 1; fetchList(); };
const handleReset = () => {
  page.value = 1;
  searchForm.name = '';
  searchForm.industry = '';
  searchForm.scale = '';
  searchForm.recruitStatus = '';
  searchForm.status = undefined;
  fetchList();
};
const handlePageChange = (p: number, ps: number) => { page.value = p; pageSize.value = ps; fetchList(); };
const handleSelectionChange = (selection: any[]) => { selectedIds.value = selection.map((item) => item.id); };
const handleRowClick = (row: CompanyItem) => { currentEditingId.value = row.id; };

const handleInputFocus = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  const input = target.closest('.el-input, .el-select') as HTMLElement;
  if (input) {
    input.style.transform = 'scale(1.02)';
    input.style.transition = 'all 0.2s ease';
    input.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
  }
};

const handleInputBlur = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  const input = target.closest('.el-input, .el-select') as HTMLElement;
  if (input) {
    input.style.transform = 'scale(1)';
    input.style.boxShadow = 'none';
  }
};

const handleIndustryChange = async (val: string) => {
  if (!val) {
    matchedCategories.value = [];
    return;
  }
  const res = await getMatchingJobCategoriesApi(val);
  matchedCategories.value = res.categories;

  if (isEdit.value && formData.jobCategories) {
    const currentCats = formData.jobCategories.split(',');
    const allowed = INDUSTRY_JOB_CATEGORY_MAP[val] || [];
    const unmatched = currentCats.filter(cat => !allowed.includes(cat));
    if (unmatched.length > 0) {
      ElMessage.warning(`已清空不匹配的岗位分类：${unmatched.map(c => JobCategoryLabel[c as JobCategory] || c).join('、')}`);
      formData.jobCategories = currentCats.filter(cat => allowed.includes(cat)).join(',');
    }
  }
};

const handleScaleChange = async (val: string) => {
  if (!val) {
    matchedRecruitRange.value = [];
    return;
  }
  const res = await getMatchingRecruitRangeApi(val);
  matchedRecruitRange.value = res.range;
};

const handleValidate = async () => {
  if (!formData.id) return;
  const res = await validateCompanyDataApi(formData, formData.id);
  if (!res.valid) {
    ElMessage.warning(res.errors.join('；'));
  }
};

const resetFormData = () => {
  Object.assign(formData, {
    name: '', shortName: '', industry: '', scale: '', nature: '',
    address: '', officeAddress: '', contactPerson: '', contactPhone: '',
    contactEmail: '', recruitStatus: 'active', description: '',
    isQualificationApproved: false, status: 1, sort: 0,
    changeAuditStatus: undefined, pendingChanges: undefined,
    changeOperatorId: undefined, changeOperatorName: undefined,
  });
  matchedCategories.value = [];
  matchedRecruitRange.value = [];
  qualificationApproved.value = true;
};

const handleAdd = () => {
  isEdit.value = false;
  dialogTitle.value = '新增企业';
  resetFormData();
  dialogVisible.value = true;
};

const handleEdit = async (row: CompanyItem) => {
  isEdit.value = true;
  dialogTitle.value = '编辑企业';
  Object.assign(formData, row);

  if (row.industry) {
    const res = await getMatchingJobCategoriesApi(row.industry);
    matchedCategories.value = res.categories;
  }
  if (row.scale) {
    const res2 = await getMatchingRecruitRangeApi(row.scale);
    matchedRecruitRange.value = res2.range;
  }

  try {
    const qualRes = await checkCompanyQualificationApi(row.id);
    qualificationApproved.value = qualRes.approved;
  } catch {
    qualificationApproved.value = false;
  }

  dialogVisible.value = true;
};

const handleView = async (row: CompanyItem) => {
  try {
    const res = await getCompanyDetailApi(row.id);
    detailData.value = res.company;
    changeLogs.value = res.changeLogs || [];
    detailVisible.value = true;
  } catch (error) {
    console.error(error);
  }
};

const getPendingChangesSummary = () => {
  if (!formData.pendingChanges) return '';
  try {
    const data = JSON.parse(formData.pendingChanges);
    const keys = Object.keys(data);
    const fieldMap: Record<string, string> = {
      name: '企业名称', shortName: '简称', industry: '所属行业', scale: '企业规模',
      nature: '企业性质', address: '注册地址', officeAddress: '办公地址',
      contactPerson: '联系人', contactPhone: '联系电话', contactEmail: '联系邮箱',
      recruitStatus: '招聘状态', status: '状态', sort: '排序', description: '企业简介',
    };
    return keys.map(k => fieldMap[k] || k).join('、');
  } catch {
    return '内容变更';
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    const validateRes = await validateCompanyDataApi(formData, isEdit.value ? formData.id : undefined);
    if (!validateRes.valid) {
      ElMessage.error(validateRes.errors.join('；'));
      return;
    }

    submitLoading.value = true;
    try {
      if (isEdit.value) {
        const res = await updateCompanyApi(formData.id!, formData);
        ElMessage.success(res.needAudit ? '提交审核成功，请等待管理员审核' : '更新成功');
      } else {
        await createCompanyApi(formData);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      fetchList();
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleApprove = async (row: any) => {
  ElMessageBox.confirm('确定审核通过该变更吗？', '审核确认', {
    confirmButtonText: '通过',
    cancelButtonText: '取消',
    type: 'success',
  }).then(async () => {
    await approveCompanyChangeApi(row.id, '审核通过');
    ElMessage.success('审核通过');
    dialogVisible.value = false;
    fetchList();
  }).catch(() => {});
};

const handleReject = (row: any) => {
  currentRejectId.value = row.id;
  rejectForm.rejectReason = '';
  rejectVisible.value = true;
};

const confirmReject = async () => {
  if (!rejectFormRef.value) return;
  await rejectFormRef.value.validate(async (valid) => {
    if (!valid) return;
    rejectLoading.value = true;
    try {
      await rejectCompanyChangeApi(currentRejectId.value, rejectForm.rejectReason);
      ElMessage.success('已驳回');
      rejectVisible.value = false;
      dialogVisible.value = false;
      fetchList();
    } finally {
      rejectLoading.value = false;
    }
  });
};

const handleDelete = (row: CompanyItem) => {
  ElMessageBox.confirm('确定要删除该企业吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteCompanyApi(row.id);
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteCompanyApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      fetchList();
    })
    .catch(() => {});
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
  resetFormData();
};

const handleBatchUpdateClose = () => {
  selectedBatchFields.value = [];
  batchForm.officeAddress = '';
  batchForm.contactPhone = '';
  batchForm.recruitStatus = '';
  batchForm.status = 1;
  batchForm.effectiveMode = 'global';
  batchUpdateResult.value = null;
};

const handleRippleStart = () => {
  if (!isAdmin.value && selectedIds.value.length > 0) {
    ElMessageBox.alert('无权限执行全局批量修改操作，普通HR仅可操作本人创建的企业数据', '权限不足', {
      confirmButtonText: '我知道了',
      type: 'error',
    }).catch(() => {});
    return;
  }
  showRipple.value = true;
  setTimeout(() => { showRipple.value = false; }, 500);
};

const handleDoBatchUpdate = async () => {
  if (!batchFormRef.value) return;

  const validateFields: any = {};
  selectedBatchFields.value.forEach(field => {
    validateFields[field] = batchForm[field as keyof typeof batchForm];
  });

  const validateRes = await validateCompanyDataApi(validateFields);
  if (!validateRes.valid) {
    ElMessage.error(validateRes.errors.join('；'));
    return;
  }

  const updateData: any = {};
  selectedBatchFields.value.forEach(field => {
    updateData[field] = batchForm[field as keyof typeof batchForm];
  });

  batchUpdateLoading.value = true;
  try {
    const res = await batchUpdateCompanyApi(
      selectedIds.value,
      updateData,
      isAdmin.value ? batchForm.effectiveMode : 'global'
    );
    batchUpdateResult.value = res;
    ElMessage.success(`批量操作完成：成功${res.success}，待审核${res.needAudit}，失败${res.failed}`);
    fetchList();
  } finally {
    batchUpdateLoading.value = false;
  }
};

const fetchChangeLogs = async () => {
  const params: any = {
    page: logPage.value,
    pageSize: logPageSize.value,
    operatorName: logSearch.operatorName,
    changedFields: logSearch.changedFields,
    auditStatus: logSearch.auditStatus,
  };
  if (logDateRange.value.length > 0) {
    params.startTime = logDateRange.value[0];
    params.endTime = logDateRange.value[1];
  }
  const res = await getCompanyChangeLogsApi(params);
  changeLogList.value = res.list;
  changeLogTotal.value = res.total;
};

const resetLogSearch = () => {
  logPage.value = 1;
  logDateRange.value = [];
  logSearch.operatorName = '';
  logSearch.changedFields = '';
  logSearch.auditStatus = '';
  fetchChangeLogs();
};

const getCompanyName = (companyId: number) => {
  const company = tableData.value.find(c => c.id === companyId);
  return company?.name || `企业ID:${companyId}`;
};

const showLogDetail = (row: CompanyChangeLogItem) => {
  currentLogDetail.value = row;
  logDetailVisible.value = true;
};

const formatJson = (val?: string) => {
  if (!val) return '-';
  try {
    const obj = JSON.parse(val);
    if (typeof obj === 'object') {
      return JSON.stringify(obj, null, 2);
    }
    return val;
  } catch {
    return val;
  }
};

watch(showChangeLogs, (val) => {
  if (val) {
    logPage.value = 1;
    fetchChangeLogs();
  }
});

onMounted(() => { fetchList(); });
</script>

<style lang="scss" scoped>
.company-page {
  .toolbar-left {
    display: flex;
    gap: $spacing-sm;
  }

  .name-cell {
    display: flex;
    align-items: center;
  }

  .ml-sm { margin-left: $spacing-sm; }

  .mr-sm { margin-right: $spacing-sm; }

  .mb-base { margin-bottom: $spacing-base; }

  .mb-sm { margin-bottom: $spacing-xs; }

  .mt-base { margin-top: $spacing-base; }

  .mt-lg { margin-top: $spacing-lg; }

  .mt-sm { margin-top: $spacing-xs; }

  .field-hint {
    color: $text-secondary;
    font-size: $font-size-sm;
  }

  .pending-actions {
    margin-top: $spacing-sm;
    display: flex;
    gap: $spacing-sm;
  }

  .matched-info {
    margin-top: $spacing-sm;
  }

  .category-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  .change-logs-section {
    .logs-title {
      font-size: $font-size-base;
      font-weight: 600;
      margin-bottom: $spacing-base;
      color: $text-primary;
    }

    .log-card {
      background: $bg-light;
      border-radius: $border-radius-sm;
      padding: $spacing-sm;

      .log-header {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        margin-bottom: $spacing-xs;
      }

      .log-operator {
        font-size: $font-size-sm;
        color: $text-secondary;
      }

      .log-audit {
        margin-left: auto;
        font-size: $font-size-sm;
      }

      .log-fields {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-bottom: $spacing-xs;
      }

      .log-remark {
        font-size: $font-size-sm;
        color: $danger-color;
      }

      .log-collapse {
        margin-top: $spacing-xs;
        border: none;
        --el-collapse-border-color: transparent;

        :deep(.el-collapse-item__header) {
          font-size: $font-size-sm;
          color: $primary-color;
          padding-left: 0;
        }

        :deep(.el-collapse-item__wrap) {
          border: none;
        }
      }

      .log-detail {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $spacing-sm;

        .label {
          font-weight: 500;
          color: $text-secondary;
        }

        pre {
          margin: $spacing-xs 0 0 0;
          padding: $spacing-xs;
          background: $bg-white;
          border-radius: $border-radius-sm;
          font-size: $font-size-xs;
          max-height: 200px;
          overflow: auto;
        }

        .log-old pre { border-left: 3px solid $warning-color; }
        .log-new pre { border-left: 3px solid $success-color; }
      }
    }
  }

  .batch-result {
    .error-list {
      .error-item {
        color: $danger-color;
        font-size: $font-size-sm;
        padding: 2px 0;
      }
    }
  }

  .btn-ripple {
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: ripple 0.5s ease-out;
      pointer-events: none;
    }
  }

  @keyframes ripple {
    0% { width: 0; height: 0; opacity: 1; }
    100% { width: 200px; height: 200px; opacity: 0; }
  }

  .log-search-form {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  .log-table {
    :deep(.el-table__header-wrapper) {
      position: sticky;
      top: 0;
      z-index: 10;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
  }

  .json-pre {
    margin: 0;
    padding: $spacing-sm;
    background: $bg-light;
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    max-height: 150px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .custom-input {
    transition: all 0.2s ease;
  }
}
</style>

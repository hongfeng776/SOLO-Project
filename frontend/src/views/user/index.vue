<template>
  <div class="page-container">
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card primary">
          <div class="stat-value">{{ statistics.totalUsers || 0 }}</div>
          <div class="stat-label">用户总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="stat-value">{{ statistics.newUsers || 0 }}</div>
          <div class="stat-label">今日新增</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning">
          <div class="stat-value">{{ statistics.frozenUsers || 0 }}</div>
          <div class="stat-label">冻结用户</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card danger">
          <div class="stat-value">{{ statistics.riskWarning || 0 }}</div>
          <div class="stat-label">风控预警</div>
        </div>
      </el-col>
    </el-row>

    <div class="search-section">
      <el-form :model="searchForm" :inline="true" label-width="auto" @submit.prevent="handleSearch">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="用户状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="(item, key) in UserStatusMap" :key="key" :label="item.label" :value="Number(key)" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户等级">
          <el-select v-model="searchForm.level" placeholder="请选择等级" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="(item, key) in UserLevelMap" :key="key" :label="item.label" :value="Number(key)" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册渠道">
          <el-select v-model="searchForm.registerChannel" placeholder="请选择渠道" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="channel in registerChannels" :key="channel.code" :label="channel.name" :value="channel.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="消费金额">
          <el-input-number v-model="searchForm.minAmount" :min="0" placeholder="最小" style="width: 120px;" />
          <span style="margin: 0 8px;">-</span>
          <el-input-number v-model="searchForm.maxAmount" :min="0" placeholder="最大" style="width: 120px;" />
        </el-form-item>
        <el-form-item label="风控预警">
          <el-select v-model="searchForm.riskWarning" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
        <el-button
          type="warning"
          :disabled="!selectedRows.length"
          @click="openBatchFreezeDialog"
        >
          <el-icon><Lock /></el-icon>批量冻结
        </el-button>
        <el-button
          type="success"
          :disabled="!selectedRows.length"
          @click="handleBatchUnfreeze"
        >
          <el-icon><Unlock /></el-icon>批量解冻
        </el-button>
        <el-button
          :disabled="!selectedRows.length"
          @click="openBatchUpdateTagsDialog"
        >
          <el-icon><CollectionTag /></el-icon>批量改标签
        </el-button>
        <el-button
          :disabled="!selectedRows.length"
          @click="openBatchResetPermissionsDialog"
        >
          <el-icon><Key /></el-icon>重置权限
        </el-button>
        <el-button
          type="danger"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button @click="loadStatistics">
          <el-icon><Refresh /></el-icon>刷新统计
        </el-button>
      </div>
    </div>

    <div v-if="selectedRows.length" class="batch-operation-bar">
      <span class="batch-info">已选择 {{ selectedRows.length }} 项</span>
      <el-button link type="primary" @click="clearSelection">取消选择</el-button>
    </div>

    <el-table
      ref="tableRef"
      :data="tableData"
      :loading="loading"
      stripe
      class="user-table"
      :row-class-name="rowClassNameHandler"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column type="index" label="序号" width="60" align="center">
        <template #default="{ $index }">
          {{ (pagination.page - 1) * pagination.pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="头像" width="70" align="center">
        <template #default="{ row }">
          <el-avatar :src="row.avatar" :size="36" />
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="realName" label="真实姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
      <el-table-column prop="levelName" label="等级" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="UserLevelMap[row.level]?.type" size="small">
            {{ UserLevelMap[row.level]?.label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="UserStatusMap[row.status]?.type" size="small">
            {{ UserStatusMap[row.status]?.label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="风控" width="80" align="center">
        <template #default="{ row }">
          <span v-if="row.riskWarning === 1" class="risk-warning-badge">
            <el-icon><Warning /></el-icon>预警
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="合规分" width="90" align="center">
        <template #default="{ row }">
          <span :class="['compliance-score', getComplianceScoreClass(row.complianceScore)]">
            <el-icon><Odometer /></el-icon>
            {{ row.complianceScore ?? '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="累计消费" width="120" align="right">
        <template #default="{ row }">
          <span class="amount-text">{{ row.totalAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="totalOrders" label="订单数" width="80" align="center" />
      <el-table-column label="备注" width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tooltip
            v-if="row.remark && row.remark.length > 20"
            :content="row.remark"
            placement="top"
            :show-after="300"
          >
            <div class="remark-tooltip-trigger">{{ row.remark.slice(0, 20) }}...</div>
          </el-tooltip>
          <span v-else>{{ row.remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="170" align="center" />
      <el-table-column label="操作" width="280" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleViewDetail(rowType(row))">详情</el-button>
          <el-button link type="primary" @click="handleEdit(rowType(row))">编辑</el-button>
          <el-button link type="primary" @click="handleViewTrace(rowType(row))">溯源</el-button>
          <el-button
            v-if="row.status === 1"
            link
            type="warning"
            @click="handleFreeze(rowType(row))"
          >冻结</el-button>
          <el-button
            v-if="row.status === 2"
            link
            type="success"
            @click="handleUnfreeze(rowType(row))"
          >解冻</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="pagination.total"
      layout="total, sizes, prev, pager, next, jumper"
      background
      class="pagination-section"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <el-dialog
      v-model="formDialogVisible"
      :title="dialogTitle"
      width="720px"
      class="dialog-center-zoom"
      append-to-body
      destroy-on-close
    >
      <div v-if="editPermission && !editPermission.canEdit" class="edit-permission-banner">
        <el-icon class="banner-icon"><Warning /></el-icon>
        <div class="banner-content">
          <div class="banner-title">编辑权限受限</div>
          <div class="banner-desc">{{ editPermission.reason }}</div>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="user-form"
        @submit.prevent="handleFormSubmit"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="formData.username"
                placeholder="请输入用户名"
                :disabled="isFormDisabled('username')"
                :class="{ 'is-error': fieldErrors.username }"
                @blur="validateField('username')"
              />
              <div v-if="fieldErrors.username" class="validate-error-tip">
                <el-icon class="error-icon"><CircleClose /></el-icon>
                <div class="error-content">
                  <div class="error-message">{{ fieldErrors.username.message }}</div>
                  <div v-if="fieldErrors.username.code" class="error-suggestion">
                    错误码: {{ fieldErrors.username.code }}
                  </div>
                </div>
              </div>
              <div v-else-if="fieldValidated.username" class="field-validate-success">
                <el-icon><CircleCheck /></el-icon>格式正确
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="formData.nickname"
                placeholder="请输入昵称"
                :disabled="isFormDisabled('nickname')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input
                v-model="formData.realName"
                placeholder="请输入真实姓名"
                :disabled="isFormDisabled('realName')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCard">
              <el-input
                v-model="formData.idCard"
                placeholder="请输入身份证号"
                :disabled="isFormDisabled('idCard')"
                :class="{ 'is-error': fieldErrors.idCard }"
                @blur="validateField('idCard')"
              />
              <div v-if="fieldErrors.idCard" class="validate-error-tip">
                <el-icon class="error-icon"><CircleClose /></el-icon>
                <div class="error-content">
                  <div class="error-message">{{ fieldErrors.idCard.message }}</div>
                  <div v-if="fieldErrors.idCard.code" class="error-suggestion">
                    错误码: {{ fieldErrors.idCard.code }}
                  </div>
                </div>
              </div>
              <div v-else-if="fieldValidated.idCard" class="field-validate-success">
                <el-icon><CircleCheck /></el-icon>身份证格式正确
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="formData.phone"
                placeholder="请输入手机号"
                :disabled="isFormDisabled('phone')"
                :class="{ 'is-error': fieldErrors.phone }"
                @blur="validateField('phone')"
              />
              <div v-if="fieldErrors.phone" class="validate-error-tip">
                <el-icon class="error-icon"><CircleClose /></el-icon>
                <div class="error-content">
                  <div class="error-message">{{ fieldErrors.phone.message }}</div>
                  <div v-if="fieldErrors.phone.code" class="error-suggestion">
                    错误码: {{ fieldErrors.phone.code }}
                  </div>
                </div>
              </div>
              <div v-else-if="fieldValidated.phone" class="field-validate-success">
                <el-icon><CircleCheck /></el-icon>手机号格式正确且唯一
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="formData.email"
                placeholder="请输入邮箱"
                :disabled="isFormDisabled('email')"
                :class="{ 'is-error': fieldErrors.email }"
                @blur="validateField('email')"
              />
              <div v-if="fieldErrors.email" class="validate-error-tip">
                <el-icon class="error-icon"><CircleClose /></el-icon>
                <div class="error-content">
                  <div class="error-message">{{ fieldErrors.email.message }}</div>
                  <div v-if="fieldErrors.email.code" class="error-suggestion">
                    错误码: {{ fieldErrors.email.code }}
                  </div>
                </div>
              </div>
              <div v-else-if="fieldValidated.email" class="field-validate-success">
                <el-icon><CircleCheck /></el-icon>邮箱格式正确且唯一
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="formData.gender" :disabled="isFormDisabled('gender')">
                <el-radio :value="1">男</el-radio>
                <el-radio :value="2">女</el-radio>
                <el-radio :value="0">未知</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生日" prop="birthday">
              <el-date-picker
                v-model="formData.birthday"
                type="date"
                placeholder="请选择生日"
                value-format="YYYY-MM-DD"
                :disabled="isFormDisabled('birthday')"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户等级" prop="level">
              <el-select v-model="formData.level" placeholder="请选择等级" :disabled="isFormDisabled('level')" style="width: 100%;">
                <el-option v-for="(item, key) in UserLevelMap" :key="key" :label="item.label" :value="Number(key)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号状态" prop="status">
              <el-radio-group v-model="formData.status" :disabled="isFormDisabled('status')">
                <el-radio :value="1">正常</el-radio>
                <el-radio :value="2">冻结</el-radio>
                <el-radio :value="3">注销</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册渠道" prop="registerChannel">
              <el-select
                v-model="formData.registerChannel"
                placeholder="请选择注册渠道"
                :disabled="isFormDisabled('registerChannel')"
                :class="{ 'is-error': fieldErrors.registerChannel }"
                style="width: 100%;"
                @blur="validateField('registerChannel')"
              >
                <el-option v-for="channel in registerChannels" :key="channel.code" :label="channel.name" :value="channel.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户标签" prop="tags">
              <el-input
                v-model="formData.tags"
                placeholder="多个标签用逗号分隔"
                :disabled="isFormDisabled('tags')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="formData.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
                :disabled="isFormDisabled('remark')"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          class="ripple-btn"
          :class="{ 'is-rippling': isRippling }"
          :disabled="!editPermission?.canEdit && dialogMode === 'edit'"
          @click="handleFormSubmit"
        >
          <el-icon><Check /></el-icon>保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="800px"
      class="dialog-center-zoom"
      append-to-body
      destroy-on-close
    >
      <div v-if="currentUser" class="user-detail">
        <div class="detail-header">
          <el-avatar :src="currentUser.avatar" :size="64" />
          <div class="user-basic-info">
            <div class="user-name">
              {{ currentUser.nickname || currentUser.username }}
              <el-tag v-if="currentUser.riskWarning === 1" class="risk-warning-badge" style="margin-left: 8px;">
                <el-icon><Warning /></el-icon>风控预警
              </el-tag>
            </div>
            <div class="user-meta">
              <el-tag :type="UserLevelMap[currentUser.level]?.type" style="margin-right: 8px;">
                {{ UserLevelMap[currentUser.level]?.label }}
              </el-tag>
              <el-tag :type="UserStatusMap[currentUser.status]?.type">
                {{ UserStatusMap[currentUser.status]?.label }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="user-detail-grid">
          <div class="user-detail-item">
            <span class="item-label">用户名</span>
            <span class="item-value">{{ currentUser.username }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">真实姓名</span>
            <span class="item-value">{{ currentUser.realName || '-' }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">手机号</span>
            <span class="item-value">{{ currentUser.phone }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">邮箱</span>
            <span class="item-value">{{ currentUser.email || '-' }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">身份证号</span>
            <span class="item-value">{{ maskIdCard(currentUser.idCard) }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">性别</span>
            <span class="item-value">{{ GenderMap[currentUser.gender || 0] }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">生日</span>
            <span class="item-value">{{ currentUser.birthday || '-' }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">注册渠道</span>
            <span class="item-value">{{ currentUser.registerChannelName || currentUser.registerChannel || '-' }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">累计消费</span>
            <span class="item-value amount-text">{{ currentUser.totalAmount }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">订单数</span>
            <span class="item-value">{{ currentUser.totalOrders }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">注册IP</span>
            <span class="item-value">{{ currentUser.registerIp || '-' }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">注册时间</span>
            <span class="item-value">{{ currentUser.createdAt }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">最后登录</span>
            <span class="item-value">{{ currentUser.lastLoginTime || '-' }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">最后登录IP</span>
            <span class="item-value">{{ currentUser.lastLoginIp || '-' }}</span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">合规评分</span>
            <span class="item-value">
              <span :class="['compliance-score', getComplianceScoreClass(currentUser.complianceScore)]">
                {{ currentUser.complianceScore ?? '-' }}
              </span>
            </span>
          </div>
          <div class="user-detail-item">
            <span class="item-label">用户标签</span>
            <span class="item-value">{{ currentUser.tags || '-' }}</span>
          </div>
        </div>

        <div v-if="currentUser.remark" class="remark-section">
          <div class="remark-label">备注</div>
          <div class="remark-content">{{ currentUser.remark }}</div>
        </div>

        <div v-if="currentUser.status === 2 && currentUser.frozenReason" class="frozen-section">
          <el-icon style="color: #e6a23c; margin-right: 8px;"><Warning /></el-icon>
          <span>冻结原因: {{ currentUser.frozenReason }}</span>
          <span v-if="currentUser.frozenTime" style="margin-left: 16px; color: #909399;">
            冻结时间: {{ currentUser.frozenTime }}
          </span>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      :title="`用户溯源 - ${currentUser?.username || ''}`"
      width="900px"
      class="trace-dialog dialog-center-zoom"
      append-to-body
      destroy-on-close
    >
      <el-tabs v-model="activeTraceTab" class="trace-tabs">
        <el-tab-pane label="合规检查" name="compliance">
          <div v-if="traceInfo.complianceCheck" class="trace-tab-content">
            <div class="validation-report-card" :class="traceInfo.complianceCheck.passed ? 'passed' : 'failed'">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="font-weight: 600; font-size: 16px;">合规性检查结果</div>
                <div :class="['compliance-score', getComplianceScoreClass(traceInfo.complianceCheck.score)]">
                  综合评分: {{ traceInfo.complianceCheck.score }}
                </div>
              </div>
              <div style="font-size: 14px; color: #606266;">
                {{ traceInfo.complianceCheck.passed ? '✓ 合规检查通过' : '✗ 存在合规风险' }}
              </div>
            </div>
            <div v-if="traceInfo.complianceCheck.issues?.length > 0">
              <div
                v-for="(issue, index) in traceInfo.complianceCheck.issues"
                :key="index"
                class="compliance-issue-item"
                :class="issue.level"
              >
                <div class="issue-type">
                  <el-icon style="margin-right: 4px;">
                    <Warning v-if="issue.level === 'high'" />
                    <InfoFilled v-else-if="issue.level === 'medium'" />
                    <CircleCheck v-else style="color: #67c23a;" />
                  </el-icon>
                  {{ getIssueTypeLabel(issue.type) }}
                </div>
                <div class="issue-message">{{ issue.message }}</div>
                <div v-if="issue.suggestion" class="issue-suggestion">
                  建议: {{ issue.suggestion }}
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-icon class="empty-icon"><CircleCheck /></el-icon>
              <div class="empty-text">暂无合规问题</div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="重复账号" name="duplicate">
          <div class="trace-tab-content">
            <div v-if="duplicateUsers.length > 0">
              <div
                v-for="(user, index) in duplicateUsers"
                :key="index"
                class="duplicate-user-item"
              >
                <div class="duplicate-header">
                  <span class="duplicate-name">{{ user.username }}</span>
                  <el-tag type="danger" size="small">疑似重复</el-tag>
                </div>
                <div class="duplicate-fields">
                  匹配字段: {{ user.matchFields?.join(', ') || '未知' }}
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-icon class="empty-icon"><CircleCheck /></el-icon>
              <div class="empty-text">未检测到重复账号</div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="注册信息" name="register">
          <div class="trace-tab-content">
            <div v-if="traceInfo.registerLog" class="profile-log-item">
              <div class="field-name">
                <el-icon style="margin-right: 6px;"><UserFilled /></el-icon>
                注册日志
              </div>
              <div class="field-change">
                <span>注册时间: {{ traceInfo.registerLog.registerTime }}</span>
              </div>
              <div class="field-change">
                <span>注册IP: {{ traceInfo.registerLog.registerIp }}</span>
              </div>
              <div v-if="traceInfo.registerLog.registerLocation" class="field-change">
                <span>注册地点: {{ traceInfo.registerLog.registerLocation }}</span>
              </div>
              <div class="field-change">
                <span>注册渠道: {{ traceInfo.registerLog.registerChannel }}</span>
              </div>
              <div v-if="traceInfo.registerLog.device" class="field-change">
                <span>设备: {{ traceInfo.registerLog.device }}</span>
              </div>
              <div v-if="traceInfo.registerLog.source" class="field-change">
                <span>来源: {{ traceInfo.registerLog.source }}</span>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-icon class="empty-icon"><InfoFilled /></el-icon>
              <div class="empty-text">暂无注册日志</div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="资料修改记录" name="profile">
          <div class="trace-tab-content">
            <div v-if="traceInfo.profileLogs?.length > 0">
              <div
                v-for="(log, index) in traceInfo.profileLogs"
                :key="index"
                class="profile-log-item"
              >
                <div class="field-name">
                  <el-icon style="margin-right: 6px;"><EditPen /></el-icon>
                  {{ log.fieldName }}
                </div>
                <div class="field-change">
                  <span class="old-value">{{ log.oldValue || '(空)' }}</span>
                  <el-icon><Right /></el-icon>
                  <span class="new-value">{{ log.newValue || '(空)' }}</span>
                </div>
                <div class="log-meta">
                  操作人: {{ log.operatorName }} | 操作时间: {{ log.operateTime }} | IP: {{ log.operateIp }}
                  <span v-if="log.remark"> | 备注: {{ log.remark }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-icon class="empty-icon"><InfoFilled /></el-icon>
              <div class="empty-text">暂无修改记录</div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="登录轨迹" name="login">
          <div class="trace-tab-content">
            <div v-if="traceInfo.loginTraces?.length > 0">
              <el-table :data="traceInfo.loginTraces" size="small">
                <el-table-column prop="loginTime" label="登录时间" width="170" />
                <el-table-column prop="loginIp" label="登录IP" width="140" />
                <el-table-column prop="loginLocation" label="登录地点" width="150" />
                <el-table-column prop="device" label="设备" width="150" />
                <el-table-column prop="browser" label="浏览器" width="150" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                      {{ row.status === 1 ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="failReason" label="失败原因" show-overflow-tooltip />
              </el-table>
            </div>
            <div v-else class="empty-state">
              <el-icon class="empty-icon"><InfoFilled /></el-icon>
              <div class="empty-text">暂无登录记录</div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="消费台账" name="consumption">
          <div class="trace-tab-content">
            <div v-if="traceInfo.consumptionLedgers?.length > 0">
              <el-table :data="traceInfo.consumptionLedgers" size="small">
                <el-table-column prop="orderNo" label="订单号" width="180" />
                <el-table-column prop="amount" label="金额" width="100" align="right">
                  <template #default="{ row }">
                    <span class="amount-text">{{ row.amount }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="payType" label="支付方式" width="100" />
                <el-table-column prop="payTime" label="支付时间" width="170" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
                      {{ row.status === 1 ? '成功' : '处理中' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" show-overflow-tooltip />
              </el-table>
            </div>
            <div v-else class="empty-state">
              <el-icon class="empty-icon"><InfoFilled /></el-icon>
              <div class="empty-text">暂无消费记录</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="batchFreezeDialogVisible" title="批量冻结用户" width="500px" class="dialog-center-zoom" append-to-body>
      <div class="batch-scope-selector">
        <span class="scope-label">生效范围:</span>
        <el-radio-group v-model="batchFreezeForm.scope">
          <el-radio value="partial">局部生效</el-radio>
          <el-radio value="global">全局生效</el-radio>
        </el-radio-group>
      </div>
      <el-form label-width="80px">
        <el-form-item label="冻结原因">
          <el-input
            v-model="batchFreezeForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入冻结原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchFreezeDialogVisible = false">取消</el-button>
        <el-button type="warning" class="ripple-btn" :class="{ 'is-rippling': isRippling }" @click="handleBatchFreeze">
          <el-icon><Lock /></el-icon>确认冻结
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchTagsDialogVisible" title="批量修改标签" width="500px" class="dialog-center-zoom" append-to-body>
      <div class="batch-scope-selector">
        <span class="scope-label">生效范围:</span>
        <el-radio-group v-model="batchTagsForm.scope">
          <el-radio value="partial">局部生效</el-radio>
          <el-radio value="global">全局生效</el-radio>
        </el-radio-group>
      </div>
      <el-form label-width="80px">
        <el-form-item label="操作模式">
          <el-radio-group v-model="batchTagsForm.mode">
            <el-radio value="append">追加标签</el-radio>
            <el-radio value="replace">替换标签</el-radio>
            <el-radio value="remove">移除标签</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标签内容">
          <el-input v-model="batchTagsForm.tags" placeholder="多个标签用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchTagsDialogVisible = false">取消</el-button>
        <el-button type="primary" class="ripple-btn" :class="{ 'is-rippling': isRippling }" @click="handleBatchUpdateTags">
          <el-icon><Check /></el-icon>确认修改
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchPermissionsDialogVisible" title="批量重置权限" width="500px" class="dialog-center-zoom" append-to-body>
      <div class="batch-scope-selector">
        <span class="scope-label">生效范围:</span>
        <el-radio-group v-model="batchPermissionsForm.scope">
          <el-radio value="partial">局部生效</el-radio>
          <el-radio value="global">全局生效</el-radio>
        </el-radio-group>
      </div>
      <el-form label-width="80px">
        <el-form-item label="权限列表">
          <el-checkbox-group v-model="batchPermissionsForm.permissions">
            <el-checkbox value="view">查看权限</el-checkbox>
            <el-checkbox value="order">下单权限</el-checkbox>
            <el-checkbox value="comment">评论权限</el-checkbox>
            <el-checkbox value="promotion">活动参与</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchPermissionsDialogVisible = false">取消</el-button>
        <el-button type="primary" class="ripple-btn" :class="{ 'is-rippling': isRippling }" @click="handleBatchResetPermissions">
          <el-icon><Check /></el-icon>确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search, Refresh, Plus, Lock, Unlock, Key, Delete,
  Check, Warning, CircleClose, CircleCheck, InfoFilled,
  Right, UserFilled, EditPen, Odometer, CollectionTag
} from '@element-plus/icons-vue'
import type { User, UserQueryParams, UserCreateData, UserUpdateData } from '@/api/user'
import {
  getUserList, createUser, updateUser, deleteUser,
  batchDeleteUsers, updateUserStatus, getUserEditPermission,
  getRegisterChannels, validateUserField, getUserStatistics, getUserFullInfo
} from '@/api/user'
import {
  batchFreeze, batchUnfreeze, batchUpdateTags, batchResetPermissions
} from '@/api/userBatch'
import { getUserTrace, getDuplicateUsers, type UserTraceInfo } from '@/api/userTrace'
import {
  UserStatusMap, UserLevelMap, GenderMap, UserRiskLevelMap,
  type UserEditPermission, type RegisterChannel, type BatchResult
} from '@/types/business'
import type { PageResult } from '@/types/api'

const tableRef = ref<any>()

const rowType = (row: any): User => row as User
const formRef = ref<FormInstance>()

const loading = ref(false)
const isRippling = ref(false)
const tableData = ref<User[]>([])
const selectedRows = ref<User[]>([])
const registerChannels = ref<RegisterChannel[]>([])
const statistics = ref<Record<string, number>>({})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive<{
  username: string
  phone: string
  status: number | ''
  level: number | ''
  registerChannel: string
  dateRange: string[]
  minAmount: number | undefined
  maxAmount: number | undefined
  riskWarning: number | ''
  tags: string
}>({
  username: '',
  phone: '',
  status: '',
  level: '',
  registerChannel: '',
  dateRange: [],
  minAmount: undefined,
  maxAmount: undefined,
  riskWarning: '',
  tags: ''
})

const formDialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const currentRow = ref<Partial<User>>({})
const editPermission = ref<UserEditPermission | null>(null)

const dialogTitle = computed(() => {
  if (dialogMode.value === 'add') return '新增用户'
  if (dialogMode.value === 'edit') return '编辑用户'
  return '查看用户'
})

const formData = reactive<Partial<User>>({
  username: '',
  nickname: '',
  realName: '',
  idCard: '',
  gender: 0,
  birthday: '',
  phone: '',
  email: '',
  status: 1,
  level: 1,
  registerChannel: '',
  tags: '',
  remark: ''
})

const fieldErrors = reactive<Record<string, { message: string; code?: string } | null>>({
  username: null,
  phone: null,
  email: null,
  idCard: null,
  registerChannel: null
})

const fieldValidated = reactive<Record<string, boolean>>({
  username: false,
  phone: false,
  email: false,
  idCard: false
})

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
}

const detailDialogVisible = ref(false)
const currentUser = ref<User | null>(null)

const traceDialogVisible = ref(false)
const activeTraceTab = ref('compliance')
const traceInfo = ref<UserTraceInfo>({
  registerLog: undefined,
  profileLogs: [],
  loginTraces: [],
  consumptionLedgers: [],
  complianceCheck: { passed: true, score: 100, issues: [] }
})
const duplicateUsers = ref<any[]>([])

const batchFreezeDialogVisible = ref(false)
const batchFreezeForm = reactive({
  reason: '',
  scope: 'partial' as 'global' | 'partial'
})

const batchTagsDialogVisible = ref(false)
const batchTagsForm = reactive({
  tags: '',
  mode: 'append' as 'append' | 'replace' | 'remove',
  scope: 'partial' as 'global' | 'partial'
})

const batchPermissionsDialogVisible = ref(false)
const batchPermissionsForm = reactive({
  permissions: [] as string[],
  scope: 'partial' as 'global' | 'partial'
})

const rowClassNameHandler = ({ row }: { row: User }) => {
  const classes: string[] = []
  if (row.status === 2) classes.push('is-frozen')
  if (row.status === 3) classes.push('is-canceled')
  if (row.riskWarning === 1) classes.push('is-risk')
  return classes.join(' ')
}

const getComplianceScoreClass = (score?: number) => {
  if (score === undefined) return ''
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

const maskIdCard = (idCard?: string) => {
  if (!idCard) return '-'
  if (idCard.length < 8) return idCard
  return idCard.slice(0, 6) + '********' + idCard.slice(-4)
}

const getIssueTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    duplicate: '重复信息',
    fake: '虚假信息',
    risk: '风险信息',
    incomplete: '信息不完整'
  }
  return map[type] || type
}

const isFormDisabled = (field: string) => {
  if (dialogMode.value === 'add') return false
  if (!editPermission.value?.editableFields) return true
  const fieldConfig = editPermission.value.editableFields.find(f => f.field === field)
  return !fieldConfig?.editable
}

const loadRegisterChannels = async () => {
  try {
    const res = await getRegisterChannels()
    registerChannels.value = res.data
  } catch (e) {
    console.error('加载注册渠道失败', e)
  }
}

const loadStatistics = async () => {
  try {
    const res = await getUserStatistics()
    statistics.value = res.data as any
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

const fetchUserList = async () => {
  loading.value = true
  try {
    const params: UserQueryParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      username: searchForm.username || undefined,
      phone: searchForm.phone || undefined,
      status: searchForm.status !== '' ? searchForm.status : undefined,
      level: searchForm.level !== '' ? searchForm.level : undefined,
      registerChannel: searchForm.registerChannel || undefined,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1],
      minAmount: searchForm.minAmount,
      maxAmount: searchForm.maxAmount,
      riskWarning: searchForm.riskWarning !== '' ? searchForm.riskWarning : undefined,
      tags: searchForm.tags || undefined
    }

    const res = await getUserList(params)
    const data = res.data as PageResult<User>
    tableData.value = data.list
    pagination.total = data.total
  } catch (e) {
    console.error('获取用户列表失败', e)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

const handleReset = () => {
  searchForm.username = ''
  searchForm.phone = ''
  searchForm.status = ''
  searchForm.level = ''
  searchForm.registerChannel = ''
  searchForm.dateRange = []
  searchForm.minAmount = undefined
  searchForm.maxAmount = undefined
  searchForm.riskWarning = ''
  searchForm.tags = ''
  pagination.page = 1
  fetchUserList()
}

const handleSelectionChange = (rows: User[]) => {
  selectedRows.value = rows
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
  selectedRows.value = []
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchUserList()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchUserList()
}

const handleAdd = () => {
  dialogMode.value = 'add'
  currentRow.value = {}
  resetFormData()
  editPermission.value = null
  formDialogVisible.value = true
}

const handleEdit = async (row: User) => {
  dialogMode.value = 'edit'
  currentRow.value = { ...row }
  resetFormData()
  Object.assign(formData, row)
  
  try {
    const res = await getUserEditPermission(row.status)
    editPermission.value = res.data
  } catch (e) {
    console.error('获取编辑权限失败', e)
  }
  
  formDialogVisible.value = true
}

const handleViewDetail = async (row: User) => {
  try {
    const res = await getUserFullInfo(row.id)
    currentUser.value = res.data
    detailDialogVisible.value = true
  } catch (e) {
    console.error('获取用户详情失败', e)
    ElMessage.error('获取用户详情失败')
  }
}

const handleViewTrace = async (row: User) => {
  currentUser.value = row
  traceDialogVisible.value = true
  activeTraceTab.value = 'compliance'
  
  try {
    const [traceRes, duplicateRes] = await Promise.all([
      getUserTrace(row.id),
      getDuplicateUsers(row.id)
    ])
    traceInfo.value = traceRes.data
    duplicateUsers.value = duplicateRes.data
  } catch (e) {
    console.error('获取溯源信息失败', e)
    ElMessage.error('获取溯源信息失败')
  }
}

const handleFreeze = async (row: User) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入冻结原因', '冻结用户', {
      confirmButtonText: '确认冻结',
      cancelButtonText: '取消',
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return '请输入冻结原因'
        }
        return true
      }
    })
    
    await updateUserStatus(row.id, 2, reason)
    ElMessage.success('冻结成功')
    fetchUserList()
    loadStatistics()
  } catch (e) {
    if ((e as any) !== 'cancel') {
      console.error('冻结失败', e)
      ElMessage.error('冻结失败')
    }
  }
}

const handleUnfreeze = async (row: User) => {
  try {
    await ElMessageBox.confirm('确定要解冻该用户吗？', '提示', { type: 'warning' })
    await updateUserStatus(row.id, 1)
    ElMessage.success('解冻成功')
    fetchUserList()
    loadStatistics()
  } catch (e) {
    if ((e as any) !== 'cancel') {
      console.error('解冻失败', e)
      ElMessage.error('解冻失败')
    }
  }
}

const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗？`, '提示', { type: 'warning' })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchUserList()
    loadStatistics()
  } catch (e) {
    if ((e as any) !== 'cancel') {
      console.error('删除失败', e)
      ElMessage.error('删除失败')
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个用户吗？`, '提示', { type: 'warning' })
    const ids = selectedRows.value.map(r => r.id)
    await batchDeleteUsers(ids)
    ElMessage.success('批量删除成功')
    clearSelection()
    fetchUserList()
    loadStatistics()
  } catch (e) {
    if ((e as any) !== 'cancel') {
      console.error('批量删除失败', e)
      ElMessage.error('批量删除失败')
    }
  }
}

const handleBatchUnfreeze = async () => {
  try {
    await ElMessageBox.confirm(`确定要解冻选中的 ${selectedRows.value.length} 个用户吗？`, '提示', { type: 'warning' })
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchUnfreeze(ids, 'partial')
    showBatchResult(res.data, '批量解冻')
    clearSelection()
    fetchUserList()
    loadStatistics()
  } catch (e) {
    if ((e as any) !== 'cancel') {
      console.error('批量解冻失败', e)
      ElMessage.error('批量解冻失败')
    }
  }
}

const openBatchFreezeDialog = () => {
  batchFreezeForm.reason = ''
  batchFreezeForm.scope = 'partial'
  batchFreezeDialogVisible.value = true
}

const handleBatchFreeze = async () => {
  if (!batchFreezeForm.reason.trim()) {
    ElMessage.warning('请输入冻结原因')
    return
  }
  
  triggerRipple()
  
  try {
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchFreeze({
      ids,
      reason: batchFreezeForm.reason,
      scope: batchFreezeForm.scope
    })
    showBatchResult(res.data, '批量冻结')
    batchFreezeDialogVisible.value = false
    clearSelection()
    fetchUserList()
    loadStatistics()
  } catch (e) {
    console.error('批量冻结失败', e)
    ElMessage.error('批量冻结失败')
  }
}

const openBatchUpdateTagsDialog = () => {
  batchTagsForm.tags = ''
  batchTagsForm.mode = 'append'
  batchTagsForm.scope = 'partial'
  batchTagsDialogVisible.value = true
}

const handleBatchUpdateTags = async () => {
  if (!batchTagsForm.tags.trim()) {
    ElMessage.warning('请输入标签内容')
    return
  }
  
  triggerRipple()
  
  try {
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchUpdateTags({
      ids,
      tags: batchTagsForm.tags,
      mode: batchTagsForm.mode,
      scope: batchTagsForm.scope
    })
    showBatchResult(res.data, '批量修改标签')
    batchTagsDialogVisible.value = false
    clearSelection()
    fetchUserList()
  } catch (e) {
    console.error('批量修改标签失败', e)
    ElMessage.error('批量修改标签失败')
  }
}

const openBatchResetPermissionsDialog = () => {
  batchPermissionsForm.permissions = []
  batchPermissionsForm.scope = 'partial'
  batchPermissionsDialogVisible.value = true
}

const handleBatchResetPermissions = async () => {
  triggerRipple()
  
  try {
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchResetPermissions({
      ids,
      permissions: batchPermissionsForm.permissions,
      scope: batchPermissionsForm.scope
    })
    showBatchResult(res.data, '批量重置权限')
    batchPermissionsDialogVisible.value = false
    clearSelection()
    fetchUserList()
  } catch (e) {
    console.error('批量重置权限失败', e)
    ElMessage.error('批量重置权限失败')
  }
}

const showBatchResult = (result: BatchResult, actionName: string) => {
  if (result.failCount === 0) {
    ElMessage.success(`${actionName}成功，共 ${result.successCount} 条`)
  } else {
    ElMessage.warning(`${actionName}完成，成功 ${result.successCount} 条，失败 ${result.failCount} 条`)
  }
}

const validateField = async (field: string) => {
  const value = (formData as any)[field]
  if (!value) {
    fieldErrors[field as keyof typeof fieldErrors] = null
    fieldValidated[field as keyof typeof fieldValidated] = false
    return
  }
  
  try {
    const userId = dialogMode.value === 'edit' ? currentRow.value.id : undefined
    const res = await validateUserField(field, value, userId)
    
    if (res.data.valid) {
      fieldErrors[field as keyof typeof fieldErrors] = null
      fieldValidated[field as keyof typeof fieldValidated] = true
    } else {
      fieldErrors[field as keyof typeof fieldErrors] = res.data.error || { message: '校验失败' }
      fieldValidated[field as keyof typeof fieldValidated] = false
    }
  } catch (e) {
    console.error(`校验字段 ${field} 失败`, e)
  }
}

const resetFormData = () => {
  Object.keys(formData).forEach(key => {
    ;(formData as any)[key] = key === 'status' ? 1 : key === 'level' ? 1 : key === 'gender' ? 0 : ''
  })
  Object.keys(fieldErrors).forEach(key => {
    fieldErrors[key as keyof typeof fieldErrors] = null
  })
  Object.keys(fieldValidated).forEach(key => {
    fieldValidated[key as keyof typeof fieldValidated] = false
  })
}

const triggerRipple = () => {
  isRippling.value = true
  setTimeout(() => {
    isRippling.value = false
  }, 600)
}

const handleFormSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const fieldsToValidate = ['username', 'phone', 'email', 'idCard', 'registerChannel']
    for (const field of fieldsToValidate) {
      await validateField(field)
      if (fieldErrors[field as keyof typeof fieldErrors]) {
        return
      }
    }
    
    triggerRipple()
    
    if (dialogMode.value === 'add') {
      await createUser(formData as UserCreateData)
      ElMessage.success('创建用户成功')
    } else {
      await updateUser(currentRow.value.id!, formData as UserUpdateData)
      ElMessage.success('更新用户成功')
    }
    
    formDialogVisible.value = false
    fetchUserList()
    loadStatistics()
  } catch (e) {
    console.error('表单提交失败', e)
    ElMessage.error('操作失败，请检查表单')
  }
}

onMounted(() => {
  loadRegisterChannels()
  loadStatistics()
  fetchUserList()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-container {
  padding: $spacing-base;
}

.stats-row {
  margin-bottom: $spacing-base;
}

.search-section {
  background: #fff;
  padding: $spacing-base;
  border-radius: $radius-base;
  margin-bottom: $spacing-base;
  box-shadow: $shadow-light;
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-base;
}

.pagination-section {
  margin-top: $spacing-base;
  display: flex;
  justify-content: flex-end;
}

.remark-tooltip-trigger {
  cursor: help;
  color: $primary-color;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base;
  background: $bg-color;
  border-radius: $radius-base;
  margin-bottom: $spacing-base;
}

.user-basic-info {
  flex: 1;
}

.user-name {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.user-meta {
  display: flex;
  align-items: center;
}

.remark-section {
  margin-top: $spacing-base;
  padding: $spacing-base;
  background: $bg-color;
  border-radius: $radius-base;
}

.remark-label {
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.remark-content {
  color: $text-regular;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.frozen-section {
  margin-top: $spacing-base;
  padding: $spacing-base;
  background: rgba(230, 162, 60, 0.1);
  border: 1px solid rgba(230, 162, 60, 0.3);
  border-radius: $radius-base;
  color: $warning-color;
}

.user-detail {
  padding: 0;
}

.toolbar-right {
  display: flex;
  gap: $spacing-sm;
}
</style>

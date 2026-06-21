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
          type="primary"
          :disabled="!selectedRows.length"
          @click="openBatchGrantDialog"
        >
          <el-icon><Key /></el-icon>批量授权
        </el-button>
        <el-button
          type="danger"
          :disabled="!selectedRows.length"
          @click="openBatchRevokeDialog"
        >
          <el-icon><Lock /></el-icon>批量回收
        </el-button>
        <el-button
          type="warning"
          :disabled="!selectedRows.length"
          @click="openBatchResetDialog"
        >
          <el-icon><Refresh /></el-icon>批量重置权限
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
      <el-table-column label="操作" width="340" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleViewDetail(rowType(row))">详情</el-button>
          <el-button link type="primary" @click="handleEdit(rowType(row))">编辑</el-button>
          <el-button link type="primary" @click="handleViewTrace(rowType(row))">溯源</el-button>
          <el-dropdown trigger="click" @command="(cmd) => handleStatusCommand(cmd, rowType(row))">
            <el-button link type="primary">
              状态管理<el-icon class="el-icon--right"><Right /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="open">
                  <el-icon><Unlock /></el-icon>状态变更
                </el-dropdown-item>
                <el-dropdown-item command="freeze" v-if="row.status === 1">
                  <el-icon><Lock /></el-icon>冻结
                </el-dropdown-item>
                <el-dropdown-item command="unfreeze" v-if="row.status === 2">
                  <el-icon><Unlock /></el-icon>解冻
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
      width="900px"
      class="dialog-center-zoom detail-dialog"
      append-to-body
      destroy-on-close
      @opened="handleDetailDialogOpened"
    >
      <el-tabs v-model="detailActiveTab" class="detail-tabs">
        <el-tab-pane label="基本信息" name="basic">
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
        </el-tab-pane>

        <el-tab-pane label="权限配置" name="permission">
          <div v-if="currentUser" class="permission-config-panel">
            <div class="permission-identity-card">
              <div class="identity-tags">
                <el-tag :type="UserLevelMap[currentUser.level]?.type" effect="dark" size="large">
                  <el-icon style="margin-right: 4px;"><UserFilled /></el-icon>
                  用户等级：{{ UserLevelMap[currentUser.level]?.label }}
                </el-tag>
                <el-tag :type="UserStatusMap[currentUser.status]?.type" effect="dark" size="large" style="margin-left: 12px;">
                  <el-icon style="margin-right: 4px;"><InfoFilled /></el-icon>
                  账号状态：{{ UserStatusMap[currentUser.status]?.label }}
                </el-tag>
                <el-tag :type="UserRiskLevelMap[currentUser.riskLevel || 0]?.type" effect="dark" size="large" style="margin-left: 12px;">
                  <el-icon style="margin-right: 4px;"><Warning /></el-icon>
                  风控等级：{{ UserRiskLevelMap[currentUser.riskLevel || 0]?.label }}
                </el-tag>
              </div>
              <div class="permission-stats">
                <div class="stat-item">
                  <div class="stat-num">{{ currentUserPermissions?.totalCount || 0 }}</div>
                  <div class="stat-label">权限总数</div>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item granted">
                  <div class="stat-num">{{ currentUserPermissions?.grantedCount || 0 }}</div>
                  <div class="stat-label">已授予</div>
                </div>
              </div>
              <div class="permission-actions">
                <el-button type="warning" @click="resetUserPermissions">
                  <el-icon><Refresh /></el-icon>重置为默认权限
                </el-button>
                <el-button type="primary" @click="checkPermissionsCompliance">
                  <el-icon><CircleCheck /></el-icon>权限合规检测
                </el-button>
              </div>
            </div>

            <div class="permission-groups-container" :class="{ shake: permissionShakeFlag }">
              <el-row :gutter="16">
                <el-col :span="12" v-for="groupKey in permissionGroups" :key="groupKey">
                  <el-card class="permission-group-card" shadow="hover">
                    <template #header>
                      <div class="card-header" :style="{ borderLeftColor: PermissionGroupMap[groupKey]?.color }">
                        <div class="card-title">
                          <el-icon :style="{ color: PermissionGroupMap[groupKey]?.color }">
                            <Key v-if="groupKey === 'basic'" />
                            <Present v-else-if="groupKey === 'marketing'" />
                            <ShoppingCart v-else-if="groupKey === 'order'" />
                            <ChatDotRound v-else-if="groupKey === 'review'" />
                            <Promotion v-else-if="groupKey === 'activity'" />
                            <Setting v-else />
                          </el-icon>
                          <span>{{ PermissionGroupMap[groupKey]?.label }}</span>
                        </div>
                        <el-tag size="small" :type="getGroupGrantedCount(groupKey) > 0 ? 'success' : 'info'">
                          {{ getGroupGrantedCount(groupKey) }}/{{ getGroupTotalCount(groupKey) }}
                        </el-tag>
                      </div>
                    </template>
                    <el-checkbox-group
                      v-model="selectedPermissionCodesByGroup[groupKey]"
                      @change="(val: string[]) => onPermissionChange(groupKey, val)"
                    >
                      <div v-for="perm in getGroupPermissions(groupKey)" :key="perm.permissionCode" class="permission-item">
                        <div :class="['checkbox-wrapper', { 'is-disabled-mask': isPermissionDisabled(perm) }]">
                          <el-checkbox
                            :label="perm.permissionCode"
                            :disabled="isPermissionDisabled(perm)"
                          >
                            <span :class="{ 'text-disabled': isPermissionDisabled(perm) }">
                              {{ perm.permissionName }}
                            </span>
                          </el-checkbox>
                          <el-tooltip
                            v-if="isPermissionDisabled(perm)"
                            :content="getPermissionDisableTip(perm)"
                            placement="top"
                          >
                            <el-icon class="disable-icon"><Lock /></el-icon>
                          </el-tooltip>
                        </div>
                      </div>
                    </el-checkbox-group>
                  </el-card>
                </el-col>
              </el-row>
            </div>

            <div v-if="hasPermissionChanges" class="permission-save-bar">
              <el-button type="primary" size="large" @click="saveUserPermissions">
                <el-icon><Check /></el-icon>保存权限配置
              </el-button>
              <el-button size="large" @click="loadUserPermissions(currentUser!.id)">
                <el-icon><Refresh /></el-icon>取消修改
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <transition name="status-fade">
      <el-dialog
        v-if="statusDialogVisible"
        v-model="statusDialogVisible"
        title="状态变更"
        width="560px"
        class="dialog-center-zoom status-dialog"
        append-to-body
        destroy-on-close
      >
        <div class="status-user-info">
          <el-avatar :src="statusForm.avatar" :size="48" />
          <div class="status-user-meta">
            <div class="status-username">{{ statusForm.username }}</div>
            <el-tag :type="UserStatusMap[statusForm.currentStatus]?.type" size="small">
              当前状态：{{ UserStatusMap[statusForm.currentStatus]?.label }}
            </el-tag>
          </div>
        </div>

        <el-form label-width="100px" class="status-form">
          <el-form-item label="新状态">
            <el-radio-group v-model="statusForm.newStatus" @change="onStatusChange">
              <el-radio :value="1">正常</el-radio>
              <el-radio :value="2">冻结</el-radio>
              <el-radio :value="3">注销</el-radio>
            </el-radio-group>
          </el-form-item>

          <transition name="smooth">
            <div v-if="statusForm.newStatus === 2" key="freeze" class="status-branch">
              <el-form-item label="冻结类型">
                <el-radio-group v-model="statusForm.freezeType">
                  <el-radio :value="FreezeType.TEMPORARY">临时冻结</el-radio>
                  <el-radio :value="FreezeType.PERMANENT">永久冻结</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="冻结原因">
                <el-input
                  v-model="statusForm.reason"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入冻结原因"
                />
              </el-form-item>
              <transition name="smooth">
                <div v-if="statusForm.freezeType === FreezeType.TEMPORARY" class="status-tip tip-blue">
                  <el-icon><InfoFilled /></el-icon>
                  <span>临时冻结：仅保留登录、查看信息、修改密码权限</span>
                  <div class="revoked-list">
                    <span class="revoked-label">将被回收权限：</span>
                    <el-tag v-for="p in revokedPermissionsByStatus.slice(0, 5)" :key="p" size="small" type="danger" style="margin: 2px;">
                      {{ p }}
                    </el-tag>
                  </div>
                </div>
                <div v-else-if="statusForm.freezeType === FreezeType.PERMANENT" class="status-tip tip-red">
                  <el-icon><Warning /></el-icon>
                  <span>永久冻结：仅保留查看个人信息权限</span>
                  <div class="revoked-list">
                    <span class="revoked-label">将被回收权限：</span>
                    <el-tag v-for="p in revokedPermissionsByStatus.slice(0, 7)" :key="p" size="small" type="danger" style="margin: 2px;">
                      {{ p }}
                    </el-tag>
                  </div>
                </div>
              </transition>
            </div>
            <div v-else-if="statusForm.newStatus === 3" key="cancel" class="status-branch">
              <el-form-item label="注销类型">
                <el-radio-group v-model="statusForm.cancelType">
                  <el-radio :value="CancelType.VOLUNTARY">主动注销</el-radio>
                  <el-radio :value="CancelType.VIOLATION">违规注销</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="注销原因">
                <el-input
                  v-model="statusForm.reason"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入注销原因"
                />
              </el-form-item>
              <transition name="smooth">
                <div v-if="statusForm.cancelType === CancelType.VOLUNTARY" class="status-tip tip-gray">
                  <el-icon><InfoFilled /></el-icon>
                  <span>主动注销：保留查看个人信息和隐私设置权限</span>
                </div>
                <div v-else-if="statusForm.cancelType === CancelType.VIOLATION" class="status-tip tip-red strong">
                  <el-icon><CircleClose /></el-icon>
                  <span>违规注销：回收全部权限，不可恢复</span>
                </div>
              </transition>
            </div>
          </transition>
        </el-form>

        <template #footer>
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitStatusChange">
            <el-icon><Check /></el-icon>确认变更
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <el-dialog
      v-model="batchGrantVisible"
      title="批量授权"
      width="700px"
      class="dialog-center-zoom"
      append-to-body
      destroy-on-close
    >
      <div class="batch-info-bar">
        <el-tag type="primary" size="large">已选用户：{{ selectedRows.length }} 人</el-tag>
      </div>
      <div class="batch-scope-selector">
        <span class="scope-label">生效范围:</span>
        <el-radio-group v-model="batchGrantForm.scope">
          <el-radio value="partial">局部生效</el-radio>
          <el-radio value="global">全局生效</el-radio>
        </el-radio-group>
        <el-alert
          v-if="batchGrantForm.scope === 'global'"
          type="error"
          :closable="false"
          show-icon
          style="margin-top: 8px;"
          title="全局生效将同步更新所有统计数据"
        />
      </div>
      <div class="batch-permissions-section">
        <el-row :gutter="12">
          <el-col :span="12" v-for="groupKey in permissionGroups" :key="groupKey">
            <div class="batch-group-card">
              <div class="batch-group-title" :style="{ color: PermissionGroupMap[groupKey]?.color }">
                {{ PermissionGroupMap[groupKey]?.label }}
              </div>
              <el-checkbox-group v-model="batchGrantForm.permissionCodes">
                <div v-for="perm in getAllGroupPermissions(groupKey)" :key="perm.permissionCode" class="batch-perm-item">
                  <el-checkbox :label="perm.permissionCode">{{ perm.permissionName }}</el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
          </el-col>
        </el-row>
      </div>
      <div class="batch-super-admin-tip">
        <el-icon><InfoFilled /></el-icon>仅超级管理员可执行全局批量操作
      </div>
      <template #footer>
        <el-button @click="batchGrantVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchGrant">
          <el-icon><Key /></el-icon>确认授权
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchRevokeVisible"
      title="批量回收权限"
      width="700px"
      class="dialog-center-zoom"
      append-to-body
      destroy-on-close
    >
      <div class="batch-info-bar">
        <el-tag type="danger" size="large">已选用户：{{ selectedRows.length }} 人</el-tag>
      </div>
      <div class="batch-scope-selector">
        <span class="scope-label">生效范围:</span>
        <el-radio-group v-model="batchRevokeForm.scope">
          <el-radio value="partial">局部生效</el-radio>
          <el-radio value="global">全局生效</el-radio>
        </el-radio-group>
        <el-alert
          v-if="batchRevokeForm.scope === 'global'"
          type="error"
          :closable="false"
          show-icon
          style="margin-top: 8px;"
          title="全局生效将同步更新所有统计数据"
        />
      </div>
      <el-form label-width="80px" style="margin-top: 16px;">
        <el-form-item label="回收原因">
          <el-input
            v-model="batchRevokeForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入回收原因"
          />
        </el-form-item>
      </el-form>
      <div class="batch-permissions-section">
        <el-row :gutter="12">
          <el-col :span="12" v-for="groupKey in permissionGroups" :key="groupKey">
            <div class="batch-group-card">
              <div class="batch-group-title" :style="{ color: PermissionGroupMap[groupKey]?.color }">
                {{ PermissionGroupMap[groupKey]?.label }}
              </div>
              <el-checkbox-group v-model="batchRevokeForm.permissionCodes">
                <div v-for="perm in getAllGroupPermissions(groupKey)" :key="perm.permissionCode" class="batch-perm-item">
                  <el-checkbox :label="perm.permissionCode">{{ perm.permissionName }}</el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
          </el-col>
        </el-row>
      </div>
      <div class="batch-super-admin-tip">
        <el-icon><InfoFilled /></el-icon>仅超级管理员可执行全局批量操作
      </div>
      <template #footer>
        <el-button @click="batchRevokeVisible = false">取消</el-button>
        <el-button type="danger" @click="submitBatchRevoke">
          <el-icon><Lock /></el-icon>确认回收
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchResetVisible"
      title="批量重置权限"
      width="520px"
      class="dialog-center-zoom"
      append-to-body
      destroy-on-close
    >
      <div class="batch-info-bar">
        <el-tag type="warning" size="large">已选用户：{{ selectedRows.length }} 人</el-tag>
      </div>
      <div class="batch-scope-selector">
        <span class="scope-label">生效范围:</span>
        <el-radio-group v-model="batchResetForm.scope">
          <el-radio value="partial">局部生效</el-radio>
          <el-radio value="global">全局生效</el-radio>
        </el-radio-group>
        <el-alert
          v-if="batchResetForm.scope === 'global'"
          type="error"
          :closable="false"
          show-icon
          style="margin-top: 8px;"
          title="全局生效将同步更新所有统计数据"
        />
      </div>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        style="margin-top: 16px;"
        title="该操作将把所选用户的权限重置为系统默认配置"
        description="请谨慎操作，重置后非默认权限将被回收"
      />
      <div class="batch-super-admin-tip">
        <el-icon><InfoFilled /></el-icon>仅超级管理员可执行全局批量操作
      </div>
      <template #footer>
        <el-button @click="batchResetVisible = false">取消</el-button>
        <el-button type="warning" @click="submitBatchReset">
          <el-icon><Refresh /></el-icon>确认重置
        </el-button>
      </template>
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
        <el-tab-pane label="权限配置溯源" name="permissionTrace">
          <div class="trace-tab-content">
            <div v-if="permissionTraceData.summary" class="permission-overview-card">
              <div class="overview-header">
                <div class="overview-title">权限配置概览</div>
              </div>
              <div class="overview-grid">
                <div class="overview-item">
                  <div class="overview-num">{{ permissionTraceData.summary.totalPermissions }}</div>
                  <div class="overview-label">总权限数</div>
                </div>
                <div class="overview-item success">
                  <div class="overview-num">{{ permissionTraceData.summary.grantedCount }}</div>
                  <div class="overview-label">已授予</div>
                </div>
                <div class="overview-item danger">
                  <div class="overview-num">{{ permissionTraceData.summary.revokedCount }}</div>
                  <div class="overview-label">已回收</div>
                </div>
                <div class="overview-item primary">
                  <div class="overview-num">{{ permissionTraceData.summary.grantCount }}</div>
                  <div class="overview-label">授予次数</div>
                </div>
                <div class="overview-item warning">
                  <div class="overview-num">{{ permissionTraceData.summary.changeCount }}</div>
                  <div class="overview-label">变更次数</div>
                </div>
                <div class="overview-item info">
                  <div class="overview-small">
                    <div class="small-row">
                      <el-icon><UserFilled /></el-icon>
                      <span>最后操作人：{{ permissionTraceData.summary.lastOperator || '-' }}</span>
                    </div>
                    <div class="small-row">
                      <el-icon><EditPen /></el-icon>
                      <span>操作时间：{{ permissionTraceData.summary.lastOperateTime || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="permissionCompliance" class="compliance-section">
              <div class="compliance-score-card">
                <el-progress
                  type="dashboard"
                  :percentage="permissionCompliance.score || 0"
                  :color="getComplianceProgressColor(permissionCompliance.score)"
                />
                <div class="compliance-score-label">合规分数</div>
              </div>

              <div v-if="permissionCompliance.issues?.length > 0" class="compliance-issues">
                <div class="section-title">问题列表</div>
                <div
                  v-for="(issue, idx) in permissionCompliance.issues"
                  :key="idx"
                  class="compliance-issue-item"
                  :class="issue.level"
                >
                  <div class="issue-icon">
                    <el-icon>
                      <Warning v-if="issue.level === 'high'" />
                      <InfoFilled v-else-if="issue.level === 'medium'" />
                      <CircleCheck v-else />
                    </el-icon>
                  </div>
                  <div class="issue-content">
                    <el-tag :type="issue.level === 'high' ? 'danger' : issue.level === 'medium' ? 'warning' : 'success'" size="small">
                      {{ issue.type }}
                    </el-tag>
                    <span class="issue-message">{{ issue.message }}</span>
                  </div>
                </div>
              </div>

              <div v-if="permissionCompliance.duplicatePermissions?.length > 0" class="compliance-list-section">
                <div class="section-title">
                  <el-icon style="color: #e6a23c;"><Warning /></el-icon>
                  重复绑定权限
                </div>
                <div class="tag-list">
                  <el-tag v-for="p in permissionCompliance.duplicatePermissions" :key="p" type="warning" style="margin: 4px;">
                    {{ p }}
                  </el-tag>
                </div>
              </div>

              <div v-if="permissionCompliance.overLimitPermissions?.length > 0" class="compliance-list-section">
                <div class="section-title">
                  <el-icon style="color: #f56c6c;"><CircleClose /></el-icon>
                  超限权限
                </div>
                <el-table :data="permissionCompliance.overLimitPermissions" size="small" border>
                  <el-table-column prop="name" label="权限名" />
                  <el-table-column prop="requiredLevel" label="所需等级" width="120" align="center">
                    <template #default="{ row }">
                      {{ UserLevelMap[row.requiredLevel]?.label || row.requiredLevel }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="userLevel" label="用户等级" width="120" align="center">
                    <template #default="{ row }">
                      {{ UserLevelMap[row.userLevel]?.label || row.userLevel }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <div v-if="permissionCompliance.mismatchedPermissions?.length > 0" class="compliance-list-section">
                <div class="section-title">
                  <el-icon style="color: #909399;"><InfoFilled /></el-icon>
                  身份不匹配权限
                </div>
                <el-table :data="permissionCompliance.mismatchedPermissions" size="small" border>
                  <el-table-column prop="name" label="权限名" />
                  <el-table-column prop="reason" label="原因" />
                </el-table>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="权限变更日志" name="permissionLogs">
          <div class="trace-tab-content">
            <el-timeline v-if="permissionLogs.length > 0">
              <el-timeline-item
                v-for="(log, idx) in permissionLogs"
                :key="log.id || idx"
                :type="getLogTimelineType(log.logType)"
                :hollow="false"
                :timestamp="log.operateTime"
                placement="top"
              >
                <template #dot>
                  <el-icon class="timeline-icon">
                    <Plus v-if="log.logType === 1" />
                    <Delete v-else-if="log.logType === 2" />
                    <Refresh v-else-if="log.logType === 3" />
                    <EditPen v-else-if="log.logType === 4" />
                    <CollectionTag v-else />
                  </el-icon>
                </template>
                <div class="log-item-card">
                  <div class="log-header">
                    <el-tag :type="PermissionLogTypeMap[log.logType]?.type" size="small">
                      {{ PermissionLogTypeMap[log.logType]?.label }}
                    </el-tag>
                    <span class="log-operator">操作人：{{ log.operatorName || '-' }}</span>
                  </div>
                  <div v-if="log.permissionCodes || log.permissionDetails" class="log-permissions">
                    <template v-if="parsePermissionCodes(log.permissionCodes).length <= 3">
                      <el-tag
                        v-for="p in parsePermissionCodes(log.permissionCodes)"
                        :key="p"
                        size="small"
                        style="margin: 2px;"
                      >
                        {{ p }}
                      </el-tag>
                    </template>
                    <template v-else>
                      <el-tag
                        v-for="p in parsePermissionCodes(log.permissionCodes).slice(0, 3)"
                        :key="p"
                        size="small"
                        style="margin: 2px;"
                      >
                        {{ p }}
                      </el-tag>
                      <span class="more-perms">
                        等{{ parsePermissionCodes(log.permissionCodes).length }}个权限
                      </span>
                    </template>
                  </div>
                  <div v-if="log.reason" class="log-reason">
                    <el-icon><InfoFilled /></el-icon>
                    原因/备注：{{ log.reason }}
                  </div>
                  <div v-if="log.logType === 4 && (log.beforeStatus || log.afterStatus)" class="log-status-change">
                    <el-tag v-if="log.beforeStatus !== undefined && log.beforeStatus !== null" :type="UserStatusMap[log.beforeStatus]?.type" size="small">
                      {{ UserStatusMap[log.beforeStatus]?.label }}
                    </el-tag>
                    <el-icon style="margin: 0 8px; color: #909399;"><Right /></el-icon>
                    <el-tag v-if="log.afterStatus !== undefined && log.afterStatus !== null" :type="UserStatusMap[log.afterStatus]?.type" size="small">
                      {{ UserStatusMap[log.afterStatus]?.label }}
                    </el-tag>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <div v-else class="empty-state">
              <el-icon class="empty-icon"><InfoFilled /></el-icon>
              <div class="empty-text">暂无权限变更日志</div>
            </div>
          </div>
        </el-tab-pane>

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
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search, Refresh, Plus, Lock, Unlock, Key, Delete,
  Check, Warning, CircleClose, CircleCheck, InfoFilled,
  Right, UserFilled, EditPen, Odometer, CollectionTag,
  Present, ShoppingCart, ChatDotRound, Promotion, Setting
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
  type UserEditPermission, type RegisterChannel, type BatchResult,
  PermissionGroupMap, GrantTypeMap, PermissionLogTypeMap,
  FreezeType, FreezeTypeMap, CancelType, CancelTypeMap,
  type PermissionChangeLog, type PermissionComplianceResult
} from '@/types/business'
import type { PageResult } from '@/types/api'
import {
  getSystemPermissions, getFilteredPermissions, validatePermissionGrant,
  getUserPermissions, grantPermissions, revokePermissions, resetPermissions,
  changeUserStatus, batchGrantPermissions, batchRevokePermissions, batchResetPermissions as apiBatchResetPermissions,
  getPermissionTrace, getPermissionLogs, checkPermissionCompliance
} from '@/api/userPermission'
import type { SystemPermission, UserPermissionInfo, StatusChangeResult } from '@/api/userPermission'

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

const statusDialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const batchGrantVisible = ref(false)
const batchRevokeVisible = ref(false)
const batchResetVisible = ref(false)
const currentUserPermissions = ref<UserPermissionInfo | null>(null)
const selectedPermissionCodes = ref<string[]>([])
const filteredPermissions = ref<Record<string, SystemPermission[]>>({})
const permissionCompliance = ref<PermissionComplianceResult | null>(null)
const permissionLogs = ref<PermissionChangeLog[]>([])
const isSuperAdmin = ref(true)
const statusAnimating = ref(false)
const detailActiveTab = ref('basic')
const permissionShakeFlag = ref(false)

const onStatusChange = () => {
  statusAnimating.value = true
  window.setTimeout(() => {
    statusAnimating.value = false
  }, 300)
}

const statusForm = reactive({
  userId: 0 as number,
  username: '',
  avatar: '',
  currentStatus: 1 as number,
  newStatus: 1 as number,
  freezeType: FreezeType.TEMPORARY as number,
  cancelType: CancelType.VOLUNTARY as number,
  reason: ''
})

const batchGrantForm = reactive({
  scope: 'partial' as 'global' | 'partial',
  permissionCodes: [] as string[]
})

const batchRevokeForm = reactive({
  scope: 'partial' as 'global' | 'partial',
  permissionCodes: [] as string[],
  reason: ''
})

const batchResetForm = reactive({
  scope: 'partial' as 'global' | 'partial'
})

const selectedPermissionCodesByGroup = reactive<Record<string, string[]>>({
  basic: [],
  marketing: [],
  order: [],
  review: [],
  activity: [],
  info: []
})

const originalGrantedCodes = ref<string[]>([])

const systemAllPermissions = ref<SystemPermission[]>([])

const permissionTraceData = ref<any>({
  summary: null,
  permissionList: [],
  grantRecords: [],
  revokeRecords: [],
  changeLogs: []
})

const hasPermissionChanges = computed(() => {
  const current = Object.values(selectedPermissionCodesByGroup).flat()
  const original = originalGrantedCodes.value
  if (current.length !== original.length) return true
  const set1 = new Set(current)
  const set2 = new Set(original)
  for (const item of set1) if (!set2.has(item)) return true
  return false
})

const permissionGroups = computed(() => Object.keys(PermissionGroupMap))

const revokedPermissionsByStatus = computed(() => {
  if (statusForm.newStatus === 1) return []
  if (statusForm.newStatus === 2) {
    if (statusForm.freezeType === FreezeType.TEMPORARY) {
      return ['下单', '评论', '参与活动', '使用优惠券', '发布评价']
    } else {
      return ['下单', '评论', '参与活动', '使用优惠券', '发布评价', '修改密码', '查看订单']
    }
  }
  if (statusForm.newStatus === 3) {
    if (statusForm.cancelType === CancelType.VIOLATION) {
      return ['全部权限']
    }
    return ['下单', '评论', '参与活动', '使用优惠券', '发布评价', '修改密码']
  }
  return []
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

const loadSystemPermissions = async () => {
  try {
    if (systemAllPermissions.value.length === 0) {
      const res = await getSystemPermissions()
      systemAllPermissions.value = res.data
    }
  } catch (e) {
    console.error('加载系统权限失败', e)
  }
}

const loadUserPermissions = async (userId: number) => {
  try {
    const [permRes, filterRes] = await Promise.all([
      getUserPermissions(userId),
      getFilteredPermissions(
        currentUser.value?.level || 1,
        currentUser.value?.status || 1,
        currentUser.value?.riskLevel || 0
      )
    ])
    currentUserPermissions.value = permRes.data
    originalGrantedCodes.value = [...permRes.data.grantedCodes]

    Object.keys(selectedPermissionCodesByGroup).forEach(key => {
      selectedPermissionCodesByGroup[key] = []
    })

    const filteredList = filterRes.data
    const filteredCodes = new Set(filteredList.map(p => p.permissionCode))

    permRes.data.grantedCodes.forEach(code => {
      const perm = systemAllPermissions.value.find(p => p.permissionCode === code)
        || permRes.data.allPermissions.find(p => p.permissionCode === code)
      if (perm) {
        const group = perm.permissionGroup
        if (selectedPermissionCodesByGroup[group]) {
          selectedPermissionCodesByGroup[group].push(code)
        }
      }
    })

    const groupedFiltered: Record<string, SystemPermission[]> = {}
    filteredList.forEach(perm => {
      if (!groupedFiltered[perm.permissionGroup]) {
        groupedFiltered[perm.permissionGroup] = []
      }
      groupedFiltered[perm.permissionGroup].push(perm)
    })
    filteredPermissions.value = groupedFiltered

    if (systemAllPermissions.value.length === 0) {
      systemAllPermissions.value = permRes.data.allPermissions
    }
  } catch (e) {
    console.error('加载用户权限失败', e)
    ElMessage.error('加载用户权限失败')
  }
}

const handleDetailDialogOpened = async () => {
  detailActiveTab.value = 'basic'
  if (currentUser.value) {
    await loadSystemPermissions()
  }
}

watch(() => detailActiveTab.value, async (newTab) => {
  if (newTab === 'permission' && currentUser.value) {
    await loadUserPermissions(currentUser.value.id)
  }
})

watch(() => [currentUser.value?.status, currentUser.value?.level, currentUser.value?.riskLevel], async () => {
  if (detailActiveTab.value === 'permission' && currentUser.value) {
    try {
      const filterRes = await getFilteredPermissions(
        currentUser.value?.level || 1,
        currentUser.value?.status || 1,
        currentUser.value?.riskLevel || 0
      )
      const filteredList = filterRes.data
      const groupedFiltered: Record<string, SystemPermission[]> = {}
      filteredList.forEach(perm => {
        if (!groupedFiltered[perm.permissionGroup]) {
          groupedFiltered[perm.permissionGroup] = []
        }
        groupedFiltered[perm.permissionGroup].push(perm)
      })
      filteredPermissions.value = groupedFiltered
    } catch (e) {
      console.error('刷新筛选权限失败', e)
    }
  }
}, { deep: true })

const getGroupPermissions = (groupKey: string): SystemPermission[] => {
  const filtered = filteredPermissions.value[groupKey] || []
  if (filtered.length > 0) return filtered
  return systemAllPermissions.value.filter(p => p.permissionGroup === groupKey)
}

const getAllGroupPermissions = (groupKey: string): SystemPermission[] => {
  return systemAllPermissions.value.filter(p => p.permissionGroup === groupKey)
}

const getGroupGrantedCount = (groupKey: string): number => {
  return selectedPermissionCodesByGroup[groupKey]?.length || 0
}

const getGroupTotalCount = (groupKey: string): number => {
  return getGroupPermissions(groupKey).length
}

const isPermissionDisabled = (perm: SystemPermission): boolean => {
  if (!currentUser.value) return true
  if (perm.requiredLevel > currentUser.value.level) return true
  const filtered = filteredPermissions.value[perm.permissionGroup] || []
  if (filtered.length > 0) {
    return !filtered.some(p => p.permissionCode === perm.permissionCode)
  }
  return false
}

const getPermissionDisableTip = (perm: SystemPermission): string => {
  if (!currentUser.value) return ''
  if (perm.requiredLevel > currentUser.value.level) {
    return `需要${UserLevelMap[perm.requiredLevel]?.label || perm.requiredLevel}级用户以上`
  }
  return '当前用户状态或风控等级不符合条件'
}

const onPermissionChange = async (group: string, val: string[]) => {
  if (!currentUser.value) return

  const allSelected = Object.values(selectedPermissionCodesByGroup).flat()

  try {
    const res = await validatePermissionGrant(currentUser.value.id, allSelected)
    if (!res.data.valid && res.data.blockedPermissions?.length > 0) {
      permissionShakeFlag.value = true
      setTimeout(() => { permissionShakeFlag.value = false }, 500)

      const blocked = res.data.blockedPermissions[0]
      ElMessage.warning(`权限【${blocked.name}】被拦截：${blocked.reason}`)

      const blockedCodes = new Set(res.data.blockedPermissions.map(b => b.code))
      selectedPermissionCodesByGroup[group] = val.filter(v => !blockedCodes.has(v))
      return
    }
  } catch (e) {
    console.error('校验权限失败', e)
  }
}

const saveUserPermissions = async () => {
  if (!currentUser.value) return
  const allSelected = Object.values(selectedPermissionCodesByGroup).flat()
  const original = originalGrantedCodes.value

  const grantCodes = allSelected.filter(c => !original.includes(c))
  const revokeCodes = original.filter(c => !allSelected.includes(c))

  try {
    const promises: Promise<any>[] = []
    if (grantCodes.length > 0) {
      promises.push(grantPermissions(currentUser.value.id, grantCodes, 2))
    }
    if (revokeCodes.length > 0) {
      promises.push(revokePermissions(currentUser.value.id, revokeCodes, '管理员手动配置'))
    }
    if (promises.length > 0) {
      await Promise.all(promises)
    }
    ElMessage.success('权限配置保存成功')
    await loadUserPermissions(currentUser.value.id)
  } catch (e) {
    console.error('保存权限配置失败', e)
    ElMessage.error('保存权限配置失败')
  }
}

const resetUserPermissions = async () => {
  if (!currentUser.value) return
  try {
    await ElMessageBox.confirm('确定要将该用户权限重置为系统默认配置吗？', '提示', { type: 'warning' })
    await resetPermissions(currentUser.value.id, '管理员重置为默认')
    ElMessage.success('权限重置成功')
    await loadUserPermissions(currentUser.value.id)
  } catch (e) {
    if ((e as any) !== 'cancel') {
      console.error('重置权限失败', e)
      ElMessage.error('重置权限失败')
    }
  }
}

const checkPermissionsCompliance = async () => {
  if (!currentUser.value) return
  try {
    const res = await checkPermissionCompliance(currentUser.value.id)
    permissionCompliance.value = res.data

    if (res.data.passed) {
      ElMessage.success(`权限合规检测通过，综合评分：${res.data.score}`)
    } else {
      ElMessage.warning(`发现 ${res.data.issues?.length || 0} 个合规问题`)
    }
  } catch (e) {
    console.error('合规检测失败', e)
    ElMessage.error('权限合规检测失败')
  }
}

const handleStatusCommand = (cmd: string, row: User) => {
  if (cmd === 'open') {
    openStatusDialog(row)
  } else if (cmd === 'freeze') {
    handleFreeze(row)
  } else if (cmd === 'unfreeze') {
    handleUnfreeze(row)
  }
}

const openStatusDialog = (row: User) => {
  statusForm.userId = row.id
  statusForm.username = row.nickname || row.username
  statusForm.avatar = row.avatar || ''
  statusForm.currentStatus = row.status
  statusForm.newStatus = row.status
  statusForm.freezeType = FreezeType.TEMPORARY
  statusForm.cancelType = CancelType.VOLUNTARY
  statusForm.reason = ''
  statusDialogVisible.value = true
}

const submitStatusChange = async () => {
  if (!statusForm.userId) return

  if (statusForm.newStatus !== 1 && !statusForm.reason.trim()) {
    ElMessage.warning('请输入变更原因')
    return
  }

  if (statusForm.newStatus === statusForm.currentStatus) {
    ElMessage.warning('新状态与当前状态相同')
    return
  }

  try {
    const res = await changeUserStatus(
      statusForm.userId,
      statusForm.newStatus,
      statusForm.newStatus === 2 ? statusForm.freezeType : undefined,
      statusForm.newStatus === 3 ? statusForm.cancelType : undefined,
      statusForm.reason
    )
    const result = res.data
    ElMessage.success(`状态变更成功，已回收${result.revokedPermissions.length}个权限，保留${result.retainedPermissions.length}个权限`)
    statusDialogVisible.value = false
    refreshTableRowLocally(result.user)
    loadStatistics()
  } catch (e) {
    console.error('状态变更失败', e)
    ElMessage.error('状态变更失败')
  }
}

const refreshTableRowLocally = (updatedUser: User) => {
  const idx = tableData.value.findIndex(r => r.id === updatedUser.id)
  if (idx !== -1) {
    tableData.value[idx] = { ...tableData.value[idx], ...updatedUser }
    const tableEl = tableRef.value?.$el || tableRef.value
    if (tableEl) {
      const rows = tableEl.querySelectorAll('.el-table__row')
      if (rows[idx]) {
        rows[idx].classList.add('row-update')
        setTimeout(() => {
          rows[idx]?.classList.remove('row-update')
        }, 1000)
      }
    }
  }
}

const openBatchGrantDialog = async () => {
  await loadSystemPermissions()
  batchGrantForm.scope = 'partial'
  batchGrantForm.permissionCodes = []
  batchGrantVisible.value = true
}

const openBatchRevokeDialog = async () => {
  await loadSystemPermissions()
  batchRevokeForm.scope = 'partial'
  batchRevokeForm.permissionCodes = []
  batchRevokeForm.reason = ''
  batchRevokeVisible.value = true
}

const openBatchResetDialog = () => {
  batchResetForm.scope = 'partial'
  batchResetVisible.value = true
}

const submitBatchGrant = async () => {
  if (batchGrantForm.permissionCodes.length === 0) {
    ElMessage.warning('请选择要授权的权限')
    return
  }
  try {
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchGrantPermissions(ids, batchGrantForm.permissionCodes, batchGrantForm.scope)
    showBatchResult(res.data, '批量授权')
    res.data.updatedUsers?.forEach(u => refreshTableRowLocally(u))
    batchGrantVisible.value = false
    clearSelection()
    loadStatistics()
  } catch (e) {
    console.error('批量授权失败', e)
    ElMessage.error('批量授权失败')
  }
}

const submitBatchRevoke = async () => {
  if (batchRevokeForm.permissionCodes.length === 0) {
    ElMessage.warning('请选择要回收的权限')
    return
  }
  if (!batchRevokeForm.reason.trim()) {
    ElMessage.warning('请输入回收原因')
    return
  }
  try {
    const ids = selectedRows.value.map(r => r.id)
    const res = await batchRevokePermissions(ids, batchRevokeForm.permissionCodes, batchRevokeForm.reason, batchRevokeForm.scope)
    showBatchResult(res.data, '批量回收')
    res.data.updatedUsers?.forEach(u => refreshTableRowLocally(u))
    batchRevokeVisible.value = false
    clearSelection()
    loadStatistics()
  } catch (e) {
    console.error('批量回收失败', e)
    ElMessage.error('批量回收失败')
  }
}

const submitBatchReset = async () => {
  try {
    await ElMessageBox.confirm(`确定要重置选中的 ${selectedRows.value.length} 个用户权限吗？`, '提示', { type: 'warning' })
    const ids = selectedRows.value.map(r => r.id)
    const res = await apiBatchResetPermissions(ids, batchResetForm.scope)
    showBatchResult(res.data, '批量重置权限')
    res.data.updatedUsers?.forEach(u => refreshTableRowLocally(u))
    batchResetVisible.value = false
    clearSelection()
    loadStatistics()
  } catch (e) {
    if ((e as any) !== 'cancel') {
      console.error('批量重置权限失败', e)
      ElMessage.error('批量重置权限失败')
    }
  }
}

watch(() => traceDialogVisible.value, async (visible) => {
  if (visible && currentUser.value) {
    try {
      const [traceRes, logsRes] = await Promise.all([
        getPermissionTrace(currentUser.value.id),
        getPermissionLogs(currentUser.value.id, 1, 50)
      ])
      permissionTraceData.value = traceRes.data
      permissionCompliance.value = traceRes.data.complianceCheck || null
      permissionLogs.value = logsRes.data.list || []
    } catch (e) {
      console.error('加载权限溯源数据失败', e)
    }
  }
})

const getLogTimelineType = (logType: number): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    1: 'success',
    2: 'danger',
    3: 'warning',
    4: 'primary',
    5: 'primary'
  }
  return map[logType] || 'info'
}

const parsePermissionCodes = (codes?: string): string[] => {
  if (!codes) return []
  try {
    if (codes.startsWith('[') || codes.startsWith('{')) {
      const parsed = JSON.parse(codes)
      return Array.isArray(parsed) ? parsed : []
    }
    return codes.split(',').filter(c => c.trim())
  } catch {
    return codes.split(',').filter(c => c.trim())
  }
}

const getComplianceProgressColor = (score?: number) => {
  if (score === undefined) return '#dcdfe6'
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

onMounted(() => {
  loadRegisterChannels()
  loadStatistics()
  fetchUserList()
  loadSystemPermissions()
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

.detail-dialog {
  :deep(.el-dialog__body) {
    padding-top: 0;
  }
}

.detail-tabs {
  :deep(.el-tabs__header) {
    margin: 0 -20px;
    padding: 0 20px;
  }
}

.permission-config-panel {
  padding: $spacing-base 0;
}

.permission-identity-card {
  background: linear-gradient(135deg, #f0f7ff 0%, #faf5ff 100%);
  border-radius: $radius-base;
  padding: $spacing-base;
  margin-bottom: $spacing-base;
  border: 1px solid #e4e7ed;
}

.identity-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: $spacing-base;
}

.permission-stats {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base 0;
  border-top: 1px dashed #e4e7ed;
  border-bottom: 1px dashed #e4e7ed;
  margin-bottom: $spacing-base;
}

.stat-item {
  flex: 1;
  text-align: center;

  .stat-num {
    font-size: 28px;
    font-weight: 700;
    color: $text-primary;
  }

  .stat-label {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-top: 4px;
  }

  &.granted .stat-num {
    color: $success-color;
  }
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #e4e7ed;
}

.permission-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}

.permission-groups-container {
  margin-top: $spacing-base;

  &.shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    border: 2px solid transparent;
    border-radius: $radius-base;
    padding: $spacing-xs;
  }

  &.shake {
    border-color: rgba(245, 108, 108);
  }
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.permission-group-card {
  margin-bottom: $spacing-base;

  :deep(.el-card__header) {
    padding: $spacing-sm $spacing-base;
  }

  :deep(.el-card__body) {
    padding: $spacing-sm $spacing-base;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid;
  padding-left: $spacing-sm;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: $font-size-base;

  .el-icon {
    font-size: 18px;
  }
}

.permission-item {
  margin-bottom: 8px;
}

.checkbox-wrapper {
  position: relative;
  padding: 6px 8px;
  border-radius: 4px;
  transition: all 0.2s;

  &.is-disabled-mask {
    position: relative;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 4px;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(200, 200, 200, 0.15);
      border-radius: 4px;
      pointer-events: none;
    }
  }

  .text-disabled {
    color: #c0c4cc;
  }

  .disable-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #c0c4cc;
    z-index: 2;
  }
}

.permission-save-bar {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: $spacing-sm;
  border-top: 1px solid #e4e7ed;
  margin: 0 -20px -20px;
  padding: $spacing-base 20px;
  display: flex;
  justify-content: center;
  gap: $spacing-sm;
  z-index: 10;
}

.status-user-info {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  padding: $spacing-base;
  background: $bg-color;
  border-radius: $radius-base;
  margin-bottom: $spacing-base;
}

.status-user-meta {
  flex: 1;
}

.status-username {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 4px;
}

.status-form {
  :deep(.el-radio-group) {
    padding-left: 0;
  }
}

.status-branch {
  padding: $spacing-sm 0;
  border-top: 1px dashed #e4e7ed;
}

.status-tip {
  padding: $spacing-sm;
  border-radius: $radius-base;
  margin-top: $spacing-sm;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: $font-size-sm;

  .el-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  &.tip-blue {
    background: rgba(64, 158, 255, 0.1);
    border: 1px solid rgba(64, 158, 255, 0.3);
    color: $primary-color;
  }

  &.tip-red {
    background: rgba(245, 108, 108, 0.1);
    border: 1px solid rgba(245, 108, 108, 0.3);
    color: $danger-color;

    &.strong {
      background: rgba(245, 108, 108, 0.15);
      font-weight: 500;
    }
  }

  &.tip-gray {
    background: rgba(144, 147, 153, 0.1);
    border: 1px solid rgba(144, 147, 153, 0.3);
    color: $text-secondary;
  }
}

.revoked-list {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.5);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.revoked-label {
  color: inherit;
  margin-right: 8px;
  font-weight: 500;
}

.status-fade-enter-active,
.status-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.status-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.smooth-enter-active,
.smooth-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.smooth-enter-from,
.smooth-leave-to {
  opacity: 0;
  transform: translateY(8px);
  max-height: 0;
}

.smooth-enter-to,
.smooth-leave-from {
  max-height: 500px;
  opacity: 1;
  transform: translateY(0);
}

.batch-info-bar {
  margin-bottom: $spacing-base;
}

.batch-scope-selector {
  padding: $spacing-base;
  background: $bg-color;
  border-radius: $radius-base;
  margin-bottom: $spacing-base;
}

.scope-label {
  margin-right: $spacing-sm;
  font-weight: 500;
  color: $text-primary;
}

.batch-permissions-section {
  margin: $spacing-base 0;
}

.batch-group-card {
  padding: $spacing-sm;
  background: $bg-color;
  border-radius: $radius-base;
  margin-bottom: $spacing-sm 0;
  border: 1px solid #e4e7ed;
}

.batch-group-title {
  font-weight: 600;
  margin-bottom: $spacing-xs;
  padding-bottom: $spacing-xs;
  border-bottom: 1px dashed #e4e7ed;
}

.batch-perm-item {
  padding: 4px 0;
}

.batch-super-admin-tip {
  font-size: $font-size-xs;
  color: $text-placeholder;
  padding: $spacing-xs 0;
  text-align: center;
}

.permission-overview-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #fff5f5 100%);
  border-radius: $radius-base;
  padding: $spacing-base;
  margin-bottom: $spacing-base;
}

.overview-header {
  margin-bottom: $spacing-base;
}

.overview-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: $spacing-sm;
}

.overview-item {
  background: #fff;
  padding: $spacing-sm;
  border-radius: $radius-base;
  text-align: center;
  border: 1px solid #ebeef5;

  .overview-num {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
  }

  .overview-label {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-top: 4px;
  }

  &.success .overview-num { color: $success-color; }
  &.danger .overview-num { color: $danger-color; }
  &.primary .overview-num { color: $primary-color; }
  &.warning .overview-num { color: $warning-color; }
  &.info {
    text-align: left;
    grid-column: span 1;
  }
}

.overview-small {
  .small-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: $font-size-sm;
    color: $text-regular;
    margin-bottom: 4px;

    .el-icon {
      color: $text-secondary;
    }
  }
}

.compliance-section {
  display: flex;
  gap: $spacing-base;
  align-items: flex-start;
}

.compliance-score-card {
  width: 180px;
  flex-shrink: 0;
  text-align: center;
  background: $bg-color;
  padding: $spacing-base;
  border-radius: $radius-base;
}

.compliance-score-label {
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.compliance-issues {
  flex: 1;
}

.section-title {
  font-weight: 600;
  font-size: $font-size-base;
  color: $text-primary;
  margin-bottom: $spacing-sm;
  display: flex;
  align-items: center;
  gap: 6px;
}

.compliance-issue-item {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-radius: $radius-base;
  margin-bottom: $spacing-xs;
  border-left: 4px solid;

  &.high {
    background: rgba(245, 108, 108, 0.08);
    border-left-color: $danger-color;
  }

  &.medium {
    background: rgba(230, 162, 60, 0.08);
    border-left-color: $warning-color;
  }

  &.low {
    background: rgba(103, 194, 58, 0.08);
    border-left-color: $success-color;
  }

  .issue-icon {
    flex-shrink: 0;
    font-size: 18px;
  }

  &.high .issue-icon { color: $danger-color; }
  &.medium .issue-icon { color: $warning-color; }
  &.low .issue-icon { color: $success-color; }

  .issue-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  .issue-message {
    color: $text-regular;
  }
}

.compliance-list-section {
  margin-top: $spacing-base;
  padding-top: $spacing-base;
  border-top: 1px dashed #e4e7ed;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
}

.log-item-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: $radius-base;
  padding: $spacing-sm;
}

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

.log-permissions {
  padding: $spacing-xs 0;
}

.more-perms {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-left: 4px;
}

.log-reason {
  font-size: $font-size-sm;
  color: $text-regular;
  margin-top: $spacing-xs;
  padding-top: $spacing-xs;
  border-top: 1px dashed #ebeef5;
  display: flex;
  align-items: center;
  gap: 4px;

  .el-icon {
    color: $text-secondary;
  }
}

.log-status-change {
  margin-top: $spacing-xs;
  padding-top: $spacing-xs;
  border-top: 1px dashed #ebeef5;
  display: flex;
  align-items: center;
}

.timeline-icon {
  font-size: 14px;
}

.row-update {
  animation: rowUpdate 1s ease-in-out;
}

@keyframes rowUpdate {
  0% { background-color: transparent; }
  25% { background-color: rgba(64, 158, 255, 0.2); }
  50% { background-color: rgba(64, 158, 255, 0.35); }
  75% { background-color: rgba(64, 158, 255, 0.2); }
  100% { background-color: transparent; }
}

@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

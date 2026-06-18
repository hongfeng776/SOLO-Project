<template>
  <div class="platform-users" :class="{ shake: shakeTrigger }">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="用户名/昵称/UID/手机号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filterForm.role" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card card-wrapper">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd" class="toolbar-btn">新增用户</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="!canBatchDelete"
            @click="handleBatchDelete"
            class="toolbar-btn"
          >
            批量删除
          </el-button>
          <el-button
            type="warning"
            :icon="Edit"
            :disabled="!canBatchUpdate"
            @click="handleBatchUpdateOpen"
            class="toolbar-btn"
          >
            批量修改
          </el-button>
          <el-tooltip
            v-if="!canBatchStatus"
            content="当前选中用户中包含无权操作账号，仅超级管理员可操作永久封禁"
            placement="top"
            :show-after="200"
          >
            <el-button
              type="warning"
              :icon="Warning"
              :disabled="selectedRows.length === 0"
              @click="handleBatchStatusOpen"
              class="toolbar-btn"
            >
              批量状态调整
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            type="warning"
            :icon="Warning"
            :disabled="selectedRows.length === 0"
            @click="handleBatchStatusOpen"
            class="toolbar-btn"
          >
            批量状态调整
          </el-button>
          <el-button
            type="info"
            :icon="Search"
            @click="handleTraceOpen"
            class="toolbar-btn"
          >
            溯源校验
          </el-button>
          <el-button
            type="success"
            :icon="Tag"
            @click="openTagDefinitionDialog"
            class="toolbar-btn"
          >
            标签定义
          </el-button>
          <el-button
            type="primary"
            :icon="Share"
            :disabled="!canBatchStatus"
            @click="openBatchTagDialog"
            class="toolbar-btn"
          >
            批量标签配置
          </el-button>
          <el-button
            class="toolbar-btn"
            type="danger"
            :icon="Warning"
            @click="openLoginLogDialog(null)"
          >登录日志</el-button>
        </div>
        <div class="toolbar-right">
          <el-tag type="info" class="role-tag">
            当前角色：{{ currentRoleLabel }}
          </el-tag>
        </div>
      </div>

      <BatchOperation :selected-count="selectedRows.length" @clear="handleClearSelection">
        <el-button size="small" type="success" @click="handleBatchStatusAction('active')">
          批量启用
        </el-button>
        <el-button size="small" type="warning" @click="handleBatchStatusAction('frozen')">
          批量冻结
        </el-button>
      </BatchOperation>

      <DataTable
        :data="tableData"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        show-selection
        @selection-change="handleSelectionChange"
        @refresh="fetchList"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="uid" label="UID" width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.uid" placement="top" :show-after="300">
              <span class="uid-text">{{ row.uid }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="110" />
        <el-table-column prop="nickname" label="昵称" width="110" />
        <el-table-column label="头像" width="70" align="center">
          <template #default="{ row }">
            <el-avatar :size="32" :src="row.avatar">
              {{ row.nickname?.charAt(0) || row.username?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.role" type="role" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <span
              class="status-glow-tag"
              :class="'status-' + row.status"
              :style="{ '--glow-color': getStatusGlowColor(row.status) }"
              @click="handleStatusChange(row)"
            >
              <el-tag :type="getStatusTagType(row.status)" size="small" effect="dark" :round="true">
                {{ UserStatusLabel[row.status] || row.status }}
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="180">
          <template #default="{ row }">
            <template v-if="row.tags && row.tags.length > 0">
              <el-tag
                v-for="tag in row.tags.slice(0, 2)"
                :key="tag"
                size="small"
                type="info"
                class="user-tag user-tag-item"
                @click="handleTagEdit(row)"
              >
                {{ tag }}
              </el-tag>
              <el-tooltip v-if="row.tags.length > 2" :content="row.tags.join('、')" placement="top">
                <el-tag
                  size="small"
                  type="info"
                  class="user-tag user-tag-item"
                  @click="handleTagEdit(row)"
                >+{{ row.tags.length - 2 }}</el-tag>
              </el-tooltip>
            </template>
            <span v-else class="text-muted" @click="handleTagEdit(row)" style="cursor:pointer;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="权限组" width="90" align="center">
          <template #default="{ row }">
            {{ PermissionGroupLabel[row.permissionGroup] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="会员等级" width="110" align="center">
          <template #default="{ row }">
            <span
              v-if="row.member"
              class="member-level-badge"
              :class="'lvl-' + getDisplayLevel(row.member?.level)"
              @click="handleLevelChange(row)"
            >
              <el-tag
                :type="DisplayMemberLevelTagType[getDisplayLevel(row.member?.level) || 'normal']"
                size="small"
                effect="dark"
                :round="true"
              >
                {{ DisplayMemberLevelLabel[getDisplayLevel(row.member?.level) || 'normal'] }}
              </el-tag>
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              :disabled="isFrozenOrBanned(row) && !canUnlock(row)"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              link
              size="small"
              :disabled="!canChangeStatus(row, 'frozen') && !canChangeStatus(row, 'temp_banned') && !canChangeStatus(row, 'permanent_banned') && !canChangeStatus(row, 'active')"
              @click="handleStatusChange(row)"
            >
              状态
            </el-button>
            <el-button type="info" link size="small" @click="handleViewStatusLogs(row)">历史</el-button>
            <el-button type="info" link size="small" @click="handleViewEditLogs(row)">变更</el-button>
            <el-button type="success" link size="small" @click="handleTraceOne(row)">溯源</el-button>
            <el-tooltip
              v-if="!canDelete(row)"
              content="仅有超级管理员可执行删除操作"
              placement="top"
              :show-after="200"
            >
              <el-button type="danger" link size="small" :disabled="true">删除</el-button>
            </el-tooltip>
            <el-button v-else type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            <el-tooltip
              v-if="!canChangeLevel(row)"
              content="仅超级管理员和管理员可操作层级"
              placement="top"
              :show-after="200"
            >
              <el-button
                type="success"
                link
                size="small"
                :disabled="!canChangeLevel(row)"
                @click="handleLevelChange(row)"
              >
                层级
              </el-button>
            </el-tooltip>
            <el-button
              v-else
              type="success"
              link
              size="small"
              @click="handleLevelChange(row)"
            >
              层级
            </el-button>
            <el-button
              type="warning"
              link
              size="small"
              @click="handleTagEdit(row)"
            >
              标签
            </el-button>
            <el-button
              type="info"
              link
              size="small"
              @click="handleTagTrace(row)"
            >
              溯源标签
            </el-button>
            <el-tooltip content="登录记录" placement="top" :show-after="100">
              <el-button link type="primary" @click="openLoginLogDialog(row)">
                <el-icon><View /></el-icon>&nbsp;登录
              </el-button>
            </el-tooltip>
            <el-tooltip content="设备管控" placement="top" :show-after="100">
              <el-button link type="warning" @click="openDeviceDialog(row)">
                <el-icon><Monitor /></el-icon>&nbsp;设备
              </el-button>
            </el-tooltip>
            <el-tooltip content="登录风控" placement="top" :show-after="100">
              <el-button link type="danger" @click="openLoginRiskDialog(row)">
                <el-icon><DataAnalysis /></el-icon>&nbsp;风控
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </DataTable>
    </div>

    <el-dialog
      v-model="createDialogVisible"
      title="新增用户"
      width="560px"
      @closed="handleCreateDialogClosed"
      class="create-dialog"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <div class="validated-input-wrap">
            <el-input
              v-model="createForm.username"
              placeholder="请输入用户名"
              class="focus-scale-input"
              @blur="validateField('username')"
            />
            <el-icon v-if="fieldValidation.username.valid" class="check-icon success"><CircleCheckFilled /></el-icon>
            <el-icon v-if="!fieldValidation.username.valid && fieldValidation.username.errors.length" class="check-icon error"><CircleCloseFilled /></el-icon>
          </div>
          <div v-if="fieldValidation.username.errors.length" class="field-error">
            {{ fieldValidation.username.errors.join('; ') }}
          </div>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="请输入密码" show-password class="focus-scale-input" />
        </el-form-item>
        <el-form-item label="UID" prop="uid">
          <div class="validated-input-wrap">
            <el-input
              v-model="createForm.uid"
              placeholder="留空自动生成"
              class="focus-scale-input"
              @blur="validateField('uid')"
            >
              <template #append>
                <el-button @click="generateUid">自动生成</el-button>
              </template>
            </el-input>
            <el-icon v-if="fieldValidation.uid.valid && createForm.uid" class="check-icon success"><CircleCheckFilled /></el-icon>
            <el-icon v-if="!fieldValidation.uid.valid && fieldValidation.uid.errors.length" class="check-icon error"><CircleCloseFilled /></el-icon>
          </div>
          <div v-if="fieldValidation.uid.errors.length" class="field-error">
            {{ fieldValidation.uid.errors.join('; ') }}
          </div>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <div class="validated-input-wrap">
            <el-input
              v-model="createForm.nickname"
              placeholder="请输入昵称"
              class="focus-scale-input"
              @blur="validateField('nickname')"
            />
            <el-icon v-if="fieldValidation.nickname.valid && createForm.nickname" class="check-icon success"><CircleCheckFilled /></el-icon>
            <el-icon v-if="!fieldValidation.nickname.valid && fieldValidation.nickname.errors.length" class="check-icon error"><CircleCloseFilled /></el-icon>
          </div>
          <div v-if="fieldValidation.nickname.errors.length" class="field-error">
            {{ fieldValidation.nickname.errors.join('; ') }}
          </div>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <div class="validated-input-wrap">
            <el-input
              v-model="createForm.phone"
              placeholder="请输入手机号"
              class="focus-scale-input"
              @blur="validateField('phone')"
            />
            <el-icon v-if="fieldValidation.phone.valid && createForm.phone" class="check-icon success"><CircleCheckFilled /></el-icon>
            <el-icon v-if="!fieldValidation.phone.valid && fieldValidation.phone.errors.length" class="check-icon error"><CircleCloseFilled /></el-icon>
          </div>
          <div v-if="fieldValidation.phone.errors.length" class="field-error">
            {{ fieldValidation.phone.errors.join('; ') }}
          </div>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="createForm.email" placeholder="请输入邮箱" class="focus-scale-input" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权限分组" prop="permissionGroup">
          <el-select v-model="createForm.permissionGroup" placeholder="请选择权限分组" style="width: 100%">
            <el-option
              v-for="item in permissionGroupOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="createForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCreateSubmit">确认创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      :title="'编辑用户 - ' + (editForm.username || '')"
      width="620px"
      @closed="handleEditDialogClosed"
      class="edit-dialog"
    >
      <div class="edit-steps">
        <div
          class="step-indicator"
          :class="{ active: editStep === 1, completed: editStep > 1 }"
          @click="editStep = 1"
        >
          <span class="step-num">1</span>
          <span class="step-label">基础信息</span>
        </div>
        <div class="step-line" :class="{ active: editStep > 1 }"></div>
        <div
          class="step-indicator"
          :class="{ active: editStep === 2, completed: editStep > 2 }"
          @click="editStep = 2"
        >
          <span class="step-num">2</span>
          <span class="step-label">核心信息</span>
        </div>
        <div class="step-line" :class="{ active: editStep > 2 }"></div>
        <div
          class="step-indicator"
          :class="{ active: editStep === 3 }"
          @click="editStep = 3"
        >
          <span class="step-num">3</span>
          <span class="step-label">标签权限</span>
        </div>
      </div>

      <div class="edit-step-content">
        <div v-show="editStep === 1" class="step-panel">
          <el-form :model="editForm" label-width="90px">
            <el-form-item label="用户名">
              <el-input :model-value="editForm.username" disabled />
            </el-form-item>
            <el-form-item label="UID">
              <el-input :model-value="editForm.uid" disabled />
            </el-form-item>
            <el-alert
              v-if="['frozen', 'temp_banned', 'permanent_banned'].includes(editForm.status)"
              :title="'当前账号状态为【' + UserStatusLabel[editForm.status] + '】，' + (editForm.status === 'frozen' ? '仅支持查看和状态回滚' : '禁止编辑所有核心字段')"
              type="error"
              :closable="false"
              show-icon
              class="core-field-alert"
            />
            <el-form-item label="昵称">
              <div class="validated-input-wrap">
                <el-input
                  v-model="editForm.nickname"
                  placeholder="请输入昵称"
                  :disabled="['temp_banned', 'permanent_banned'].includes(editForm.status)"
                  class="focus-scale-input"
                  @blur="validateEditField('nickname')"
                />
                <el-icon v-if="editFieldValidation.nickname.valid && editForm.nickname" class="check-icon success"><CircleCheckFilled /></el-icon>
                <el-icon v-if="!editFieldValidation.nickname.valid && editFieldValidation.nickname.errors.length" class="check-icon error"><CircleCloseFilled /></el-icon>
              </div>
              <div v-if="editFieldValidation.nickname.errors.length" class="field-error">
                {{ editFieldValidation.nickname.errors.join('; ') }}
              </div>
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="editForm.email" placeholder="请输入邮箱" :disabled="['temp_banned', 'permanent_banned'].includes(editForm.status)" class="focus-scale-input" />
            </el-form-item>
            <el-form-item label="头像">
              <el-input v-model="editForm.avatar" placeholder="头像URL" :disabled="['temp_banned', 'permanent_banned'].includes(editForm.status)" class="focus-scale-input" />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="editForm.role" style="width: 100%" :disabled="['temp_banned', 'permanent_banned'].includes(editForm.status)">
                <el-option
                  v-for="item in roleOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <div v-show="editStep === 2" class="step-panel">
          <el-alert
            v-if="['frozen', 'temp_banned', 'permanent_banned'].includes(editForm.status)"
            :title="'当前账号状态为【' + UserStatusLabel[editForm.status] + '】，禁止修改手机号、登录密码等核心字段'"
            type="error"
            :closable="false"
            show-icon
            class="core-field-alert"
          />
          <el-alert
            v-else
            title="修改手机号、密码等核心字段需二次身份校验"
            type="warning"
            :closable="false"
            show-icon
            class="core-field-alert"
          />
          <el-form :model="editForm" label-width="90px">
            <el-form-item label="手机号">
              <div class="validated-input-wrap">
                <el-input
                  v-model="editForm.phone"
                  placeholder="请输入手机号"
                  :disabled="['frozen', 'temp_banned', 'permanent_banned'].includes(editForm.status)"
                  class="focus-scale-input"
                  @blur="validateEditField('phone')"
                />
                <el-icon v-if="editFieldValidation.phone.valid && editForm.phone" class="check-icon success"><CircleCheckFilled /></el-icon>
                <el-icon v-if="!editFieldValidation.phone.valid && editFieldValidation.phone.errors.length" class="check-icon error"><CircleCloseFilled /></el-icon>
              </div>
              <div v-if="editFieldValidation.phone.errors.length" class="field-error">
                {{ editFieldValidation.phone.errors.join('; ') }}
              </div>
            </el-form-item>
            <el-form-item label="新密码">
              <el-input
                v-model="editForm.newPassword"
                type="password"
                placeholder="留空则不修改"
                show-password
                :disabled="['frozen', 'temp_banned', 'permanent_banned'].includes(editForm.status)"
                class="focus-scale-input"
              />
            </el-form-item>
            <el-form-item v-if="!['frozen', 'temp_banned', 'permanent_banned'].includes(editForm.status) && (editForm.phone !== editOriginal.phone || editForm.newPassword)" label="身份校验" prop="verifyPassword">
              <el-input
                v-model="editForm.verifyPassword"
                type="password"
                placeholder="请输入当前管理员密码进行二次校验"
                show-password
                class="focus-scale-input"
              />
            </el-form-item>
          </el-form>
        </div>

        <div v-show="editStep === 3" class="step-panel">
          <el-form :model="editForm" label-width="90px">
            <el-form-item label="标签">
              <el-select
                v-model="editForm.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入标签后回车"
                style="width: 100%"
                :disabled="['temp_banned', 'permanent_banned'].includes(editForm.status)"
              />
            </el-form-item>
            <el-form-item label="权限分组">
              <el-select v-model="editForm.permissionGroup" style="width: 100%" :disabled="['temp_banned', 'permanent_banned'].includes(editForm.status)">
                <el-option
                  v-for="item in permissionGroupOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="editForm.remark"
                type="textarea"
                :rows="3"
                placeholder="编辑备注"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="edit-dialog-footer">
          <el-button v-if="editStep > 1" @click="editStep--">上一步</el-button>
          <el-button v-if="editStep < 3" type="primary" @click="editStep++">下一步</el-button>
          <el-button v-if="editStep === 3" type="primary" :loading="submitLoading" :disabled="['temp_banned', 'permanent_banned'].includes(editForm.status)" @click="handleEditSubmit">
            确认修改
          </el-button>
          <el-button @click="editDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="statusDialogVisible"
      :title="'调整账号状态 - ' + (statusUser?.username || '')"
      width="560px"
      class="status-change-dialog scale-fade-dialog"
      @open="handleStatusDialogOpen"
    >
      <el-steps :active="statusStep" finish-status="success" class="status-steps">
        <el-step title="风控预检" />
        <el-step title="原因与到期" />
        <el-step title="权限联动预览" />
      </el-steps>

      <div v-if="statusStep === 1" class="status-step-panel">
        <el-descriptions title="当前账号信息" :column="1" border size="small" class="status-desc">
          <el-descriptions-item label="用户名">{{ statusUser?.username }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <span
              class="status-glow-tag"
              :class="'status-' + statusUser?.status"
              :style="{ '--glow-color': getStatusGlowColor(statusUser?.status || '') }"
            >
              <el-tag :type="getStatusTagType(statusUser?.status || '')" size="small" effect="dark">
                {{ UserStatusLabel[statusUser?.status || ''] }}
              </el-tag>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="会员等级">
            <StatusTag v-if="statusUser?.member" :status="statusUser.member.level" type="member" />
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-form label-width="100px" class="status-form">
          <el-form-item label="目标状态" required>
            <el-radio-group v-model="statusForm.newStatus" @change="handlePreviewStatusChange">
              <div
                v-for="opt in allowedStatusOptions"
                :key="opt.value"
                class="status-option"
                :class="{
                  disabled: !canChangeStatus(statusUser!, opt.value),
                  selected: statusForm.newStatus === opt.value
                }"
              >
                <el-radio
                  :value="opt.value"
                  :disabled="!canChangeStatus(statusUser!, opt.value)"
                >
                  {{ opt.label }}
                </el-radio>
                <el-tooltip
                  v-if="!canChangeStatus(statusUser!, opt.value)"
                  :content="getStatusDisabledReason(statusUser!, opt.value)"
                  placement="right"
                  :show-after="100"
                >
                  <el-icon class="lock-icon"><Lock /></el-icon>
                </el-tooltip>
              </div>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <div v-if="riskPreview" class="risk-preview">
          <el-alert
            v-if="!riskPreview.mutex.valid"
            :title="riskPreview.mutex.reason"
            type="error"
            show-icon
            :closable="false"
          />
          <el-alert
            v-else-if="!riskPreview.appeal.valid"
            :title="riskPreview.appeal.reason"
            type="error"
            show-icon
            :closable="false"
          />
          <el-alert
            v-else-if="!riskPreview.role.valid"
            :title="riskPreview.role.reason + '。允许: ' + (riskPreview.role.allowed || '')"
            type="error"
            show-icon
            :closable="false"
          />
          <el-alert
            v-else-if="riskPreview.frequency.blocked"
            :title="'高频变更拦截：' + riskPreview.frequency.violations.map(v => v.message).join('；')"
            type="error"
            show-icon
            :closable="false"
          >
            <template #default>
              <el-button type="danger" plain size="small" @click="handleForceSubmitEnable">
                强制提交（仅超级管理员）
              </el-button>
            </template>
          </el-alert>
          <el-alert
            v-else-if="riskPreview.match.warning"
            :title="riskPreview.match.reason"
            type="warning"
            show-icon
            :closable="false"
          />

          <el-descriptions title="7天变更频次统计" :column="2" border size="small" v-if="riskPreview.frequency.stats">
            <el-descriptions-item label="同状态变更次数">
              <span :class="{ danger: riskPreview.frequency.stats.sameStatusCount >= 3 }">
                {{ riskPreview.frequency.stats.sameStatusCount }} 次
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="总变更次数">
              <span :class="{ danger: riskPreview.frequency.stats.totalCount >= 10 }">
                {{ riskPreview.frequency.stats.totalCount }} 次
              </span>
            </el-descriptions-item>
          </el-descriptions>

          <el-descriptions title="关联未处置项" :column="1" border size="small" v-if="riskPreview.pendingAppeals.length || riskPreview.unresolvedViolations.length">
            <el-descriptions-item v-if="riskPreview.pendingAppeals.length" label="处理中申诉">
              <el-tag
                v-for="a in riskPreview.pendingAppeals"
                :key="a.id"
                size="small"
                type="warning"
                class="log-tag"
              >
                申诉#{{ a.id }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="riskPreview.unresolvedViolations.length" label="未处置违规">
              <el-tag
                v-for="v in riskPreview.unresolvedViolations"
                :key="v.id"
                size="small"
                :type="v.level === 'severe' ? 'danger' : 'warning'"
                class="log-tag"
              >
                {{ v.type }}({{ v.level }})
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <div v-if="statusStep === 2" class="status-step-panel">
        <el-form :model="statusForm" label-width="100px" class="status-form">
          <el-form-item label="变更原因" required>
            <el-input
              v-model="statusForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请填写变更原因，便于后续溯源"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item v-if="statusForm.newStatus === 'temp_banned'" label="到期时间">
            <el-date-picker
              v-model="statusForm.statusExpireAt"
              type="datetime"
              placeholder="选择临时封禁到期时间"
              style="width: 100%"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="操作确认">
            <el-checkbox v-model="statusForm.confirm">
              我已确认该状态变更符合风控规范
            </el-checkbox>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="statusStep === 3" class="status-step-panel">
        <el-descriptions title="变更摘要" :column="1" border size="small">
          <el-descriptions-item label="变更状态">
            {{ UserStatusLabel[statusUser?.status || ''] }} →
            <span
              class="status-glow-tag"
              :class="'status-' + statusForm.newStatus"
              :style="{ '--glow-color': getStatusGlowColor(statusForm.newStatus) }"
            >
              <el-tag :type="getStatusTagType(statusForm.newStatus)" size="small" effect="dark">
                {{ UserStatusLabel[statusForm.newStatus] }}
              </el-tag>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="变更原因">{{ statusForm.reason || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="statusForm.newStatus === 'temp_banned'" label="到期时间">
            {{ statusForm.statusExpireAt || '未设置' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="permission-sync-preview">
          <h4 class="preview-title">联动同步的用户功能权限</h4>
          <div class="perm-grid">
            <div
              v-for="(enabled, key) in riskPreview?.functionPermissions || {}"
              :key="key"
              class="perm-item"
              :class="enabled ? 'enabled' : 'disabled'"
            >
              <el-icon v-if="enabled" class="perm-icon ok"><CircleCheckFilled /></el-icon>
              <el-icon v-else class="perm-icon no"><CircleCloseFilled /></el-icon>
              <span>{{ FunctionPermissionLabels[key as keyof typeof FunctionPermissionLabels] }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button v-if="statusStep > 1" @click="statusStep--">上一步</el-button>
        <el-button
          v-if="statusStep < 3"
          type="primary"
          :disabled="statusStep === 1 && (!statusForm.newStatus || !riskPreview?.mutex.valid || !riskPreview?.appeal.valid || !riskPreview?.role.valid || (riskPreview.frequency.blocked && !statusForm.force))"
          @click="statusStep++"
        >
          下一步
        </el-button>
        <el-button
          v-if="statusStep === 3"
          type="primary"
          :loading="submitLoading"
          :disabled="!statusForm.confirm"
          @click="handleStatusSubmit"
        >
          确认提交
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchStatusDialogVisible"
      title="批量调整账号状态"
      width="560px"
      class="batch-status-dialog scale-fade-dialog"
    >
      <el-alert
        title="系统将根据操作人角色自动过滤无权操作账号，VIP用户需谨慎处理"
        type="warning"
        show-icon
        :closable="false"
        class="batch-alert"
      />
      <div class="batch-summary">
        已选 <em>{{ selectedRows.length }}</em> 个用户，预计可操作 <em>{{ allowedBatchCount }}</em> 个
      </div>
      <el-form label-width="100px" class="status-form">
        <el-form-item label="目标状态" required>
          <el-radio-group v-model="batchStatusForm.newStatus">
            <div
              v-for="opt in batchAllowedOptions"
              :key="opt.value"
              class="status-option"
              :class="{ selected: batchStatusForm.newStatus === opt.value }"
            >
              <el-radio :value="opt.value">
                {{ opt.label }}
              </el-radio>
            </div>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="变更原因" required>
          <el-input
            v-model="batchStatusForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请填写变更原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="batchStatusForm.newStatus === 'temp_banned'" label="到期时间">
          <el-date-picker
            v-model="batchStatusForm.statusExpireAt"
            type="datetime"
            placeholder="选择临时封禁到期时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="操作确认">
          <el-checkbox v-model="batchStatusForm.confirm">
            我已确认该批量状态变更符合风控规范
          </el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchStatusDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="!batchStatusForm.confirm || !batchStatusForm.newStatus" @click="handleBatchStatusSubmit">
          确认提交
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchUpdateDialogVisible"
      title="批量修改用户信息"
      width="520px"
      class="batch-dialog scale-fade-dialog"
    >
      <el-alert
        title="批量修改将根据用户等级和账号状态差异化适配修改规则，VIP用户核心标签禁止批量修改"
        type="warning"
        :closable="false"
        show-icon
        class="batch-alert"
      />
      <div class="batch-selected-info">
        已选择 <em>{{ selectedRows.length }}</em> 个用户
      </div>
      <el-form :model="batchForm" label-width="100px" class="batch-form">
        <el-form-item label="昵称后缀">
          <el-input v-model="batchForm.nicknameSuffix" placeholder="追加到现有昵称末尾" class="batch-input" />
        </el-form-item>
        <el-form-item label="添加标签">
          <el-select
            v-model="batchForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车"
            style="width: 100%"
            class="batch-input"
          />
        </el-form-item>
        <el-form-item label="权限分组">
          <el-select v-model="batchForm.permissionGroup" placeholder="选择权限分组" clearable style="width: 100%" class="batch-input">
            <el-option
              v-for="item in permissionGroupOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchUpdateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleBatchUpdateSubmit" class="batch-submit-btn">
          确认批量修改
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      title="账号信息溯源校验"
      width="900px"
      class="trace-dialog scale-fade-dialog"
    >
      <div class="trace-search">
        <el-form :inline="true" :model="traceForm" class="trace-search-form">
          <el-form-item label="UID">
            <el-input v-model="traceForm.uid" placeholder="用户UID" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="traceForm.phone" placeholder="手机号" clearable style="width: 140px" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="traceForm.username" placeholder="用户名" clearable style="width: 140px" />
          </el-form-item>
          <el-form-item label="注册时间">
            <el-date-picker
              v-model="traceForm.registerTimeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 260px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" :loading="traceLoading" @click="handleTraceSearch">检索</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="trace-results" v-loading="traceLoading" element-loading-background="rgba(255,255,255,0.8)">
        <template v-if="traceLoading">
          <div class="skeleton-wrap">
            <div v-for="i in 3" :key="i" class="skeleton-item">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="traceResults.length > 0">
          <div
            v-for="item in traceResults"
            :key="item.user.id"
            class="trace-result-card"
            :class="{ 'has-warning': !item.consistencyCheck.consistent }"
          >
            <div class="trace-user-info">
              <el-avatar :size="40" :src="item.user.avatar">
                {{ item.user.nickname?.charAt(0) || item.user.username?.charAt(0) }}
              </el-avatar>
              <div class="trace-user-detail">
                <div class="trace-user-name">
                  {{ item.user.nickname || item.user.username }}
                  <span
                    class="status-glow-tag"
                    :class="'status-' + item.user.status"
                    :style="{ '--glow-color': getStatusGlowColor(item.user.status) }"
                  >
                    <el-tag :type="getStatusTagType(item.user.status)" size="small" effect="dark">
                      {{ UserStatusLabel[item.user.status] }}
                    </el-tag>
                  </span>
                  <StatusTag v-if="item.member" :status="item.member.level" type="member" />
                </div>
                <div class="trace-user-meta">
                  <span>UID: {{ item.user.uid }}</span>
                  <span>手机: {{ item.user.phone || '-' }}</span>
                  <span>注册: {{ formatDate(item.user.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="trace-consistency">
              <div class="consistency-header">
                <span class="consistency-label">一致性校验</span>
                <el-tag :type="item.consistencyCheck.consistent ? 'success' : 'danger'" size="small">
                  {{ item.consistencyCheck.consistent ? '数据一致' : '存在异常' }}
                </el-tag>
              </div>
              <div v-if="item.consistencyCheck.inconsistencies.length" class="inconsistency-list">
                <div
                  v-for="(inc, idx) in item.consistencyCheck.inconsistencies"
                  :key="idx"
                  class="inconsistency-item"
                  :class="'severity-' + inc.severity"
                >
                  <el-icon><Warning /></el-icon>
                  <span>{{ inc.description }}</span>
                </div>
              </div>
            </div>
            <div class="trace-edit-logs" v-if="item.editLogs.length">
              <el-collapse>
                <el-collapse-item :title="'编辑记录 (' + item.editLogs.length + '条)'">
                  <div v-for="log in item.editLogs.slice(0, 10)" :key="log.id" class="edit-log-item">
                    <span class="log-field">{{ log.field }}</span>
                    <span class="log-change">
                      <span class="old-val">{{ truncateStr(log.oldValue, 30) }}</span>
                      <el-icon><Right /></el-icon>
                      <span class="new-val">{{ truncateStr(log.newValue, 30) }}</span>
                    </span>
                    <el-tooltip :content="'操作人: ' + log.editorName + ' | IP: ' + log.ip + ' | 时间: ' + formatDate(log.createdAt)" placement="top">
                      <span class="log-time">{{ formatDate(log.createdAt) }}</span>
                    </el-tooltip>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </template>
        <template v-else-if="traceSearched">
          <EmptyState description="未检索到匹配的账号信息" />
        </template>
      </div>

      <div class="trace-pagination" v-if="traceTotal > 0">
        <el-pagination
          v-model:current-page="tracePage"
          :page-size="10"
          :total="traceTotal"
          layout="total, prev, pager, next"
          @current-change="handleTraceSearch"
        />
      </div>
    </el-dialog>

    <el-dialog
      v-model="editLogDialogVisible"
      :title="'变更记录 - ' + (editLogUser?.username || '')"
      width="700px"
      class="scale-fade-dialog"
    >
      <el-tabs v-model="editLogActiveTab" class="edit-log-tabs">
        <el-tab-pane label="编辑变更" name="edit">
          <el-table :data="editLogData" v-loading="editLogLoading" max-height="400">
            <el-table-column prop="field" label="字段" width="100" />
            <el-table-column label="原值" width="180">
              <template #default="{ row }">
                <el-tooltip :content="row.oldValue" placement="top" :disabled="!row.oldValue || row.oldValue.length <= 30">
                  <span>{{ truncateStr(row.oldValue, 30) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="新值" width="180">
              <template #default="{ row }">
                <el-tooltip :content="row.newValue" placement="top" :disabled="!row.newValue || row.newValue.length <= 30">
                  <span>{{ truncateStr(row.newValue, 30) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="editorName" label="操作人" width="100" />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="状态变更" name="status">
          <el-table :data="statusLogData" v-loading="statusLogLoading" max-height="400">
            <el-table-column label="原状态" width="110">
              <template #default="{ row }">
                <span v-if="row.oldStatus">
                  {{ UserStatusLabel[row.oldStatus] }}
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="新状态" width="110">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.newStatus)" size="small" effect="dark">
                  {{ UserStatusLabel[row.newStatus] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="变更原因" min-width="140">
              <template #default="{ row }">
                <el-tooltip :content="row.reason" placement="top" :disabled="!row.reason || row.reason.length <= 20">
                  <span>{{ truncateStr(row.reason, 20) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="90" />
            <el-table-column label="变更类型" width="100">
              <template #default="{ row }">
                {{ ChangeTypeLabel[row.changeType] || row.changeType }}
              </template>
            </el-table-column>
            <el-table-column label="时间" width="150">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="标签日志" name="tagLog">
          <el-table :data="tagLogData" v-loading="tagLogLoading" max-height="400" class="zebra-table sticky-header-table">
            <el-table-column label="标签" width="140">
              <template #default="{ row }">
                <template v-if="row.addedTags?.length">
                  <el-tag v-for="t in row.addedTags" :key="'a'+t" size="small" type="success" effect="light" style="margin-right:4px;">+{{ t }}</el-tag>
                </template>
                <template v-if="row.removedTags?.length">
                  <el-tag v-for="t in row.removedTags" :key="'r'+t" size="small" type="danger" effect="light" style="margin-right:4px;">-{{ t }}</el-tag>
                </template>
              </template>
            </el-table-column>
            <el-table-column label="变更类型" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.changeType === 'add'" size="small" type="success">新增</el-tag>
                <el-tag v-else-if="row.changeType === 'remove'" size="small" type="danger">移除</el-tag>
                <el-tag v-else size="small">{{ row.changeType || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="140">
              <template #default="{ row }">
                <el-tooltip :content="row.reason" placement="top" :disabled="!row.reason || row.reason.length <= 20">
                  <span>{{ truncateStr(row.reason, 20) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="90" />
            <el-table-column label="时间" width="150">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="层级日志" name="levelLog">
          <el-table :data="levelLogData" v-loading="levelLogLoading" max-height="400" class="zebra-table sticky-header-table">
            <el-table-column label="原层级" width="110">
              <template #default="{ row }">
                <span v-if="row.oldLevel">
                  {{ DisplayMemberLevelLabel[getDisplayLevel(row.oldLevel)] || row.oldLevel }}
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="新层级" width="110">
              <template #default="{ row }">
                <el-tag
                  v-if="row.newLevel"
                  :type="DisplayMemberLevelTagType[getDisplayLevel(row.newLevel)] || 'info'"
                  size="small"
                  effect="dark"
                >
                  {{ DisplayMemberLevelLabel[getDisplayLevel(row.newLevel)] || row.newLevel }}
                </el-tag>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="是否达标" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.metCriteria === true" size="small" type="success">达标</el-tag>
                <el-tag v-else-if="row.metCriteria === false" size="small" type="warning">强制</el-tag>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="140">
              <template #default="{ row }">
                <el-tooltip :content="row.reason" placement="top" :disabled="!row.reason || row.reason.length <= 20">
                  <span>{{ truncateStr(row.reason, 20) }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="90" />
            <el-table-column label="时间" width="150">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog
      v-model="tagDialogVisible"
      title="标签定义管理"
      width="860px"
      class="tag-definition-dialog"
    >
      <div class="tag-def-toolbar">
        <el-button type="primary" :icon="Plus" @click="showTagDefForm = true">新增标签</el-button>
        <div class="tag-def-filters">
          <el-select v-model="tagDefFilter.dimension" placeholder="维度筛选" clearable style="width:140px;" size="default">
            <el-option
              v-for="opt in TAG_DIMENSION_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-select v-model="tagDefFilter.status" placeholder="状态筛选" clearable style="width:120px;" size="default">
            <el-option label="启用中" value="active" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
          <el-button :icon="Refresh" size="default" @click="loadTagDefinitions">刷新</el-button>
        </div>
      </div>

      <el-form v-if="showTagDefForm" :model="tagDefForm" label-width="110px" class="tag-def-form border-card">
        <el-divider content-position="left">{{ tagDefEditingId ? '编辑标签' : '新增标签' }}</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标签名称">
              <el-input
                v-model="tagDefForm.name"
                placeholder="请输入标签名称"
                :class="['tag-name-input', 'focus-color', { 'error-border': !tagDefNameValid }]"
                @blur="validateTagDefName"
              />
              <div v-if="!tagDefNameValid && tagDefNameError" class="field-error">
                {{ tagDefNameError }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签颜色">
              <el-color-picker v-model="tagDefForm.color" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属维度">
              <el-select v-model="tagDefForm.dimension" style="width:100%;">
                <el-option
                  v-for="opt in TAG_DIMENSION_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用层级">
              <el-checkbox-group v-model="tagDefForm.applicableLevels">
                <el-checkbox
                  v-for="opt in USER_LEVEL_OPTIONS"
                  :key="opt.value"
                  :label="opt.value"
                >{{ opt.label }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最低消费(元)">
              <el-input-number v-model="tagDefForm.minConsumeAmount" :min="0" :step="100" style="width:100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最少活跃(小时)">
              <el-input-number v-model="tagDefForm.minActiveHours" :min="0" :step="10" style="width:100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最少创作(个)">
              <el-input-number v-model="tagDefForm.minCreateCount" :min="0" :step="5" style="width:100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标签描述">
              <el-input
                v-model="tagDefForm.description"
                type="textarea"
                :rows="2"
                placeholder="请输入标签描述（可选）"
                class="focus-color"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div style="text-align:right; margin-bottom:8px;">
          <el-button @click="cancelTagDefForm">取消</el-button>
          <el-button type="primary" @click="handleSaveTagDef" :loading="tagDefSaving">
            {{ tagDefEditingId ? '保存修改' : '确认创建' }}
          </el-button>
        </div>
      </el-form>

      <el-table
        :data="filteredTagDefinitions"
        v-loading="tagDefLoading"
        height="380"
        class="zebra-table sticky-header-table"
        :header-cell-style="{position:'sticky', top:'0', zIndex:2}"
      >
        <el-table-column label="标签" width="150">
          <template #default="{ row }">
            <el-tag
              :style="{ backgroundColor: row.color + '33', color: row.color, borderColor: row.color }"
              effect="light"
              size="small"
            >
              {{ row.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="维度" width="100">
          <template #default="{ row }">
            {{ TagDimensionLabel[row.dimension] || row.dimension }}
          </template>
        </el-table-column>
        <el-table-column label="适用层级" min-width="140">
          <template #default="{ row }">
            <template v-if="row.applicableLevels?.length">
              <el-tag
                v-for="lvl in row.applicableLevels"
                :key="lvl"
                size="small"
                style="margin-right:4px;"
              >
                {{ USER_LEVEL_OPTIONS.find(o => o.value === lvl)?.label || lvl }}
              </el-tag>
            </template>
            <span v-else class="text-muted">全部</span>
          </template>
        </el-table-column>
        <el-table-column label="消费≥" width="80" align="right">
          <template #default="{ row }">{{ row.minConsumeAmount || 0 }}</template>
        </el-table-column>
        <el-table-column label="活跃≥h" width="80" align="right">
          <template #default="{ row }">{{ row.minActiveHours || 0 }}</template>
        </el-table-column>
        <el-table-column label="创作≥" width="80" align="right">
          <template #default="{ row }">{{ row.minCreateCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEditTagDef(row)">编辑</el-button>
            <el-button
              :type="row.status === 'active' ? 'warning' : 'success'"
              link
              size="small"
              @click="handleToggleTagDefStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog
      v-model="levelDialogVisible"
      title="调整用户层级"
      width="620px"
      class="level-change-dialog ripple-dialog"
      :class="{ 'ripple-trigger': rippleTrigger }"
      @opened="handleLevelDialogOpened"
    >
      <div class="ripple-effect"></div>
      <el-steps :active="levelStep" finish-status="success" align-center style="margin-bottom:24px;">
        <el-step title="达标校验" />
        <el-step title="权益预览" />
        <el-step title="确认提交" />
      </el-steps>

      <div v-show="levelStep === 1" class="level-step-panel">
        <el-descriptions v-if="levelUser" title="当前用户信息" :column="2" border size="small" class="border-card">
          <el-descriptions-item label="用户名">{{ levelUser.username }}</el-descriptions-item>
          <el-descriptions-item label="UID">{{ levelUser.uid }}</el-descriptions-item>
          <el-descriptions-item label="当前层级">
            <el-tag
              v-if="levelUser.member"
              :type="DisplayMemberLevelTagType[getDisplayLevel(levelUser.member.level)] || 'info'"
              effect="dark"
              size="small"
            >
              {{ DisplayMemberLevelLabel[getDisplayLevel(levelUser.member.level)] || '-' }}
            </el-tag>
            <span v-else class="text-muted">普通用户</span>
          </el-descriptions-item>
          <el-descriptions-item label="消费/活跃/创作">
            <span class="text-muted small-text">
              ¥{{ levelUser.member?.consumeAmount || 0 }} / {{ levelUser.member?.activeHours || 0 }}h / {{ levelUser.member?.createCount || 0 }}个
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <el-form label-width="90px" style="margin-top:16px;">
          <el-form-item label="目标层级">
            <el-radio-group v-model="levelForm.targetLevel" @change="doLevelPreview">
              <el-radio
                v-for="opt in USER_LEVEL_OPTIONS"
                :key="opt.value"
                :label="opt.value"
              >{{ opt.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <div v-if="levelPreview" class="criteria-result border-card">
          <h4 style="margin:0 0 12px;">升级达标情况</h4>
          <div
            v-for="(c, idx) in levelCriteriaItems"
            :key="idx"
            class="criteria-progress-item"
          >
            <div class="label">
              <span>{{ c.label }}</span>
              <span :class="{ pass: c.pass, fail: !c.pass }">
                {{ c.current }}/{{ c.require }} {{ c.pass ? '✓ 通过' : '✗ 未达标' }}
              </span>
            </div>
            <el-progress
              :percentage="c.percent"
              :status="c.pass ? 'success' : 'exception'"
              :stroke-width="8"
            />
          </div>
          <div v-if="levelPreview.missing?.length" class="missing-info">
            <el-alert
              :title="'未达标项：' + levelPreview.missing.join('、')"
              type="error"
              :closable="false"
              show-icon
            />
          </div>
          <div v-if="!levelPreview.allMet && !canLevelForce" style="margin-top:8px;">
            <el-alert title="当前角色无法强制调整，仅超级管理员可执行强制升级" type="warning" :closable="false" show-icon />
          </div>
          <div v-if="!levelPreview.allMet && canLevelForce" style="margin-top:8px; text-align:right;">
            <el-checkbox v-model="levelForm.force">
              <span style="color:#F56C6C;">强制提交（仅超管）</span>
            </el-checkbox>
          </div>
        </div>

        <div style="margin-top:20px; text-align:right;">
          <el-button @click="levelDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="!levelForm.targetLevel || (!levelPreview?.allMet && !levelForm.force)"
            @click="goLevelStep(2)"
          >
            下一步
          </el-button>
        </div>
      </div>

      <div v-show="levelStep === 2" class="level-step-panel">
        <h4 style="margin:0 0 12px;">权益变更预览</h4>
        <div class="benefit-compare">
          <div class="benefit-col">
            <h4>调整前（{{ DisplayMemberLevelLabel[getDisplayLevel(levelUser?.member?.level)] || '普通' }}）</h4>
            <div
              v-for="b in oldBenefits"
              :key="'old-'+b.key"
              class="item"
              :class="{ 'diff-remove': b.isRemoved }"
            >
              <el-icon v-if="b.isRemoved" color="#F56C6C"><Close /></el-icon>
              <el-icon v-else color="#909399"><Check /></el-icon>
              <span>{{ b.label }}</span>
            </div>
          </div>
          <div class="benefit-col">
            <h4>调整后（{{ DisplayMemberLevelLabel[levelForm.targetLevel] || '普通' }}）</h4>
            <div
              v-for="b in newBenefits"
              :key="'new-'+b.key"
              class="item"
              :class="{ 'diff-add': b.isAdded }"
            >
              <el-icon v-if="b.isAdded" color="#67C23A"><Check /></el-icon>
              <el-icon v-else color="#909399"><Check /></el-icon>
              <span>{{ b.label }}</span>
            </div>
          </div>
        </div>
        <div style="margin-top:20px; text-align:right;">
          <el-button @click="goLevelStep(1)">上一步</el-button>
          <el-button type="primary" @click="goLevelStep(3)">下一步</el-button>
        </div>
      </div>

      <div v-show="levelStep === 3" class="level-step-panel">
        <el-descriptions title="变更摘要" :column="1" border size="small" class="border-card">
          <el-descriptions-item label="用户">
            {{ levelUser?.username }}（UID: {{ levelUser?.uid }}）
          </el-descriptions-item>
          <el-descriptions-item label="层级变更">
            <span>{{ DisplayMemberLevelLabel[getDisplayLevel(levelUser?.member?.level)] || '普通' }}</span>
            <el-icon style="vertical-align:middle; margin:0 8px;"><Right /></el-icon>
            <el-tag
              :type="DisplayMemberLevelTagType[levelForm.targetLevel] || 'info'"
              effect="dark"
              size="small"
            >
              {{ DisplayMemberLevelLabel[levelForm.targetLevel] || '普通' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="强制提交">
            <el-tag v-if="levelForm.force" type="warning" size="small">是</el-tag>
            <span v-else class="text-muted">否</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-form label-width="90px" style="margin-top:16px;">
          <el-form-item label="变更原因">
            <el-input
              v-model="levelForm.reason"
              type="textarea"
              :rows="2"
              placeholder="请输入变更原因（可选）"
              class="focus-color"
            />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="levelForm.confirm">
              我已确认以上变更内容，了解相关权益的解锁与回收影响
            </el-checkbox>
          </el-form-item>
        </el-form>

        <div style="margin-top:20px; text-align:right;">
          <el-button @click="goLevelStep(2)">上一步</el-button>
          <el-button
            type="primary"
            :disabled="!levelForm.confirm"
            :loading="submitLoading"
            @click="handleLevelSubmit"
          >
            确认提交
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="batchTagDialogVisible"
      title="批量用户标签差异化配置"
      width="760px"
      class="batch-tag-dialog"
    >
      <el-form :model="batchTagForm" label-width="110px">
        <el-divider content-position="left">人群筛选条件</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="人群过滤">
              <el-select v-model="batchTagForm.filterBy" placeholder="全部用户" clearable style="width:100%;">
                <el-option
                  v-for="opt in FILTER_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <div class="form-tip">
                {{ selectedRows.length > 0 ? `已在表格选中 ${selectedRows.length} 个用户，将基于此集合进一步过滤` : '将对全量用户应用过滤条件' }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="消费等级">
              <el-select v-model="batchTagForm.consumeLevel" placeholder="全部等级" clearable style="width:100%;">
                <el-option
                  v-for="opt in CONSUME_LEVEL_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活跃区间(小时)">
              <div class="range-inputs">
                <el-input-number v-model="batchTagForm.activeMin" :min="0" placeholder="最小值" style="width:48%;" />
                <span class="range-sep">—</span>
                <el-input-number v-model="batchTagForm.activeMax" :min="0" placeholder="最大值" style="width:48%;" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">目标标签配置</el-divider>
        <el-form-item label="添加标签">
          <el-select
            v-model="batchTagForm.tagNames"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择已有标签或输入自定义标签后回车"
            style="width:100%;"
            class="tag-select focus-color"
          >
            <el-option
              v-for="td in availableTagDefinitions"
              :key="td.id"
              :label="td.name"
              :value="td.name"
            >
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <span
                  class="tag-dot"
                  :style="{ backgroundColor: td.color }"
                ></span>
                {{ td.name }}
                <el-tag size="small" type="info" effect="plain">
                  {{ TagDimensionLabel[td.dimension] || td.dimension }}
                </el-tag>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <div v-if="batchTagProcessing || batchTagResult" class="batch-progress-area border-card">
        <div class="progress-header">
          <span>{{ batchTagProcessing ? '正在配置中...' : '配置结果' }}</span>
          <span v-if="totalUserCount > 0">
            进度 {{ processedCount }}/{{ totalUserCount }}（{{ batchTagProgress }}%）
          </span>
        </div>
        <el-progress
          :percentage="batchTagProgress"
          :status="batchTagProcessing ? undefined : 'success'"
          class="batch-progress"
        />
      </div>

      <div v-if="batchTagResult" class="batch-result-area">
        <el-alert
          :title="'完成：成功' + batchTagResult.successCount + ' 个，失败 ' + batchTagResult.failedCount + ' 个，跳过 ' + batchTagResult.skippedCount + ' 个'"
          type="info"
          :closable="false"
          show-icon
          class="validation-alert-block"
        />
        <el-table
          v-if="batchTagResult.successUsers?.length"
          :data="batchTagResult.successUsers"
          height="200"
          class="batch-result-table zebra-table sticky-header-table"
          :row-class-name="({row}) => row.addedTags?.length ? 'success-row' : ''"
        >
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="uid" label="UID" width="140" />
          <el-table-column label="添加的标签" min-width="240">
            <template #default="{ row }">
              <el-tag
                v-for="t in row.addedTags"
                :key="t"
                size="small"
                type="success"
                effect="light"
                style="margin-right:4px;"
              >
                +{{ t }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="batchTagDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="batchTagForm.tagNames.length === 0 || batchTagProcessing"
          :loading="batchTagProcessing"
          @click="handleBatchTagSubmit"
        >
          开始配置
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="tagEditDialogVisible"
      title="用户标签编辑"
      width="620px"
      class="tag-edit-dialog"
    >
      <el-descriptions v-if="tagEditUser" title="当前用户" :column="2" border size="small" class="border-card">
        <el-descriptions-item label="用户名">{{ tagEditUser.username }}</el-descriptions-item>
        <el-descriptions-item label="UID">{{ tagEditUser.uid }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <StatusTag :status="tagEditUser.role" type="role" />
        </el-descriptions-item>
        <el-descriptions-item label="当前层级">
          <el-tag
            v-if="tagEditUser.member"
            :type="DisplayMemberLevelTagType[getDisplayLevel(tagEditUser.member.level)] || 'info'"
            size="small"
            effect="dark"
          >
            {{ DisplayMemberLevelLabel[getDisplayLevel(tagEditUser.member.level)] || '-' }}
          </el-tag>
          <span v-else class="text-muted">普通用户</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-form label-width="90px" style="margin-top:16px;">
        <el-form-item label="用户标签">
          <el-select
            v-model="tagEditForm.selectedTags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建标签（回车添加）"
            style="width:100%;"
            class="tag-select focus-color"
            @change="onTagChange"
          >
            <el-option
              v-for="td in availableTagDefinitions"
              :key="td.id"
              :label="td.name"
              :value="td.name"
            >
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <span class="tag-dot" :style="{ backgroundColor: td.color }"></span>
                {{ td.name }}
              </span>
            </el-option>
          </el-select>
          <div style="margin-top:6px;">
            <div
              v-for="t in tagEditForm.selectedTags"
              :key="t"
              :class="['mismatch-chip', { 'mismatch-tag': tagMismatch[t] }]"
              style="margin:2px;"
            >
              <el-tag
                :type="tagMismatch[t] ? 'danger' : 'success'"
                effect="light"
                size="small"
              >
                {{ t }}
                <span v-if="tagMismatch[t]" style="margin-left:4px; color:#f56c6c;">⚠ 错配</span>
              </el-tag>
            </div>
          </div>
          <div v-if="hasDuplicateTags" style="margin-top:6px;" class="field-error">
            警告：存在重复标签，已自动去重
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="tagEditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="saveTagEdit">
          保存标签
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="tagTraceDialogVisible"
      title="标签溯源与校验"
      width="960px"
      top="5vh"
      class="tag-trace-dialog"
    >
      <div v-if="tagTraceUser" class="border-card">
        <div class="trace-user-info">
          <el-avatar :size="44" :src="tagTraceUser.avatar">
            {{ tagTraceUser.nickname?.charAt(0) || tagTraceUser.username?.charAt(0) }}
          </el-avatar>
          <div class="trace-user-detail">
            <div class="trace-user-name">
              {{ tagTraceUser.username }}
              <el-tag size="small" type="info">UID: {{ tagTraceUser.uid }}</el-tag>
              <StatusTag v-if="tagTraceUser.role" :status="tagTraceUser.role" type="role" />
            </div>
            <div class="trace-user-meta">
              <span>消费：¥{{ tagTraceUser.member?.consumeAmount || 0 }}</span>
              <span>活跃：{{ tagTraceUser.member?.activeHours || 0 }}h</span>
              <span>创作：{{ tagTraceUser.member?.createCount || 0 }}个</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="tagTraceResult" class="validation-alert-block">
        <el-alert
          v-if="tagTraceResult.redundantTags?.length || tagTraceResult.mismatchedTags?.length"
          :title="(tagTraceResult.redundantTags?.length ? `冗余标签 ${tagTraceResult.redundantTags.length} 个` : '') +
                 (tagTraceResult.mismatchedTags?.length ? `；错配标签 ${tagTraceResult.mismatchedTags.length} 个` : '') +
                 '，建议清理'"
          type="warning"
          show-icon
          :closable="false"
        >
          <template #default>
            <div style="margin-top:6px;">
              <el-tag v-for="t in tagTraceResult.redundantTags" :key="'rd'+t" size="small" type="info" effect="light" style="margin-right:4px;">
                冗余: {{ t }}
              </el-tag>
              <el-tag v-for="t in tagTraceResult.mismatchedTags" :key="'mm'+t" size="small" type="danger" effect="light" style="margin-right:4px;">
                错配: {{ t }}
              </el-tag>
            </div>
          </template>
        </el-alert>
        <el-alert
          v-else
          title="标签校验通过，未发现冗余或错配标签"
          type="success"
          show-icon
          :closable="false"
        />
        <div style="margin-top:12px; text-align:right;">
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="!tagTraceResult.redundantTags?.length && !tagTraceResult.mismatchedTags?.length"
            :loading="tagCleaning"
            @click="cleanTags"
          >
            一键清理冗余标签
          </el-button>
        </div>
      </div>

      <el-tabs v-model="tagTraceActiveTab" class="trace-tabs">
        <el-tab-pane label="标签变更历史" name="tagHistory">
          <el-table
            :data="tagTraceResult?.tagLogs || []"
            height="400"
            class="zebra-table sticky-header-table"
            :header-cell-style="{position:'sticky', top:'0', zIndex:2}"
          >
            <el-table-column label="标签变更" width="220">
              <template #default="{ row }">
                <el-tag v-for="t in row.addedTags" :key="'a'+t" size="small" type="success" effect="light" style="margin-right:4px;">+{{ t }}</el-tag>
                <el-tag v-for="t in row.removedTags" :key="'r'+t" size="small" type="danger" effect="light" style="margin-right:4px;">-{{ t }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.changeType === 'add'" size="small" type="success">新增</el-tag>
                <el-tag v-else-if="row.changeType === 'remove'" size="small" type="danger">移除</el-tag>
                <span v-else class="text-muted">{{ row.changeType || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="来源" width="100">
              <template #default="{ row }">{{ row.source || '手动' }}</template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="160">
              <template #default="{ row }">{{ truncateStr(row.reason, 30) }}</template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="100" />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="层级变更历史" name="levelHistory">
          <el-table
            :data="tagTraceResult?.levelLogs || []"
            height="400"
            class="zebra-table sticky-header-table"
            :header-cell-style="{position:'sticky', top:'0', zIndex:2}"
          >
            <el-table-column label="层级变更" width="200">
              <template #default="{ row }">
                <span>{{ DisplayMemberLevelLabel[getDisplayLevel(row.oldLevel)] || '-' }}</span>
                <el-icon style="vertical-align:middle; margin:0 6px;"><Right /></el-icon>
                <el-tag
                  :type="DisplayMemberLevelTagType[getDisplayLevel(row.newLevel)] || 'info'"
                  size="small"
                  effect="dark"
                >
                  {{ DisplayMemberLevelLabel[getDisplayLevel(row.newLevel)] || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="达标" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.metCriteria === true" size="small" type="success">是</el-tag>
                <el-tag v-else-if="row.metCriteria === false" size="small" type="warning">强制</el-tag>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="unlockedBenefits" label="解锁权益" min-width="160">
              <template #default="{ row }">
                <el-tag
                  v-for="b in row.unlockedBenefits"
                  :key="'u'+b"
                  size="small"
                  type="success"
                  effect="light"
                  style="margin-right:4px;"
                >{{ b }}</el-tag>
                <span v-if="!row.unlockedBenefits?.length" class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="140">
              <template #default="{ row }">{{ truncateStr(row.reason, 30) }}</template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="100" />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog
      v-model="loginLogDialogVisible"
      :title="loginDialogTargetUser ? `${loginDialogTargetUser.username} - 登录记录` : '全平台登录日志'"
      width="1100px"
      top="5vh"
      class="scale-fade-dialog"
      destroy-on-close
    >
      <el-form :inline="true" :model="loginQuery" size="default" class="login-filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="loginQuery.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="login-filter-datetime focus-color"
            @change="fetchLoginLogs(1)"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="loginQuery.status" placeholder="全部" class="w-36 focus-color" clearable @change="fetchLoginLogs(1)">
            <el-option v-for="opt in LOGIN_STATUS_OPTIONS" :key="opt.value" :value="opt.value" :label="opt.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="loginQuery.riskLevel" placeholder="全部" class="w-36 focus-color" clearable @change="fetchLoginLogs(1)">
            <el-option v-for="opt in RISK_LEVEL_OPTIONS" :key="opt.value" :value="opt.value" :label="opt.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP">
          <el-input v-model="loginQuery.ip" placeholder="模糊搜索IP" class="w-44 focus-color" clearable @change="fetchLoginLogs(1)" />
        </el-form-item>
        <el-form-item label="操作系统">
          <el-select v-model="loginQuery.os" placeholder="全部" class="w-36 focus-color" clearable @change="fetchLoginLogs(1)">
            <el-option v-for="opt in OS_OPTIONS" :key="opt.value" :value="opt.value" :label="opt.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="仅看风险">
          <el-switch v-model="loginQuery.isMarkedRisk" @change="fetchLoginLogs(1)" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Refresh" circle @click="fetchLoginLogs(1)" />
        </el-form-item>
      </el-form>

      <div v-if="loginLogsSelection.length" class="login-batch-bar">
        <el-space>
          <span style="color:#909399">已选 {{ loginLogsSelection.length }} 条：</span>
          <el-button
            size="small"
            type="danger"
            :icon="Warning"
            @click="batchProcessLoginLogs('mark')"
          >批量标记风险</el-button>
          <el-button
            size="small"
            type="success"
            :icon="CircleCheckFilled"
            @click="batchProcessLoginLogs('clear')"
          >批量清除标记</el-button>
          <el-checkbox v-model="batchLockDevices" label="同时锁定关联设备" />
        </el-space>
      </div>

      <div
        v-loading="loginLogsLoading"
        class="login-log-table-wrap sticky-header-table"
        ref="loginLogTableWrap"
        @scroll="onLoginLogScroll"
      >
        <el-table
          :data="loginLogs"
          height="480"
          @selection-change="loginLogsSelection = $event"
          :row-class-name="getLoginLogRowClass"
          class="zebra-table login-log-table"
          @row-click="handleLoginRowClick"
        >
          <el-table-column type="selection" width="48" reserve-selection />
          <el-table-column label="时间" prop="createdAt" width="170" show-overflow-tooltip />
          <el-table-column label="账号" prop="username" width="140" show-overflow-tooltip />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="LoginStatusTagType[row.status]" effect="dark" size="small" round>{{ LoginStatusLabel[row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="风险" width="100">
            <template #default="{ row }">
              <span
                v-if="row.riskLevel !== 'none'"
                class="risk-level-dot"
                :style="{ background: RiskLevelColor[row.riskLevel] }"
              ></span>
              <el-tag
                :type="RiskLevelTagType[row.riskLevel]"
                size="small"
                effect="plain"
                :class="{'risk-highlight': row.isMarkedRisk || row.riskLevel === 'high' || row.riskLevel === 'critical'}"
              >{{ RiskLevelLabel[row.riskLevel] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="IP地址" width="150" prop="ip" show-overflow-tooltip />
          <el-table-column label="地理位置" width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.ipLocation || `${row.country||''}/${row.region||''}/${row.city||''}` }}</span>
              <el-icon v-if="row.isAbroad || row.isProxy || row.isVpn || row.isTor" color="#F56C6C" title="异常网络"><WarningFilled /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="设备信息" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.os || '-' }}{{ row.osVersion ? ' '+row.osVersion : '' }}</span>
              <span style="color:#909399;margin:0 4px">|</span>
              <span>{{ row.browser || '-' }}{{ row.browserVersion ? ' '+row.browserVersion : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="频次/检测" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tag
                v-if="row.frequencyFlag !== 'normal'"
                size="small"
                type="danger"
                effect="plain"
              >{{ FrequencyFlagLabel[row.frequencyFlag] }}</el-tag>
              <el-tag
                v-if="row.scriptDetected || row.seleniumDetected || row.headlessDetected"
                size="small"
                type="danger"
                effect="dark"
              >脚本/伪造检测</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="viewLoginDetail(row)">查看详情</el-button>
              <el-button
                v-if="!row.isMarkedRisk"
                link type="danger"
                @click.stop="markLoginRisk(row)"
              >标记风险</el-button>
              <el-button
                v-else
                link type="success"
                @click.stop="clearLoginRisk(row)"
              >清除标记</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <transition name="fade">
        <div
          v-show="showBackToTop"
          class="back-to-top-btn"
          @click="scrollLoginLogTop"
        >
          <el-icon :size="18"><Top /></el-icon>
        </div>
      </transition>

      <el-pagination
        v-model:current-page="loginQuery.page"
        v-model:page-size="loginQuery.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="loginLogsTotal"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-4"
        @size-change="fetchLoginLogs(1)"
        @current-change="fetchLoginLogs"
      />
    </el-dialog>

    <el-dialog
      v-model="loginDetailDialogVisible"
      title="登录详情"
      width="820px"
      class="scale-fade-dialog login-detail-dialog"
      destroy-on-close
    >
      <div v-if="loginDetail" class="login-detail-wrap">
        <el-row :gutter="16">
          <el-col :span="18">
            <el-descriptions :column="2" border size="default">
              <el-descriptions-item label="登录时间">{{ loginDetail.log.createdAt }}</el-descriptions-item>
              <el-descriptions-item label="登录账号">{{ loginDetail.log.username }}</el-descriptions-item>
              <el-descriptions-item label="登录状态">
                <el-tag :type="LoginStatusTagType[loginDetail.log.status]" effect="dark" round>{{ LoginStatusLabel[loginDetail.log.status] }}</el-tag>
                <span v-if="loginDetail.log.failReason" style="color:#F56C6C;margin-left:8px">失败原因：{{ loginDetail.log.failReason }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="是否二次验证">
                {{ loginDetail.log.twoFaPassed ? '是' : '否' }}（{{ loginDetail.log.twoFaMethod || '-' }}）
              </el-descriptions-item>
              <el-descriptions-item label="IP地址" :span="2">
                {{ loginDetail.log.ip }}
                <el-tag v-if="loginDetail.log.ipv6" type="info" size="small" style="margin-left:8px">IPv6: {{ loginDetail.log.ipv6 }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="地理位置" :span="2">
                {{ loginDetail.log.ipLocation || '-' }}
                <el-space style="margin-left:8px">
                  <el-tag v-if="loginDetail.log.isProxy" size="small" type="danger">代理</el-tag>
                  <el-tag v-if="loginDetail.log.isVpn" size="small" type="danger">VPN</el-tag>
                  <el-tag v-if="loginDetail.log.isTor" size="small" type="danger">Tor</el-tag>
                  <el-tag v-if="loginDetail.log.isDatacenter" size="small" type="warning">机房IP</el-tag>
                  <el-tag v-if="loginDetail.log.isAbroad" size="small" type="danger">境外</el-tag>
                  <el-tag v-if="loginDetail.log.isOffsite" size="small" type="warning">异地</el-tag>
                </el-space>
              </el-descriptions-item>
              <el-descriptions-item label="操作系统">{{ loginDetail.log.os || '-' }} {{ loginDetail.log.osVersion || '' }}</el-descriptions-item>
              <el-descriptions-item label="浏览器">{{ loginDetail.log.browser || '-' }} {{ loginDetail.log.browserVersion || '' }}</el-descriptions-item>
              <el-descriptions-item label="设备名称" :span="2">{{ loginDetail.log.deviceName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="新设备/新IP">
                <el-tag v-if="loginDetail.log.isNewDevice" size="small" type="warning">新设备</el-tag>
                <el-tag v-if="loginDetail.log.isNewIp" size="small" type="warning" style="margin-left:4px">新IP</el-tag>
                <span v-if="!loginDetail.log.isNewDevice && !loginDetail.log.isNewIp">否</span>
              </el-descriptions-item>
              <el-descriptions-item label="在线时长">{{ loginDetail.log.onlineDuration }}秒</el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="6" v-if="loginDetail.report">
            <div class="risk-score-ring">
              <el-progress
                type="dashboard"
                :percentage="loginDetail.report.overallScore"
                :color="RiskLevelColor[loginDetail.report.riskLevel]"
                :stroke-width="10"
              />
              <div class="risk-score-center" :style="{ color: RiskLevelColor[loginDetail.report.riskLevel] }">
                {{ RiskLevelLabel[loginDetail.report.riskLevel] }}
              </div>
            </div>
            <div class="mt-2" style="text-align:center">
              <el-tag :type="RiskLevelTagType[loginDetail.report.riskLevel]" effect="dark" round>
                决策：{{ FinalDecisionLabel[loginDetail.report.finalDecision] }}
              </el-tag>
            </div>
            <div v-if="loginDetail.device" class="mt-3" style="text-align:center">
              <el-tag :type="DeviceStatusTagType[loginDetail.device.status]" size="small">
                设备状态：{{ DeviceStatusLabel[loginDetail.device.status] }}
              </el-tag>
              <div style="margin-top:8px">
                <el-button
                  v-if="loginDetail.device && !loginDetail.device.isLocked"
                  size="small"
                  type="danger"
                  @click="lockDeviceFromDetail"
                >锁定此设备</el-button>
                <el-button
                  v-if="loginDetail.device && loginDetail.device.isLocked"
                  size="small"
                  type="success"
                  @click="unlockDeviceFromDetail"
                >解锁此设备</el-button>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-collapse v-if="loginDetail.report" class="mt-4">
          <el-collapse-item title="风险评分明细（点击展开）" name="score">
            <el-table :data="loginDetail.report.riskScoreDetails" size="small" border>
              <el-table-column label="检测项" prop="description" />
              <el-table-column label="检测键" prop="key" width="120" />
              <el-table-column label="是否触发" width="90" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.applied" color="#F56C6C"><CircleCloseFilled /></el-icon>
                  <el-icon v-else color="#67C23A"><CircleCheckFilled /></el-icon>
                </template>
              </el-table-column>
              <el-table-column label="扣分项" prop="score" width="80" align="center" />
            </el-table>
          </el-collapse-item>
          <el-collapse-item title="触发的风险规则" name="rules" v-if="loginDetail.report.riskRulesTriggered.length">
            <el-tag
              v-for="(rule, idx) in loginDetail.report.riskRulesTriggered"
              :key="idx"
              closable
              type="danger"
              disable-transitions
              style="margin:4px"
            >{{ rule.description }} (+{{ rule.score }}分)</el-tag>
          </el-collapse-item>
          <el-collapse-item title="处理建议" name="suggestion">
            <el-alert
              v-if="loginDetail.report.suggestion"
              :title="loginDetail.report.suggestion"
              :type="loginDetail.report.finalDecision === 'block' ? 'error' : loginDetail.report.finalDecision === 'verify' ? 'warning' : 'success'"
              show-icon
            />
          </el-collapse-item>
        </el-collapse>
      </div>
      <template #footer>
        <el-button @click="loginDetailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="loginDetail && !loginDetail.log.isMarkedRisk && (loginDetail.log.status === 'pending' || loginDetail.log.status === 'blocked')"
          class="verify-btn"
          type="primary"
          @click="verifyLoginFromDetail"
        >
          <el-icon><CircleCheckFilled /></el-icon>&nbsp;人工验证通过
        </el-button>
        <el-button
          v-if="loginDetail && !loginDetail.log.isMarkedRisk"
          type="danger"
          @click="markLoginRisk(loginDetail.log)"
        >标记风险</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="loginAlertDialogVisible"
      title="⚠ 异常登录预警"
      width="480px"
      :class="['login-alert-dialog', { 'shake-dialog': loginAlertShake }]"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      show-close
    >
      <div class="login-alert-content">
        <el-alert
          title="检测到异常登录行为"
          type="error"
          :closable="false"
          show-icon
          description="请仔细确认以下登录信息，如非本人操作请立即锁定账号并修改密码"
        />
        <div v-if="loginAlertLog" class="login-alert-info mt-4">
          <el-descriptions size="small" :column="1" border>
            <el-descriptions-item label="时间">{{ loginAlertLog.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="IP">{{ loginAlertLog.ip }}</el-descriptions-item>
            <el-descriptions-item label="位置">{{ loginAlertLog.ipLocation || '-' }}</el-descriptions-item>
            <el-descriptions-item label="设备">{{ loginAlertLog.deviceName || loginAlertLog.os || '-' }}</el-descriptions-item>
            <el-descriptions-item label="风险">
              <el-tag :type="RiskLevelTagType[loginAlertLog.riskLevel]" effect="dark" size="small" round>
                {{ RiskLevelLabel[loginAlertLog.riskLevel] }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer>
        <el-button
          class="alert-danger-btn"
          type="danger"
          @click="handleAlertLockDevice"
        >
          <el-icon><Lock /></el-icon>&nbsp;锁定该设备
        </el-button>
        <el-button
          :class="['alert-verify-btn', { 'verify-btn-hovered': verifyBtnHovered }]"
          type="primary"
          @mouseenter="verifyBtnHovered = true"
          @mouseleave="verifyBtnHovered = false"
          @mousedown="verifyBtnPressed = true"
          @mouseup="verifyBtnPressed = false"
          @click="handleAlertVerify"
        >
          <el-icon><CircleCheckFilled /></el-icon>&nbsp;确认为本人登录
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deviceDialogVisible"
      :title="`${deviceDialogUser?.username || ''} - 设备管控`"
      width="900px"
      class="scale-fade-dialog"
      destroy-on-close
    >
      <el-table :data="deviceList" v-loading="deviceLoading" border size="default" class="zebra-table sticky-header-table" height="480">
        <el-table-column label="设备标识" prop="deviceId" width="150" show-overflow-tooltip />
        <el-table-column label="设备名称" prop="deviceName" width="160" show-overflow-tooltip />
        <el-table-column label="操作系统" width="150">
          <template #default="{ row }">{{ row.os || '-' }} {{ row.osVersion || '' }}</template>
        </el-table-column>
        <el-table-column label="浏览器" width="150">
          <template #default="{ row }">{{ row.browser || '-' }} {{ row.browserVersion || '' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="DeviceStatusTagType[row.status]" effect="dark" size="small" round>
              {{ DeviceStatusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="在线" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.isOnline" color="#67C23A" :size="16"><CircleCheckFilled /></el-icon>
            <span v-else style="color:#C0C4CC">离线</span>
          </template>
        </el-table-column>
        <el-table-column label="登录次数" width="90" align="center" prop="totalLoginCount" />
        <el-table-column label="风险次数" width="90" align="center" prop="riskCount" />
        <el-table-column label="最后登录" prop="lastLoginAt" width="170" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isLocked"
              link type="danger"
              @click="lockDevice(row)"
            >锁定</el-button>
            <el-button
              v-else
              link type="success"
              @click="unlockDevice(row)"
            >解锁</el-button>
            <el-button link type="primary" @click="openLoginLogDialogByDevice(row)">相关记录</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="devicePage"
        v-model:page-size="devicePageSize"
        :page-sizes="[10, 20, 50]"
        :total="deviceTotal"
        layout="total, sizes, prev, pager, next"
        class="mt-4"
        @size-change="fetchDevices(1)"
        @current-change="fetchDevices"
      />
    </el-dialog>

    <el-dialog
      v-model="loginRiskDialogVisible"
      :title="`${loginRiskDialogUser?.username || ''} - 登录风控总览`"
      width="1000px"
      top="5vh"
      class="scale-fade-dialog"
      destroy-on-close
    >
      <div v-if="loginRiskSummary">
        <el-row :gutter="12" class="risk-summary-cards">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="label">总登录次数</div>
                <div class="value highlight-1">{{ loginRiskSummary.totalCount }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="label">成功/验证</div>
                <div class="value highlight-2">{{ loginRiskSummary.successCount }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="label">失败次数</div>
                <div class="value" style="color:#E6A23C">{{ loginRiskSummary.failCount }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="label">拦截/风险</div>
                <div class="value" style="color:#F56C6C">{{ loginRiskSummary.blockOrRiskCount }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="mt-4">
          <template #header>风险等级分布</template>
          <el-space wrap>
            <div
              v-for="(lv, idx) in ['none', 'low', 'medium', 'high', 'critical']"
              :key="idx"
              class="risk-dist-item"
            >
              <span class="risk-level-dot" :style="{ background: RiskLevelColor[lv] }"></span>
              <span>{{ RiskLevelLabel[lv] }}</span>
              <span style="font-weight:600;margin-left:6px">{{ loginRiskSummary.byLevel[lv] || 0 }}</span>
            </div>
          </el-space>
        </el-card>

        <el-card shadow="never" class="mt-4">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>最近风险登录记录（全链路溯源）</span>
              <el-button type="primary" size="small" link @click="openLoginLogDialog(loginRiskDialogUser)">查看全部 <el-icon><ArrowRight /></el-icon></el-button>
            </div>
          </template>
          <el-table
            :data="loginRiskSummary.recentRiskLogs"
            border size="small"
            class="zebra-table sticky-header-table"
            max-height="260"
          >
            <el-table-column label="时间" prop="createdAt" width="170" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="LoginStatusTagType[row.status]" effect="dark" size="small" round>
                  {{ LoginStatusLabel[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="风险等级" width="100">
              <template #default="{ row }">
                <el-tag :type="RiskLevelTagType[row.riskLevel]" size="small">
                  {{ RiskLevelLabel[row.riskLevel] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="IP" prop="ip" width="140" show-overflow-tooltip />
            <el-table-column label="位置" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.ipLocation || `${row.country||''}/${row.region||''}/${row.city||''}` }}</template>
            </el-table-column>
            <el-table-column label="设备/OS" width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ row.deviceName || row.os || '-' }}</template>
            </el-table-column>
            <el-table-column label="检测结果" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag v-if="row.frequencyFlag!=='normal'" size="small" type="warning" style="margin-right:4px">{{ FrequencyFlagLabel[row.frequencyFlag] }}</el-tag>
                <el-tag v-if="row.scriptDetected" size="small" type="danger" style="margin-right:4px">脚本检测</el-tag>
                <el-tag v-if="row.seleniumDetected" size="small" type="danger" style="margin-right:4px">Selenium</el-tag>
                <el-tag v-if="row.headlessDetected" size="small" type="danger" style="margin-right:4px">无头浏览器</el-tag>
                <el-tag v-if="row.isMultiDevice" size="small" type="warning">多设备</el-tag>
                <el-tag v-if="row.isOffsite" size="small" type="warning">异地</el-tag>
                <el-tag v-if="row.isAbroad" size="small" type="danger">境外</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="viewLoginDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-dialog>

    <el-dialog
      v-model="loginBatchResultDialog"
      title="批量处理结果"
      width="520px"
      class="scale-fade-dialog"
      destroy-on-close
    >
      <el-result
        :icon="loginBatchResult?.failedCount ? 'warning' : 'success'"
        :title="`成功${loginBatchResult?.successCount || 0}条`"
        :sub-title="loginBatchResult?.failedCount ? `失败${loginBatchResult.failedCount}条，点击展开查看` : '全部处理完成'"
      />
      <el-alert
        v-if="loginBatchResult?.failed?.length"
        :title="`失败原因：${loginBatchResult.failed.map(f => f.id + ':' + f.reason).join('；')}`"
        type="error"
        show-icon
        :closable="false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import {
  Search, Refresh, Plus, Delete, Edit, Warning, Right,
  CircleCheckFilled, CircleCloseFilled, Lock, Tag, Star,
  Share, Collection, Check, Close, Monitor, UserFilled,
  Unlock, View, CirclePlus, CircleClose, DataAnalysis, Top,
  ArrowRight, WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { DataTable, StatusTag, BatchOperation, EmptyState } from '@/components/business'
import { useUserStore } from '@/stores/user'
import {
  UserRoleLabel,
  UserStatusLabel,
  UserStatusTagType,
  UserStatusGlowColor,
  UserStatusFlow,
  PermissionGroupLabel,
  RoleStatusPermission,
  HighRiskActions,
  FunctionPermissionLabels,
  ChangeTypeLabel,
  UserRole,
  DisplayMemberLevel,
  DisplayMemberLevelLabel,
  DisplayMemberLevelTagType,
  INTERNAL_TO_DISPLAY_LEVEL,
  DISPLAY_LEVEL_ORDER,
  LEVEL_UPGRADE_CRITERIA,
  LEVEL_BENEFITS,
  LEVEL_AUTO_TAGS,
  TagDimension,
  TagDimensionLabel,
  TagDimensionTagType,
  USER_LEVEL_OPTIONS,
  TAG_DIMENSION_OPTIONS,
  CONSUME_LEVEL_OPTIONS,
  FILTER_OPTIONS,
  LoginStatusLabel,
  LoginStatusTagType,
  RiskLevelLabel,
  RiskLevelTagType,
  RiskLevelColor,
  DeviceStatusLabel,
  DeviceStatusTagType,
  FrequencyFlagLabel,
  FinalDecisionLabel,
  RISK_SCORE_RULES_DESC,
  LOGIN_STATUS_OPTIONS,
  RISK_LEVEL_OPTIONS,
  DEVICE_STATUS_OPTIONS,
  OS_OPTIONS,
  BROWSER_OPTIONS,
  SCROLL_BACK_TO_TOP_THRESHOLD
} from '@/constants'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUser,
  validateAccount,
  getEditLogs,
  batchUpdateUsers,
  traceAccount,
  updateUserStatus,
  getRiskPreview,
  getStatusLogs,
  getChangeStats,
  batchChangeUserStatus,
  getLevelCriteriaMeta,
  getLevelPreview,
  changeMemberLevel,
  getMemberLevelLogs,
  getTagMeta,
  validateTagName,
  listTagDefinitions,
  createTagDefinition,
  updateTagDefinition,
  checkUserTagMatch,
  addUserTags,
  removeUserTags,
  batchApplyTags,
  getMemberTagLogs,
  getTagTrace,
  cleanRedundantTags,
  getLoginThresholdsMeta,
  queryLoginLogs,
  getLoginDetail,
  markRiskLoginLog,
  clearRiskLoginLog,
  verifyLoginRecord,
  batchProcessLoginLogs,
  listLoginDevices,
  lockLoginDevice,
  unlockLoginDevice,
  getLoginRiskSummary
} from '@/api/userManage'
import type {
  UserInfo, FieldValidation, AccountValidationResult, UserEditLog,
  TraceResultItem, UserStatusLog, RiskPreview,
  TagDefinition, MemberLevelLog, MemberTagLog, BenefitItem,
  LevelPreviewResult, ChangeLevelResult, AddTagsResult,
  BatchApplyTagsResult, TagTraceResult, CleanTagsResult,
  LevelCriteriaMeta, TagMeta, TagMatchResult,
  LoginLog, LoginDevice, LoginRiskReport, RiskRuleItem, RiskScoreDetail,
  VerifyLoginResult, LoginDetailResult, BatchProcessLoginResult,
  LoginRiskSummary, LoginThresholdsMeta, LoginQueryParams,
  LoginStatus, RiskLevel, DeviceStatus, FrequencyFlag, FinalDecision
} from '@/types'

const userStore = useUserStore()

const defaultFieldValidation = (): { phone: FieldValidation; nickname: FieldValidation; uid: FieldValidation; username: FieldValidation } => ({
  phone: { valid: true, errors: [] },
  nickname: { valid: true, errors: [] },
  uid: { valid: true, errors: [] },
  username: { valid: true, errors: [] }
})

const loading = ref(false)
const tableData = ref<UserInfo[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedRows = ref<UserInfo[]>([])
const submitLoading = ref(false)
const shakeTrigger = ref(false)

const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const fieldValidation = reactive(defaultFieldValidation())

const editDialogVisible = ref(false)
const editStep = ref(1)
const editOriginal = reactive<Record<string, any>>({})
const editFieldValidation = reactive(defaultFieldValidation())

const batchUpdateDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const editLogDialogVisible = ref(false)
const editLogActiveTab = ref('edit')

const statusDialogVisible = ref(false)
const statusStep = ref(1)
const statusUser = ref<UserInfo | null>(null)
const riskPreview = ref<RiskPreview | null>(null)

const batchStatusDialogVisible = ref(false)

const traceLoading = ref(false)
const traceSearched = ref(false)
const traceResults = ref<TraceResultItem[]>([])
const traceTotal = ref(0)
const tracePage = ref(1)

const editLogLoading = ref(false)
const editLogData = ref<UserEditLog[]>([])
const editLogUser = ref<UserInfo | null>(null)
const statusLogLoading = ref(false)
const statusLogData = ref<UserStatusLog[]>([])
const tagLogLoading = ref(false)
const tagLogData = ref<MemberTagLog[]>([])
const levelLogLoading = ref(false)
const levelLogData = ref<MemberLevelLog[]>([])

const tagDialogVisible = ref(false)
const batchTagDialogVisible = ref(false)
const levelDialogVisible = ref(false)
const levelStep = ref(1)
const tagEditDialogVisible = ref(false)
const tagTraceDialogVisible = ref(false)
const tagTraceActiveTab = ref('tagHistory')
const levelUser = ref<UserInfo | null>(null)
const tagEditUser = ref<UserInfo | null>(null)
const tagTraceUser = ref<UserInfo | null>(null)
const tagMismatch = reactive<Record<string, boolean>>({})
const tagCleaning = ref(false)
const rippleTrigger = ref(false)

const showTagDefForm = ref(false)
const tagDefEditingId = ref<number | null>(null)
const tagDefSaving = ref(false)
const tagDefLoading = ref(false)
const tagDefinitions = ref<TagDefinition[]>([])
const tagDefFilter = reactive({ dimension: '', status: '' })
const tagDefForm = reactive<any>({
  name: '',
  color: '#409EFF',
  dimension: 'composite',
  applicableLevels: [] as string[],
  minConsumeAmount: 0,
  minActiveHours: 0,
  minCreateCount: 0,
  description: ''
})
const tagDefNameValid = ref(true)
const tagDefNameError = ref('')

const levelPreview = ref<LevelPreviewResult | null>(null)
const levelForm = reactive<any>({
  targetLevel: '',
  force: false,
  reason: '',
  confirm: false
})
const levelCriteriaMeta = ref<LevelCriteriaMeta | null>(null)

const tagEditForm = reactive<any>({
  selectedTags: [] as string[]
})

const batchTagForm = reactive<any>({
  filterBy: '',
  consumeLevel: '',
  activeMin: null as number | null,
  activeMax: null as number | null,
  tagNames: [] as string[]
})
const batchTagProgress = ref(0)
const batchTagProcessing = ref(false)
const batchTagResult = ref<BatchApplyTagsResult | null>(null)
const processedCount = ref(0)
const totalUserCount = ref(0)

const tagTraceResult = ref<TagTraceResult | null>(null)

const filterForm = reactive({
  keyword: '',
  role: '',
  status: ''
})

const createForm = reactive({
  username: '',
  password: '',
  uid: '',
  nickname: '',
  phone: '',
  email: '',
  role: 'member',
  permissionGroup: 'default',
  tags: [] as string[],
  status: 'active' as string
})

const editForm = reactive({
  id: 0,
  uid: '',
  username: '',
  nickname: '',
  phone: '',
  email: '',
  avatar: '',
  role: 'member',
  status: 'active' as string,
  tags: [] as string[],
  permissionGroup: 'default',
  newPassword: '',
  verifyPassword: '',
  remark: ''
})

const batchForm = reactive({
  nicknameSuffix: '',
  tags: [] as string[],
  permissionGroup: ''
})

const statusForm = reactive({
  newStatus: '',
  reason: '',
  statusExpireAt: '',
  confirm: false,
  force: false
})

const batchStatusForm = reactive({
  newStatus: '',
  reason: '',
  statusExpireAt: '',
  confirm: false
})

const traceForm = reactive({
  uid: '',
  phone: '',
  username: '',
  registerTimeRange: null as [string, string] | null
})

const createRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '长度在 6 到 32 个字符', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const roleOptions = Object.entries(UserRoleLabel).map(([value, label]) => ({ value, label }))
const statusOptions = Object.entries(UserStatusLabel).map(([value, label]) => ({ value, label }))
const permissionGroupOptions = Object.entries(PermissionGroupLabel).map(([value, label]) => ({ value, label }))

const currentRoleLabel = computed(() => UserRoleLabel[userStore.userRole as keyof typeof UserRoleLabel] || '')
const currentRole = computed(() => userStore.userRole || '')

const allowedStatusOptions = computed(() => {
  const all = statusOptions
  if (!statusUser.value) return all
  const fromStatus = statusUser.value.status
  return all.filter((opt) => {
    if (opt.value === fromStatus) return true
    const flow = UserStatusFlow[fromStatus] || []
    return flow.includes(opt.value)
  })
})

const batchAllowedOptions = computed(() => {
  const allowed = RoleStatusPermission[currentRole.value] || []
  return statusOptions.filter((opt) => allowed.includes(opt.value))
})

const allowedBatchCount = computed(() => {
  const targetStatus = batchStatusForm.newStatus
  if (!targetStatus) return selectedRows.value.length
  return selectedRows.value.filter((r) => canChangeStatus(r, targetStatus)).length
})

const canBatchDelete = computed(() =>
  selectedRows.value.length > 0 && currentRole.value === UserRole.SUPER_ADMIN
)
const canBatchUpdate = computed(() =>
  selectedRows.value.length > 0 && (currentRole.value === UserRole.SUPER_ADMIN || currentRole.value === UserRole.ADMIN)
)
const canBatchStatus = computed(() => {
  if (selectedRows.value.length === 0) return true
  const allAllowed = selectedRows.value.every((r) => {
    const targetStatuses = RoleStatusPermission[currentRole.value] || []
    return ['active', 'frozen', 'temp_banned', 'permanent_banned'].every((s) => {
      if (!UserStatusFlow[r.status]?.includes(s)) return true
      return targetStatuses.includes(s) || s !== 'permanent_banned'
    })
  })
  return allAllowed
})

const getStatusGlowColor = (status: string) => UserStatusGlowColor[status] || 'transparent'
const getStatusTagType = (status: string) => UserStatusTagType[status] || 'info'

const isFrozenOrBanned = (row: UserInfo) => ['frozen', 'temp_banned', 'permanent_banned'].includes(row.status)

const canUnlock = (row: UserInfo) => {
  if (row.status === 'active') return true
  const allowed = RoleStatusPermission[currentRole.value] || []
  return allowed.includes('active')
}

const canChangeStatus = (row: UserInfo, targetStatus: string) => {
  if (row.status === targetStatus) return false
  const flow = UserStatusFlow[row.status] || []
  if (!flow.includes(targetStatus)) return false

  const allowed = RoleStatusPermission[currentRole.value] || []
  if (!allowed.includes(targetStatus)) return false

  const fromStatus = row.status
  const action = `${targetStatus}${fromStatus === 'permanent_banned' ? '-from-permanent' : ''}`
  if (HighRiskActions.includes(action) && currentRole.value !== UserRole.SUPER_ADMIN) {
    return false
  }
  return true
}

const getStatusDisabledReason = (row: UserInfo, targetStatus: string) => {
  if (row.status === targetStatus) return '账号已处于此状态'
  const flow = UserStatusFlow[row.status] || []
  if (!flow.includes(targetStatus)) return '不符合状态流转规则'
  const allowed = RoleStatusPermission[currentRole.value] || []
  if (!allowed.includes(targetStatus)) return '当前角色无权操作此状态'
  const fromStatus = row.status
  const action = `${targetStatus}${fromStatus === 'permanent_banned' ? '-from-permanent' : ''}`
  if (HighRiskActions.includes(action)) return '该操作仅超级管理员可执行'
  return '无权限'
}

const canDelete = (row: UserInfo) => currentRole.value === UserRole.SUPER_ADMIN

const triggerShake = () => {
  shakeTrigger.value = true
  setTimeout(() => {
    shakeTrigger.value = false
  }, 400)
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      role: filterForm.role || undefined,
      status: filterForm.status || undefined
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const handleReset = () => {
  filterForm.keyword = ''
  filterForm.role = ''
  filterForm.status = ''
  page.value = 1
  fetchList()
}

const handleSelectionChange = (selection: UserInfo[]) => {
  selectedRows.value = selection
}

const handleClearSelection = () => {
  selectedRows.value = []
}

const validateField = async (field: 'phone' | 'nickname' | 'uid' | 'username') => {
  const value = createForm[field]
  if (!value) {
    fieldValidation[field] = { valid: true, errors: [] }
    return
  }
  try {
    const params: any = { [field]: value }
    const res = await validateAccount(params)
    const result = res.data as AccountValidationResult
    fieldValidation[field] = result[field] || { valid: true, errors: [] }
  } catch {
    fieldValidation[field] = { valid: true, errors: [] }
  }
}

const validateEditField = async (field: 'phone' | 'nickname' | 'uid') => {
  const value = editForm[field]
  if (!value) {
    editFieldValidation[field] = { valid: true, errors: [] }
    return
  }
  try {
    const params: any = { [field]: value, excludeUserId: editForm.id }
    const res = await validateAccount(params)
    const result = res.data as AccountValidationResult
    editFieldValidation[field] = result[field] || { valid: true, errors: [] }
  } catch {
    editFieldValidation[field] = { valid: true, errors: [] }
  }
}

const generateUid = () => {
  const now = new Date()
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomPart = ''
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  createForm.uid = `U${datePart}${randomPart}`
  validateField('uid')
}

const handleAdd = () => {
  Object.assign(fieldValidation, defaultFieldValidation())
  createForm.username = ''
  createForm.password = ''
  createForm.uid = ''
  createForm.nickname = ''
  createForm.phone = ''
  createForm.email = ''
  createForm.role = 'member'
  createForm.permissionGroup = 'default'
  createForm.tags = []
  createForm.status = 'active'
  createDialogVisible.value = true
}

const handleCreateSubmit = async () => {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (!valid) return

    const allValidation = { ...fieldValidation }
    const hasError = Object.values(allValidation).some((v: any) => !v.valid)
    if (hasError) {
      ElMessage.error('请修正校验错误后再提交')
      return
    }

    submitLoading.value = true
    try {
      await createUser({
        username: createForm.username,
        password: createForm.password,
        uid: createForm.uid || undefined,
        nickname: createForm.nickname,
        phone: createForm.phone,
        email: createForm.email,
        role: createForm.role,
        permissionGroup: createForm.permissionGroup,
        tags: createForm.tags,
        status: createForm.status as any
      })
      ElMessage.success('创建成功，已自动生成账号创建日志并初始化基础权限')
      createDialogVisible.value = false
      fetchList()
    } catch (error: any) {
      console.error('创建失败:', error)
    } finally {
      submitLoading.value = false
    }
  })
}

const handleCreateDialogClosed = () => {
  createFormRef.value?.resetFields()
  Object.assign(fieldValidation, defaultFieldValidation())
}

const handleEdit = (row: UserInfo) => {
  editStep.value = 1
  Object.assign(editFieldValidation, defaultFieldValidation())
  Object.assign(editForm, {
    id: row.id,
    uid: row.uid || '',
    username: row.username,
    nickname: row.nickname || '',
    phone: row.phone || '',
    email: row.email || '',
    avatar: row.avatar || '',
    role: row.role,
    status: row.status,
    tags: row.tags ? [...row.tags] : [],
    permissionGroup: row.permissionGroup || 'default',
    newPassword: '',
    verifyPassword: '',
    remark: ''
  })
  Object.assign(editOriginal, {
    phone: row.phone || '',
    nickname: row.nickname || ''
  })
  editDialogVisible.value = true
}

const handleEditSubmit = async () => {
  submitLoading.value = true
  try {
    const updateData: any = {
      nickname: editForm.nickname,
      email: editForm.email,
      avatar: editForm.avatar,
      role: editForm.role,
      status: editForm.status,
      tags: editForm.tags,
      permissionGroup: editForm.permissionGroup,
      remark: editForm.remark,
      editStep: editStep.value
    }

    if (editForm.phone !== editOriginal.phone) {
      updateData.phone = editForm.phone
    }
    if (editForm.newPassword) {
      updateData.password = editForm.newPassword
    }
    if (editForm.phone !== editOriginal.phone || editForm.newPassword) {
      updateData.verifyPassword = editForm.verifyPassword
    }

    await updateUser(editForm.id, updateData)
    ElMessage.success('编辑成功，变更记录已留存')
    editDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    console.error('编辑失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleEditDialogClosed = () => {
  editStep.value = 1
  editForm.newPassword = ''
  editForm.verifyPassword = ''
  editForm.remark = ''
}

const handleStatusChange = async (row: UserInfo) => {
  statusUser.value = row
  statusStep.value = 1
  statusForm.newStatus = ''
  statusForm.reason = ''
  statusForm.statusExpireAt = ''
  statusForm.confirm = false
  statusForm.force = false
  riskPreview.value = null
  statusDialogVisible.value = true
}

const handleStatusDialogOpen = () => {
  nextTick(() => {
    if (statusUser.value) {
      handlePreviewStatusChange()
    }
  })
}

const handlePreviewStatusChange = async () => {
  if (!statusUser.value || !statusForm.newStatus) {
    riskPreview.value = null
    return
  }
  try {
    const res = await getRiskPreview(statusUser.value.id, statusForm.newStatus)
    riskPreview.value = res.data
    if (res.data.frequency.blocked) {
      triggerShake()
      ElMessage.warning(res.data.frequency.violations.map((v) => v.message).join('；'))
    }
  } catch (error) {
    console.error('风控预检失败:', error)
  }
}

const handleForceSubmitEnable = () => {
  if (currentRole.value === UserRole.SUPER_ADMIN) {
    statusForm.force = true
    ElMessage.success('已启用强制提交模式')
  } else {
    ElMessage.error('仅超级管理员可执行强制提交')
  }
}

const handleStatusSubmit = async () => {
  if (!statusUser.value || !statusForm.newStatus) return

  submitLoading.value = true
  try {
    const res = await updateUserStatus(statusUser.value.id, {
      status: statusForm.newStatus,
      reason: statusForm.reason,
      statusExpireAt: statusForm.statusExpireAt || undefined,
      force: statusForm.force
    })
    const result = res.data
    const msg = `状态变更成功：${UserStatusLabel[statusUser.value.status]} → ${UserStatusLabel[statusForm.newStatus]}`
    ElMessage.success(msg + '，创作/素材/营销权限已同步')

    if (result.warnings && result.warnings.length) {
      ElMessage.warning({ message: result.warnings.join('；'), duration: 4000 })
    }

    statusDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    console.error('状态变更失败:', error)
    if (error?.code === 400 && error?.details) {
      triggerShake()
    }
  } finally {
    submitLoading.value = false
  }
}

const handleBatchStatusOpen = () => {
  batchStatusForm.newStatus = ''
  batchStatusForm.reason = ''
  batchStatusForm.statusExpireAt = ''
  batchStatusForm.confirm = false
  batchStatusDialogVisible.value = true
}

const handleBatchStatusAction = async (status: string) => {
  if (selectedRows.value.length === 0) return

  const target = status === 'active' ? '启用' : '冻结'
  try {
    await ElMessageBox.confirm(
      `确定要批量${target}选中的 ${selectedRows.value.length} 个用户吗？系统将自动过滤无权操作的账号。`,
      '批量状态确认',
      { type: 'warning' }
    )

    const ids = selectedRows.value.map((r) => r.id)
    const res = await batchChangeUserStatus({
      ids,
      status,
      reason: `批量${target}操作`
    })
    const result = res.data

    let msg = `批量${target}完成，成功 ${result.success.length} 个`
    if (result.failed.length > 0) msg += `，失败 ${result.failed.length} 个`
    ElMessage.success(msg)

    if (result.failed.length > 0) {
      const failReasons = result.failed.map((f) => `${f.username}: ${f.reason}`).join('\n')
      setTimeout(() => {
        ElMessage.warning({ message: '失败详情:\n' + failReasons, duration: 5000 })
      }, 500)
    }

    selectedRows.value = []
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量状态调整失败:', error)
    }
  }
}

const handleBatchStatusSubmit = async () => {
  if (selectedRows.value.length === 0 || !batchStatusForm.newStatus) return

  submitLoading.value = true
  try {
    const ids = selectedRows.value.map((r) => r.id)
    const res = await batchChangeUserStatus({
      ids,
      status: batchStatusForm.newStatus,
      reason: batchStatusForm.reason,
      statusExpireAt: batchStatusForm.statusExpireAt || undefined
    })
    const result = res.data

    let msg = `批量状态变更完成，成功 ${result.success.length} 个`
    if (result.failed.length > 0) msg += `，失败 ${result.failed.length} 个`
    ElMessage.success(msg)

    if (result.failed.length > 0) {
      const failReasons = result.failed.map((f) => `${f.username}: ${f.reason}`).join('\n')
      ElMessage.warning({ message: '失败详情:\n' + failReasons, duration: 5000 })
    }

    batchStatusDialogVisible.value = false
    selectedRows.value = []
    fetchList()
  } catch (error: any) {
    console.error('批量状态变更失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: UserInfo) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户"${row.username}"吗？`, '提示', { type: 'warning' })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个用户吗？`,
      '提示',
      { type: 'warning' }
    )

    const ids = selectedRows.value.map((item) => item.id)
    await batchDeleteUser(ids)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

const handleBatchUpdateOpen = () => {
  batchForm.nicknameSuffix = ''
  batchForm.tags = []
  batchForm.permissionGroup = ''
  batchUpdateDialogVisible.value = true
}

const handleBatchUpdateSubmit = async () => {
  if (selectedRows.value.length === 0) return

  submitLoading.value = true
  try {
    const ids = selectedRows.value.map((row) => row.id)
    const data: any = { ids }
    if (batchForm.nicknameSuffix) data.nicknameSuffix = batchForm.nicknameSuffix
    if (batchForm.tags.length) data.tags = batchForm.tags
    if (batchForm.permissionGroup) data.permissionGroup = batchForm.permissionGroup

    const res = await batchUpdateUsers(data)
    const result = res.data

    if (result.failedItems.length > 0) {
      const failedNames = result.failedItems.map((f) => `${f.username}: ${f.reasons.join(',')}`).join('\n')
      ElMessage.warning({
        message: `批量更新完成，${result.updated}个成功，${result.failedItems.length}个失败：\n${failedNames}`,
        duration: 5000
      })
    } else {
      ElMessage.success(`批量更新成功，共更新${result.updated}个用户`)
    }

    batchUpdateDialogVisible.value = false
    const refreshIds = result.successIds
    if (refreshIds.length > 0) {
      const listRes = await getUserList({ page: page.value, pageSize: pageSize.value })
      tableData.value = listRes.data.list
      total.value = listRes.data.total
    }
  } catch (error: any) {
    console.error('批量更新失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleTraceOpen = () => {
  traceForm.uid = ''
  traceForm.phone = ''
  traceForm.username = ''
  traceForm.registerTimeRange = null
  traceResults.value = []
  traceTotal.value = 0
  traceSearched.value = false
  traceDialogVisible.value = true
}

const handleTraceOne = (row: UserInfo) => {
  traceForm.uid = row.uid || ''
  traceForm.phone = ''
  traceForm.username = ''
  traceForm.registerTimeRange = null
  traceResults.value = []
  traceTotal.value = 0
  traceSearched.value = false
  traceDialogVisible.value = true
}

const handleTraceSearch = async () => {
  traceLoading.value = true
  traceSearched.value = true
  try {
    const params: any = {
      page: tracePage.value,
      pageSize: 10
    }
    if (traceForm.uid) params.uid = traceForm.uid
    if (traceForm.phone) params.phone = traceForm.phone
    if (traceForm.username) params.username = traceForm.username
    if (traceForm.registerTimeRange && traceForm.registerTimeRange.length === 2) {
      params.registerTimeStart = traceForm.registerTimeRange[0]
      params.registerTimeEnd = traceForm.registerTimeRange[1]
    }

    const res = await traceAccount(params)
    traceResults.value = res.data.list
    traceTotal.value = res.data.total
  } catch (error: any) {
    console.error('溯源检索失败:', error)
  } finally {
    traceLoading.value = false
  }
}

const handleViewEditLogs = async (row: UserInfo) => {
  editLogUser.value = row
  editLogActiveTab.value = 'edit'
  editLogLoading.value = true
  statusLogLoading.value = true
  tagLogLoading.value = true
  levelLogLoading.value = true
  editLogDialogVisible.value = true
  try {
    const [editRes, statusRes, tagRes, levelRes] = await Promise.all([
      getEditLogs(row.id, { page: 1, pageSize: 50 }),
      getStatusLogs(row.id, { page: 1, pageSize: 50 }),
      getMemberTagLogs(row.id, { page: 1, pageSize: 50 }),
      getMemberLevelLogs(row.id, { page: 1, pageSize: 50 })
    ])
    editLogData.value = editRes.data.list
    statusLogData.value = statusRes.data.list
    tagLogData.value = (tagRes.data as any).list || []
    levelLogData.value = (levelRes.data as any).list || []
  } catch (error) {
    console.error('获取变更记录失败:', error)
  } finally {
    editLogLoading.value = false
    statusLogLoading.value = false
    tagLogLoading.value = false
    levelLogLoading.value = false
  }
}

const handleViewStatusLogs = async (row: UserInfo) => {
  editLogUser.value = row
  editLogActiveTab.value = 'status'
  editLogLoading.value = true
  statusLogLoading.value = true
  tagLogLoading.value = true
  levelLogLoading.value = true
  editLogDialogVisible.value = true
  try {
    const [editRes, statusRes, tagRes, levelRes] = await Promise.all([
      getEditLogs(row.id, { page: 1, pageSize: 50 }),
      getStatusLogs(row.id, { page: 1, pageSize: 50 }),
      getMemberTagLogs(row.id, { page: 1, pageSize: 50 }),
      getMemberLevelLogs(row.id, { page: 1, pageSize: 50 })
    ])
    editLogData.value = editRes.data.list
    statusLogData.value = statusRes.data.list
    tagLogData.value = (tagRes.data as any).list || []
    levelLogData.value = (levelRes.data as any).list || []
  } catch (error) {
    console.error('获取变更记录失败:', error)
  } finally {
    editLogLoading.value = false
    statusLogLoading.value = false
    tagLogLoading.value = false
    levelLogLoading.value = false
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.replace('T', ' ').substring(0, 16)
}

const truncateStr = (str: string | null | undefined, max: number) => {
  if (!str) return '-'
  try {
    const parsed = JSON.parse(str)
    str = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed)
  } catch {}
  return str.length > max ? str.substring(0, max) + '...' : str
}

// ===== 基础辅助函数 =====
const getDisplayLevel = (internal: string | undefined): string =>
  internal ? (INTERNAL_TO_DISPLAY_LEVEL[internal as keyof typeof INTERNAL_TO_DISPLAY_LEVEL] || 'normal') : 'normal'

const canChangeLevel = (row: UserInfo): boolean =>
  currentRole.value === UserRole.SUPER_ADMIN || currentRole.value === UserRole.ADMIN

const canLevelForce = computed(() => currentRole.value === UserRole.SUPER_ADMIN)

// ===== 标签定义 =====
const availableTagDefinitions = computed(() =>
  tagDefinitions.value.filter((t) => t.status === 'active')
)

const filteredTagDefinitions = computed(() => {
  let list = tagDefinitions.value
  if (tagDefFilter.dimension) {
    list = list.filter((t) => t.dimension === tagDefFilter.dimension)
  }
  if (tagDefFilter.status) {
    list = list.filter((t) => t.status === tagDefFilter.status)
  }
  return list
})

const loadTagDefinitions = async () => {
  tagDefLoading.value = true
  try {
    const res = await listTagDefinitions({ page: 1, pageSize: 100 })
    tagDefinitions.value = (res.data as any).list || []
  } catch (error) {
    console.error('加载标签定义失败:', error)
  } finally {
    tagDefLoading.value = false
  }
}

const openTagDefinitionDialog = async () => {
  tagDialogVisible.value = true
  await loadTagDefinitions()
}

const validateTagDefName = async () => {
  if (!tagDefForm.name) {
    tagDefNameValid.value = true
    tagDefNameError.value = ''
    return
  }
  try {
    const res = await validateTagName(tagDefForm.name, tagDefEditingId.value || undefined)
    tagDefNameValid.value = (res.data as any).valid
    tagDefNameError.value = (res.data as any).reason || ''
  } catch {
    tagDefNameValid.value = true
    tagDefNameError.value = ''
  }
}

const resetTagDefForm = () => {
  tagDefForm.name = ''
  tagDefForm.color = '#409EFF'
  tagDefForm.dimension = 'composite'
  tagDefForm.applicableLevels = []
  tagDefForm.minConsumeAmount = 0
  tagDefForm.minActiveHours = 0
  tagDefForm.minCreateCount = 0
  tagDefForm.description = ''
  tagDefNameValid.value = true
  tagDefNameError.value = ''
  tagDefEditingId.value = null
  showTagDefForm.value = false
}

const cancelTagDefForm = () => {
  resetTagDefForm()
}

const handleEditTagDef = (row: TagDefinition) => {
  tagDefEditingId.value = row.id
  tagDefForm.name = row.name
  tagDefForm.color = row.color || '#409EFF'
  tagDefForm.dimension = row.dimension || 'composite'
  tagDefForm.applicableLevels = [...(row.applicableLevels || [])]
  tagDefForm.minConsumeAmount = row.minConsumeAmount || 0
  tagDefForm.minActiveHours = row.minActiveHours || 0
  tagDefForm.minCreateCount = row.minCreateCount || 0
  tagDefForm.description = row.description || ''
  tagDefNameValid.value = true
  tagDefNameError.value = ''
  showTagDefForm.value = true
}

const handleSaveTagDef = async () => {
  if (!tagDefForm.name?.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  if (!tagDefNameValid.value) {
    ElMessage.error('标签名称校验未通过')
    return
  }
  if (!tagDefForm.applicableLevels?.length) {
    ElMessage.warning('请至少选择一个适用层级')
    return
  }
  tagDefSaving.value = true
  try {
    const payload = { ...tagDefForm }
    if (tagDefEditingId.value) {
      await updateTagDefinition(tagDefEditingId.value, payload)
      ElMessage.success('标签定义更新成功')
    } else {
      await createTagDefinition(payload)
      ElMessage.success('标签定义创建成功')
    }
    resetTagDefForm()
    await loadTagDefinitions()
  } catch (error) {
    console.error('保存标签定义失败:', error)
  } finally {
    tagDefSaving.value = false
  }
}

const handleToggleTagDefStatus = async (row: TagDefinition) => {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  try {
    await updateTagDefinition(row.id, { status: newStatus } as any)
    ElMessage.success(`标签已${newStatus === 'active' ? '启用' : '禁用'}`)
    await loadTagDefinitions()
  } catch (error) {
    console.error('切换标签状态失败:', error)
  }
}

// ===== 层级调整 =====
const openBatchTagDialog = () => {
  batchTagForm.filterBy = ''
  batchTagForm.consumeLevel = ''
  batchTagForm.activeMin = null
  batchTagForm.activeMax = null
  batchTagForm.tagNames = []
  batchTagProgress.value = 0
  batchTagProcessing.value = false
  batchTagResult.value = null
  processedCount.value = 0
  totalUserCount.value = 0
  batchTagDialogVisible.value = true
  if (availableTagDefinitions.value.length === 0) {
    loadTagDefinitions()
  }
}

const handleLevelDialogOpened = () => {
  loadLevelCriteriaMeta()
}

const loadLevelCriteriaMeta = async () => {
  if (levelCriteriaMeta.value) return
  try {
    const res = await getLevelCriteriaMeta()
    levelCriteriaMeta.value = res.data as any
  } catch (error) {
    console.error('加载层级标准失败:', error)
  }
}

const handleLevelChange = async (row: UserInfo) => {
  levelUser.value = row
  levelStep.value = 1
  levelDialogVisible.value = true
  levelPreview.value = null
  levelForm.targetLevel = ''
  levelForm.force = false
  levelForm.reason = ''
  levelForm.confirm = false
}

const levelCriteriaItems = computed(() => {
  if (!levelPreview.value || !levelUser.value?.member) return []
  const items: any[] = []
  const consume = levelUser.value.member.consumeAmount || 0
  const active = levelUser.value.member.activeHours || 0
  const create = levelUser.value.member.createCount || 0
  const criteria = levelPreview.value.criteria || LEVEL_UPGRADE_CRITERIA[levelForm.targetLevel as keyof typeof LEVEL_UPGRADE_CRITERIA]

  if (criteria?.minConsumeAmount !== undefined) {
    const req = criteria.minConsumeAmount
    items.push({
      label: '累计消费金额',
      current: consume,
      require: req,
      pass: consume >= req,
      percent: Math.min(100, Math.round((consume / Math.max(1, req)) * 100))
    })
  }
  if (criteria?.minActiveHours !== undefined) {
    const req = criteria.minActiveHours
    items.push({
      label: '累计活跃时长(小时)',
      current: active,
      require: req,
      pass: active >= req,
      percent: Math.min(100, Math.round((active / Math.max(1, req)) * 100))
    })
  }
  if (criteria?.minCreateCount !== undefined) {
    const req = criteria.minCreateCount
    items.push({
      label: '累计创作数量',
      current: create,
      require: req,
      pass: create >= req,
      percent: Math.min(100, Math.round((create / Math.max(1, req)) * 100))
    })
  }
  return items
})

const oldBenefits = computed(() => {
  if (!levelUser.value) return []
  const oldLvl = getDisplayLevel(levelUser.value.member?.level)
  const newLvl = levelForm.targetLevel
  const newBenefitKeys = LEVEL_BENEFITS[newLvl as keyof typeof LEVEL_BENEFITS] || []
  const benefits = LEVEL_BENEFITS[oldLvl as keyof typeof LEVEL_BENEFITS] || []
  return benefits.map((b: BenefitItem) => ({
    ...b,
    isRemoved: !newBenefitKeys.some((nb: BenefitItem) => nb.key === b.key)
  }))
})

const newBenefits = computed(() => {
  if (!levelUser.value) return []
  const oldLvl = getDisplayLevel(levelUser.value.member?.level)
  const newLvl = levelForm.targetLevel
  const oldBenefitKeys = LEVEL_BENEFITS[oldLvl as keyof typeof LEVEL_BENEFITS] || []
  const benefits = LEVEL_BENEFITS[newLvl as keyof typeof LEVEL_BENEFITS] || []
  return benefits.map((b: BenefitItem) => ({
    ...b,
    isAdded: !oldBenefitKeys.some((ob: BenefitItem) => ob.key === b.key)
  }))
})

const goLevelStep = (step: number) => {
  levelStep.value = step
}

const doLevelPreview = async () => {
  if (!levelUser.value || !levelForm.targetLevel) return
  levelPreview.value = null
  try {
    const res = await getLevelPreview(levelUser.value.id, levelForm.targetLevel)
    levelPreview.value = res.data as any
  } catch (error) {
    console.error('获取层级预览失败:', error)
  }
}

const handleLevelSubmit = async () => {
  if (!levelUser.value) return
  submitLoading.value = true
  try {
    const res = await changeMemberLevel(levelUser.value.id, {
      targetLevel: levelForm.targetLevel,
      force: levelForm.force,
      reason: levelForm.reason
    })
    const result = res.data as any
    rippleTrigger.value = true
    setTimeout(() => { rippleTrigger.value = false }, 1800)
    if (result?.unlockedBenefits?.length) {
      ElMessage.success(`解锁权益：${result.unlockedBenefits.map((b: BenefitItem) => b.label).join('、')}`)
    }
    if (result?.recoveredBenefits?.length) {
      setTimeout(() => {
        ElMessage.warning(`回收权益：${result.recoveredBenefits.map((b: BenefitItem) => b.label).join('、')}`)
      }, 300)
    }
    if (!result?.unlockedBenefits?.length && !result?.recoveredBenefits?.length) {
      ElMessage.success('用户层级调整成功')
    }
    levelDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    console.error('层级调整失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// ===== 标签编辑 =====
const hasDuplicateTags = computed(() => {
  const tags = tagEditForm.selectedTags
  return tags.length !== new Set(tags).size
})

const handleTagEdit = async (row: UserInfo) => {
  tagEditUser.value = row
  tagEditForm.selectedTags = [...new Set(row.tags || [])]
  Object.keys(tagMismatch).forEach((k) => delete tagMismatch[k])
  tagEditDialogVisible.value = true
  if (availableTagDefinitions.value.length === 0) {
    loadTagDefinitions()
  }
  for (const t of row.tags || []) {
    try {
      const r = await checkUserTagMatch(row.id, t)
      const d = r.data as any
      tagMismatch[t] = !d.custom && !d.matched
    } catch {}
  }
}

const onTagChange = async (tags: string[]) => {
  if (!tagEditUser.value) return
  const deduped = [...new Set(tags)]
  if (deduped.length !== tags.length) {
    tagEditForm.selectedTags = deduped
  }
  for (const t of deduped) {
    if (tagMismatch[t] === undefined) {
      try {
        const r = await checkUserTagMatch(tagEditUser.value!.id, t)
        const d = r.data as any
        tagMismatch[t] = !d.custom && !d.matched
      } catch {
        tagMismatch[t] = false
      }
    }
  }
}

const saveTagEdit = async () => {
  if (!tagEditUser.value) return
  submitLoading.value = true
  try {
    const oldTags = tagEditUser.value.tags || []
    const newTags = [...new Set(tagEditForm.selectedTags)]
    const added = newTags.filter((t) => !oldTags.includes(t))
    const removed = oldTags.filter((t) => !newTags.includes(t))
    if (added.length) {
      await addUserTags(tagEditUser.value.id, { tagNames: added })
    }
    if (removed.length) {
      await removeUserTags(tagEditUser.value.id, { tagNames: removed })
    }
    ElMessage.success(`标签保存成功：新增 ${added.length} 个，移除 ${removed.length} 个`)
    tagEditDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    console.error('保存标签失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// ===== 批量标签 =====
const handleBatchTagSubmit = async () => {
  batchTagProcessing.value = true
  batchTagProgress.value = 0
  processedCount.value = 0
  batchTagResult.value = null
  try {
    const ids = selectedRows.value.length > 0 ? selectedRows.value.map((r) => r.id) : undefined
    const activeRange: any =
      batchTagForm.activeMin !== null || batchTagForm.activeMax !== null
        ? [batchTagForm.activeMin, batchTagForm.activeMax]
        : null
    const res = await batchApplyTags({
      userIds: ids,
      tagNames: batchTagForm.tagNames,
      filterBy: batchTagForm.filterBy || null,
      activeRange: activeRange?.some((v: any) => v !== null && v !== '') ? activeRange : null,
      consumeLevel: batchTagForm.consumeLevel || null
    } as any)
    const result = res.data as any
    totalUserCount.value = result.total || 1
    const total = Math.max(1, result.successCount + result.failedCount + result.skippedCount)
    for (let i = 1; i <= 100; i++) {
      await new Promise((r) => setTimeout(r, 15))
      batchTagProgress.value = i
      processedCount.value = Math.ceil((total * i) / 100)
    }
    batchTagResult.value = result
    ElMessage.success(
      `完成：成功 ${result.successCount} 个，失败 ${result.failedCount} 个，跳过 ${result.skippedCount} 个`
    )
    if (result.successCount > 0) {
      fetchList()
    }
  } catch (error) {
    console.error('批量标签配置失败:', error)
    ElMessage.error('批量标签配置失败')
  } finally {
    batchTagProcessing.value = false
  }
}

// ===== 标签溯源 =====
const handleTagTrace = async (row: UserInfo) => {
  tagTraceUser.value = row
  tagTraceResult.value = null
  tagTraceActiveTab.value = 'tagHistory'
  tagTraceDialogVisible.value = true
  try {
    const res = await getTagTrace(row.id)
    tagTraceResult.value = res.data as any
  } catch (error) {
    console.error('获取标签溯源失败:', error)
  }
}

const cleanTags = async () => {
  if (!tagTraceUser.value) return
  tagCleaning.value = true
  try {
    const res = await cleanRedundantTags(tagTraceUser.value.id)
    const cleaned = (res.data as any).cleaned || []
    ElMessage.success(`清理完成，共清理 ${cleaned.length} 个冗余标签`)
    await handleTagTrace(tagTraceUser.value)
    fetchList()
  } catch (error) {
    console.error('清理冗余标签失败:', error)
  } finally {
    tagCleaning.value = false
  }
}

const getBatchProgressPercent = () => batchTagProgress.value

// ========= 登录行为管控 - 响应式变量 =========
const loginLogDialogVisible = ref(false)
const loginDialogTargetUser = ref<UserInfo | null>(null)
const loginLogs = ref<LoginLog[]>([])
const loginLogsTotal = ref(0)
const loginLogsLoading = ref(false)
const loginLogsSelection = ref<LoginLog[]>([])
const batchLockDevices = ref(false)
const loginBatchResultDialog = ref(false)
const loginBatchResult = ref<BatchProcessLoginResult | null>(null)
const loginDetailDialogVisible = ref(false)
const loginDetail = ref<LoginDetailResult | null>(null)
const loginAlertDialogVisible = ref(false)
const loginAlertShake = ref(false)
const loginAlertLog = ref<LoginLog | null>(null)
const verifyBtnHovered = ref(false)
const verifyBtnPressed = ref(false)
const deviceDialogVisible = ref(false)
const deviceDialogUser = ref<UserInfo | null>(null)
const deviceList = ref<LoginDevice[]>([])
const deviceTotal = ref(0)
const devicePage = ref(1)
const devicePageSize = ref(10)
const deviceLoading = ref(false)
const loginRiskDialogVisible = ref(false)
const loginRiskDialogUser = ref<UserInfo | null>(null)
const loginRiskSummary = ref<LoginRiskSummary | null>(null)
const showBackToTop = ref(false)
const loginLogTableWrap = ref<any>(null)

const loginQuery = reactive<LoginQueryParams & { timeRange?: [string, string] }>({
  page: 1, pageSize: 20,
  username: '', status: '', riskLevel: '',
  ip: '', os: '', browser: '',
  isMarkedRisk: false
})

// ========= 登录行为管控 - 核心方法 =========
const openLoginLogDialog = (user: UserInfo | null) => {
  loginDialogTargetUser.value = user
  loginQuery.page = 1
  if (user) {
    loginQuery.userId = user.id
    loginQuery.username = ''
  } else {
    delete loginQuery.userId
  }
  fetchLoginLogs(1)
  loginLogDialogVisible.value = true
}
const openLoginLogDialogByDevice = (device: LoginDevice) => {
  deviceDialogVisible.value = false
  loginQuery.deviceId = device.deviceId
  if (deviceDialogUser.value) loginQuery.userId = deviceDialogUser.value.id
  fetchLoginLogs(1)
  loginLogDialogVisible.value = true
}
const fetchLoginLogs = async (page?: number) => {
  if (page) loginQuery.page = page
  const params: LoginQueryParams = { ...loginQuery }
  if (loginQuery.timeRange && loginQuery.timeRange.length === 2) {
    params.startTime = loginQuery.timeRange[0]
    params.endTime = loginQuery.timeRange[1]
  }
  loginLogsLoading.value = true
  try {
    const res = await queryLoginLogs(params)
    loginLogs.value = res.data.list
    loginLogsTotal.value = res.data.total
  } finally { loginLogsLoading.value = false }
}
const getLoginLogRowClass = ({ row }: { row: LoginLog }) => {
  const classes = []
  if (row.isMarkedRisk) classes.push('risk-row-red')
  if (row.riskLevel === 'high' || row.riskLevel === 'critical') classes.push('risk-row-highlight')
  if (loginLogsSelection.value.some(s => s.id === row.id)) classes.push('selected-row-highlight')
  return classes.join(' ')
}
const handleLoginRowClick = (row: LoginLog) => {
  if ((row.riskLevel === 'high' || row.riskLevel === 'critical') && row.status !== 'success' && row.status !== 'verified') {
    triggerLoginAlert(row)
  }
}
const viewLoginDetail = async (row: LoginLog) => {
  try {
    const res = await getLoginDetail(row.id)
    loginDetail.value = res.data
    loginDetailDialogVisible.value = true
  } catch (e) { /* ignore */ }
}
const markLoginRisk = async (row: LoginLog) => {
  await ElMessageBox.prompt('请输入标记原因（可选）', '标记为风险登录', {
    confirmButtonText: '确认标记',
    cancelButtonText: '取消',
    inputPlaceholder: '例如：疑似脚本登录',
    type: 'warning'
  }).then(async ({ value }) => {
    const res = await markRiskLoginLog(row.id, value || '人工标记风险')
    ElMessage.success(res.data.deviceLocked ? `标记成功，已同步锁定关联设备` : '标记成功')
    await fetchLoginLogs()
    if (loginDetail.value && loginDetail.value.log.id === row.id) viewLoginDetail(row)
  }).catch(() => {})
}
const clearLoginRisk = async (row: LoginLog) => {
  const { value } = await ElMessageBox.prompt('请输入清除原因（可选）', '清除风险标记', {
    confirmButtonText: '确认清除', cancelButtonText: '取消',
    inputPlaceholder: '例如：确认为本人正常登录', type: 'success'
  }).catch(() => ({}))
  const res = await clearRiskLoginLog(row.id, value || '人工清除标记')
  ElMessage.success('清除成功')
  await fetchLoginLogs()
  if (loginDetail.value && loginDetail.value.log.id === row.id) viewLoginDetail(row)
}
const verifyLoginFromDetail = async () => {
  if (!loginDetail.value) return
  await verifyLoginRecord(loginDetail.value.log.id)
  ElMessage.success('已验证通过')
  viewLoginDetail(loginDetail.value.log)
}
const batchProcessLoginLogs = async (action: 'mark' | 'clear' | 'delete') => {
  if (!loginLogsSelection.value.length) return
  const ids = loginLogsSelection.value.map(r => r.id)
  let needConfirm = true, title = '', type: any = 'warning'
  if (action === 'mark') { title = `确定要将选中的 ${ids.length} 条记录标记为风险吗？${batchLockDevices.value ? '将同步锁定关联设备' : ''}` }
  else if (action === 'clear') { title = `确定要清除选中的 ${ids.length} 条记录的风险标记吗？` }
  else { title = `确定要删除选中的 ${ids.length} 条记录吗？此操作不可恢复`, type = 'error' }
  await ElMessageBox.confirm(title, '批量操作确认', { type, confirmButtonText: '确认执行', cancelButtonText: '取消' }).catch(() => { needConfirm = false })
  if (!needConfirm) return
  const res = await batchProcessLoginLogs({ ids, action, lockDevices: action === 'mark' && batchLockDevices.value })
  loginBatchResult.value = res.data
  loginBatchResultDialog.value = true
  await fetchLoginLogs()
  loginLogsSelection.value = []
}
const onLoginLogScroll = (e: Event) => {
  const target = e.target as HTMLElement
  showBackToTop.value = target.scrollTop > (typeof SCROLL_BACK_TO_TOP_THRESHOLD === 'number' ? SCROLL_BACK_TO_TOP_THRESHOLD : 500)
}
const scrollLoginLogTop = () => {
  if (loginLogTableWrap.value?.$el) loginLogTableWrap.value.$el.scrollTop = 0
  else if (loginLogTableWrap.value) loginLogTableWrap.value.scrollTop = 0
}
const triggerLoginAlert = (row: LoginLog) => {
  loginAlertLog.value = row
  loginAlertDialogVisible.value = true
  loginAlertShake.value = true
  setTimeout(() => loginAlertShake.value = false, 500)
}
const handleAlertLockDevice = async () => {
  if (!loginAlertLog.value?.userId || !loginAlertLog.value.deviceId) return
  await lockLoginDevice(loginAlertLog.value.userId, loginAlertLog.value.deviceId, { reason: loginAlertLog.value.failReason || '异常登录锁定' })
  ElMessage.success('设备已锁定')
  loginAlertDialogVisible.value = false
  fetchLoginLogs()
}
const handleAlertVerify = async () => {
  if (!loginAlertLog.value) return
  await verifyLoginRecord(loginAlertLog.value.id)
  ElMessage.success('已确认为本人登录')
  loginAlertDialogVisible.value = false
  fetchLoginLogs()
}
// ========= 设备管控 =========
const openDeviceDialog = async (user: UserInfo) => {
  deviceDialogUser.value = user
  devicePage.value = 1
  await fetchDevices(1)
  deviceDialogVisible.value = true
}
const fetchDevices = async (page?: number) => {
  if (!deviceDialogUser.value) return
  if (page) devicePage.value = page
  deviceLoading.value = true
  try {
    const res = await listLoginDevices(deviceDialogUser.value.id, { page: devicePage.value, pageSize: devicePageSize.value })
    deviceList.value = res.data.list
    deviceTotal.value = res.data.total
  } finally { deviceLoading.value = false }
}
const lockDevice = async (device: LoginDevice, reason?: string) => {
  if (!deviceDialogUser.value) return
  let level: 'temporary' | 'permanent' = 'temporary'
  try {
    const { value } = await ElMessageBox.prompt(
      `锁定原因（可选），关闭时取消`,
      '锁定设备 - ' + (device.deviceName || device.deviceId.slice(0, 16)),
      { confirmButtonText: '临时锁定(24h)', cancelButtonText: '永久锁定', inputPlaceholder: '例如：疑似被盗', type: 'warning' }
    ).catch(() => ({}))
    if (value === undefined) {
      level = 'permanent'
    }
    await lockLoginDevice(deviceDialogUser.value.id, device.deviceId, {
      level, reason: reason || value || '人工锁定',
      lockHours: level === 'temporary' ? 24 : undefined
    })
    ElMessage.success(level === 'permanent' ? '已永久锁定' : '已临时锁定24小时')
  } catch (e) { /* skip cancel */ return }
  fetchDevices()
}
const unlockDevice = async (device: LoginDevice) => {
  if (!deviceDialogUser.value) return
  await unlockLoginDevice(deviceDialogUser.value.id, device.deviceId)
  ElMessage.success('设备已解锁')
  fetchDevices()
}
const lockDeviceFromDetail = () => {
  if (!loginDetail.value?.device || !loginDetail.value.userId) return
  lockDevice(loginDetail.value.device)
  if (loginDetail.value) viewLoginDetail(loginDetail.value.log)
}
const unlockDeviceFromDetail = () => {
  if (!loginDetail.value?.device || !loginDetail.value.log.userId) return
  unlockDevice(loginDetail.value.log.userId, loginDetail.value.device.deviceId)
  if (loginDetail.value) viewLoginDetail(loginDetail.value.log)
}
// ========= 登录风控总览 =========
const openLoginRiskDialog = async (user: UserInfo) => {
  loginRiskDialogUser.value = user
  const res = await getLoginRiskSummary(user.id)
  loginRiskSummary.value = res.data
  loginRiskDialogVisible.value = true
}

watch(loginLogs, (list) => {
  const highRisk = list.find(l =>
    (l.riskLevel === 'high' || l.riskLevel === 'critical')
    && !l.isCleared && (l.status === 'blocked' || l.status === 'pending')
  )
  if (highRisk && loginLogDialogVisible.value) {
    setTimeout(() => triggerLoginAlert(highRisk), 400)
  }
}, { once: false })

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.platform-users {
  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .toolbar-left {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .toolbar-right {
        .role-tag {
          border-radius: 8px;
          padding: 4px 12px;
        }
      }

      .toolbar-btn {
        border-radius: 8px;
      }
    }
  }

  .uid-text {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: $text-secondary;
  }

  .user-tag {
    margin-right: 4px;
    margin-bottom: 2px;
  }

  .text-muted {
    color: $text-placeholder;
  }

  &.shake {
    animation: pageShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
  }

  @keyframes pageShake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-4px); }
    40%, 60% { transform: translateX(4px); }
  }
}

.status-glow-tag {
  display: inline-flex;
  position: relative;
  padding: 2px 4px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
  }

  :deep(.el-tag) {
    box-shadow: 0 0 12px var(--glow-color, transparent);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    animation: tagGlow 2s ease-in-out infinite alternate;
  }
}

@keyframes tagGlow {
  from {
    box-shadow: 0 0 4px var(--glow-color, transparent);
  }
  to {
    box-shadow: 0 0 14px var(--glow-color, transparent);
  }
}

.status-active :deep(.el-tag) { animation-delay: 0s; }
.status-frozen :deep(.el-tag) { animation-delay: 0.3s; }
.status-temp_banned :deep(.el-tag) { animation-delay: 0.6s; }
.status-permanent_banned :deep(.el-tag) { animation-delay: 0.9s; }

.validated-input-wrap {
  position: relative;
  width: 100%;

  .check-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    z-index: 1;

    &.success {
      color: $success-color;
    }

    &.error {
      color: $danger-color;
    }
  }
}

.field-error {
  font-size: 12px;
  color: $danger-color;
  margin-top: 4px;
  line-height: 1.4;
}

.focus-scale-input {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:focus,
  :deep(.el-input__inner:focus) {
    transform: scale(1.02);
    box-shadow: 0 0 0 2px rgba($primary-color, 0.15);
  }
}

.edit-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  padding: 0 20px;

  .step-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      background: $border-color-light;
      color: $text-secondary;
      transition: all 0.3s ease;
    }

    .step-label {
      margin-top: 6px;
      font-size: 12px;
      color: $text-secondary;
      transition: color 0.3s ease;
    }

    &.active {
      .step-num {
        background: $primary-color;
        color: #fff;
      }
      .step-label {
        color: $primary-color;
        font-weight: 600;
      }
    }

    &.completed {
      .step-num {
        background: $success-color;
        color: #fff;
      }
      .step-label {
        color: $success-color;
      }
    }
  }

  .step-line {
    flex: 1;
    height: 2px;
    background: $border-color-light;
    margin: 0 12px;
    margin-bottom: 22px;
    transition: background 0.3s ease;

    &.active {
      background: $success-color;
    }
  }
}

.step-panel {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.core-field-alert {
  margin-bottom: 16px;
}

.edit-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.scale-fade-dialog {
  :deep(.el-dialog) {
    animation: dialogScaleIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    transition: opacity 0.2s ease, transform 0.25s ease;
  }

  :deep(.v-enter-active) {
    animation: dialogScaleIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  :deep(.v-leave-active) {
    animation: dialogSlideDown 0.25s ease;
  }
}

@keyframes dialogScaleIn {
  0% {
    opacity: 0;
    transform: translateY(-40px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dialogSlideDown {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
  }
}

.status-steps {
  margin-bottom: 24px;
  padding: 0 10px;
}

.status-desc {
  margin-bottom: 20px;
}

.status-form {
  .status-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border: 1px solid $border-color-lighter;
    border-radius: 8px;
    margin-bottom: 10px;
    transition: all 0.25s ease;

    &:hover {
      border-color: $primary-color;
      box-shadow: $shadow-light;
    }

    &.selected {
      border-color: $primary-color;
      background: rgba($primary-color, 0.05);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        border-color: $border-color-lighter;
        box-shadow: none;
      }
    }

    .lock-icon {
      color: $text-placeholder;
      cursor: help;
      margin-left: auto;
    }
  }
}

.risk-preview {
  margin-top: 20px;

  .el-alert {
    margin-bottom: 12px;
  }

  .el-descriptions {
    margin-top: 16px;

    :deep(.el-descriptions-item__content) {
      .danger {
        color: $danger-color;
        font-weight: 600;
      }
    }
  }

  .log-tag {
    margin-right: 4px;
    margin-bottom: 2px;
  }
}

.status-step-panel {
  min-height: 320px;
  animation: fadeSlideIn 0.3s ease;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.permission-sync-preview {
  margin-top: 20px;

  .preview-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: $text-primary;
  }

  .perm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;

    .perm-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid $border-color-lighter;
      transition: all 0.25s ease;

      &.enabled {
        background: rgba($success-color, 0.06);
        border-color: rgba($success-color, 0.3);
      }

      &.disabled {
        background: rgba($danger-color, 0.04);
        border-color: rgba($danger-color, 0.2);
      }

      .perm-icon {
        font-size: 16px;

        &.ok { color: $success-color; }
        &.no { color: $danger-color; }
      }
    }
  }
}

.batch-alert {
  margin-bottom: 16px;
}

.batch-summary {
  margin-bottom: 16px;
  font-size: 14px;
  color: $text-regular;

  em {
    color: $primary-color;
    font-style: normal;
    font-weight: 600;
  }
}

.batch-selected-info {
  margin-bottom: 16px;
  font-size: 14px;
  color: $text-regular;

  em {
    color: $primary-color;
    font-style: normal;
    font-weight: 600;
  }
}

.batch-form {
  .batch-input {
    border-radius: 8px;
  }
}

.batch-submit-btn {
  border-radius: 8px;
}

.trace-search {
  margin-bottom: 20px;

  .trace-search-form {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.skeleton-wrap {
  .skeleton-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid $border-color-lighter;

    &:last-child {
      border-bottom: none;
    }

    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(90deg, $border-color-lighter 25%, $border-color-extra-light 50%, $border-color-lighter 75%);
      background-size: 200% 100%;
      animation: skeletonPulse 1.5s ease-in-out infinite;
    }

    .skeleton-lines {
      flex: 1;

      .skeleton-line {
        height: 14px;
        border-radius: 4px;
        background: linear-gradient(90deg, $border-color-lighter 25%, $border-color-extra-light 50%, $border-color-lighter 75%);
        background-size: 200% 100%;
        animation: skeletonPulse 1.5s ease-in-out infinite;
        margin-bottom: 8px;

        &.long { width: 80%; }
        &.medium { width: 60%; }
        &.short { width: 40%; }
      }
    }
  }
}

@keyframes skeletonPulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.trace-result-card {
  border: 1px solid $border-color-lighter;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: $shadow-light;
  }

  &.has-warning {
    border-left: 3px solid $warning-color;
  }

  .trace-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .trace-user-detail {
      .trace-user-name {
        font-size: 15px;
        font-weight: 600;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .trace-user-meta {
        font-size: 12px;
        color: $text-secondary;
        margin-top: 4px;

        span {
          margin-right: 16px;
        }
      }
    }
  }

  .trace-consistency {
    .consistency-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .consistency-label {
        font-size: 13px;
        font-weight: 600;
        color: $text-regular;
      }
    }

    .inconsistency-list {
      .inconsistency-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 4px;
        margin-bottom: 4px;

        &.severity-high {
          background: rgba($danger-color, 0.08);
          color: $danger-color;
        }

        &.severity-warning {
          background: rgba($warning-color, 0.08);
          color: $warning-color;
        }

        &.severity-low {
          background: rgba($info-color, 0.08);
          color: $info-color;
        }
      }
    }
  }

  .trace-edit-logs {
    margin-top: 12px;

    .edit-log-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      padding: 4px 0;
      border-bottom: 1px dashed $border-color-lighter;

      .log-field {
        font-weight: 600;
        color: $text-regular;
        min-width: 80px;
      }

      .log-change {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;

        .old-val {
          color: $danger-color;
          text-decoration: line-through;
        }

        .new-val {
          color: $success-color;
          font-weight: 600;
        }
      }

      .log-time {
        color: $text-secondary;
        white-space: nowrap;
        cursor: help;
      }
    }
  }
}

.trace-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.edit-log-tabs {
  margin-top: -12px;
}

// ===== 功能点1：标签选择聚焦变色 + 错配红框 =====
.focus-color {
  transition: all 0.25s ease;

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select__wrapper) {
    transition: all 0.25s ease;

    &:is(:hover, .is-focus, .is-focused) {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.25) !important;
      border-color: #409EFF;
      background: rgba(64, 158, 255, 0.03);
    }
  }
}

.tag-name-input.error-border :deep(.el-input__wrapper),
.tag-select .mismatch-tag :deep(.el-select__tags-text) {
  border: 1px solid #f56c6c !important;
  background: rgba(245, 108, 108, 0.05) !important;
  color: #f56c6c;
  animation: mismatchPulse 1.2s ease infinite alternate;
}

@keyframes mismatchPulse {
  from { box-shadow: 0 0 0 0 rgba(245,108,108,0.15); }
  to { box-shadow: 0 0 0 4px rgba(245,108,108,0.3); }
}

.user-tag-item {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }
}

.mismatch-chip {
  border: 1px solid #f56c6c;
  border-radius: 4px;
  background: rgba(245,108,108,0.08);
  padding: 2px;
  display: inline-flex;
}

.member-level-badge {
  cursor: pointer;
  display: inline-block;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  &.lvl-vip :deep(.el-tag) { box-shadow: 0 0 6px rgba(230, 162, 60, 0.6); }
  &.lvl-svip :deep(.el-tag) { box-shadow: 0 0 8px rgba(198, 124, 255, 0.7); }
  &.lvl-black :deep(.el-tag) { box-shadow: 0 0 10px rgba(48, 49, 51, 0.8); }
}

.tag-def-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .tag-def-filters {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.tag-def-form {
  margin-bottom: 16px;
}

.form-tip {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 4px;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;

  .range-sep {
    color: $text-secondary;
  }
}

.tag-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.border-card {
  border: 1px solid $border-color-lighter;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: $color-white;
}

.small-text {
  font-size: 12px;
}

.field-error {
  color: $danger-color;
  font-size: 12px;
  margin-top: 4px;
}

// ===== 功能点2：层级调整波纹动画 + 权益弹窗 =====
.ripple-dialog :deep(.el-dialog) {
  position: relative;
  overflow: visible;
}

.ripple-effect {
  position: absolute;
  top: 50%; left: 50%;
  width: 10px; height: 10px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0;
}

.ripple-trigger {
  .ripple-effect {
    opacity: 1;

    &::before, &::after {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      width: 0; height: 0;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: rippleExpand 1.6s ease-out 2;
      background: radial-gradient(circle, rgba(103,194,58,0.35) 0%, rgba(103,194,58,0) 70%);
    }
    &::after { animation-delay: 0.5s; }
  }
}

@keyframes rippleExpand {
  0% { width: 0; height: 0; opacity: 1; }
  100% { width: 700px; height: 700px; opacity: 0; }
}

.level-step-panel {
  animation: fadeSlideIn 0.3s ease;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.criteria-progress-item {
  margin-bottom: 18px;

  .label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;

    .pass { color: #67C23A; font-weight: 600; }
    .fail { color: #F56C6C; font-weight: 600; }
  }
}

.benefit-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  .benefit-col {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #ebeef5;

    h4 { margin: 0 0 10px; font-size: 14px; }
    .item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      padding: 4px 0;

      &.diff-add {
        color: #67C23A;
        font-weight: 500;
      }
      &.diff-remove {
        color: #F56C6C;
        text-decoration: line-through;
      }
    }
  }
}

.criteria-result {
  margin-top: 8px;

  h4 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
  }
}

.missing-info {
  margin-top: 12px;
}

// ===== 功能点3：批量配置进度条 + 成功高亮 =====
.batch-progress {
  margin: 16px 0;

  :deep(.el-progress-bar__inner) {
    transition: width 0.2s linear;
  }
}

.batch-result-table {
  :deep(.el-table__row.success-row) {
    background-color: rgba(103, 194, 58, 0.08) !important;

    &:hover > td {
      background-color: rgba(103, 194, 58, 0.14) !important;
    }
  }
}

.batch-progress-area {
  margin-bottom: 16px;

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
  }
}

// ===== 功能点4：隔行变色 + 吸顶表头 =====
.zebra-table {
  :deep(.el-table__body tr:nth-child(even) > td) {
    background-color: rgba(245, 247, 250, 0.8);
  }
}

.sticky-header-table {
  :deep(.el-table__header-wrapper) {
    position: sticky;
    top: 0;
    z-index: 10;
  }

  :deep(.el-table th.el-table__cell) {
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 11;
    box-shadow: inset 0 -1px 0 #ebeef5, 0 2px 6px rgba(0,0,0,0.04);
    font-weight: 600;
  }
}

.trace-tabs {
  margin-top: 12px;
}

.validation-alert-block {
  margin-bottom: 16px;
}

/* ===== 登录异常抖动 (功能点1) ===== */
.shake-dialog :deep(.el-dialog) {
  animation: loginShake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes loginShake {
  10%, 90% { transform: translate(-1px, 0); }
  20%, 80% { transform: translate(2px, 0); }
  30%, 50%, 70% { transform: translate(-4px, 0); }
  40%, 60% { transform: translate(4px, 0); }
  100% { transform: translate(0, 0); }
}

.login-alert-content :deep(.el-alert) { margin-bottom: 8px; }

.verify-btn {
  transition: all 0.15s ease !important;
}

.alert-verify-btn {
  position: relative;
  transition: all 0.18s ease !important;

  &.verify-btn-hovered {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(64, 158, 255, 0.35);
  }

  &:active,
  &:focus-visible {
    transform: translate(2px, 2px) scale(0.985) !important;
    background-color: #67c23a !important;
    border-color: #67c23a !important;
    box-shadow: 0 2px 4px rgba(103, 194, 58, 0.35) !important;
  }
}

/* ===== 登录日志表格 风险红色高亮 (功能点2) ===== */
.login-log-table {
  :deep(.el-table__row.risk-row-red) > td {
    background-color: rgba(245, 108, 108, 0.06) !important;
    color: #c45656 !important;
  }
  :deep(.el-table__row.risk-row-highlight) > td {
    background-color: rgba(245, 108, 108, 0.03);
  }
  :deep(.el-table__row.risk-row-red.risk-row-highlight) > td {
    background-color: rgba(245, 108, 108, 0.1) !important;
  }
  :deep(.el-table__body tr.risk-row-red:hover > td) {
    background-color: rgba(245, 108, 108, 0.12) !important;
  }
}

.risk-highlight {
  animation: riskBlink 2s ease infinite alternate;
}

@keyframes riskBlink {
  from { filter: brightness(1); }
  to { filter: brightness(1.2); }
}

.login-log-table :deep(.el-table__row.selected-row-highlight) > td {
  background-color: rgba(64, 158, 255, 0.06) !important;
}

.risk-level-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.04);
  vertical-align: middle;
}

/* ===== 批量操作栏 ===== */
.login-batch-bar {
  padding: 10px 12px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, rgba(253, 246, 236, 0.9) 0%, rgba(254, 240, 240, 0.9) 100%);
  border: 1px solid rgba(230, 162, 60, 0.3);
  border-radius: 6px;
}

/* ===== 登录筛选 ===== */
.login-filter-form {
  padding: 8px 4px 16px 4px;
  border-bottom: 1px dashed #ebeef5;
  margin-bottom: 12px;
}

/* ===== 返回顶部按钮 (功能点4) ===== */
.back-to-top-btn {
  position: absolute;
  right: 24px;
  bottom: 70px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  z-index: 20;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(64, 158, 255, 0.55);
    filter: brightness(1.1);
  }
  &:active {
    transform: translate(1px, 1px) scale(0.97);
  }
}

.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(6px); }

/* ===== 登录详情弹窗 缩放淡入 ===== */
.login-detail-dialog {
  .risk-score-ring {
    position: relative;
    text-align: center;
  }
  .risk-score-center {
    position: absolute;
    top: 62%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 700;
    font-size: 14px;
  }
}

.login-log-table-wrap {
  position: relative;
  max-height: 520px;
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

/* ===== 统计卡片 ===== */
.risk-summary-cards { margin-bottom: 8px; }
.stat-card {
  text-align: center;
  .label { font-size: 13px; color: #909399; margin-bottom: 6px; }
  .value { font-size: 28px; font-weight: 700; line-height: 1.3; }
  .highlight-1 { color: #409EFF; background: linear-gradient(135deg, #409EFF, #66b1ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .highlight-2 { color: #67C23A; }
}

.risk-dist-item {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  transition: all 0.2s ease;
  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); transform: translateY(-1px); }
}

.mt-4 { margin-top: 16px; } .mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; }
</style>

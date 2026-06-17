<template>
  <div class="platform-users">
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
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
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
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
            class="toolbar-btn"
          >
            批量删除
          </el-button>
          <el-button
            type="warning"
            :icon="Edit"
            :disabled="selectedRows.length === 0"
            @click="handleBatchUpdateOpen"
            class="toolbar-btn"
          >
            批量修改
          </el-button>
          <el-button
            type="info"
            :icon="Search"
            @click="handleTraceOpen"
            class="toolbar-btn"
          >
            溯源校验
          </el-button>
        </div>
      </div>

      <BatchOperation :selected-count="selectedRows.length" @clear="handleClearSelection">
        <el-button size="small" type="success" @click="handleBatchStatus('active')">
          批量启用
        </el-button>
        <el-button size="small" type="warning" @click="handleBatchStatus('disabled')">
          批量禁用
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
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ UserStatusLabel[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="160">
          <template #default="{ row }">
            <template v-if="row.tags && row.tags.length > 0">
              <el-tag
                v-for="tag in row.tags.slice(0, 2)"
                :key="tag"
                size="small"
                type="info"
                class="user-tag"
              >
                {{ tag }}
              </el-tag>
              <el-tooltip v-if="row.tags.length > 2" :content="row.tags.join('、')" placement="top">
                <el-tag size="small" type="info" class="user-tag">+{{ row.tags.length - 2 }}</el-tag>
              </el-tooltip>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="权限组" width="90" align="center">
          <template #default="{ row }">
            {{ PermissionGroupLabel[row.permissionGroup] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="会员等级" width="90" align="center">
          <template #default="{ row }">
            <StatusTag v-if="row.member" :status="row.member.level" type="member" />
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="handleViewEditLogs(row)">变更</el-button>
            <el-button type="warning" link size="small" @click="handleTraceOne(row)">溯源</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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

      <div class="edit-step-content" :class="'step-slide-' + editStep">
        <div v-show="editStep === 1" class="step-panel">
          <el-form :model="editForm" label-width="90px">
            <el-form-item label="用户名">
              <el-input :model-value="editForm.username" disabled />
            </el-form-item>
            <el-form-item label="UID">
              <el-input :model-value="editForm.uid" disabled />
            </el-form-item>
            <el-form-item label="昵称">
              <div class="validated-input-wrap">
                <el-input
                  v-model="editForm.nickname"
                  placeholder="请输入昵称"
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
              <el-input v-model="editForm.email" placeholder="请输入邮箱" class="focus-scale-input" />
            </el-form-item>
            <el-form-item label="头像">
              <el-input v-model="editForm.avatar" placeholder="头像URL" class="focus-scale-input" />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="editForm.role" style="width: 100%">
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
            v-if="['frozen', 'banned'].includes(editForm.status)"
            :title="'当前账号状态为' + UserStatusLabel[editForm.status] + '，禁止修改手机号、登录密码等核心字段'"
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
                  :disabled="['frozen', 'banned'].includes(editForm.status)"
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
                :disabled="['frozen', 'banned'].includes(editForm.status)"
                class="focus-scale-input"
              />
            </el-form-item>
            <el-form-item v-if="!['frozen', 'banned'].includes(editForm.status) && (editForm.phone !== editOriginal.phone || editForm.newPassword)" label="身份校验" prop="verifyPassword">
              <el-input
                v-model="editForm.verifyPassword"
                type="password"
                placeholder="请输入当前管理员密码进行二次校验"
                show-password
                class="focus-scale-input"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-radio-group v-model="editForm.status">
                <el-radio
                  v-for="item in statusOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </el-radio>
              </el-radio-group>
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
              />
            </el-form-item>
            <el-form-item label="权限分组">
              <el-select v-model="editForm.permissionGroup" style="width: 100%">
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
          <el-button v-if="editStep === 3" type="primary" :loading="submitLoading" @click="handleEditSubmit">
            确认修改
          </el-button>
          <el-button @click="editDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchUpdateDialogVisible"
      title="批量修改用户信息"
      width="520px"
      class="batch-dialog"
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
      class="trace-dialog"
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
                  <el-tag size="small" :type="getStatusTagType(item.user.status)">
                    {{ UserStatusLabel[item.user.status] }}
                  </el-tag>
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
    >
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, Delete, Edit, Warning, Right, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { DataTable, StatusTag, BatchOperation, EmptyState } from '@/components/business'
import { UserRoleLabel, UserStatusLabel, UserStatusTagType, PermissionGroupLabel } from '@/constants'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUser,
  validateAccount,
  getEditLogs,
  batchUpdateUsers,
  traceAccount
} from '@/api/userManage'
import type { UserInfo, FieldValidation, AccountValidationResult, UserEditLog, TraceResultItem } from '@/types'

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

const traceLoading = ref(false)
const traceSearched = ref(false)
const traceResults = ref<TraceResultItem[]>([])
const traceTotal = ref(0)
const tracePage = ref(1)

const editLogLoading = ref(false)
const editLogData = ref<UserEditLog[]>([])
const editLogUser = ref<UserInfo | null>(null)

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

const getStatusTagType = (status: string) => UserStatusTagType[status] || 'info'

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

const handleBatchStatus = async (status: string) => {
  if (selectedRows.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要${status === 'active' ? '启用' : '禁用'}选中的 ${selectedRows.value.length} 个用户吗？`,
      '提示',
      { type: 'warning' }
    )
    for (const row of selectedRows.value) {
      await updateUser(row.id, { status } as any)
    }
    ElMessage.success('操作成功')
    selectedRows.value = []
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
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
  editLogLoading.value = true
  editLogDialogVisible.value = true
  try {
    const res = await getEditLogs(row.id, { page: 1, pageSize: 50 })
    editLogData.value = res.data.list
  } catch (error) {
    console.error('获取变更记录失败:', error)
  } finally {
    editLogLoading.value = false
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
}

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

.batch-alert {
  margin-bottom: 16px;
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
</style>

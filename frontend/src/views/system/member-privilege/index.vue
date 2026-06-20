<template>
  <div class="member-privilege-page">
    <div class="page-header">
      <h2>会员权益配置</h2>
      <p class="page-desc">管理会员权益配置、状态切换、批量操作与溯源核销</p>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="4" v-for="stat in statsCards" :key="stat.key">
        <el-card shadow="hover" class="stat-card" :style="{ borderTop: `3px solid ${stat.color}` }">
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="权益类型">
          <el-select v-model="queryForm.privilegeType" placeholder="全部类型" clearable style="width: 140px">
            <el-option v-for="item in Object.values(MEMBER_PRIVILEGE_TYPE)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="生效状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option v-for="item in Object.values(MEMBER_PRIVILEGE_STATUS)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="生效范围">
          <el-select v-model="queryForm.scopeType" placeholder="全部范围" clearable style="width: 120px">
            <el-option v-for="item in Object.values(MEMBER_PRIVILEGE_SCOPE_TYPE)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="编码/名称" clearable style="width: 160px" class="focus-color-input" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker v-model="queryForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadPrivilegeList" style="border-radius: 8px">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetQuery" style="border-radius: 8px">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="openCreateDialog" style="border-radius: 8px">
            <el-icon><Plus /></el-icon>新增权益
          </el-button>
          <el-button v-if="selectedIds.length > 0" type="success" @click="handleBatchAction('batch_online')" style="border-radius: 8px">
            <el-icon><CircleCheck /></el-icon>批量上线({{ selectedIds.length }})
          </el-button>
          <el-button v-if="selectedIds.length > 0" type="warning" @click="handleBatchAction('batch_pause')" style="border-radius: 8px">
            <el-icon><VideoPause /></el-icon>批量暂停({{ selectedIds.length }})
          </el-button>
          <el-button v-if="selectedIds.length > 0" type="primary" @click="openBatchLimitDialog" style="border-radius: 8px">
            <el-icon><EditPen /></el-icon>批量修改上限({{ selectedIds.length }})
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="溯源查询" placement="top">
            <el-button @click="openTraceDrawer" style="border-radius: 8px"><el-icon><Connection /></el-icon></el-button>
          </el-tooltip>
          <el-tooltip content="核销记录" placement="top">
            <el-button @click="openRedemptionDrawer" style="border-radius: 8px"><el-icon><Document /></el-icon></el-button>
          </el-tooltip>
        </div>
      </div>

      <el-table
        :data="privilegeList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @header-dragend="onHeaderDragend"
        :row-class-name="tableRowClassName"
        highlight-current-row
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="privilegeCode" label="权益编码" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="openTraceForCode(row.privilegeCode)">{{ row.privilegeCode }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="privilegeName" label="权益名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="privilegeType" label="权益类型" min-width="120">
          <template #default="{ row }">
            <el-tag :color="getPrivilegeTypeColor(row.privilegeType)" effect="dark" size="small" style="border: none">
              {{ getPrivilegeTypeLabel(row.privilegeType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicableLevels" label="适配等级" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ formatApplicableLevels(row.applicableLevels) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生效时段" min-width="180">
          <template #default="{ row }">
            <span>{{ formatDate(row.effectiveStartTime) }}</span>
            <span style="color: #909399"> ~ </span>
            <span>{{ formatDate(row.effectiveEndTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="usageLimit" label="使用上限" min-width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.usageLimit === -1 ? '无限' : row.usageLimit }}</span>
            <span v-if="row.dailyLimit !== -1" style="color: #909399; font-size: 12px"> /日{{ row.dailyLimit }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="scopeType" label="生效范围" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.scopeType === 'NEW_USER' ? 'warning' : 'primary'" size="small">
              {{ row.scopeType === 'NEW_USER' ? '仅新用户' : '全量' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="configBatch" label="配置批次" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="info" @click="openTraceForBatch(row.configBatch)">{{ row.configBatch }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="核销量" min-width="80" align="center">
          <template #default="{ row }">{{ row.redemptionCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="110">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-dropdown trigger="click" @command="(cmd: any) => handleStatusChange(row, cmd)">
              <el-button link type="warning" size="small">
                状态<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="1" :disabled="row.status === 1">生效</el-dropdown-item>
                  <el-dropdown-item command="2" :disabled="row.status === 2">暂停</el-dropdown-item>
                  <el-dropdown-item command="3" :disabled="row.status === 3">下线</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button link type="info" size="small" @click="openHistoryDrawer(row)">历史</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadPrivilegeList"
          @current-change="loadPrivilegeList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑权益' : '新增权益'"
      width="720px"
      :close-on-click-modal="false"
      class="privilege-dialog"
      destroy-on-close
    >
      <el-alert v-if="conflictResult && conflictResult.hasConflict" :title="`检测到${conflictResult.conflicts.length}项冲突`" type="warning" :closable="false" show-icon style="margin-bottom: 16px">
        <template #default>
          <div v-for="(c, i) in conflictResult.conflicts" :key="i" style="font-size: 13px; line-height: 1.6">
            <el-tag :type="c.level === 'high' ? 'danger' : c.level === 'medium' ? 'warning' : 'info'" size="small">{{ c.level }}</el-tag>
            {{ c.message }}
            <span style="color: #909399">→ {{ c.suggestion }}</span>
          </div>
        </template>
      </el-alert>

      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px" :class="{ 'shake-form': shakeForm }">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="权益名称" prop="privilegeName">
              <el-input v-model="formData.privilegeName" placeholder="请输入权益名称" maxlength="80" class="focus-color-input" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权益类型" prop="privilegeType">
              <el-select v-model="formData.privilegeType" placeholder="请选择类型" style="width: 100%" @change="onPrivilegeTypeChange">
                <el-option v-for="item in Object.values(MEMBER_PRIVILEGE_TYPE)" :key="item.value" :label="item.label" :value="item.value">
                  <span>{{ item.label }}</span>
                  <span style="color: #909399; font-size: 12px; margin-left: 6px">{{ item.desc }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="适配等级" prop="applicableLevels">
          <el-select v-model="formData.applicableLevels" multiple placeholder="请选择适配会员等级" style="width: 100%">
            <el-option v-for="level in levelOptions" :key="level.levelTier" :label="`L${level.levelTier} ${level.levelName}`" :value="level.levelTier" />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="生效开始" prop="effectiveStartTime">
              <el-date-picker v-model="formData.effectiveStartTime" type="datetime" placeholder="开始时间" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效结束" prop="effectiveEndTime">
              <el-date-picker v-model="formData.effectiveEndTime" type="datetime" placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="总使用上限">
              <el-input-number v-model="formData.usageLimit" :min="-1" :step="1" style="width: 100%" controls-position="right" />
              <div class="form-tip">-1 表示无限</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每日上限">
              <el-input-number v-model="formData.dailyLimit" :min="-1" :step="1" style="width: 100%" controls-position="right" />
              <div class="form-tip">-1 表示无限</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每月上限">
              <el-input-number v-model="formData.monthlyLimit" :min="-1" :step="1" style="width: 100%" controls-position="right" />
              <div class="form-tip">-1 表示无限</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="生效范围" prop="scopeType">
          <el-radio-group v-model="formData.scopeType">
            <el-radio value="ALL">全量用户</el-radio>
            <el-radio value="NEW_USER">仅新用户</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="permissionKeys.length > 0" label="权限开关">
          <div class="permission-grid">
            <div v-for="key in permissionKeys" :key="key" class="permission-item">
              <el-switch v-model="formData.permissionSwitches[key]" />
              <span class="perm-label">{{ PRIVILEGE_PERMISSION_SWITCHES[key]?.label || key }}</span>
              <el-tooltip :content="PRIVILEGE_PERMISSION_SWITCHES[key]?.desc || ''" placement="top">
                <el-icon style="color: #909399; cursor: help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="权益描述" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="备注信息" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false" style="border-radius: 8px">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="conflictResult && !conflictResult.canSubmit" @click="handleSubmit" style="border-radius: 8px">
          {{ isEdit ? '保存修改' : '创建权益' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchLimitDialogVisible" title="批量修改使用上限" width="500px" destroy-on-close class="privilege-dialog">
      <el-form :model="batchLimitForm" label-width="110px">
        <el-form-item label="生效范围">
          <el-radio-group v-model="batchLimitForm.scopeType">
            <el-radio value="">不修改</el-radio>
            <el-radio value="ALL">全量用户</el-radio>
            <el-radio value="NEW_USER">仅新用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="总使用上限">
          <el-input-number v-model="batchLimitForm.usageLimit" :min="-1" style="width: 200px" controls-position="right" />
          <span style="color: #909399; margin-left: 8px">-1 = 无限</span>
        </el-form-item>
        <el-form-item label="每日上限">
          <el-input-number v-model="batchLimitForm.dailyLimit" :min="-1" style="width: 200px" controls-position="right" />
        </el-form-item>
        <el-form-item label="每月上限">
          <el-input-number v-model="batchLimitForm.monthlyLimit" :min="-1" style="width: 200px" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchLimitDialogVisible = false" style="border-radius: 8px">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="handleBatchLimitSubmit" style="border-radius: 8px">确认修改</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="historyDrawerVisible" title="变更历史" size="520px" direction="rtl" destroy-on-close>
      <el-timeline v-loading="historyLoading">
        <el-timeline-item v-for="log in historyList" :key="log.id" :timestamp="formatDate(log.createdAt)" placement="top" :color="getModifyTypeColor(log.modifyType)">
          <el-card shadow="never" style="border-radius: 8px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
              <el-tag :color="getModifyTypeColor(log.modifyType)" effect="dark" size="small" style="border: none">{{ log.modifyTypeLabel || log.modifyType }}</el-tag>
              <span style="color: #909399; font-size: 12px">{{ log.operatorName }}</span>
            </div>
            <div v-if="log.changedFields && log.changedFields.length" style="font-size: 13px; color: #606266">
              变更字段: {{ log.changedFields.join(', ') }}
            </div>
            <div v-if="log.affectUserCount" style="font-size: 12px; color: #E6A23C; margin-top: 4px">
              影响用户: {{ log.affectUserCount }}人
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <div v-if="historyTotal > historyQuery.pageSize" style="text-align: center; margin-top: 12px">
        <el-pagination v-model:current-page="historyQuery.page" :page-size="historyQuery.pageSize" :total="historyTotal" layout="prev, next" small @current-change="loadHistory" />
      </div>
    </el-drawer>

    <el-drawer v-model="traceDrawerVisible" title="权益溯源" size="620px" direction="rtl" destroy-on-close>
      <div style="margin-bottom: 16px">
        <el-radio-group v-model="traceType" size="small" style="margin-bottom: 8px">
          <el-radio-button v-for="item in Object.values(MEMBER_PRIVILEGE_TRACE_TYPE)" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button>
        </el-radio-group>
        <div style="display: flex; gap: 8px; margin-top: 8px">
          <el-input v-model="traceValue" :placeholder="`请输入${traceTypeLabel}`" clearable class="focus-color-input" @keyup.enter="loadTraceData" />
          <el-button type="primary" @click="loadTraceData" :loading="traceLoading" style="border-radius: 8px">查询</el-button>
        </div>
      </div>

      <div v-if="traceResult && traceResult.found" v-loading="traceLoading">
        <el-descriptions v-if="traceResult.privilege" :column="2" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="权益编码">{{ traceResult.privilege.privilegeCode }}</el-descriptions-item>
          <el-descriptions-item label="权益名称">{{ traceResult.privilege.privilegeName }}</el-descriptions-item>
          <el-descriptions-item label="权益类型">{{ getPrivilegeTypeLabel(traceResult.privilege.privilegeType) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusLabel(traceResult.privilege.status) }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="traceResult.summary" style="margin-bottom: 16px">
          <el-row :gutter="12">
            <el-col :span="8" v-for="(item, idx) in traceSummaryCards" :key="idx">
              <el-statistic :title="item.label" :value="item.value" />
            </el-col>
          </el-row>
        </div>

        <div v-if="traceResult.relatedPrivileges && traceResult.relatedPrivileges.length" style="margin-bottom: 16px">
          <h4 style="margin-bottom: 8px">关联权益</h4>
          <el-table :data="traceResult.relatedPrivileges" size="small" border stripe>
            <el-table-column prop="privilegeCode" label="编码" min-width="120" show-overflow-tooltip />
            <el-table-column prop="privilegeName" label="名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }"><el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag></template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="traceResult.recentLogs && traceResult.recentLogs.length">
          <h4 style="margin-bottom: 8px">变更记录</h4>
          <el-timeline>
            <el-timeline-item v-for="log in traceResult.recentLogs" :key="log.id" :timestamp="formatDate(log.createdAt)" placement="top" :color="getModifyTypeColor(log.modifyType)">
              <span>{{ log.modifyTypeLabel }}</span>
              <span v-if="log.operatorName" style="color: #909399"> by {{ log.operatorName }}</span>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div v-if="traceResult.recentRedemptions && traceResult.recentRedemptions.length">
          <h4 style="margin-bottom: 8px">核销记录</h4>
          <el-table :data="traceResult.recentRedemptions" size="small" border stripe max-height="300">
            <el-table-column prop="uid" label="用户UID" width="100" />
            <el-table-column prop="redemptionType" label="类型" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.redemptionType === 'USE' ? 'primary' : row.redemptionType === 'GRANT' ? 'success' : row.redemptionType === 'REVOKE' ? 'danger' : 'info'">{{ row.redemptionType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="redemptionCount" label="数量" width="70" align="center" />
            <el-table-column prop="createdAt" label="时间" min-width="100">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <el-empty v-else-if="traceSearched && (!traceResult || !traceResult.found)" description="未找到相关溯源信息" />
    </el-drawer>

    <el-drawer v-model="redemptionDrawerVisible" title="核销记录" size="700px" direction="rtl" destroy-on-close>
      <el-form :inline="true" :model="redemptionQuery" style="margin-bottom: 12px">
        <el-form-item label="权益编码">
          <el-input v-model="redemptionQuery.privilegeCode" placeholder="权益编码" clearable style="width: 140px" class="focus-color-input" />
        </el-form-item>
        <el-form-item label="核销类型">
          <el-select v-model="redemptionQuery.redemptionType" placeholder="全部" clearable style="width: 100px">
            <el-option v-for="item in Object.values(MEMBER_PRIVILEGE_REDEMPTION_TYPE)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRedemptions" style="border-radius: 8px">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="redemptionList" v-loading="redemptionLoading" size="small" border stripe max-height="500">
        <el-table-column prop="privilegeCode" label="权益编码" min-width="120" show-overflow-tooltip />
        <el-table-column prop="privilegeName" label="权益名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="uid" label="用户UID" width="100" />
        <el-table-column prop="redemptionType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag size="small" :color="getRedemptionTypeColor(row.redemptionType)" style="border: none; color: #fff">{{ getRedemptionTypeLabel(row.redemptionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="redemptionCount" label="数量" width="70" align="center" />
        <el-table-column prop="configBatch" label="配置批次" min-width="140" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" min-width="100">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <div style="text-align: center; margin-top: 12px">
        <el-pagination v-model:current-page="redemptionQuery.page" :page-size="redemptionQuery.pageSize" :total="redemptionTotal" layout="total, prev, next" small @current-change="loadRedemptions" />
      </div>
    </el-drawer>

    <transition name="fade-back-top">
      <div v-if="showBackTop" class="back-top-btn" @click="scrollToTop">
        <el-icon><Top /></el-icon>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, CircleCheck, VideoPause, EditPen, Connection, Document, ArrowDown, QuestionFilled, Top } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { debounce } from 'lodash-es'
import {
  MEMBER_PRIVILEGE_TYPE,
  MEMBER_PRIVILEGE_STATUS,
  MEMBER_PRIVILEGE_MODIFY_TYPE,
  MEMBER_PRIVILEGE_BATCH_ACTION,
  MEMBER_PRIVILEGE_SCOPE_TYPE,
  MEMBER_PRIVILEGE_REDEMPTION_TYPE,
  MEMBER_PRIVILEGE_TRACE_TYPE,
  PRIVILEGE_PERMISSION_SWITCHES,
  MEMBER_LEVEL_DEFAULT_PRIVILEGES,
} from '@/constants/enums'
import {
  getMemberPrivilegeListApi,
  getMemberPrivilegeStatsApi,
  checkMemberPrivilegeConflictsApi,
  createMemberPrivilegeApi,
  updateMemberPrivilegeApi,
  changeMemberPrivilegeStatusApi,
  getMemberPrivilegeHistoryApi,
  batchActionMemberPrivilegeApi,
  getMemberPrivilegeRedemptionsApi,
  getMemberPrivilegeTraceApi,
  getMemberLevelListApi,
} from '@/api/member-privilege'
import type {
  MemberPrivilegeItem,
  MemberPrivilegeLogItem,
  MemberPrivilegeRedemptionItem,
  MemberPrivilegeConflictCheckResult,
  MemberPrivilegeStatsResult,
  MemberPrivilegeTraceResult,
  MemberPrivilegeCreateForm,
} from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const batchLoading = ref(false)
const privilegeList = ref<MemberPrivilegeItem[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const selectedRows = ref<MemberPrivilegeItem[]>([])
const conflictResult = ref<MemberPrivilegeConflictCheckResult | null>(null)
const shakeForm = ref(false)
const showBackTop = ref(false)

const levelOptions = ref<Array<{ levelTier: number; levelName: string }>>([])

const stats = ref<MemberPrivilegeStatsResult>({
  totalCount: 0, activeCount: 0, pausedCount: 0, offlineCount: 0,
  expiringSoon: 0, totalRedemptions: 0, byType: [],
})

const statsCards = computed(() => [
  { key: 'total', label: '总权益数', value: stats.value.totalCount, color: '#409EFF' },
  { key: 'active', label: '已生效', value: stats.value.activeCount, color: '#67C23A' },
  { key: 'paused', label: '已暂停', value: stats.value.pausedCount, color: '#E6A23C' },
  { key: 'offline', label: '已下线', value: stats.value.offlineCount, color: '#909399' },
  { key: 'expiring', label: '即将到期', value: stats.value.expiringSoon, color: '#F56C6C' },
  { key: 'redemptions', label: '总核销量', value: stats.value.totalRedemptions, color: '#722ed1' },
])

const queryForm = reactive({
  page: 1,
  pageSize: 20,
  privilegeType: '',
  status: null as number | null,
  scopeType: '',
  keyword: '',
  dateRange: null as [string, string] | null,
})

const isEdit = ref(false)
const editId = ref<number | null>(null)
const formDialogVisible = ref(false)
const formRef = ref()
const formData = reactive<{
  privilegeName: string
  privilegeType: string
  applicableLevels: number[]
  effectiveStartTime: string
  effectiveEndTime: string
  usageLimit: number
  dailyLimit: number
  monthlyLimit: number
  permissionSwitches: Record<string, boolean>
  scopeType: string
  sortOrder: number
  description: string
  remark: string
}>({
  privilegeName: '',
  privilegeType: '',
  applicableLevels: [],
  effectiveStartTime: '',
  effectiveEndTime: '',
  usageLimit: -1,
  dailyLimit: -1,
  monthlyLimit: -1,
  permissionSwitches: {},
  scopeType: 'ALL',
  sortOrder: 0,
  description: '',
  remark: '',
})

const permissionKeys = computed(() => {
  const type = formData.privilegeType
  if (!type || type === 'CUSTOM') return Object.keys(PRIVILEGE_PERMISSION_SWITCHES)
  const map: Record<string, string[]> = {
    WATCH_PRIVILEGE: ['canWatchHD', 'canWatchUHD', 'canEarlyAccess', 'canScreenCast', 'canDolby'],
    AD_FREE: ['canAdFree'],
    EXCLUSIVE_CONTENT: ['canWatchHD', 'canWatchExclusive'],
    OFFLINE_DOWNLOAD: ['canOffline'],
    COUPON: [],
    BADGE: [],
    PRIORITY: ['canEarlyAccess'],
    CUSTOMER_SERVICE: [],
    SCREEN_CAST: ['canWatchHD', 'canScreenCast'],
    DOLBY: ['canWatchHD', 'canDolby'],
  }
  return map[type] || Object.keys(PRIVILEGE_PERMISSION_SWITCHES)
})

const formRules = {
  privilegeName: [{ required: true, message: '请输入权益名称', trigger: 'blur' }],
  privilegeType: [{ required: true, message: '请选择权益类型', trigger: 'change' }],
  applicableLevels: [{ required: true, message: '请选择适配等级', trigger: 'change', type: 'array' as const, min: 1 }],
  effectiveStartTime: [{ required: true, message: '请选择生效开始时间', trigger: 'change' }],
  effectiveEndTime: [{ required: true, message: '请选择生效结束时间', trigger: 'change' }],
}

const batchLimitDialogVisible = ref(false)
const batchLimitForm = reactive({
  usageLimit: -1,
  dailyLimit: -1,
  monthlyLimit: -1,
  scopeType: '',
})

const historyDrawerVisible = ref(false)
const historyLoading = ref(false)
const historyList = ref<MemberPrivilegeLogItem[]>([])
const historyTotal = ref(0)
const historyPrivilegeId = ref(0)
const historyQuery = reactive({ page: 1, pageSize: 20 })

const traceDrawerVisible = ref(false)
const traceLoading = ref(false)
const traceSearched = ref(false)
const traceType = ref('privilegeCode')
const traceValue = ref('')
const traceResult = ref<MemberPrivilegeTraceResult | null>(null)
const traceTypeLabel = computed(() => {
  const found = Object.values(MEMBER_PRIVILEGE_TRACE_TYPE).find(t => t.value === traceType.value)
  return found?.label || ''
})
const traceSummaryCards = computed(() => {
  if (!traceResult.value?.summary) return []
  const s = traceResult.value.summary
  return [
    { label: '变更次数', value: s.totalChanges },
    { label: '核销次数', value: s.totalRedemptions },
    { label: '受影响用户', value: s.affectedUsers ?? 0 },
  ]
})

const redemptionDrawerVisible = ref(false)
const redemptionLoading = ref(false)
const redemptionList = ref<MemberPrivilegeRedemptionItem[]>([])
const redemptionTotal = ref(0)
const redemptionQuery = reactive({
  page: 1,
  pageSize: 20,
  privilegeCode: '',
  redemptionType: '',
})

const getPrivilegeTypeLabel = (type: string) => {
  const found = Object.values(MEMBER_PRIVILEGE_TYPE).find(t => t.value === type)
  return found?.label || type
}
const getPrivilegeTypeColor = (type: string) => {
  const found = Object.values(MEMBER_PRIVILEGE_TYPE).find(t => t.value === type)
  return found?.color || '#909399'
}
const getStatusLabel = (s: number) => {
  const found = Object.values(MEMBER_PRIVILEGE_STATUS).find(t => t.value === s)
  return found?.label || String(s)
}
const getStatusType = (s: number) => {
  const found = Object.values(MEMBER_PRIVILEGE_STATUS).find(t => t.value === s)
  return (found?.type || 'info') as 'success' | 'warning' | 'info'
}
const getModifyTypeColor = (type: string) => {
  const found = Object.values(MEMBER_PRIVILEGE_MODIFY_TYPE).find(t => t.value === type)
  return found?.color || '#909399'
}
const getRedemptionTypeLabel = (type: string) => {
  const found = Object.values(MEMBER_PRIVILEGE_REDEMPTION_TYPE).find(t => t.value === type)
  return found?.label || type
}
const getRedemptionTypeColor = (type: string) => {
  const found = Object.values(MEMBER_PRIVILEGE_REDEMPTION_TYPE).find(t => t.value === type)
  return found?.color || '#909399'
}
const formatDate = (d: string | Date) => d ? dayjs(d).format('YYYY-MM-DD') : ''
const formatApplicableLevels = (levels: number[]) => {
  if (!levels || levels.length === 0) return '-'
  return levels.map(l => {
    const lo = levelOptions.value.find(o => o.levelTier === l)
    return lo ? `L${l} ${lo.levelName}` : `L${l}`
  }).join('、')
}

const loadLevelOptions = async () => {
  try {
    const res = await getMemberLevelListApi({ page: 1, pageSize: 100, isEnabled: 1 } as any)
    levelOptions.value = (res.list || []).map((l: any) => ({ levelTier: l.levelTier, levelName: l.levelName }))
  } catch { /* ignore */ }
}

const loadPrivilegeList = async () => {
  loading.value = true
  try {
    const params: any = { page: queryForm.page, pageSize: queryForm.pageSize }
    if (queryForm.privilegeType) params.privilegeType = queryForm.privilegeType
    if (queryForm.status !== null && queryForm.status !== undefined) params.status = queryForm.status
    if (queryForm.scopeType) params.scopeType = queryForm.scopeType
    if (queryForm.keyword) params.keyword = queryForm.keyword
    if (queryForm.dateRange && queryForm.dateRange.length === 2) {
      params.startTime = queryForm.dateRange[0]
      params.endTime = queryForm.dateRange[1]
    }
    const res = await getMemberPrivilegeListApi(params)
    privilegeList.value = res.list || []
    total.value = res.pagination?.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '获取权益列表失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    stats.value = await getMemberPrivilegeStatsApi()
  } catch { /* ignore */ }
}

const loadAllData = () => {
  loadPrivilegeList()
  loadStats()
}

const resetQuery = () => {
  queryForm.page = 1
  queryForm.privilegeType = ''
  queryForm.status = null
  queryForm.scopeType = ''
  queryForm.keyword = ''
  queryForm.dateRange = null
  loadPrivilegeList()
}

const handleSelectionChange = (rows: MemberPrivilegeItem[]) => {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.id)
}

const onHeaderDragend = (newWidth: number, oldWidth: number, column: any) => { /* 支持拖拽列宽 */ }

const tableRowClassName = ({ row }: { row: MemberPrivilegeItem }) => {
  return row.status === 2 ? 'paused-row' : row.status === 3 ? 'offline-row' : ''
}

const checkConflictDebounced = debounce(async () => {
  if (!formData.privilegeName && !formData.privilegeType && formData.applicableLevels.length === 0) {
    conflictResult.value = null
    return
  }
  try {
    const params: any = {
      privilegeName: formData.privilegeName || undefined,
      privilegeType: formData.privilegeType || undefined,
      applicableLevels: formData.applicableLevels.length > 0 ? formData.applicableLevels : undefined,
      effectiveStartTime: formData.effectiveStartTime || undefined,
      effectiveEndTime: formData.effectiveEndTime || undefined,
      excludeId: isEdit.value ? editId.value : undefined,
    }
    conflictResult.value = await checkMemberPrivilegeConflictsApi(params)
    if (conflictResult.value?.hasConflict) {
      shakeForm.value = true
      setTimeout(() => { shakeForm.value = false }, 500)
    }
  } catch { /* ignore */ }
}, 400)

watch([
  () => formData.privilegeName,
  () => formData.privilegeType,
  () => formData.applicableLevels,
  () => formData.effectiveStartTime,
  () => formData.effectiveEndTime,
], () => {
  if (formDialogVisible.value) checkConflictDebounced()
})

const onPrivilegeTypeChange = (type: string) => {
  const defaults: Record<string, Record<string, boolean>> = {
    WATCH_PRIVILEGE: { canWatchHD: true, canWatchUHD: true, canEarlyAccess: true, canScreenCast: true, canDolby: true },
    AD_FREE: { canAdFree: true },
    EXCLUSIVE_CONTENT: { canWatchHD: true, canWatchExclusive: true },
    OFFLINE_DOWNLOAD: { canOffline: true },
    PRIORITY: { canEarlyAccess: true },
    SCREEN_CAST: { canWatchHD: true, canScreenCast: true },
    DOLBY: { canWatchHD: true, canDolby: true },
  }
  formData.permissionSwitches = defaults[type] ? { ...defaults[type] } : {}
}

const resetFormData = () => {
  Object.assign(formData, {
    privilegeName: '', privilegeType: '', applicableLevels: [],
    effectiveStartTime: '', effectiveEndTime: '',
    usageLimit: -1, dailyLimit: -1, monthlyLimit: -1,
    permissionSwitches: {}, scopeType: 'ALL', sortOrder: 0,
    description: '', remark: '',
  })
  conflictResult.value = null
}

const openCreateDialog = () => {
  isEdit.value = false
  editId.value = null
  resetFormData()
  formDialogVisible.value = true
}

const openEditDialog = (row: MemberPrivilegeItem) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    privilegeName: row.privilegeName,
    privilegeType: row.privilegeType,
    applicableLevels: [...(row.applicableLevels || [])],
    effectiveStartTime: row.effectiveStartTime ? dayjs(row.effectiveStartTime).format('YYYY-MM-DD HH:mm:ss') : '',
    effectiveEndTime: row.effectiveEndTime ? dayjs(row.effectiveEndTime).format('YYYY-MM-DD HH:mm:ss') : '',
    usageLimit: row.usageLimit,
    dailyLimit: row.dailyLimit,
    monthlyLimit: row.monthlyLimit,
    permissionSwitches: row.permissionSwitches ? { ...row.permissionSwitches } : {},
    scopeType: row.scopeType || 'ALL',
    sortOrder: row.sortOrder,
    description: row.description || '',
    remark: row.remark || '',
  })
  conflictResult.value = null
  formDialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch { return }

  if (new Date(formData.effectiveStartTime) >= new Date(formData.effectiveEndTime)) {
    ElMessage.warning('生效开始时间必须早于结束时间')
    return
  }

  if (conflictResult.value && !conflictResult.value.canSubmit) {
    ElMessage.error('存在高等级冲突，请修正后再提交')
    shakeForm.value = true
    setTimeout(() => { shakeForm.value = false }, 500)
    return
  }

  submitLoading.value = true
  try {
    const data: any = {
      privilegeName: formData.privilegeName,
      privilegeType: formData.privilegeType,
      applicableLevels: formData.applicableLevels,
      effectiveStartTime: formData.effectiveStartTime,
      effectiveEndTime: formData.effectiveEndTime,
      usageLimit: formData.usageLimit,
      dailyLimit: formData.dailyLimit,
      monthlyLimit: formData.monthlyLimit,
      permissionSwitches: Object.keys(formData.permissionSwitches).length > 0 ? formData.permissionSwitches : null,
      scopeType: formData.scopeType,
      sortOrder: formData.sortOrder,
      description: formData.description,
      remark: formData.remark,
    }

    if (isEdit.value && editId.value) {
      await updateMemberPrivilegeApi(editId.value, data)
      ElMessage.success('权益更新成功')
    } else {
      await createMemberPrivilegeApi(data)
      ElMessage.success('权益创建成功')
    }

    formDialogVisible.value = false
    loadAllData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleStatusChange = async (row: MemberPrivilegeItem, newStatus: string | number) => {
  const status = Number(newStatus)
  const statusLabel = getStatusLabel(status)

  if (row.status === status) return

  if (status === 3) {
    try {
      await ElMessageBox.confirm(
        `确定要将权益「${row.privilegeName}」下线吗？下线后将清除权益配置，此操作不可逆。`,
        '下线确认',
        { confirmButtonText: '确认下线', cancelButtonText: '取消', type: 'warning' }
      )
    } catch { return }
  } else if (row.status === 1) {
    try {
      await ElMessageBox.confirm(
        `权益「${row.privilegeName}」当前生效中，变更为${statusLabel}将影响存量用户权益，是否继续？`,
        '状态变更确认',
        { confirmButtonText: '确认变更', cancelButtonText: '取消', type: 'warning' }
      )
    } catch { return }
  }

  try {
    await changeMemberPrivilegeStatusApi(row.id, status)
    ElMessage.success(`权益已切换为${statusLabel}状态`)
    loadAllData()
  } catch (e: any) {
    ElMessage.error(e.message || '状态变更失败')
  }
}

const handleBatchAction = async (action: string) => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择权益')
    return
  }

  const actionLabel = Object.values(MEMBER_PRIVILEGE_BATCH_ACTION).find(a => a.value === action)?.label || action

  if (action === 'batch_pause') {
    const activeIds = selectedRows.value.filter(r => r.status === 1).map(r => r.id)
    if (activeIds.length === 0) {
      ElMessage.warning('选中项中没有生效的权益可暂停')
      return
    }
    try {
      await ElMessageBox.confirm(`确认批量暂停${activeIds.length}个生效中的权益？`, '批量暂停确认', { type: 'warning' })
    } catch { return }
  }

  try {
    batchLoading.value = true
    const res = await batchActionMemberPrivilegeApi({ action: action as any, ids: selectedIds.value })
    ElMessage.success(`${actionLabel}完成：成功${res.successCount}，失败${res.failCount}，跳过${res.skippedCount}`)
    loadAllData()
  } catch (e: any) {
    ElMessage.error(e.message || '批量操作失败')
  } finally {
    batchLoading.value = false
  }
}

const openBatchLimitDialog = () => {
  batchLimitForm.usageLimit = -1
  batchLimitForm.dailyLimit = -1
  batchLimitForm.monthlyLimit = -1
  batchLimitForm.scopeType = ''
  batchLimitDialogVisible.value = true
}

const handleBatchLimitSubmit = async () => {
  try {
    batchLoading.value = true
    const data: any = { action: 'batch_limit_change', ids: selectedIds.value }
    if (batchLimitForm.usageLimit !== undefined) data.usageLimit = batchLimitForm.usageLimit
    if (batchLimitForm.dailyLimit !== undefined) data.dailyLimit = batchLimitForm.dailyLimit
    if (batchLimitForm.monthlyLimit !== undefined) data.monthlyLimit = batchLimitForm.monthlyLimit
    if (batchLimitForm.scopeType) data.scopeType = batchLimitForm.scopeType
    const res = await batchActionMemberPrivilegeApi(data)
    ElMessage.success(`批量修改上限完成：成功${res.successCount}，失败${res.failCount}`)
    batchLimitDialogVisible.value = false
    loadAllData()
  } catch (e: any) {
    ElMessage.error(e.message || '批量修改失败')
  } finally {
    batchLoading.value = false
  }
}

const openHistoryDrawer = (row: MemberPrivilegeItem) => {
  historyPrivilegeId.value = row.id
  historyQuery.page = 1
  historyDrawerVisible.value = true
  loadHistory()
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await getMemberPrivilegeHistoryApi(historyPrivilegeId.value, {
      page: historyQuery.page,
      pageSize: historyQuery.pageSize,
    })
    historyList.value = res.list || []
    historyTotal.value = res.pagination?.total || 0
  } catch { /* ignore */ } finally {
    historyLoading.value = false
  }
}

const openTraceDrawer = () => {
  traceType.value = 'privilegeCode'
  traceValue.value = ''
  traceResult.value = null
  traceSearched.value = false
  traceDrawerVisible.value = true
}

const openTraceForCode = (code: string) => {
  traceType.value = 'privilegeCode'
  traceValue.value = code
  traceResult.value = null
  traceSearched.value = false
  traceDrawerVisible.value = true
  loadTraceData()
}

const openTraceForBatch = (batch: string) => {
  traceType.value = 'configBatch'
  traceValue.value = batch
  traceResult.value = null
  traceSearched.value = false
  traceDrawerVisible.value = true
  loadTraceData()
}

const loadTraceData = async () => {
  if (!traceValue.value.trim()) {
    ElMessage.warning('请输入溯源查询值')
    return
  }
  traceLoading.value = true
  traceSearched.value = true
  try {
    traceResult.value = await getMemberPrivilegeTraceApi({
      traceType: traceType.value as any,
      traceValue: traceValue.value,
    })
  } catch (e: any) {
    ElMessage.error(e.message || '溯源查询失败')
  } finally {
    traceLoading.value = false
  }
}

const openRedemptionDrawer = () => {
  redemptionQuery.page = 1
  redemptionQuery.privilegeCode = ''
  redemptionQuery.redemptionType = ''
  redemptionDrawerVisible.value = true
  loadRedemptions()
}

const loadRedemptions = async () => {
  redemptionLoading.value = true
  try {
    const params: any = { page: redemptionQuery.page, pageSize: redemptionQuery.pageSize }
    if (redemptionQuery.privilegeCode) params.privilegeCode = redemptionQuery.privilegeCode
    if (redemptionQuery.redemptionType) params.redemptionType = redemptionQuery.redemptionType
    const res = await getMemberPrivilegeRedemptionsApi(params)
    redemptionList.value = res.list || []
    redemptionTotal.value = res.pagination?.total || 0
  } catch { /* ignore */ } finally {
    redemptionLoading.value = false
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onScroll = () => {
  showBackTop.value = window.scrollY > 300
}

onMounted(() => {
  loadLevelOptions()
  loadAllData()
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style lang="scss" scoped>
.member-privilege-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 600;
  }

  .page-desc {
    margin: 0;
    font-size: 14px;
    color: #909399;
  }
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  border-radius: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.4;
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }
}

.filter-card {
  margin-bottom: 16px;
  border-radius: 10px;
}

.table-card {
  border-radius: 10px;
}

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
    display: flex;
    gap: 8px;
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.focus-color-input {
  :deep(.el-input__wrapper:focus-within) {
    box-shadow: 0 0 0 1px #722ed1 inset;
  }
}

.shake-form {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  .perm-label {
    white-space: nowrap;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

:deep(.el-table .paused-row) {
  background-color: #fdf6ec !important;
}

:deep(.el-table .offline-row) {
  background-color: #f4f4f5 !important;
}

:deep(.el-table__body tr.current-row > td) {
  background-color: #ecf5ff !important;
}

.back-top-btn {
  position: fixed;
  right: 40px;
  bottom: 80px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
  z-index: 999;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.5);
  }
}

.fade-back-top-enter-active,
.fade-back-top-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-back-top-enter-from,
.fade-back-top-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

:deep(.privilege-dialog) {
  .el-dialog {
    border-radius: 12px;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .el-dialog__header {
    border-radius: 12px 12px 0 0;
  }
}

:deep(.el-dialog) {
  border-radius: 12px;
}

:deep(.el-button) {
  border-radius: 8px;
}

:deep(.el-card) {
  border-radius: 10px;
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}
</style>

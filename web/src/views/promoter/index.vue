<template>
  <div class="promoter-manage-page">
    <el-card shadow="never" class="tabs-card">
      <el-tabs v-model="activeTab" class="promoter-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="推客列表" name="list" />
        <el-tab-pane label="编辑管控" name="edit" />
        <el-tab-pane label="资质审核" name="qualification" />
        <el-tab-pane label="批量操作" name="batch" />
        <el-tab-pane label="变更溯源" name="trace" />
      </el-tabs>
    </el-card>

    <div v-show="activeTab === 'list'">
      <el-card shadow="never">
        <el-form :inline="true" :model="queryParams" class="search-form">
          <el-form-item label="推客编号/姓名/手机号">
            <el-input
              v-model="queryParams.keyword"
              placeholder="请输入关键词"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="渠道">
            <el-select
              v-model="queryParams.channelId"
              placeholder="请选择"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in channelOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="等级">
            <el-select
              v-model="queryParams.level"
              placeholder="请选择"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in PROMOTER_LEVEL_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="推广状态">
            <el-select
              v-model="(queryParams as any).promoteStatus"
              placeholder="请选择"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in PROMOTE_STATUS_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="实名认证">
            <el-select
              v-model="(queryParams as any).verifyStatus"
              placeholder="请选择"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in VERIFY_STATUS_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" class="scale-btn" @click="handleSearch">搜索</el-button>
            <el-button :icon="RefreshRight" class="scale-btn" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" style="margin-top: 16px">
        <BaseBatchOperation
          :selected-count="selectedIds.length"
          @clear="handleClearSelection"
        >
          <el-button type="primary" size="small" class="scale-btn" :icon="Edit" :disabled="selectedIds.length !== 1" @click="handleEditFromList">
            编辑
          </el-button>
          <el-button type="warning" size="small" class="scale-btn" :icon="Operation" :disabled="selectedIds.length === 0" @click="handleSwitchToBatch">
            批量操作
          </el-button>
        </BaseBatchOperation>

        <BaseTable
          :data="dataList"
          :loading="loading"
          :total="total"
          :page="pagination.page"
          :page-size="pagination.pageSize"
          show-selection
          stripe
          @selection-change="handleSelectionChange"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        >
          <template #toolbar>
            <div class="table-toolbar">
              <el-button type="primary" :icon="Plus" class="scale-btn" @click="handleAdd">新增推客</el-button>
              <el-button :icon="Download" class="scale-btn" @click="handleExport">导出</el-button>
            </div>
          </template>
          <el-table-column prop="id" label="编号" width="80" align="center" />
          <el-table-column prop="name" label="姓名" min-width="100" />
          <el-table-column label="头像" width="70" align="center">
            <template #default="{ row }">
              <el-avatar :size="32" :src="(row as any).avatar || undefined">
                {{ (row as any).name?.charAt(0) || 'U' }}
              </el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column prop="channelName" label="渠道" width="100" />
          <el-table-column label="等级" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="(PROMOTER_LEVEL_MAP[(row as any).level]?.type || 'info') as any" size="small">
                {{ PROMOTER_LEVEL_MAP[(row as any).level]?.label || 'L1 初级' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="推广状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="(PROMOTE_STATUS_MAP[(row as any).promoteStatus ?? 1]?.type || 'info') as any" size="small">
                {{ PROMOTE_STATUS_MAP[(row as any).promoteStatus ?? 1]?.label || '正常推广' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="结算状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="(SETTLE_STATUS_MAP[(row as any).settleStatus ?? 1]?.type || 'info') as any" size="small">
                {{ SETTLE_STATUS_MAP[(row as any).settleStatus ?? 1]?.label || '结算正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="实名认证" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="(VERIFY_STATUS_MAP[(row as any).verifyStatus ?? 0]?.type || 'info') as any" size="small">
                {{ VERIFY_STATUS_MAP[(row as any).verifyStatus ?? 0]?.label || '未认证' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalOrders" label="总订单" width="90" align="right">
            <template #default="{ row }">{{ (row as any).totalOrders || 0 }}</template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="累计金额" width="110" align="right">
            <template #default="{ row }">¥{{ formatMoney((row as any).totalAmount ?? 0) }}</template>
          </el-table-column>
          <el-table-column label="注册时间" width="160">
            <template #default="{ row }">{{ formatDateTime((row as any).createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" class="scale-btn" :icon="Edit" @click="handleEditFromRow(row as any)">编辑</el-button>
              <el-button type="success" link size="small" class="scale-btn" :icon="Document" v-if="(row as any).verifyStatus === 1" @click="handleSwitchToQualification(row as any)">
                资质审核
              </el-button>
              <el-button type="warning" link size="small" class="scale-btn" :icon="Connection" @click="handleSwitchToTrace(row as any)">变更溯源</el-button>
            </template>
          </el-table-column>
        </BaseTable>
      </el-card>
    </div>

    <div v-show="activeTab === 'edit'">
      <el-card shadow="never" v-if="!selectedEditPromoter">
        <el-empty description="请先从推客列表选择要编辑的推客">
          <el-button type="primary" class="scale-btn" @click="activeTab = 'list'">去选择</el-button>
        </el-empty>
      </el-card>

      <el-card shadow="never" v-else>
        <div class="edit-header">
          <div class="edit-promoter-info">
            <el-avatar :size="48" :src="selectedEditPromoter.avatar || undefined">
              {{ selectedEditPromoter.name?.charAt(0) || 'U' }}
            </el-avatar>
            <div class="promoter-meta">
              <div class="promoter-name">
                {{ selectedEditPromoter.name }}
                <el-tag size="small" style="margin-left: 8px;" :type="PROMOTER_LEVEL_MAP[selectedEditPromoter.level as any]?.type || 'info'">
                  {{ PROMOTER_LEVEL_MAP[selectedEditPromoter.level as any]?.label || 'L1' }}
                </el-tag>
              </div>
              <div class="promoter-sub">编号: {{ selectedEditPromoter.id }} | 手机号: {{ selectedEditPromoter.phone }}</div>
            </div>
          </div>
          <div class="edit-actions">
            <el-button :icon="RefreshLeft" class="scale-btn" @click="handleResetEditForm">重置</el-button>
            <el-button type="primary" :icon="Check" class="scale-btn" :loading="editSubmitting" @click="handleSaveEdit">保存修改</el-button>
          </div>
        </div>

        <el-divider content-position="left">
          <span class="section-title"><el-icon><User /></el-icon> 基础资料 <el-tag size="small" type="info" style="margin-left: 8px;">普通运营可改</el-tag></span>
        </el-divider>

        <el-form ref="editFormRef" :model="editFormData" label-width="120px" class="edit-form">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <div class="form-item-with-icon">
                  <el-input v-model="editFormData.name" placeholder="请输入姓名" @blur="handleValidateField('name')" />
                  <el-icon v-if="fieldValidation.name === true" class="valid-icon success"><Check /></el-icon>
                  <el-icon v-else-if="fieldValidation.name" class="valid-icon error"><CloseBold /></el-icon>
                </div>
                <div v-if="fieldValidation.name && fieldValidation.name !== true" class="field-error">{{ fieldValidation.name }}</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号" prop="phone">
                <div class="form-item-with-icon">
                  <el-input v-model="editFormData.phone" placeholder="请输入手机号" @blur="handleValidateField('phone')" @input="handleCheckUniqueness" />
                  <el-icon v-if="fieldValidation.phone === true" class="valid-icon success"><Check /></el-icon>
                  <el-icon v-else-if="fieldValidation.phone" class="valid-icon error"><CloseBold /></el-icon>
                </div>
                <div v-if="fieldValidation.phone && fieldValidation.phone !== true" class="field-error">{{ fieldValidation.phone }}</div>
                <div v-if="uniquenessErrors.phone" class="field-error">{{ uniquenessErrors.phone }}</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱">
                <div class="form-item-with-icon">
                  <el-input v-model="editFormData.email" placeholder="请输入邮箱" @blur="handleValidateField('email')" />
                  <el-icon v-if="fieldValidation.email === true" class="valid-icon success"><Check /></el-icon>
                  <el-icon v-else-if="fieldValidation.email" class="valid-icon error"><CloseBold /></el-icon>
                </div>
                <div v-if="fieldValidation.email && fieldValidation.email !== true" class="field-error">{{ fieldValidation.email }}</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="微信号" prop="wechatId">
                <div class="form-item-with-icon">
                  <el-input v-model="editFormData.wechatId" placeholder="请输入微信号" @blur="handleValidateField('wechatId')" @input="handleCheckUniqueness" />
                  <el-icon v-if="fieldValidation.wechatId === true" class="valid-icon success"><Check /></el-icon>
                  <el-icon v-else-if="fieldValidation.wechatId" class="valid-icon error"><CloseBold /></el-icon>
                </div>
                <div v-if="fieldValidation.wechatId && fieldValidation.wechatId !== true" class="field-error">{{ fieldValidation.wechatId }}</div>
                <div v-if="uniquenessErrors.wechatId" class="field-error">{{ uniquenessErrors.wechatId }}</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="真实姓名">
                <el-input v-model="editFormData.realName" placeholder="请输入真实姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" prop="idCard">
                <div class="form-item-with-icon">
                  <el-input v-model="editFormData.idCard" placeholder="请输入身份证号" @blur="handleValidateField('idCard')" @input="handleCheckUniqueness" />
                  <el-icon v-if="fieldValidation.idCard === true" class="valid-icon success"><Check /></el-icon>
                  <el-icon v-else-if="fieldValidation.idCard" class="valid-icon error"><CloseBold /></el-icon>
                </div>
                <div v-if="fieldValidation.idCard && fieldValidation.idCard !== true" class="field-error">{{ fieldValidation.idCard }}</div>
                <div v-if="uniquenessErrors.idCard" class="field-error">{{ uniquenessErrors.idCard }}</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="渠道">
                <el-select v-model="editFormData.channelId" placeholder="请选择渠道" style="width: 100%">
                  <el-option v-for="item in channelOptions" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">
            <span class="section-title"><el-icon><Star /></el-icon> 等级权限 <el-tag size="small" type="warning" style="margin-left: 8px;">仅管理员可改</el-tag></span>
          </el-divider>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="推客等级">
                <el-select v-model="editFormData.level" placeholder="请选择等级" style="width: 100%" :disabled="!canEditLevel" @change="handleLevelChange">
                  <el-option v-for="item in PROMOTER_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <div v-if="!canEditLevel" class="form-tip">您没有权限修改等级，请联系管理员</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="推广状态">
                <el-select v-model="editFormData.promoteStatus" placeholder="请选择推广状态" style="width: 100%">
                  <el-option v-for="item in PROMOTE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结算状态">
                <el-select v-model="editFormData.settleStatus" placeholder="请选择结算状态" style="width: 100%">
                  <el-option v-for="item in SETTLE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="自定义佣金比例(%)">
                <el-input-number v-model="editFormData.commissionRate" :min="0" :max="100" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <div v-if="currentLevelConfig" class="level-config-card">
            <div class="level-config-header">
              <el-icon class="level-icon"><Medal /></el-icon>
              <span class="level-title">{{ PROMOTER_LEVEL_MAP[editFormData.level]?.label || 'L1 初级' }} - 等级权益配置</span>
            </div>
            <el-row :gutter="16">
              <el-col :span="8">
                <div class="config-item">
                  <div class="config-label">佣金比例</div>
                  <div class="config-value highlight">{{ (currentLevelConfig.commissionRate * 100).toFixed(2) }}%</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="config-item">
                  <div class="config-label">可绑定渠道数</div>
                  <div class="config-value">{{ currentLevelConfig.maxChannels }} 个</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="config-item">
                  <div class="config-label">最低订单金额</div>
                  <div class="config-value">¥{{ formatMoney(currentLevelConfig.minOrderAmount) }}</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="config-item">
                  <div class="config-label">每日提现上限</div>
                  <div class="config-value">¥{{ formatMoney(currentLevelConfig.dailyWithdrawLimit) }}</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="config-item">
                  <div class="config-label">优惠券</div>
                  <div class="config-value">
                    <el-tag v-if="currentLevelConfig.canUseCoupon" type="success" size="small">支持</el-tag>
                    <el-tag v-else type="info" size="small">不支持</el-tag>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="config-item">
                  <div class="config-label">返现功能</div>
                  <div class="config-value">
                    <el-tag v-if="currentLevelConfig.canUseCashback" type="success" size="small">支持</el-tag>
                    <el-tag v-else type="info" size="small">不支持</el-tag>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </el-card>
    </div>

    <div v-show="activeTab === 'qualification'">
      <el-card shadow="never">
        <div class="qualification-header">
          <div class="qualification-title">
            <el-icon><Document /></el-icon>
            资质待审核列表
            <el-tag type="warning" style="margin-left: 8px;">{{ pendingQualificationList.length }} 条待审核</el-tag>
          </div>
          <el-button :icon="Refresh" class="scale-btn" @click="fetchData">刷新</el-button>
        </div>

        <el-table
          v-loading="loading"
          :data="pendingQualificationList"
          border
          stripe
          style="width: 100%; margin-top: 16px;"
          empty-text="暂无待审核的资质"
        >
          <el-table-column prop="id" label="推客编号" width="100" align="center" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column label="资质类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ QUALIFICATION_TYPE_MAP[(row as any).qualificationType as any] || (row as any).qualificationType || '身份证' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="提交时间" width="170">
            <template #default="{ row }">
              {{ formatDateTime((row as any).qualificationSubmittedAt || (row as any).createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="审核状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="(VERIFY_STATUS_MAP[(row as any).verifyStatus]?.type || 'warning') as any" size="small">
                {{ VERIFY_STATUS_MAP[(row as any).verifyStatus]?.label || '认证中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="success" link size="small" class="scale-btn" :icon="Check" @click="openReviewDialog(row as any, true)">通过</el-button>
              <el-button type="danger" link size="small" class="scale-btn" :icon="CloseBold" @click="openReviewDialog(row as any, false)">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <div v-show="activeTab === 'batch'">
      <el-card shadow="never">
        <el-row :gutter="16">
          <el-col :span="14">
            <div class="batch-section-title">
              <el-icon><UserFilled /></el-icon>
              选择推客（已选 {{ batchSelectedIds.length }} 个）
            </div>
            <div class="batch-search-bar">
              <el-input
                v-model="batchSearchKeyword"
                placeholder="搜索推客姓名/手机号"
                clearable
                :prefix-icon="Search"
                style="width: 260px"
              />
              <el-checkbox v-model="selectAllLowPerformance" style="margin-left: 12px;">
                全选低绩效（<span class="text-warning">订单＜10单 或 金额＜¥5000</span>）
              </el-checkbox>
            </div>
            <el-table
              ref="batchTableRef"
              v-loading="loading"
              :data="filteredBatchList"
              border
              stripe
              style="width: 100%; margin-top: 12px; max-height: 520px;"
              @selection-change="handleBatchSelectionChange"
            >
              <el-table-column type="selection" width="50" align="center" />
              <el-table-column prop="id" label="编号" width="80" align="center" />
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="phone" label="手机号" width="130" />
              <el-table-column label="等级" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="PROMOTER_LEVEL_MAP[(row as any).level]?.type || 'info'" size="small">
                    {{ PROMOTER_LEVEL_MAP[(row as any).level]?.label || 'L1' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="totalOrders" label="订单数" width="80" align="right">
                <template #default="{ row }">
                  <span :class="{ 'text-danger': isLowPerformance(row as any) }">{{ (row as any).totalOrders || 0 }}</span>
                </template>
              </el-table-column>
              <el-table-column label="累计金额" width="110" align="right">
                <template #default="{ row }">
                  <span :class="{ 'text-danger': isLowPerformance(row as any) }">¥{{ formatMoney((row as any).totalAmount ?? 0) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="绩效" width="90" align="center">
                <template #default="{ row }">
                  <el-tag v-if="isLowPerformance(row as any)" type="danger" size="small" effect="dark">低绩效</el-tag>
                  <el-tag v-else type="success" size="small">正常</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-col>

          <el-col :span="10">
            <div class="batch-section-title">
              <el-icon><Operation /></el-icon>
              批量操作
            </div>
            <div class="batch-operation-card">
              <el-radio-group v-model="batchOperationType" style="width: 100%">
                <el-radio-button value="level" style="width: 33.33%;">调整等级</el-radio-button>
                <el-radio-button value="promoteStatus" style="width: 33.33%;">推广状态</el-radio-button>
                <el-radio-button value="settleStatus" style="width: 33.33%;">结算状态</el-radio-button>
              </el-radio-group>

              <div v-if="batchOperationType === 'level'" class="batch-options">
                <div class="option-label">目标等级：</div>
                <el-select v-model="batchTargetLevel" placeholder="请选择目标等级" style="width: 100%">
                  <el-option v-for="item in PROMOTER_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="String(item.value)" />
                </el-select>
              </div>

              <div v-if="batchOperationType === 'promoteStatus'" class="batch-options">
                <div class="option-label">推广状态：</div>
                <el-select v-model="batchTargetPromoteStatus" placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in PROMOTE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>

              <div v-if="batchOperationType === 'settleStatus'" class="batch-options">
                <div class="option-label">结算状态：</div>
                <el-select v-model="batchTargetSettleStatus" placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in SETTLE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>

              <div class="batch-options">
                <div class="option-label">备注（可选）：</div>
                <el-input v-model="batchRemark" type="textarea" :rows="2" placeholder="请输入操作备注" maxlength="200" show-word-limit />
              </div>

              <el-button
                type="primary"
                class="scale-btn"
                style="width: 100%; margin-top: 12px;"
                :icon="View"
                :disabled="batchSelectedIds.length === 0 || !canPreviewBatch"
                @click="showBatchPreview"
              >
                预览变更效果
              </el-button>
            </div>

            <div v-if="batchPreviewVisible" class="batch-preview-card">
              <div class="preview-header">
                <el-icon><DataAnalysis /></el-icon>
                操作预览
              </div>
              <el-row :gutter="12" class="preview-stats">
                <el-col :span="8">
                  <div class="preview-stat total">
                    <div class="preview-stat-value">{{ batchPreview.total }}</div>
                    <div class="preview-stat-label">总数</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="preview-stat process">
                    <div class="preview-stat-value">{{ batchPreview.toProcess }}</div>
                    <div class="preview-stat-label">将处理</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="preview-stat skipped">
                    <div class="preview-stat-value">{{ batchPreview.skipped }}</div>
                    <div class="preview-stat-label">将跳过</div>
                  </div>
                </el-col>
              </el-row>
              <div class="preview-list-title">明细（低绩效标红 skipped）：</div>
              <el-table :data="batchPreviewDetails" border size="small" max-height="240">
                <el-table-column prop="name" label="姓名" width="80" />
                <el-table-column label="状态" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="(row as any).status === 'process'" type="primary" size="small">处理</el-tag>
                    <el-tag v-else type="danger" size="small" effect="dark">skipped</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="说明" min-width="140" show-overflow-tooltip />
              </el-table>
              <div style="margin-top: 12px; display: flex; gap: 8px;">
                <el-button class="scale-btn" style="flex: 1;" @click="batchPreviewVisible = false">取消</el-button>
                <el-button type="primary" class="scale-btn" style="flex: 1;" :icon="Check" :loading="batchSubmitting" @click="executeBatchOperation">确认执行</el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <div v-show="activeTab === 'trace'">
      <el-card shadow="never">
        <div class="trace-search-bar">
          <span class="trace-title"><el-icon><Connection /></el-icon> 变更溯源</span>
          <el-input
            v-model="traceSearchPhone"
            placeholder="按手机号精准检索"
            clearable
            style="width: 200px; margin-left: 16px;"
            @keyup.enter="handleTraceSearch"
          />
          <el-input
            v-model="traceSearchIdCard"
            placeholder="按身份证号精准检索"
            clearable
            style="width: 240px; margin-left: 8px;"
            @keyup.enter="handleTraceSearch"
          />
          <el-button type="primary" class="scale-btn" style="margin-left: 8px;" :icon="Search" @click="handleTraceSearch">搜索</el-button>
          <el-select
            v-if="tracePromoterOptions.length > 0"
            v-model="selectedTracePromoterId"
            placeholder="选择推客查看变更"
            style="width: 260px; margin-left: 16px;"
            @change="handleTracePromoterChange"
          >
            <el-option
              v-for="item in tracePromoterOptions"
              :key="item.id"
              :label="`${item.name} (${item.phone})`"
              :value="String(item.id)"
            />
          </el-select>
        </div>

        <div v-if="!selectedTracePromoter" style="padding: 40px 0;">
          <el-empty description="请搜索并选择要查看溯源的推客" />
        </div>

        <div v-else style="margin-top: 16px;">
          <div class="trace-promoter-info">
            <el-avatar :size="40" :src="selectedTracePromoter.avatar || undefined">
              {{ selectedTracePromoter.name?.charAt(0) || 'U' }}
            </el-avatar>
            <div style="margin-left: 12px;">
              <div class="trace-promoter-name">
                {{ selectedTracePromoter.name }}
                <el-tag size="small" style="margin-left: 8px;" :type="PROMOTER_LEVEL_MAP[selectedTracePromoter.level as any]?.type || 'info'">
                  {{ PROMOTER_LEVEL_MAP[selectedTracePromoter.level as any]?.label || 'L1' }}
                </el-tag>
              </div>
              <div class="trace-promoter-sub">
                编号: {{ selectedTracePromoter.id }} | 手机号: {{ selectedTracePromoter.phone }} | 变更记录: {{ traceLogsTotal }} 条
              </div>
            </div>
          </div>

          <el-table
            v-loading="traceLogsLoading"
            :data="traceLogs"
            border
            stripe
            style="width: 100%; margin-top: 16px;"
          >
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="fieldLabel" label="变更字段" width="140" />
            <el-table-column prop="operatorName" label="操作人" width="120" />
            <el-table-column label="变更类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag size="small">
                  {{ getChangeTypeLabel((row as any).changeType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="旧值" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ (row as any).oldValue || '-' }}</template>
            </el-table-column>
            <el-table-column label="新值" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ (row as any).newValue || '-' }}</template>
            </el-table-column>
            <el-table-column label="时间" width="170">
              <template #default="{ row }">{{ formatDateTime((row as any).createdAt || (row as any).changedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" class="scale-btn" :icon="View" @click="showChangeDiff(row as any)">对比</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
            <el-pagination
              v-model:current-page="tracePagination.page"
              v-model:page-size="tracePagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="traceLogsTotal"
              layout="total, sizes, prev, pager, next"
              background
              @size-change="fetchTraceLogs"
              @current-change="fetchTraceLogs"
            />
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="reviewDialogVisible"
      :title="reviewDialogTitle"
      width="500px"
      custom-class="zoom-fade-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="reviewFormRef" :model="reviewFormData" label-width="100px">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="推客姓名">{{ reviewTarget?.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ reviewTarget?.phone }}</el-descriptions-item>
          <el-descriptions-item label="资质类型">
            {{ QUALIFICATION_TYPE_MAP[reviewTarget?.qualificationType as any] || reviewTarget?.qualificationType || '身份证' }}
          </el-descriptions-item>
        </el-descriptions>
        <el-form-item label="审核备注" style="margin-top: 16px;" v-if="!reviewPassed">
          <el-input v-model="reviewFormData.remark" type="textarea" :rows="3" placeholder="请输入驳回原因" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="审核备注" style="margin-top: 16px;" v-else>
          <el-input v-model="reviewFormData.remark" type="textarea" :rows="2" placeholder="请输入审核备注（可选）" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" class="scale-btn" :loading="reviewSubmitting" @click="confirmReview">
          {{ reviewPassed ? '确认通过' : '确认驳回' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reviewResultVisible"
      title="审核结果"
      width="600px"
      custom-class="zoom-fade-dialog"
    >
      <el-result
        :icon="reviewResultData.passed ? 'success' : 'error'"
        :title="reviewResultData.passed ? '审核通过' : '审核驳回'"
        :sub-title="reviewResultData.passed ? '资质已认证通过，相关权限已生效' : '资质已驳回'"
      >
        <template #extra>
          <div class="review-result-detail">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="推客姓名">{{ reviewResultData.name }}</el-descriptions-item>
              <el-descriptions-item label="资质类型">{{ QUALIFICATION_TYPE_MAP[reviewResultData.qualificationType as any] || reviewResultData.qualificationType }}</el-descriptions-item>
              <el-descriptions-item label="审核备注">{{ reviewResultData.remark || '-' }}</el-descriptions-item>
              <el-descriptions-item label="生效权限" v-if="reviewResultData.passed">
                <div class="effective-permissions">
                  <el-tag type="success" size="small" style="margin-right: 6px;">实名认证通过</el-tag>
                  <el-tag type="success" size="small" style="margin-right: 6px;">提现权限开启</el-tag>
                  <el-tag type="success" size="small">推广权益解锁</el-tag>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </el-result>
      <template #footer>
        <el-button type="primary" class="scale-btn" @click="reviewResultVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchResultVisible"
      title="批量操作结果"
      width="700px"
      custom-class="zoom-fade-dialog"
    >
      <div v-if="batchResult">
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
        <div class="batch-result-detail">
          <div class="detail-title">操作明细</div>
          <el-table :data="batchResult.details" border size="default" max-height="400">
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="id" label="推客编号" width="100" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="(row as any).status === 'success'" type="success" size="small">成功</el-tag>
                <el-tag v-else-if="(row as any).status === 'failed'" type="danger" size="small">失败</el-tag>
                <el-tag v-else type="info" size="small">跳过</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="说明" min-width="200" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" class="scale-btn" @click="handleBatchResultConfirm">确定并刷新</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="changeDiffVisible"
      title="变更对比"
      width="560px"
      custom-class="zoom-fade-dialog"
    >
      <div v-if="currentChangeDiff">
        <div class="diff-header">
          <el-icon><Connection /></el-icon>
          <span>{{ currentChangeDiff.fieldLabel || currentChangeDiff.fieldName }} - 变更详情</span>
        </div>
        <div class="diff-card">
          <div class="diff-side diff-side--old">
            <div class="diff-side-title"><el-icon><Back /></el-icon> 历史值</div>
            <div class="diff-side-content">{{ currentChangeDiff.before || '-' }}</div>
          </div>
          <div class="diff-arrow"><el-icon><Right /></el-icon></div>
          <div class="diff-side diff-side--new">
            <div class="diff-side-title"><el-icon><Right /></el-icon> 当前值</div>
            <div class="diff-side-content">{{ currentChangeDiff.after || '-' }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="changeDiffVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import {
  Search,
  RefreshRight,
  Plus,
  Edit,
  Download,
  View,
  Check,
  CloseBold,
  Document,
  Operation,
  Connection,
  User,
  Star,
  Medal,
  Refresh,
  RefreshLeft,
  UserFilled,
  DataAnalysis,
  Back,
  Right,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import { useTable } from '@/composables/useTable'
import {
  PROMOTER_LEVEL_OPTIONS,
  PROMOTER_LEVEL_MAP,
  VERIFY_STATUS_OPTIONS,
  VERIFY_STATUS_MAP,
  QUALIFICATION_TYPE_MAP,
  PROMOTE_STATUS_OPTIONS,
  PROMOTE_STATUS_MAP,
  SETTLE_STATUS_OPTIONS,
  SETTLE_STATUS_MAP,
  CHANGE_TYPE_OPTIONS,
} from '@/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import { getChannelList } from '@/api/channel'
import {
  getPromoterList,
  deletePromoter,
  batchDeletePromoters,
  type PromoterItem,
  type PromoterQueryParams,
} from '@/api/promoter'
import {
  getLevelConfigs,
  checkEditPermission,
  validateField,
  checkUniqueness,
  updatePromoterInfo,
  reviewQualification,
  batchUpdateLevel,
  batchUpdatePromoteStatus,
  batchUpdateSettleStatus,
  getChangeLogs,
  getChangeDiff,
  getPromoterManageDetail,
  type LevelConfig,
  type ChangeLogItem,
  type BatchUpdateResult,
  type PromoterManageDetail,
} from '@/api/promoter-manage'

const activeTab = ref<string>('list')
const channelOptions = ref<Array<{ id: number | string; name: string }>>([])
const levelConfigs = ref<LevelConfig[]>([])

async function fetchChannelOptions() {
  try {
    const res = await getChannelList({ page: 1, pageSize: 999, status: 1 as any })
    channelOptions.value = res.list.map((item) => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('Fetch channels error:', error)
  }
}

async function fetchLevelConfigs() {
  try {
    levelConfigs.value = await getLevelConfigs()
  } catch (error) {
    console.error('Fetch level configs error:', error)
  }
}

const {
  loading,
  dataList,
  total,
  selectedIds,
  pagination,
  queryParams,
  handleSearch,
  handleReset: handleBaseReset,
  handlePageChange,
  handleSizeChange,
  handleSelectionChange,
  clearSelection,
  fetchData,
} = useTable<PromoterItem, PromoterQueryParams>({
  fetchApi: getPromoterList,
  deleteApi: deletePromoter,
  batchDeleteApi: batchDeletePromoters,
})

function handleReset() {
  handleBaseReset()
}

function handleClearSelection() {
  clearSelection()
}

function handleExport() {
  ElMessage.info('导出功能开发中')
}

function handleTabChange(tab: string) {
  activeTab.value = tab
}

function handleAdd() {
  ElMessage.info('新增推客功能开发中')
}

const selectedEditPromoter = ref<PromoterManageDetail | null>(null)
const editFormRef = ref<FormInstance>()
const editSubmitting = ref(false)
const canEditLevel = ref(false)

const editFormData = reactive({
  name: '',
  phone: '',
  email: '',
  wechatId: '',
  realName: '',
  idCard: '',
  channelId: undefined as number | string | undefined,
  level: 1,
  promoteStatus: 1,
  settleStatus: 1,
  commissionRate: 0,
})

const fieldValidation = reactive<Record<string, boolean | string>>({})
const uniquenessErrors = reactive<Record<string, string>>({})

const currentLevelConfig = computed(() => {
  if (!editFormData.level) return null
  return levelConfigs.value.find((c) => Number(c.level) === Number(editFormData.level)) || null
})

async function handleEditFromList() {
  if (selectedIds.value.length !== 1) return
  const promoter = dataList.value.find((p) => (p as any).id === selectedIds.value[0])
  if (promoter) {
    await handleEditFromRow(promoter)
  }
}

async function handleEditFromRow(row: any) {
  try {
    const detail = await getPromoterManageDetail(String(row.id))
    selectedEditPromoter.value = detail
    Object.assign(editFormData, {
      name: detail.name || '',
      phone: detail.phone || '',
      email: detail.email || '',
      wechatId: detail.wechatId || '',
      realName: detail.realName || '',
      idCard: detail.idCard || '',
      channelId: detail.channelId,
      level: Number(detail.level) || 1,
      promoteStatus: detail.promoteStatus ?? 1,
      settleStatus: detail.settleStatus ?? 1,
      commissionRate: detail.commissionRate || 0,
    })
    Object.keys(fieldValidation).forEach((k) => delete fieldValidation[k])
    Object.keys(uniquenessErrors).forEach((k) => delete uniquenessErrors[k])
    await checkLevelPermission()
    activeTab.value = 'edit'
  } catch (error) {
    console.error(error)
    ElMessage.error('获取推客详情失败')
  }
}

async function checkLevelPermission() {
  if (!selectedEditPromoter.value) return
  try {
    const res = await checkEditPermission(selectedEditPromoter.value.id, ['level'])
    canEditLevel.value = res.allowed
  } catch {
    canEditLevel.value = false
  }
}

function handleResetEditForm() {
  if (!selectedEditPromoter.value) return
  const detail = selectedEditPromoter.value
  Object.assign(editFormData, {
    name: detail.name || '',
    phone: detail.phone || '',
    email: detail.email || '',
    wechatId: detail.wechatId || '',
    realName: detail.realName || '',
    idCard: detail.idCard || '',
    channelId: detail.channelId,
    level: Number(detail.level) || 1,
    promoteStatus: detail.promoteStatus ?? 1,
    settleStatus: detail.settleStatus ?? 1,
    commissionRate: detail.commissionRate || 0,
  })
  Object.keys(fieldValidation).forEach((k) => delete fieldValidation[k])
  Object.keys(uniquenessErrors).forEach((k) => delete uniquenessErrors[k])
  ElMessage.success('已重置为原始数据')
}

async function handleValidateField(field: string) {
  const value = (editFormData as any)[field]
  try {
    const res = await validateField(field, value)
    fieldValidation[field] = res.valid ? true : (res.message || '校验失败')
  } catch (e) {
    fieldValidation[field] = true
  }
}

let uniquenessTimer: any = null
function handleCheckUniqueness() {
  if (uniquenessTimer) clearTimeout(uniquenessTimer)
  uniquenessTimer = setTimeout(async () => {
    if (!selectedEditPromoter.value) return
    try {
      const res = await checkUniqueness({
        phone: editFormData.phone,
        wechatId: editFormData.wechatId,
        idCard: editFormData.idCard,
        excludePromoterId: selectedEditPromoter.value.id,
      })
      Object.keys(uniquenessErrors).forEach((k) => delete uniquenessErrors[k])
      if (!res.valid && res.duplicateFields) {
        res.duplicateFields.forEach((df) => {
          uniquenessErrors[df.field] = `该${df.field === 'phone' ? '手机号' : df.field === 'wechatId' ? '微信号' : '身份证号'}已被使用`
        })
      }
    } catch (e) {
      console.error(e)
    }
  }, 500)
}

function handleLevelChange() {
}

async function handleSaveEdit() {
  if (!selectedEditPromoter.value) return
  const hasFieldErrors = Object.keys(fieldValidation).some((k) => fieldValidation[k] !== true)
  const hasUniquenessErrors = Object.keys(uniquenessErrors).length > 0
  if (hasFieldErrors || hasUniquenessErrors) {
    ElMessage.error('请先修正表单中的错误')
    return
  }
  try {
    const editFields = Object.keys(editFormData).filter((k) => (editFormData as any)[k] !== undefined)
    const perm = await checkEditPermission(selectedEditPromoter.value.id, editFields)
    if (!perm.allowed && perm.deniedFields && perm.deniedFields.length > 0) {
      ElMessage.error(`您没有权限修改以下字段: ${perm.deniedFields.join(', ')}`)
      return
    }
  } catch (e) {
    console.error(e)
  }
  editSubmitting.value = true
  try {
    await updatePromoterInfo(selectedEditPromoter.value.id, editFormData)
    ElMessage.success('保存成功')
    await fetchData()
    const updated = await getPromoterManageDetail(selectedEditPromoter.value.id)
    selectedEditPromoter.value = updated
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    editSubmitting.value = false
  }
}

const pendingQualificationList = computed(() => {
  return dataList.value.filter((p) => (p as any).verifyStatus === 1)
})

const reviewDialogVisible = ref(false)
const reviewSubmitting = ref(false)
const reviewTarget = ref<any>(null)
const reviewPassed = ref(true)
const reviewFormRef = ref<FormInstance>()
const reviewFormData = reactive({ remark: '' })

const reviewDialogTitle = computed(() => (reviewPassed.value ? '审核通过' : '审核驳回'))

const reviewResultVisible = ref(false)
const reviewResultData = reactive<any>({})

function handleSwitchToQualification(_row: any) {
  activeTab.value = 'qualification'
}

function openReviewDialog(row: any, passed: boolean) {
  reviewTarget.value = row
  reviewPassed.value = passed
  reviewFormData.remark = ''
  reviewDialogVisible.value = true
}

async function confirmReview() {
  if (!reviewTarget.value) return
  if (!reviewPassed.value && !reviewFormData.remark.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  reviewSubmitting.value = true
  try {
    const qualificationId = reviewTarget.value.qualificationId || String(reviewTarget.value.id)
    await reviewQualification(qualificationId, {
      passed: reviewPassed.value,
      remark: reviewFormData.remark,
    })
    reviewDialogVisible.value = false
    reviewResultData.passed = reviewPassed.value
    reviewResultData.name = reviewTarget.value.name
    reviewResultData.qualificationType = reviewTarget.value.qualificationType
    reviewResultData.remark = reviewFormData.remark
    reviewResultVisible.value = true
    await fetchData()
  } catch (error: any) {
    ElMessage.error(error?.message || '审核操作失败')
  } finally {
    reviewSubmitting.value = false
  }
}

function handleSwitchToBatch() {
  activeTab.value = 'batch'
  if (selectedIds.value.length > 0) {
    batchSelectedIds.value = [...selectedIds.value]
  }
}

const batchTableRef = ref<any>(null)
const batchSearchKeyword = ref('')
const batchSelectedIds = ref<(string | number)[]>([])
const batchOperationType = ref<'level' | 'promoteStatus' | 'settleStatus'>('level')
const batchTargetLevel = ref('')
const batchTargetPromoteStatus = ref<number | undefined>()
const batchTargetSettleStatus = ref<number | undefined>()
const batchRemark = ref('')
const batchPreviewVisible = ref(false)
const batchSubmitting = ref(false)
const selectAllLowPerformance = ref(false)
const batchResultVisible = ref(false)
const batchResult = ref<BatchUpdateResult | null>(null)

const filteredBatchList = computed(() => {
  const kw = batchSearchKeyword.value.trim().toLowerCase()
  if (!kw) return dataList.value
  return dataList.value.filter((p) => {
    const row = p as any
    return (
      (row.name && row.name.toLowerCase().includes(kw)) ||
      (row.phone && row.phone.includes(kw))
    )
  })
})

const canPreviewBatch = computed(() => {
  if (batchOperationType.value === 'level') return !!batchTargetLevel.value
  if (batchOperationType.value === 'promoteStatus') return batchTargetPromoteStatus.value !== undefined
  if (batchOperationType.value === 'settleStatus') return batchTargetSettleStatus.value !== undefined
  return false
})

const batchPreview = reactive({ total: 0, toProcess: 0, skipped: 0 })
const batchPreviewDetails = ref<any[]>([])

function isLowPerformance(row: any): boolean {
  const orders = row.totalOrders || 0
  const amount = row.totalAmount || 0
  return orders < 10 || amount < 5000
}

function handleBatchSelectionChange(selection: any[]) {
  batchSelectedIds.value = selection.map((item) => item.id)
}

watch(selectAllLowPerformance, (val) => {
  if (!val || !batchTableRef.value) return
  const lowPerfRows = filteredBatchList.value.filter((r) => isLowPerformance(r as any))
  if (batchTableRef.value?.tableRef) {
    lowPerfRows.forEach((row) => {
      batchTableRef.value.tableRef.toggleRowSelection(row, true)
    })
  }
})

function showBatchPreview() {
  batchPreview.total = batchSelectedIds.value.length
  batchPreview.toProcess = 0
  batchPreview.skipped = 0
  batchPreviewDetails.value = []

  batchSelectedIds.value.forEach((id) => {
    const row = dataList.value.find((r) => (r as any).id === id) as any
    if (!row) return
    if (isLowPerformance(row)) {
      batchPreview.skipped++
      batchPreviewDetails.value.push({
        id: row.id,
        name: row.name,
        status: 'skipped',
        reason: `低绩效（订单${row.totalOrders || 0}单/¥${formatMoney(row.totalAmount || 0)}）`,
      })
    } else {
      batchPreview.toProcess++
      batchPreviewDetails.value.push({
        id: row.id,
        name: row.name,
        status: 'process',
        reason: getBatchPreviewReason(),
      })
    }
  })
  batchPreviewVisible.value = true
}

function getBatchPreviewReason(): string {
  if (batchOperationType.value === 'level') {
    const target = PROMOTER_LEVEL_MAP[Number(batchTargetLevel.value)]?.label || batchTargetLevel.value
    return `等级调整为 ${target}`
  }
  if (batchOperationType.value === 'promoteStatus') {
    const target = PROMOTE_STATUS_MAP[batchTargetPromoteStatus.value ?? 1]?.label
    return `推广状态变更为 ${target}`
  }
  if (batchOperationType.value === 'settleStatus') {
    const target = SETTLE_STATUS_MAP[batchTargetSettleStatus.value ?? 1]?.label
    return `结算状态变更为 ${target}`
  }
  return '执行批量操作'
}

async function executeBatchOperation() {
  if (batchSelectedIds.value.length === 0) return
  const idsToProcess = batchSelectedIds.value.filter((id) => {
    const row = dataList.value.find((r) => (r as any).id === id) as any
    return row && !isLowPerformance(row)
  }) as string[]
  if (idsToProcess.length === 0) {
    ElMessage.warning('没有可执行批量操作的有效推客')
    return
  }
  batchSubmitting.value = true
  try {
    let res: BatchUpdateResult
    if (batchOperationType.value === 'level') {
      res = await batchUpdateLevel(idsToProcess, batchTargetLevel.value)
    } else if (batchOperationType.value === 'promoteStatus') {
      res = await batchUpdatePromoteStatus(idsToProcess, batchTargetPromoteStatus.value ?? 1, batchRemark.value)
    } else {
      res = await batchUpdateSettleStatus(idsToProcess, batchTargetSettleStatus.value ?? 1, batchRemark.value)
    }
    batchPreviewVisible.value = false
    batchResult.value = res
    batchResultVisible.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || '批量操作失败')
  } finally {
    batchSubmitting.value = false
  }
}

function handleBatchResultConfirm() {
  batchResultVisible.value = false
  batchResult.value = null
  clearSelection()
  batchSelectedIds.value = []
  if (batchTableRef.value?.tableRef) {
    batchTableRef.value.tableRef.clearSelection()
  }
  fetchData()
}

const traceSearchPhone = ref('')
const traceSearchIdCard = ref('')
const tracePromoterOptions = ref<any[]>([])
const selectedTracePromoterId = ref<string>('')
const selectedTracePromoter = ref<any>(null)
const traceLogs = ref<ChangeLogItem[]>([])
const traceLogsLoading = ref(false)
const traceLogsTotal = ref(0)
const tracePagination = reactive({ page: 1, pageSize: 10 })
const changeDiffVisible = ref(false)
const currentChangeDiff = ref<any>(null)

function handleSwitchToTrace(row: any) {
  activeTab.value = 'trace'
  tracePromoterOptions.value = [row]
  selectedTracePromoterId.value = String(row.id)
  selectedTracePromoter.value = row
  tracePagination.page = 1
  fetchTraceLogs()
}

async function handleTraceSearch() {
  if (!traceSearchPhone.value && !traceSearchIdCard.value) {
    ElMessage.warning('请输入手机号或身份证号进行搜索')
    return
  }
  try {
    const params: any = {
      page: 1,
      pageSize: 50,
    }
    if (traceSearchPhone.value) params.phone = traceSearchPhone.value
    if (traceSearchIdCard.value) params.keyword = traceSearchIdCard.value
    const res = await getPromoterList(params as any)
    tracePromoterOptions.value = res.list
    if (res.list.length === 0) {
      ElMessage.warning('未找到匹配的推客')
      selectedTracePromoter.value = null
      selectedTracePromoterId.value = ''
      traceLogs.value = []
      traceLogsTotal.value = 0
      return
    }
    if (res.list.length === 1) {
      selectedTracePromoterId.value = String((res.list[0] as any).id)
      selectedTracePromoter.value = res.list[0]
      tracePagination.page = 1
      fetchTraceLogs()
    }
  } catch (error: any) {
    ElMessage.error('搜索失败')
  }
}

async function handleTracePromoterChange(id: string) {
  const promoter = tracePromoterOptions.value.find((p) => String(p.id) === id)
  if (promoter) {
    selectedTracePromoter.value = promoter
    tracePagination.page = 1
    fetchTraceLogs()
  }
}

async function fetchTraceLogs() {
  if (!selectedTracePromoter.value) return
  traceLogsLoading.value = true
  try {
    const res = await getChangeLogs(String(selectedTracePromoter.value.id), {
      page: tracePagination.page,
      pageSize: tracePagination.pageSize,
    })
    traceLogs.value = res.list
    traceLogsTotal.value = res.total
  } catch (error: any) {
    ElMessage.error('获取变更日志失败')
  } finally {
    traceLogsLoading.value = false
  }
}

function getChangeTypeLabel(type: string): string {
  const opt = CHANGE_TYPE_OPTIONS.find((o: any) => o.value === type)
  return opt ? (opt as any).label : type
}

async function showChangeDiff(log: ChangeLogItem) {
  if (!selectedTracePromoter.value) return
  try {
    const res = await getChangeDiff(String(selectedTracePromoter.value.id), log.id)
    currentChangeDiff.value = res
    changeDiffVisible.value = true
  } catch (error: any) {
    ElMessage.error('获取变更详情失败')
  }
}

onMounted(async () => {
  await fetchChannelOptions()
  await fetchLevelConfigs()
})
</script>

<style scoped lang="scss">
.promoter-manage-page {
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

  .search-form {
    margin-bottom: 0;

    :deep(.el-form-item) {
      margin-bottom: 12px;
      margin-right: 0;
    }
  }

  .table-toolbar {
    display: flex;
    gap: 12px;
  }

  .edit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 16px;

    .edit-promoter-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .promoter-meta {
      .promoter-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .promoter-sub {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }

    .edit-actions {
      display: flex;
      gap: 8px;
    }
  }

  .section-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .edit-form {
    .form-item-with-icon {
      position: relative;
      width: 100%;

      .valid-icon {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;

        &.success {
          color: var(--el-color-success);
        }

        &.error {
          color: var(--el-color-danger);
        }
      }
    }

    .field-error {
      font-size: 12px;
      color: var(--el-color-danger);
      margin-top: 4px;
    }

    .form-tip {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      margin-top: 4px;
    }
  }

  .level-config-card {
    margin-top: 16px;
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #ecf5ff 100%);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);

    .level-config-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;

      .level-icon {
        font-size: 20px;
        color: var(--el-color-warning);
      }

      .level-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .config-item {
      background: #fff;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 12px;

      .config-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 4px;
      }

      .config-value {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        &.highlight {
          color: var(--el-color-primary);
          font-size: 18px;
        }
      }
    }
  }

  .qualification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .qualification-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
      }
    }
  }

  .batch-section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .batch-search-bar {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .batch-operation-card {
    padding: 16px;
    background: #fafbfc;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);

    .batch-options {
      margin-top: 16px;

      .option-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-bottom: 6px;
      }
    }
  }

  .batch-preview-card {
    margin-top: 16px;
    padding: 16px;
    background: #ecf5ff;
    border-radius: 8px;
    border: 1px solid var(--el-color-primary-light-5);

    .preview-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-color-primary);
      margin-bottom: 12px;
    }

    .preview-stats {
      margin-bottom: 12px;

      .preview-stat {
        text-align: center;
        padding: 10px;
        border-radius: 6px;
        background: #fff;

        &-value {
          font-size: 22px;
          font-weight: 700;
          line-height: 1.2;
        }

        &-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-top: 4px;
        }

        &.total .preview-stat-value {
          color: var(--el-color-primary);
        }

        &.process .preview-stat-value {
          color: var(--el-color-success);
        }

        &.skipped .preview-stat-value {
          color: var(--el-color-warning);
        }
      }
    }

    .preview-list-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }
  }

  .trace-search-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    .trace-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
      }
    }
  }

  .trace-promoter-info {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 6px;

    .trace-promoter-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .trace-promoter-sub {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }

  .text-warning {
    color: var(--el-color-warning);
    font-weight: 500;
  }

  .text-danger {
    color: var(--el-color-danger);
    font-weight: 600;
  }

  .review-result-detail {
    width: 100%;
  }

  .effective-permissions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .diff-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .diff-card {
    display: flex;
    align-items: stretch;
    gap: 12px;

    .diff-side {
      flex: 1;
      padding: 16px;
      border-radius: 8px;
      background: #f5f7fa;

      &-title {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;

        .el-icon {
          font-size: 14px;
        }
      }

      &-content {
        font-size: 15px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        padding: 8px;
        background: #fff;
        border-radius: 4px;
        min-height: 40px;
        word-break: break-all;
      }

      &--old {
        .diff-side-content {
          border-left: 3px solid var(--el-color-danger);
        }
      }

      &--new {
        .diff-side-content {
          border-left: 3px solid var(--el-color-success);
        }
      }
    }

    .diff-arrow {
      display: flex;
      align-items: center;
      font-size: 20px;
      color: var(--el-color-primary);
    }
  }

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

:global(.zoom-fade-dialog) {
  :deep(.el-dialog) {
    animation: zoomFadeIn 0.3s ease;
  }
}

@keyframes zoomFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

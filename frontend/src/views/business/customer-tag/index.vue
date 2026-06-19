<template>
  <div class="ccb-customer-tag">
    <CcbPageHeader
      title="客户等级标签管理"
      description="客户等级标签适配、前置校验、合规拦截与变更管理"
      icon="PriceTag"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="客户编号" prop="customerNo">
        <el-input v-model="searchForm.customerNo" placeholder="请输入客户编号" clearable />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="客户等级" prop="customerLevel">
        <el-select v-model="searchForm.customerLevel" placeholder="请选择客户等级" clearable>
          <el-option v-for="(t, k) in customerLevelOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签类型" prop="tagType">
        <el-select v-model="searchForm.tagType" placeholder="请选择标签类型" clearable>
          <el-option v-for="(t, k) in tagTypeOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签来源" prop="tagSource">
        <el-select v-model="searchForm.tagSource" placeholder="请选择标签来源" clearable>
          <el-option v-for="(t, k) in tagSourceOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签状态" prop="tagStatus">
        <el-select v-model="searchForm.tagStatus" placeholder="请选择标签状态" clearable>
          <el-option v-for="(t, k) in tagStatusOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="数据就绪" prop="dataReady">
        <el-select v-model="searchForm.dataReady" placeholder="请选择" clearable>
          <el-option label="全部就绪" :value="1" />
          <el-option label="部分就绪" :value="2" />
          <el-option label="未就绪" :value="3" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <CcbPermissionButton permission="customer:tag:create">
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增标签
          </el-button>
        </CcbPermissionButton>
        <CcbPermissionButton permission="customer:tag:precheck">
          <el-button type="warning" :icon="CircleCheck" @click="handleBatchPrecheck">
            批量前置校验
          </el-button>
        </CcbPermissionButton>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">标签总数：</el-text>
        <el-text type="primary" size="large" bold>{{ total }}</el-text>
        <el-divider direction="vertical" />
        <el-tag type="success" effect="plain">有效 {{ stats.valid }}</el-tag>
        <el-tag type="warning" effect="plain">待生效 {{ stats.pending }}</el-tag>
        <el-tag type="danger" effect="plain">违规拦截 {{ stats.violation }}</el-tag>
      </div>
    </div>

    <div v-if="listLoading" class="skeleton-wrapper">
      <el-skeleton :rows="8" animated :throttle="200">
        <template #template>
          <el-skeleton-table :rows="8" :columns="10" animated />
        </template>
      </el-skeleton>
    </div>

    <el-table
      v-else
      v-loading="listLoading"
      :data="tableData"
      :stripe="true"
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="45" />
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="customerNo" label="客户编号" width="140" />
      <el-table-column prop="customerName" label="客户姓名" width="120" show-overflow-tooltip />
      <el-table-column prop="customerLevel" label="客户等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getCustomerLevelTagType(row.customerLevel)" effect="light" size="small">
            {{ customerLevelOptions[row.customerLevel] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="tagCode" label="标签编码" width="140" />
      <el-table-column prop="tagName" label="标签名称" width="130" show-overflow-tooltip />
      <el-table-column prop="tagType" label="标签类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTagTypeTagType(row.tagType)" effect="light" size="small">
            {{ tagTypeOptions[row.tagType] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="tagSource" label="标签来源" width="100">
        <template #default="{ row }">
          <el-tag effect="plain" size="small">
            {{ tagSourceOptions[row.tagSource] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="数据状态" width="140">
        <template #default="{ row }">
          <div class="verify-status-group">
            <el-tooltip content="资产数据" placement="top">
              <el-icon :class="['verify-icon', getDataStatusClass(row.assetDataStatus)]">
                <CircleCheckFilled v-if="row.assetDataStatus === 1" />
                <CircleCloseFilled v-else-if="row.assetDataStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
            <el-tooltip content="交易数据" placement="top">
              <el-icon :class="['verify-icon', getDataStatusClass(row.transactionDataStatus)]">
                <CircleCheckFilled v-if="row.transactionDataStatus === 1" />
                <CircleCloseFilled v-else-if="row.transactionDataStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
            <el-tooltip content="留存数据" placement="top">
              <el-icon :class="['verify-icon', getDataStatusClass(row.retentionDataStatus)]">
                <CircleCheckFilled v-if="row.retentionDataStatus === 1" />
                <CircleCloseFilled v-else-if="row.retentionDataStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
            <el-tooltip content="风控数据" placement="top">
              <el-icon :class="['verify-icon', getDataStatusClass(row.riskDataStatus)]">
                <CircleCheckFilled v-if="row.riskDataStatus === 1" />
                <CircleCloseFilled v-else-if="row.riskDataStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="tagStatus" label="标签状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getTagStatusTagType(row.tagStatus)" effect="light" size="small">
            {{ tagStatusOptions[row.tagStatus] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="warning" link size="small" @click="handleAdjust(row)">
            调整
          </el-button>
          <el-button type="danger" link size="small" @click="handleRemove(row)">
            移除
          </el-button>
          <el-button type="success" link size="small" @click="handleViewLogs(row)">
            日志
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageParams.page"
        v-model:page-size="pageParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog
      v-model="precheckDialogVisible"
      title="前置校验"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="precheckLoading" class="form-skeleton">
        <el-skeleton :rows="6" animated />
      </div>
      <div v-else>
        <el-form
          ref="precheckFormRef"
          :model="precheckForm"
          :rules="precheckRules"
          label-width="130px"
          class="precheck-form"
        >
          <el-divider content-position="left">基础数据更新状态</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="客户ID" prop="customer_id">
                <el-input
                  v-model="precheckForm.customer_id"
                  placeholder="请输入客户ID"
                  :class="{ 'shake-error': shakeField === 'customer_id' }"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标签编码" prop="tag_code">
                <el-input
                  v-model="precheckForm.tag_code"
                  placeholder="请输入标签编码"
                  :class="{ 'shake-error': shakeField === 'tag_code' }"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">合规性校验</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="标签名称" prop="tag_name">
                <el-input
                  v-model="precheckForm.tag_name"
                  placeholder="请输入标签名称"
                  :class="{ 'shake-error': shakeField === 'tag_name' }"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div v-if="precheckResult" class="precheck-result">
          <el-alert
            v-if="precheckResult.blocked"
            :title="precheckResult.block_reason || '存在严重校验错误，已被拦截'"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 12px"
          />
          <el-alert
            v-else-if="precheckResult.passed"
            title="前置校验通过"
            type="success"
            :closable="false"
            show-icon
            style="margin-bottom: 12px"
          />

          <el-descriptions :column="2" border size="small" style="margin-bottom: 12px">
            <el-descriptions-item label="资产数据">
              <el-tag :type="precheckResult.asset_data_ready ? 'success' : 'danger'" effect="dark" size="small">
                {{ precheckResult.asset_data_ready ? '已更新' : '未更新' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="交易数据">
              <el-tag :type="precheckResult.transaction_data_ready ? 'success' : 'danger'" effect="dark" size="small">
                {{ precheckResult.transaction_data_ready ? '已更新' : '未更新' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="留存数据">
              <el-tag :type="precheckResult.retention_data_ready ? 'success' : 'danger'" effect="dark" size="small">
                {{ precheckResult.retention_data_ready ? '已更新' : '未更新' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="风控数据">
              <el-tag :type="precheckResult.risk_data_ready ? 'success' : 'danger'" effect="dark" size="small">
                {{ precheckResult.risk_data_ready ? '已更新' : '未更新' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="标签合规性">
              <el-tag :type="precheckResult.tag_compliance_valid ? 'success' : 'danger'" effect="dark" size="small">
                {{ precheckResult.tag_compliance_valid ? '合规' : '不合规' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="客户群体匹配">
              <el-tag :type="precheckResult.tag_customer_group_match ? 'success' : 'warning'" effect="dark" size="small">
                {{ precheckResult.tag_customer_group_match ? '匹配' : '不匹配' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-alert
            v-for="(err, idx) in precheckResult.errors"
            :key="'err-' + idx"
            :title="err.message"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
          <el-alert
            v-for="(warn, idx) in precheckResult.warnings"
            :key="'warn-' + idx"
            :title="warn"
            type="warning"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="precheckDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="precheckSubmitting" @click="handleDoPrecheck">
          执行校验
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑客户标签' : '新增客户标签'"
      width="1100px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="formLoading" class="form-skeleton">
        <el-skeleton :rows="10" animated />
      </div>
      <el-row :gutter="20">
        <el-col :span="14">
          <el-form
            ref="tagFormRef"
            :model="tagForm"
            :rules="formRules"
            label-width="100px"
            class="tag-form"
          >
            <el-divider content-position="left">基本信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="客户ID" prop="customer_id">
                  <el-input
                    v-model="tagForm.customer_id"
                    placeholder="请输入客户ID"
                    :class="{ 'shake-error': shakeField === 'customer_id' }"
                    @blur="triggerFieldShake('customer_id')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="标签编码" prop="tag_code">
                  <el-input
                    v-model="tagForm.tag_code"
                    placeholder="请输入标签编码"
                    :class="{ 'shake-error': shakeField === 'tag_code' }"
                    @blur="triggerFieldShake('tag_code')"
                    @change="triggerAdapt"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="标签名称" prop="tag_name">
                  <el-input
                    v-model="tagForm.tag_name"
                    placeholder="请输入标签名称"
                    :class="{ 'shake-error': shakeField === 'tag_name' }"
                    @blur="triggerFieldShake('tag_name')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="标签类型" prop="tag_type">
                  <el-select v-model="tagForm.tag_type" placeholder="请选择标签类型" style="width: 100%" @change="triggerAdapt">
                    <el-option
                      v-for="(t, k) in tagTypeOptions"
                      :key="k"
                      :label="t"
                      :value="Number(k)"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="标签来源" prop="tag_source">
                  <el-select v-model="tagForm.tag_source" placeholder="请选择标签来源" style="width: 100%">
                    <el-option
                      v-for="(t, k) in tagSourceOptions"
                      :key="k"
                      :label="t"
                      :value="Number(k)"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">有效期设置</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="生效时间" prop="effective_time">
                  <el-date-picker
                    v-model="tagForm.effective_time"
                    type="datetime"
                    placeholder="选择生效时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="失效时间" prop="expire_time">
                  <el-date-picker
                    v-model="tagForm.expire_time"
                    type="datetime"
                    placeholder="选择失效时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="备注" prop="remark">
                  <el-input
                    v-model="tagForm.remark"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入备注信息"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <div v-if="precheckResult && (precheckResult.errors.length > 0 || precheckResult.warnings.length > 0)" style="margin-top: 12px">
              <el-divider content-position="left">前置校验结果</el-divider>
              <div class="precheck-result">
                <el-alert
                  v-if="precheckResult.blocked"
                  :title="precheckResult.block_reason || '存在严重校验错误，已被拦截'"
                  type="error"
                  :closable="false"
                  show-icon
                  style="margin-bottom: 12px"
                />
                <el-alert
                  v-for="(err, idx) in precheckResult.errors"
                  :key="'form-err-' + idx"
                  :title="err.message"
                  type="error"
                  :closable="false"
                  show-icon
                  style="margin-bottom: 8px"
                />
                <el-alert
                  v-for="(warn, idx) in precheckResult.warnings"
                  :key="'form-warn-' + idx"
                  :title="warn"
                  type="warning"
                  :closable="false"
                  show-icon
                  style="margin-bottom: 8px"
                />
              </div>
            </div>
          </el-form>
        </el-col>
        <el-col :span="10">
          <div class="adapt-preview-panel">
            <div class="panel-title">
              <el-icon><View /></el-icon>
              <span>实时预览面板</span>
            </div>
            <div v-if="adaptResult" class="panel-content">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="标签编码">
                  <el-tag effect="dark" size="small">{{ adaptResult.tag_code }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="标签名称">
                  {{ adaptResult.tag_name }}
                </el-descriptions-item>
                <el-descriptions-item label="标签类型">
                  <el-tag :type="getTagTypeTagType(adaptResult.tag_type)" effect="light" size="small">
                    {{ tagTypeOptions[adaptResult.tag_type] || '未知' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="客户等级">
                  <el-tag :type="getCustomerLevelTagType(adaptResult.customer_level)" effect="dark" size="large">
                    {{ adaptResult.customer_level_text }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <div class="preview-section">
                <div class="section-title">联动服务权限</div>
                <div class="tag-group">
                  <el-tag
                    v-for="perm in adaptResult.service_permissions"
                    :key="perm"
                    type="primary"
                    effect="plain"
                    size="small"
                    style="margin-right: 4px; margin-bottom: 4px"
                  >
                    {{ perm }}
                  </el-tag>
                </div>
              </div>

              <div class="preview-section">
                <div class="section-title">费率优惠</div>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item
                    v-for="fee in adaptResult.fee_discounts"
                    :key="fee.code"
                    :label="fee.name"
                  >
                    <el-text type="success" size="large">{{ (fee.discount * 100).toFixed(0) }}%</el-text>
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <div class="preview-section">
                <div class="section-title">营销适配规则</div>
                <div class="adapt-rules">
                  <div v-for="rule in adaptResult.marketing_rules" :key="rule.code" class="rule-item">
                    <el-icon color="#e6a23c"><Promotion /></el-icon>
                    <span>{{ rule.name }}：{{ rule.description }}</span>
                  </div>
                </div>
              </div>

              <div class="preview-section">
                <div class="section-title">适配规则</div>
                <div class="adapt-rules">
                  <div v-for="rule in adaptResult.adapt_rules" :key="rule" class="rule-item">
                    <el-icon color="#67c23a"><Check /></el-icon>
                    <span>{{ rule }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="panel-empty">
              <el-empty description="请填写标签信息以预览适配结果" :image-size="80" />
            </div>
          </div>
        </el-col>
      </el-row>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '更新标签' : '提交标签' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="adjustDialogVisible"
      title="标签调整"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="adjustFormRef"
        :model="adjustForm"
        :rules="adjustRules"
        label-width="100px"
      >
        <el-form-item label="客户ID">
          <el-text>{{ currentTag?.customerId }}</el-text>
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-text>{{ currentTag?.customerName }}</el-text>
        </el-form-item>
        <el-form-item label="当前标签">
          <el-tag effect="dark">{{ currentTag?.tagCode }} - {{ currentTag?.tagName }}</el-tag>
        </el-form-item>
        <el-form-item label="当前等级">
          <el-tag :type="getCustomerLevelTagType(currentTag?.customerLevel)" effect="dark">
            {{ customerLevelOptions[currentTag?.customerLevel] || '未知' }}
          </el-tag>
        </el-form-item>
        <el-divider content-position="left">调整至</el-divider>
        <el-form-item label="新标签编码" prop="new_tag_code">
          <el-input
            v-model="adjustForm.new_tag_code"
            placeholder="请输入新标签编码"
            :class="{ 'shake-error': shakeField === 'new_tag_code' }"
          />
        </el-form-item>
        <el-form-item label="新标签名称" prop="new_tag_name">
          <el-input
            v-model="adjustForm.new_tag_name"
            placeholder="请输入新标签名称"
            :class="{ 'shake-error': shakeField === 'new_tag_name' }"
          />
        </el-form-item>
        <el-form-item label="标签类型" prop="tag_type">
          <el-select v-model="adjustForm.tag_type" placeholder="请选择标签类型" style="width: 100%">
            <el-option
              v-for="(t, k) in tagTypeOptions"
              :key="k"
              :label="t"
              :value="Number(k)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因" prop="change_remark">
          <el-input
            v-model="adjustForm.change_remark"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitAdjust">
          确认调整
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logsDialogVisible" title="标签变更日志" width="800px" destroy-on-close>
      <el-timeline>
        <el-timeline-item
          v-for="log in tagLogs"
          :key="log.id"
          :timestamp="log.operateTime"
          :type="getLogTimelineType(log.changeType)"
          :hollow="log.isViolation === 1"
        >
          <el-card shadow="never" class="log-card">
            <div class="log-header">
              <el-tag :type="getLogTagType(log.changeType)" effect="light">
                {{ log.changeTypeName }}
              </el-tag>
              <div class="log-tags">
                <el-tag v-if="log.isUnauthorized === 1" type="danger" effect="dark" size="small" style="margin-left: 6px">
                  未授权
                </el-tag>
                <el-tag v-if="log.isViolation === 1" type="danger" effect="dark" size="small" style="margin-left: 6px">
                  <el-icon><WarningFilled /></el-icon>
                  违规拦截
                </el-tag>
              </div>
              <span class="log-operator">
                {{ log.operatorName || '系统' }}
                <span v-if="log.operatorOrgName">@{{ log.operatorOrgName }}</span>
              </span>
            </div>
            <div v-if="log.changeRemark" class="log-remark">{{ log.changeRemark }}</div>
            <div v-if="log.blockReason" class="log-block-reason">
              <el-icon color="#f56c6c"><WarningFilled /></el-icon>
              拦截原因：{{ log.blockReason }}
            </div>
            <div v-if="log.beforeContent || log.afterContent" class="log-detail">
              <el-text v-if="log.beforeContent" type="info" size="small">变更前：{{ log.beforeContent }}</el-text>
              <el-text v-if="log.afterContent" type="success" size="small">变更后：{{ log.afterContent }}</el-text>
            </div>
            <div v-if="log.reviewerName" class="log-review-info">
              <el-icon color="#e6a23c"><Stamp /></el-icon>
              复核人：{{ log.reviewerName }}，复核时间：{{ log.reviewTime }}
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  CircleCheck,
  CircleCheckFilled,
  CircleCloseFilled,
  QuestionFilled,
  Check,
  Stamp,
  View,
  Promotion,
  WarningFilled
} from '@element-plus/icons-vue'
import {
  preCheckCustomerTagApi,
  adaptCustomerTagApi,
  getCustomerTagListApi,
  getCustomerTagDetailApi,
  createCustomerTagApi,
  updateCustomerTagApi,
  adjustCustomerTagApi,
  removeCustomerTagApi,
  getCustomerTagLogsApi
} from '@api/business'

const listLoading = ref(false)
const formLoading = ref(false)
const submitLoading = ref(false)
const precheckLoading = ref(false)
const precheckSubmitting = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedRows = ref([])
const shakeField = ref('')

const customerLevelOptions = { 1: '普通', 2: '银卡', 3: '金卡', 4: '白金', 5: '钻石' }
const tagTypeOptions = { 1: '等级标签', 2: '服务标签', 3: '营销标签', 4: '风控标签', 5: '特殊标签' }
const tagSourceOptions = { 1: '手动调整', 2: '系统自动', 3: '批量赋值', 4: '规则触发' }
const tagStatusOptions = { 1: '有效', 2: '失效', 3: '待生效', 4: '已移除' }

const searchForm = reactive({
  customerNo: '',
  customerName: '',
  customerLevel: null,
  tagType: null,
  tagSource: null,
  tagStatus: null,
  dataReady: null
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const stats = computed(() => {
  const result = { valid: 0, pending: 0, violation: 0 }
  tableData.value.forEach(row => {
    if (row.tagStatus === 1) result.valid++
    if (row.tagStatus === 3) result.pending++
    if (!row.allDataReady) result.violation++
  })
  return result
})

const formDialogVisible = ref(false)
const precheckDialogVisible = ref(false)
const logsDialogVisible = ref(false)
const adjustDialogVisible = ref(false)
const isEdit = ref(false)
const currentTag = ref(null)
const tagLogs = ref([])
const precheckResult = ref(null)
const adaptResult = ref(null)

const tagFormRef = ref()
const precheckFormRef = ref()
const adjustFormRef = ref()

const tagForm = reactive({
  id: undefined,
  customer_id: '',
  tag_code: '',
  tag_name: '',
  tag_type: 1,
  tag_source: 1,
  effective_time: '',
  expire_time: '',
  remark: '',
  skip_precheck: false
})

const precheckForm = reactive({
  customer_id: '',
  tag_code: '',
  tag_name: ''
})

const adjustForm = reactive({
  customer_id: '',
  old_tag_code: '',
  new_tag_code: '',
  new_tag_name: '',
  tag_type: undefined,
  change_remark: ''
})

const precheckRules = {
  customer_id: [{ required: true, message: '请输入客户ID', trigger: 'blur' }],
  tag_code: [{ required: true, message: '请输入标签编码', trigger: 'blur' }],
  tag_name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
}

const formRules = {
  customer_id: [{ required: true, message: '请输入客户ID', trigger: 'blur' }],
  tag_code: [{ required: true, message: '请输入标签编码', trigger: 'blur' }],
  tag_name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  tag_type: [{ required: true, message: '请选择标签类型', trigger: 'change' }]
}

const adjustRules = {
  new_tag_code: [{ required: true, message: '请输入新标签编码', trigger: 'blur' }],
  new_tag_name: [{ required: true, message: '请输入新标签名称', trigger: 'blur' }],
  change_remark: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

const transformKeys = (obj) => {
  const result = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result
}

const fetchData = async () => {
  listLoading.value = true
  try {
    const params = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      customer_no: searchForm.customerNo || undefined,
      customer_name: searchForm.customerName || undefined,
      customer_level: searchForm.customerLevel ?? undefined,
      tag_type: searchForm.tagType ?? undefined,
      tag_source: searchForm.tagSource ?? undefined,
      tag_status: searchForm.tagStatus ?? undefined,
      data_ready: searchForm.dataReady ?? undefined
    }
    const res = await getCustomerTagListApi(params)
    tableData.value = res.data.list.map(item => transformKeys(item))
    total.value = res.data.total
  } catch (_e) {
  } finally {
    listLoading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.customerNo = ''
  searchForm.customerName = ''
  searchForm.customerLevel = null
  searchForm.tagType = null
  searchForm.tagSource = null
  searchForm.tagStatus = null
  searchForm.dataReady = null
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const handleAdd = () => {
  isEdit.value = false
  currentTag.value = null
  resetTagForm()
  precheckResult.value = null
  adaptResult.value = null
  formDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentTag.value = row
  formLoading.value = true
  formDialogVisible.value = true
  precheckResult.value = null
  adaptResult.value = null
  setTimeout(async () => {
    try {
      const res = await getCustomerTagDetailApi(row.id)
      const data = res.data
      Object.assign(tagForm, {
        id: data.id,
        customer_id: data.customer_id,
        tag_code: data.tag_code,
        tag_name: data.tag_name,
        tag_type: data.tag_type || 1,
        tag_source: data.tag_source || 1,
        effective_time: data.effective_time || '',
        expire_time: data.expire_time || '',
        remark: data.remark || ''
      })
      if (data.service_permission_list || data.fee_discount_list || data.marketing_rule_list) {
        adaptResult.value = {
          tag_code: data.tag_code,
          tag_name: data.tag_name,
          tag_type: data.tag_type,
          customer_level: data.customer_level,
          customer_level_text: customerLevelOptions[data.customer_level] || '未知',
          service_permissions: data.service_permission_list || [],
          fee_discounts: data.fee_discount_list || [],
          marketing_rules: data.marketing_rule_list || [],
          adapt_factors: { asset_amount: 0, transaction_count: 0, retention_days: 0, risk_level: 0 },
          adapt_rules: [`当前标签：${data.tag_code} - ${data.tag_name}`]
        }
      }
    } catch (_e) {
    } finally {
      formLoading.value = false
    }
  }, 300)
}

const handleAdjust = (row) => {
  currentTag.value = row
  adjustForm.customer_id = row.customerId
  adjustForm.old_tag_code = row.tagCode
  adjustForm.new_tag_code = ''
  adjustForm.new_tag_name = ''
  adjustForm.tag_type = undefined
  adjustForm.change_remark = ''
  adjustDialogVisible.value = true
}

const handleRemove = (row) => {
  ElMessageBox.confirm(
    `确认移除标签「${row.tagName}」？此操作不可撤销。`,
    '移除确认',
    {
      confirmButtonText: '确认移除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await removeCustomerTagApi(row.id)
      ElMessage.success('标签移除成功')
      fetchData()
    } catch (_e) {
    }
  }).catch(() => {})
}

const handleBatchPrecheck = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择需要校验的标签')
    return
  }
  Object.assign(precheckForm, {
    customer_id: '',
    tag_code: '',
    tag_name: ''
  })
  precheckResult.value = null
  precheckDialogVisible.value = true
}

const handleDoPrecheck = async () => {
  if (!precheckFormRef.value) return
  try {
    await precheckFormRef.value.validate()
  } catch (_e) {
    ElMessage.warning('请完善校验信息')
    return
  }

  precheckSubmitting.value = true
  try {
    const res = await preCheckCustomerTagApi({ ...precheckForm })
    precheckResult.value = res.data
    for (const err of res.data.errors) {
      triggerShake(err.field)
    }
    if (res.data.blocked) {
      ElMessage.error(res.data.block_reason || '前置校验拦截')
    } else if (res.data.passed) {
      ElMessage.success('前置校验通过')
    }
  } catch (_e) {
  } finally {
    precheckSubmitting.value = false
  }
}

const handleViewLogs = async (row) => {
  currentTag.value = row
  try {
    const res = await getCustomerTagLogsApi(row.id)
    tagLogs.value = res.data.map(item => transformKeys(item))
    logsDialogVisible.value = true
  } catch (_e) {
    ElMessage.error('获取日志失败')
  }
}

const resetTagForm = () => {
  tagForm.id = undefined
  tagForm.customer_id = ''
  tagForm.tag_code = ''
  tagForm.tag_name = ''
  tagForm.tag_type = 1
  tagForm.tag_source = 1
  tagForm.effective_time = ''
  tagForm.expire_time = ''
  tagForm.remark = ''
  tagForm.skip_precheck = false
  tagFormRef.value?.resetFields()
}

const triggerShake = (field) => {
  shakeField.value = field
  setTimeout(() => {
    shakeField.value = ''
  }, 600)
}

const triggerFieldShake = (field) => {
  shakeField.value = field
  setTimeout(() => {
    shakeField.value = ''
  }, 600)
}

const triggerAdapt = async () => {
  if (!tagForm.tag_code) return
  try {
    const res = await adaptCustomerTagApi({
      tag_code: tagForm.tag_code,
      asset_amount: 0,
      transaction_count: 0,
      retention_days: 0,
      risk_level: 0
    })
    adaptResult.value = res.data
  } catch (_e) {
    adaptResult.value = buildLocalAdaptResult(tagForm.tag_code, tagForm.tag_name, tagForm.tag_type)
  }
}

const buildLocalAdaptResult = (tagCode, tagName, tagType) => {
  const levelMap = {
    'NORMAL': { level: 1, text: '普通', permissions: ['基础查询', '基础结算'], discounts: [{ code: 'base', name: '基础费率', discount: 1.0 }], rules: [{ code: 'base', name: '基础营销', description: '普通客户基础营销活动' }] },
    'SILVER': { level: 2, text: '银卡', permissions: ['基础查询', '基础结算', '优惠理财', '优先叫号'], discounts: [{ code: 'silver_transfer', name: '转账手续费', discount: 0.8 }, { code: 'silver_mgmt', name: '理财管理费', discount: 0.9 }], rules: [{ code: 'silver_promo', name: '银卡专属', description: '银卡客户专属优惠活动' }] },
    'GOLD': { level: 3, text: '金卡', permissions: ['基础查询', '基础结算', '优惠理财', '优先叫号', '专属客服', '贵宾通道'], discounts: [{ code: 'gold_transfer', name: '转账手续费', discount: 0.5 }, { code: 'gold_mgmt', name: '理财管理费', discount: 0.7 }, { code: 'gold_loan', name: '贷款利率', discount: 0.95 }], rules: [{ code: 'gold_promo', name: '金卡专属', description: '金卡客户专属高端活动' }, { code: 'gold_birthday', name: '生日权益', description: '金卡客户生日专属权益' }] },
    'PLATINUM': { level: 4, text: '白金', permissions: ['基础查询', '基础结算', '优惠理财', '优先叫号', '专属客服', '贵宾通道', '机场贵宾厅', '全球医疗'], discounts: [{ code: 'platinum_transfer', name: '转账手续费', discount: 0 }, { code: 'platinum_mgmt', name: '理财管理费', discount: 0.5 }, { code: 'platinum_loan', name: '贷款利率', discount: 0.9 }, { code: 'platinum_fx', name: '外汇优惠', discount: 0.85 }], rules: [{ code: 'platinum_promo', name: '白金专属', description: '白金客户顶级专属活动' }, { code: 'platinum_travel', name: '出行权益', description: '白金客户出行尊享服务' }, { code: 'platinum_health', name: '健康权益', description: '白金客户健康体检权益' }] },
    'DIAMOND': { level: 5, text: '钻石', permissions: ['基础查询', '基础结算', '优惠理财', '优先叫号', '专属客服', '贵宾通道', '机场贵宾厅', '全球医疗', '私行服务', '家族信托'], discounts: [{ code: 'diamond_transfer', name: '转账手续费', discount: 0 }, { code: 'diamond_mgmt', name: '理财管理费', discount: 0 }, { code: 'diamond_loan', name: '贷款利率', discount: 0.85 }, { code: 'diamond_fx', name: '外汇优惠', discount: 0.8 }, { code: 'diamond_insurance', name: '保险费率', discount: 0.9 }], rules: [{ code: 'diamond_promo', name: '钻石专属', description: '钻石客户至尊专属活动' }, { code: 'diamond_private', name: '私行权益', description: '钻石客户私人银行专属服务' }, { code: 'diamond_family', name: '家族权益', description: '钻石客户家族传承专属方案' }, { code: 'diamond_global', name: '全球权益', description: '钻石客户全球尊享服务' }] }
  }
  const config = levelMap[tagCode] || levelMap['NORMAL']
  return {
    tag_code: tagCode,
    tag_name: tagName || config.text + '标签',
    tag_type: tagType || 1,
    customer_level: config.level,
    customer_level_text: config.text,
    service_permissions: config.permissions,
    fee_discounts: config.discounts,
    marketing_rules: config.rules,
    adapt_factors: { asset_amount: 0, transaction_count: 0, retention_days: 0, risk_level: 0 },
    adapt_rules: [`当前等级：${config.text}`, `标签编码：${tagCode}`]
  }
}

const handleSubmit = async () => {
  if (!tagFormRef.value) return
  try {
    await tagFormRef.value.validate()
  } catch (_e) {
    ElMessage.warning('请完善必填项')
    return
  }

  if (!isEdit.value) {
    submitLoading.value = true
    try {
      const res = await preCheckCustomerTagApi({ ...tagForm })
      precheckResult.value = res.data
      for (const err of res.data.errors) {
        triggerShake(err.field)
      }
      if (res.data.blocked) {
        ElMessage.error(res.data.block_reason || '前置校验拦截，无法新增标签')
        submitLoading.value = false
        return
      }
      if (res.data.errors.length > 0) {
        ElMessageBox.confirm(
          `存在${res.data.errors.length}项校验错误，是否强制提交？`,
          '校验警告',
          {
            confirmButtonText: '强制提交',
            cancelButtonText: '返回修改',
            type: 'warning'
          }
        )
          .then(async () => {
            tagForm.skip_precheck = true
            await doSubmit()
          })
          .catch(() => {
            submitLoading.value = false
          })
        return
      }
    } catch (_e) {
      submitLoading.value = false
      return
    }
  }

  await doSubmit()
}

const doSubmit = async () => {
  submitLoading.value = true
  try {
    if (isEdit.value && tagForm.id) {
      await updateCustomerTagApi(tagForm.id, tagForm)
      ElMessage.success('标签更新成功')
    } else {
      await createCustomerTagApi(tagForm)
      ElMessage.success('标签新增成功')
    }
    formDialogVisible.value = false
    fetchData()
  } catch (_e) {
  } finally {
    submitLoading.value = false
  }
}

const handleSubmitAdjust = async () => {
  if (!adjustFormRef.value) return
  try {
    await adjustFormRef.value.validate()
  } catch (_e) {
    ElMessage.warning('请完善调整信息')
    return
  }
  submitLoading.value = true
  try {
    await adjustCustomerTagApi({
      customer_id: adjustForm.customer_id,
      old_tag_code: adjustForm.old_tag_code,
      new_tag_code: adjustForm.new_tag_code,
      new_tag_name: adjustForm.new_tag_name,
      tag_type: adjustForm.tag_type,
      change_remark: adjustForm.change_remark
    })
    ElMessage.success('标签调整成功')
    adjustDialogVisible.value = false
    fetchData()
  } catch (_e) {
  } finally {
    submitLoading.value = false
  }
}

const getCustomerLevelTagType = (level) => {
  const map = { 1: 'info', 2: '', 3: 'warning', 4: '', 5: 'danger' }
  return map[level] || 'info'
}

const getTagTypeTagType = (type) => {
  const map = { 1: 'warning', 2: 'primary', 3: 'success', 4: 'danger', 5: 'info' }
  return map[type] || 'info'
}

const getTagStatusTagType = (status) => {
  const map = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger' }
  return map[status] || 'info'
}

const getDataStatusClass = (status) => {
  if (status === 1) return 'status-pass'
  if (status === 2) return 'status-fail'
  return 'status-unknown'
}

const getLogTimelineType = (changeType) => {
  const map = {
    '1': 'primary', '2': 'warning', '3': 'success', '4': 'info',
    '5': 'danger', '6': 'warning', '7': 'success'
  }
  return map[changeType] || 'primary'
}

const getLogTagType = (changeType) => {
  const map = {
    '1': 'primary', '2': 'warning', '3': 'success', '4': 'info',
    '5': 'danger', '6': '', '7': 'success'
  }
  return map[changeType] || ''
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-customer-tag {
  .skeleton-wrapper {
    padding: 20px;
    background: #fff;
    border-radius: 4px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
  }

  .verify-status-group {
    display: flex;
    gap: 6px;

    .verify-icon {
      font-size: 16px;

      &.status-pass {
        color: #67c23a;
      }
      &.status-fail {
        color: #f56c6c;
      }
      &.status-unknown {
        color: #c0c4cc;
      }
    }
  }

  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag-form,
  .precheck-form {
    :deep(.el-form-item) {
      margin-bottom: 14px;
    }
  }

  .shake-error {
    animation: shakeError 0.5s;

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      border-color: #f56c6c !important;
      box-shadow: 0 0 0 1px #f56c6c inset !important;
      background-color: #fef0f0 !important;
    }
  }

  .adapt-preview-panel {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background: #fafafa;
    min-height: 400px;

    .panel-title {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      border-bottom: 1px solid #e4e7ed;
      background: #f5f7fa;
      border-radius: 4px 4px 0 0;
    }

    .panel-content {
      padding: 12px 16px;

      .preview-section {
        margin-top: 12px;

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: #606266;
          margin-bottom: 8px;
          padding-left: 8px;
          border-left: 3px solid #409eff;
        }

        .adapt-rules {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .rule-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #606266;
          }
        }
      }
    }

    .panel-empty {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }
  }

  .precheck-result {
    margin-bottom: 10px;
  }

  .log-card {
    border: none;
    padding: 8px 0;

    :deep(.el-card__body) {
      padding: 12px;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .log-tags {
        display: flex;
        align-items: center;
      }

      .log-operator {
        font-size: 12px;
        color: #909399;
      }
    }

    .log-remark {
      font-size: 13px;
      color: #606266;
      margin-bottom: 6px;
    }

    .log-block-reason {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #f56c6c;
      padding: 6px;
      background: #fef0f0;
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .log-detail {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 6px;
    }

    .log-review-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #e6a23c;
      padding: 6px;
      background: #fdf6ec;
      border-radius: 4px;
    }
  }

  .form-skeleton {
    padding: 20px 0;
  }
}

@keyframes shakeError {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
</style>

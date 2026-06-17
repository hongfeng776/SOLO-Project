<template>
  <div class="page-container">
    <div class="pro-table goods-manage">
      <div class="search-section">
        <el-form
          ref="searchFormRef"
          :model="searchForm"
          :inline="true"
          label-width="auto"
          @submit.prevent="handleSearch"
        >
          <el-form-item label="商品名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入商品名称"
              clearable
            />
          </el-form-item>
          <el-form-item label="商品分类">
            <el-tree-select
              v-model="searchForm.categoryId"
              :data="categoryTree"
              :props="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="请选择分类"
              clearable
              check-strictly
            />
          </el-form-item>
          <el-form-item label="商家等级">
            <el-select
              v-model="searchForm.merchantLevel"
              placeholder="请选择商家等级"
              clearable
            >
              <el-option
                v-for="(item, key) in MerchantLevelMap"
                :key="key"
                :label="item.label"
                :value="Number(key)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="合规评级">
            <el-select
              v-model="searchForm.complianceLevel"
              placeholder="请选择合规评级"
              clearable
            >
              <el-option
                v-for="(item, key) in ComplianceLevelMap"
                :key="key"
                :label="item.label"
                :value="Number(key)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="商品状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
            >
              <el-option label="全部" value="" />
              <el-option label="上架" :value="1" />
              <el-option label="下架" :value="0" />
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
            <el-icon><Plus /></el-icon>新增
          </el-button>
          <el-button
            v-if="batchAbility.canOffline"
            type="warning"
            :disabled="!selectedRows.length"
            @click="handleBatchOffline"
          >
            <el-icon><Bottom /></el-icon>批量下架
          </el-button>
          <el-button
            v-if="batchAbility.canTop"
            type="success"
            :disabled="!selectedRows.length"
            @click="handleBatchTop"
          >
            <el-icon><Top /></el-icon>批量置顶
          </el-button>
          <el-button
            v-if="batchAbility.canEdit"
            :disabled="!selectedRows.length"
            @click="openBatchEditDialog"
          >
            <el-icon><Edit /></el-icon>批量编辑
          </el-button>
          <el-button
            v-if="batchAbility.canDelete"
            type="danger"
            :disabled="!selectedRows.length"
            @click="handleBatchDelete"
          >
            <el-icon><Delete /></el-icon>批量删除
          </el-button>
        </div>
      </div>

      <div v-if="selectedRows.length" class="batch-actions">
        <span class="batch-info">已选择 {{ selectedRows.length }} 项</span>
        <el-button link type="primary" @click="handleClearSelection">取消选择</el-button>
      </div>

      <el-table
        ref="tableRef"
        :data="tableData"
        :loading="loading"
        v-loading="loading"
        stripe
        :row-class-name="rowClassNameHandler"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ (pagination.currentPage - 1) * pagination.pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="商品图片" width="80" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.coverImage"
              :src="row.coverImage"
              :preview-src-list="[row.coverImage]"
              fit="cover"
              style="width: 48px; height: 48px; border-radius: 4px;"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="220">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.name && row.name.length > 20"
              :content="row.name"
              placement="top"
            >
              <span>{{ row.name.slice(0, 20) }}...</span>
            </el-tooltip>
            <span v-else>{{ row.name }}</span>
            <div v-if="row.nameDuplicate" class="mt-2">
              <el-tag size="small" type="danger" effect="light">名称疑似重复</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sku" label="SKU编码" width="140">
          <template #default="{ row }">
            <span>{{ row.sku || '-' }}</span>
            <el-tag
              v-if="row.skuDuplicate"
              size="small"
              type="danger"
              effect="light"
              class="ml-2"
            >编码重复</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="所属分类" width="120">
          <template #default="{ row }">
            <span>{{ row.categoryName || '-' }}</span>
            <el-tag
              v-if="row.brandCategoryDuplicate"
              size="small"
              type="warning"
              effect="light"
              class="ml-2"
            >品牌类目组合重复</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="merchantName" label="所属商家" width="140">
          <template #default="{ row }">
            <span>{{ row.merchantName || '-' }}</span>
            <el-tag
              v-if="row.merchantLevel"
              size="small"
              :type="MerchantLevelMap[row.merchantLevel]?.type"
              effect="plain"
              class="ml-2"
            >{{ MerchantLevelMap[row.merchantLevel]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价" width="100" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" align="center" />
        <el-table-column prop="sales" label="销量" width="80" align="center" />
        <el-table-column prop="complianceLevel" label="合规评级" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.complianceLevel"
              :type="ComplianceLevelMap[row.complianceLevel]?.type"
            >
              {{ ComplianceLevelMap[row.complianceLevel]?.label }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="isTop" label="置顶" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isTop" type="danger" effect="plain">置顶</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="GoodsStatusMap[row.status]?.type">
              {{ GoodsStatusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="260"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="handleTrace(row)">溯源</el-button>
            <el-button link type="warning" @click="handleRepeatCheck(row)">重复检查</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-icon class="empty-icon"><DataLine /></el-icon>
        <div class="empty-text">暂无数据</div>
      </div>

      <div v-if="showPagination && total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="goodsDialogVisible"
      :title="dialogTitle"
      width="720px"
      :close-on-click-modal="false"
      draggable
      class="form-dialog goods-edit-dialog"
    >
      <el-tabs v-model="dialogActiveTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="goodsFormRef"
            :model="goodsForm"
            :rules="formRules"
            label-width="100px"
            label-position="right"
            :error-class="formErrorClass"
            @validate="handleFormValidate"
          >
            <el-form-item
              v-for="item in formItems"
              :key="item.prop"
              :label="renderFieldLabel(item)"
              :prop="item.prop"
            >
              <template v-if="!isFieldEditable(item.prop)">
                <div class="readonly-field-wrapper">
                  <el-input
                    v-model="goodsForm[item.prop]"
                    disabled
                    :placeholder="`${item.label}（不可编辑）`"
                  />
                  <el-tooltip
                    v-if="getReadonlyReason(item.prop)"
                    :content="getReadonlyReason(item.prop)"
                    placement="top"
                  >
                    <span class="field-readonly-tag">
                      <el-icon><Lock /></el-icon>
                      不可编辑
                    </span>
                  </el-tooltip>
                </div>
              </template>
              <template v-else-if="formDisabled">
                <el-input
                  v-if="item.type === 'input' || !item.type"
                  v-model="goodsForm[item.prop]"
                  :placeholder="item.placeholder || `请输入${item.label}`"
                  disabled
                />
                <el-input
                  v-else-if="item.type === 'textarea'"
                  v-model="goodsForm[item.prop]"
                  type="textarea"
                  :rows="item.rows || 4"
                  disabled
                />
                <el-input-number
                  v-else-if="item.type === 'number'"
                  v-model="goodsForm[item.prop]"
                  :min="item.min ?? 0"
                  :precision="item.precision"
                  style="width: 100%"
                  disabled
                />
                <el-select
                  v-else-if="item.type === 'select'"
                  v-model="goodsForm[item.prop]"
                  disabled
                >
                  <el-option
                    v-for="opt in item.options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </template>
              <template v-else>
                <el-input
                  v-if="item.type === 'input' || !item.type"
                  v-model="goodsForm[item.prop]"
                  :placeholder="item.placeholder || `请输入${item.label}`"
                  clearable
                  @blur="handleFieldBlur(item.prop)"
                />
                <el-input
                  v-else-if="item.type === 'textarea'"
                  v-model="goodsForm[item.prop]"
                  type="textarea"
                  :rows="item.rows || 4"
                  :placeholder="item.placeholder || `请输入${item.label}`"
                  clearable
                />
                <el-input-number
                  v-else-if="item.type === 'number'"
                  v-model="goodsForm[item.prop]"
                  :min="item.min ?? 0"
                  :max="item.max"
                  :step="item.step ?? 1"
                  :precision="item.precision"
                  style="width: 100%"
                />
                <el-select
                  v-else-if="item.type === 'select'"
                  v-model="goodsForm[item.prop]"
                  :placeholder="item.placeholder || `请选择${item.label}`"
                  clearable
                  @change="handleSelectChange(item.prop, $event)"
                >
                  <el-option
                    v-for="opt in item.options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
                <el-radio-group
                  v-else-if="item.type === 'radio'"
                  v-model="goodsForm[item.prop]"
                >
                  <el-radio v-for="opt in item.options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </el-radio>
                </el-radio-group>
                <el-upload
                  v-else-if="item.type === 'upload'"
                  v-model:file-list="goodsForm[item.prop]"
                  :action="'/api/upload'"
                  :headers="uploadHeaders"
                  list-type="picture-card"
                  :limit="item.limit || 1"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
              </template>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane v-if="dialogMode === 'edit'" label="编辑日志" name="logs">
          <div class="timeline-section" v-loading="editLogsLoading">
            <el-timeline v-if="editLogs.length">
              <el-timeline-item
                v-for="log in editLogs"
                :key="log.id"
                :timestamp="log.operateTime"
                placement="top"
              >
                <el-card shadow="hover">
                  <h4>{{ log.field }} 变更</h4>
                  <p>
                    <span class="text-muted">原值：</span>
                    <span class="old-value">{{ log.oldValue || '-' }}</span>
                    <el-icon class="mx-2"><ArrowRight /></el-icon>
                    <span class="text-muted">新值：</span>
                    <span class="new-value text-primary">{{ log.newValue || '-' }}</span>
                  </p>
                  <p class="text-muted mt-2">
                    <el-icon><User /></el-icon>操作人：{{ log.operator }}
                    <span v-if="log.remark" class="ml-4">备注：{{ log.remark }}</span>
                  </p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <div v-else class="empty-state py-10">
              <el-icon class="empty-icon"><Document /></el-icon>
              <div class="empty-text">暂无编辑日志</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="goodsDialogVisible = false">取消</el-button>
        <el-button
          v-if="!isView"
          type="primary"
          :loading="submitting"
          :disabled="submitDisabled"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      title="商品溯源"
      width="800px"
      :close-on-click-modal="false"
      class="trace-dialog"
    >
      <div v-loading="traceLoading">
        <el-tabs v-model="traceActiveTab">
          <el-tab-pane label="商家入驻信息" name="merchant">
            <el-descriptions :column="2" border v-if="traceData.merchant">
              <el-descriptions-item label="商家ID">{{ traceData.merchant.id }}</el-descriptions-item>
              <el-descriptions-item label="商家名称">{{ traceData.merchant.name }}</el-descriptions-item>
              <el-descriptions-item label="商家状态">
                <el-tag :type="MerchantStatusMap[traceData.merchant.status]?.type">
                  {{ MerchantStatusMap[traceData.merchant.status]?.label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="营业执照号">{{ traceData.merchant.licenseNo }}</el-descriptions-item>
              <el-descriptions-item label="入驻时间" :span="2">
                {{ traceData.merchant.registerTime }}
              </el-descriptions-item>
            </el-descriptions>
            <h4 class="mt-4 mb-2">资质文件</h4>
            <el-table
              v-if="traceData.merchant?.qualificationList?.length"
              :data="traceData.merchant.qualificationList"
              border
              size="small"
            >
              <el-table-column prop="name" label="资质名称" />
              <el-table-column prop="no" label="资质编号" />
              <el-table-column prop="expireDate" label="到期日期" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                    {{ row.status === 1 ? '有效' : '已过期' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="类目备案数据" name="category">
            <el-descriptions :column="2" border v-if="traceData.category">
              <el-descriptions-item label="类目ID">{{ traceData.category.id }}</el-descriptions-item>
              <el-descriptions-item label="类目名称">{{ traceData.category.name }}</el-descriptions-item>
              <el-descriptions-item label="父级类目ID">{{ traceData.category.parentId }}</el-descriptions-item>
              <el-descriptions-item label="备案时间">{{ traceData.category.recordTime }}</el-descriptions-item>
            </el-descriptions>
            <h4 class="mt-4 mb-2">类目属性</h4>
            <el-descriptions
              v-if="traceData.category?.attributes?.length"
              :column="2"
              border
              size="small"
            >
              <el-descriptions-item
                v-for="attr in traceData.category.attributes"
                :key="attr.name"
                :label="attr.name"
              >
                {{ attr.value }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="编辑日志时间线" name="editLogs">
            <div class="timeline-section">
              <el-timeline v-if="traceData.editLogs?.length">
                <el-timeline-item
                  v-for="log in traceData.editLogs"
                  :key="log.id"
                  :timestamp="log.operateTime"
                  placement="top"
                  type="primary"
                >
                  <p><strong>{{ log.field }}</strong> 变更</p>
                  <p class="text-sm text-muted">
                    {{ log.oldValue }} → {{ log.newValue }} | 操作人：{{ log.operator }}
                  </p>
                </el-timeline-item>
              </el-timeline>
              <div v-else class="empty-state py-10">
                <div class="empty-text">暂无编辑记录</div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="审核记录" name="auditRecords">
            <el-table
              v-if="traceData.auditRecords?.length"
              :data="traceData.auditRecords"
              border
              size="small"
            >
              <el-table-column prop="auditor" label="审核人" width="120" />
              <el-table-column prop="auditResult" label="审核结果" width="120">
                <template #default="{ row }">
                  <el-tag
                    :type="row.auditResult === '通过' ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ row.auditResult }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="auditTime" label="审核时间" width="180" />
              <el-table-column prop="remark" label="备注" />
            </el-table>
            <div v-else class="empty-state py-10">
              <div class="empty-text">暂无审核记录</div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button type="primary" @click="traceDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="repeatDialogVisible"
      title="重复校验与风险检查"
      width="640px"
      :close-on-click-modal="false"
    >
      <div v-loading="repeatCheckLoading">
        <h4 class="mb-3">
          <el-icon class="text-warning mr-2"><Warning /></el-icon>一致性检查
        </h4>
        <div v-if="consistencyResult?.issues?.length">
          <el-alert
            v-for="(issue, idx) in consistencyResult.issues"
            :key="idx"
            :title="issue.message"
            :type="issue.level"
            :description="issue.detail"
            show-icon
            class="mb-2"
          />
        </div>
        <el-alert
          v-else-if="consistencyResult?.consistent"
          title="一致性检查通过，未发现问题"
          type="success"
          show-icon
        />

        <h4 class="mt-5 mb-3">
          <el-icon class="text-danger mr-2"><CopyDocument /></el-icon>疑似重复商品推荐
        </h4>
        <el-table
          v-if="repeatSuggestions?.length"
          :data="repeatSuggestions"
          border
          size="small"
        >
          <el-table-column prop="name" label="商品名称" />
          <el-table-column label="相似度" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.similarity >= 90 ? 'danger' : row.similarity >= 70 ? 'warning' : 'info'"
                size="small"
              >
                {{ row.similarity }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="匹配字段" min-width="150">
            <template #default="{ row }">
              <el-tag
                v-for="field in row.matchFields"
                :key="field"
                size="small"
                class="mr-1 mb-1"
                type="info"
                effect="plain"
              >
                {{ field }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="empty-state py-10">
          <div class="empty-text">未发现疑似重复商品</div>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="repeatDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchEditDialogVisible"
      title="批量编辑"
      width="560px"
      :close-on-click-modal="false"
      class="batch-edit-dialog"
    >
      <div class="mb-3 text-muted">
        已选择 {{ selectedRows.length }} 件商品，请勾选要修改的字段并填写新值：
      </div>
      <div class="field-check-group">
        <el-checkbox v-model="batchEditFields.categoryId" label="categoryId">商品分类</el-checkbox>
        <el-checkbox v-model="batchEditFields.price" label="price">售价</el-checkbox>
        <el-checkbox v-model="batchEditFields.originalPrice" label="originalPrice">原价</el-checkbox>
        <el-checkbox v-model="batchEditFields.stock" label="stock">库存</el-checkbox>
        <el-checkbox v-model="batchEditFields.status" label="status">商品状态</el-checkbox>
        <el-checkbox v-model="batchEditFields.description" label="description">商品描述</el-checkbox>
      </div>
      <el-form :model="batchEditForm" label-width="100px">
        <el-form-item v-if="batchEditFields.categoryId" label="商品分类">
          <el-select v-model="batchEditForm.categoryId" placeholder="请选择分类" clearable>
            <el-option label="数码电器" :value="1" />
            <el-option label="服装鞋帽" :value="2" />
            <el-option label="食品生鲜" :value="3" />
            <el-option label="美妆个护" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="batchEditFields.price" label="售价">
          <el-input-number v-model="batchEditForm.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="batchEditFields.originalPrice" label="原价">
          <el-input-number v-model="batchEditForm.originalPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="batchEditFields.stock" label="库存">
          <el-input-number v-model="batchEditForm.stock" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="batchEditFields.status" label="商品状态">
          <el-radio-group v-model="batchEditForm.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="batchEditFields.description" label="商品描述">
          <el-input
            v-model="batchEditForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchEditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchEditSubmitting" @click="handleBatchEdit">
          确定修改
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="offlineDialogVisible"
      title="批量下架"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="offlineForm" label-width="80px">
        <el-form-item label="下架原因">
          <el-input
            v-model="offlineForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入下架原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="offlineDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="offlineSubmitting" @click="confirmBatchOffline">
          确认下架
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  ElLoading,
  type FormInstance,
  type FormRules
} from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Edit,
  Bottom,
  Top,
  Lock,
  User,
  ArrowRight,
  Document,
  Warning,
  CopyDocument,
  DataLine
} from '@element-plus/icons-vue'
import { formatAmount } from '@/utils/amount'
import { formatDateTime } from '@/utils/date'
import { getToken } from '@/utils/auth'
import {
  GoodsStatusMap,
  MerchantStatusMap,
  MerchantLevelMap,
  ComplianceLevelMap,
  type EditFieldConfig,
  type GoodsEditLog,
  type GoodsFullTrace,
  type BatchAbility,
  type ConsistencyResult,
  type RepeatSuggestion,
  type CategoryTreeNode,
  type GoodsRequiredField
} from '@/types/business'
import { deleteGoods, batchDeleteGoods, type Goods } from '@/api/goods'
import {
  validateGoodsCreate,
  getCategoryRequiredFields,
  checkSkuUniqueness,
  checkBrandCategoryCombo,
  type ValidateCreateParams
} from '@/api/goodsValidate'
import {
  getEditFieldConfig,
  executeGoodsEdit,
  getGoodsEditLogs
} from '@/api/goodsEditor'
import {
  advancedQueryGoods,
  batchOfflineGoods,
  batchTopGoods,
  batchUpdateGoods,
  getBatchAbility,
  type AdvancedQueryParams,
  type BatchUpdateData
} from '@/api/goodsBatch'
import {
  getGoodsFullTrace,
  checkConsistency,
  getRepeatSuggestions
} from '@/api/goodsTrace'

const tableRef = ref()
const searchFormRef = ref<FormInstance>()
const goodsFormRef = ref<FormInstance>()
const loading = ref(false)
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])

const searchForm = reactive<Record<string, any>>({
  name: '',
  categoryId: '',
  merchantLevel: '',
  complianceLevel: '',
  status: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

const total = ref(0)
const showPagination = ref(true)
const formErrorClass = ref('')
const formDisabled = ref(false)
const submitDisabled = ref(false)

const categoryTree = ref<CategoryTreeNode[]>([
  {
    id: 1,
    name: '数码电器',
    children: [
      { id: 101, name: '手机通讯' },
      { id: 102, name: '电脑办公' },
      { id: 103, name: '家用电器' }
    ]
  },
  {
    id: 2,
    name: '服装鞋帽',
    children: [
      { id: 201, name: '男装' },
      { id: 202, name: '女装' },
      { id: 203, name: '鞋靴' }
    ]
  },
  {
    id: 3,
    name: '食品生鲜',
    children: [
      { id: 301, name: '休闲零食' },
      { id: 302, name: '水果生鲜' },
      { id: 303, name: '粮油调味' }
    ]
  },
  {
    id: 4,
    name: '美妆个护',
    children: [
      { id: 401, name: '护肤' },
      { id: 402, name: '彩妆' },
      { id: 403, name: '个人护理' }
    ]
  }
])

const batchAbility = reactive<BatchAbility>({
  canEdit: true,
  canOffline: true,
  canTop: true,
  canDelete: true,
  reason: ''
})

const goodsDialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const dialogActiveTab = ref('basic')
const currentRow = ref<any>({})
const submitting = ref(false)
const editLogsLoading = ref(false)
const editLogs = ref<GoodsEditLog[]>([])
const editFieldConfigs = ref<EditFieldConfig[]>([])
const categoryRequiredFields = ref<GoodsRequiredField[]>([])

const dialogTitle = computed(() => {
  const map: Record<string, string> = { add: '新增商品', edit: '编辑商品', view: '查看商品' }
  return map[dialogMode.value]
})

const isView = computed(() => dialogMode.value === 'view')

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

interface FormItemOption {
  label: string
  value: string | number
}

interface FormItem {
  prop: string
  label: string
  type?: 'input' | 'textarea' | 'number' | 'select' | 'radio' | 'upload'
  placeholder?: string
  options?: FormItemOption[]
  min?: number
  max?: number
  step?: number
  precision?: number
  rows?: number
  limit?: number
  inputType?: string
}

const baseFormItems: FormItem[] = [
  { prop: 'name', label: '商品名称' },
  { prop: 'sku', label: 'SKU编码' },
  {
    prop: 'categoryId',
    label: '商品分类',
    type: 'select',
    options: [
      { label: '数码电器', value: 1 },
      { label: '服装鞋帽', value: 2 },
      { label: '食品生鲜', value: 3 },
      { label: '美妆个护', value: 4 }
    ]
  },
  {
    prop: 'brandId',
    label: '商品品牌',
    type: 'select',
    options: [
      { label: '品牌A', value: 1 },
      { label: '品牌B', value: 2 },
      { label: '品牌C', value: 3 }
    ]
  },
  {
    prop: 'merchantId',
    label: '所属商家',
    type: 'select',
    options: [
      { label: '自营旗舰店', value: 1 },
      { label: '官方旗舰店', value: 2 }
    ]
  },
  { prop: 'price', label: '售价', type: 'number', min: 0, precision: 2 },
  { prop: 'originalPrice', label: '原价', type: 'number', min: 0, precision: 2 },
  { prop: 'stock', label: '库存', type: 'number', min: 0, precision: 0 },
  { prop: 'coverImage', label: '商品图片', type: 'upload' },
  {
    prop: 'status',
    label: '商品状态',
    type: 'radio',
    options: [
      { label: '上架', value: 1 },
      { label: '下架', value: 0 }
    ]
  },
  { prop: 'description', label: '商品描述', type: 'textarea', rows: 4 }
]

const formItems = ref<FormItem[]>([...baseFormItems])
const goodsForm = reactive<Record<string, any>>({})
const baseFormRules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入售价', trigger: 'blur' }]
}
const formRules = ref<FormRules>({ ...baseFormRules })

const traceDialogVisible = ref(false)
const traceActiveTab = ref('merchant')
const traceLoading = ref(false)
const traceData = reactive<Partial<GoodsFullTrace>>({
  merchant: undefined,
  category: undefined,
  editLogs: [],
  auditRecords: []
})

const repeatDialogVisible = ref(false)
const repeatCheckLoading = ref(false)
const consistencyResult = ref<ConsistencyResult | null>(null)
const repeatSuggestions = ref<RepeatSuggestion[]>([])

const batchEditDialogVisible = ref(false)
const batchEditSubmitting = ref(false)
const batchEditFields = reactive<Record<string, boolean>>({
  categoryId: false,
  price: false,
  originalPrice: false,
  stock: false,
  status: false,
  description: false
})
const batchEditForm = reactive<Record<string, any>>({})

const offlineDialogVisible = ref(false)
const offlineSubmitting = ref(false)
const offlineForm = reactive({ reason: '' })

const rowClassNameHandler = () => {
  return 'goods-row-hover'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: AdvancedQueryParams = {
      ...searchForm,
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize
    } as AdvancedQueryParams
    const res = await advancedQueryGoods(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const refreshCurrentPage = async () => {
  await fetchData()
}

const handleSearch = () => {
  pagination.currentPage = 1
  fetchData()
}

const handleReset = () => {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = ''
  })
  pagination.currentPage = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = async (rows: any[]) => {
  selectedRows.value = rows
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id as number)
    try {
      const res = await getBatchAbility(ids)
      Object.assign(batchAbility, res.data)
    } catch {
    }
  } else {
    Object.assign(batchAbility, {
      canEdit: true,
      canOffline: true,
      canTop: true,
      canDelete: true,
      reason: ''
    })
  }
}

const handleClearSelection = () => {
  tableRef.value?.clearSelection()
}

const renderFieldLabel = (item: FormItem) => {
  const field = categoryRequiredFields.value.find((f) => f.field === item.prop)
  return item.label + (field?.required ? ' *' : '')
}

const isFieldEditable = (field: string): boolean => {
  if (dialogMode.value !== 'edit') return true
  const config = editFieldConfigs.value.find((c) => c.field === field)
  return config ? config.editable : true
}

const getReadonlyReason = (field: string): string | undefined => {
  const config = editFieldConfigs.value.find((c) => c.field === field)
  return config?.readonlyReason
}

const initGoodsForm = () => {
  formItems.value.forEach((item) => {
    if (currentRow.value && currentRow.value[item.prop] !== undefined) {
      goodsForm[item.prop] = currentRow.value[item.prop]
    } else {
      switch (item.type) {
        case 'number':
          goodsForm[item.prop] = 0
          break
        case 'upload':
          goodsForm[item.prop] = []
          break
        default:
          goodsForm[item.prop] = ''
      }
    }
  })
}

const buildDynamicFormRules = () => {
  const rules: FormRules = { ...baseFormRules }
  categoryRequiredFields.value.forEach((field) => {
    if (field.required && field.rules?.length) {
      rules[field.field] = field.rules
    }
  })
  formRules.value = rules
}

const handleAdd = async () => {
  const validateParams: ValidateCreateParams = {
    merchantId: 1,
    categoryId: 1
  }

  try {
    const validateRes = await validateGoodsCreate(validateParams)
    if (!validateRes.data.valid) {
      const errorList = validateRes.data.errors
        .map((e) => `• ${e.message}`)
        .join('\n')

      await ElMessageBox.alert(
        `新增商品前置校验未通过：\n\n${errorList}`,
        '校验异常',
        {
          confirmButtonText: '我知道了',
          type: 'error',
          dangerouslyUseHTMLString: false
        }
      )

      const hasAuthError = errorList.includes('资质过期') ||
        errorList.includes('权限不足') ||
        errorList.includes('授权')

      if (hasAuthError) {
        submitDisabled.value = true
        formDisabled.value = true
      }
    }
  } catch {
  }

  dialogMode.value = 'add'
  dialogActiveTab.value = 'basic'
  currentRow.value = {}
  editFieldConfigs.value = []
  goodsDialogVisible.value = true
  initGoodsForm()
}

const handleEdit = async (row: Record<string, unknown>) => {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载中...',
    background: 'rgba(0, 0, 0, 0.3)'
  })

  await new Promise((resolve) => setTimeout(resolve, 300))

  try {
    const goodsId = row.id as number

    const [fieldConfigRes, editLogsRes] = await Promise.all([
      getEditFieldConfig(goodsId),
      getGoodsEditLogs(goodsId)
    ])

    editFieldConfigs.value = fieldConfigRes.data
    editLogs.value = editLogsRes.data

    dialogMode.value = 'edit'
    dialogActiveTab.value = 'basic'
    currentRow.value = { ...row }
    goodsDialogVisible.value = true
    initGoodsForm()
    submitDisabled.value = false
    formDisabled.value = false
  } finally {
    loadingInstance.close()
  }
}

const handleDelete = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteGoods(row.id as number)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
  }
}

const handleBatchDelete = async () => {
  if (!selectedRows.value.length) return
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 件商品吗？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    const ids = selectedRows.value.map((row) => row.id as number)
    await batchDeleteGoods(ids)
    ElMessage.success('批量删除成功')
    handleClearSelection()
    fetchData()
  } catch {
  }
}

const handleBatchOffline = () => {
  offlineForm.reason = ''
  offlineDialogVisible.value = true
}

const confirmBatchOffline = async () => {
  if (!offlineForm.reason.trim()) {
    ElMessage.warning('请输入下架原因')
    return
  }
  const ids = selectedRows.value.map((r) => r.id as number)
  offlineSubmitting.value = true
  try {
    const res = await batchOfflineGoods(ids, offlineForm.reason)
    const { successCount, failCount } = res.data
    ElMessage.success(`批量下架完成：成功${successCount}条/失败${failCount}条`)
    offlineDialogVisible.value = false
    handleClearSelection()
    refreshCurrentPage()
  } finally {
    offlineSubmitting.value = false
  }
}

const handleBatchTop = async () => {
  const ids = selectedRows.value.map((r) => r.id as number)
  try {
    const res = await batchTopGoods(ids)
    const { successCount, failCount } = res.data
    ElMessage.success(`批量置顶完成：成功${successCount}条/失败${failCount}条`)
    handleClearSelection()
    refreshCurrentPage()
  } catch {
  }
}

const openBatchEditDialog = () => {
  Object.keys(batchEditFields).forEach((k) => {
    batchEditFields[k] = false
  })
  Object.keys(batchEditForm).forEach((k) => {
    delete batchEditForm[k]
  })
  batchEditDialogVisible.value = true
}

const handleBatchEdit = async () => {
  const selectedFields = Object.keys(batchEditFields).filter((k) => batchEditFields[k])
  if (!selectedFields.length) {
    ElMessage.warning('请至少勾选一个要修改的字段')
    return
  }

  const ids = selectedRows.value.map((r) => r.id as number)
  const updateData: BatchUpdateData = {}
  selectedFields.forEach((f) => {
    if (batchEditForm[f] !== undefined && batchEditForm[f] !== '') {
      ;(updateData as any)[f] = batchEditForm[f]
    }
  })

  if (Object.keys(updateData).length === 0) {
    ElMessage.warning('请填写要修改的值')
    return
  }

  batchEditSubmitting.value = true
  try {
    const res = await batchUpdateGoods(ids, updateData)
    const { successCount, failCount } = res.data
    ElMessage.success(`批量编辑完成：成功${successCount}条/失败${failCount}条`)
    batchEditDialogVisible.value = false
    handleClearSelection()
    refreshCurrentPage()
  } finally {
    batchEditSubmitting.value = false
  }
}

const handleSelectChange = async (prop: string, val: any) => {
  if (prop === 'categoryId' && val) {
    try {
      const res = await getCategoryRequiredFields(val)
      categoryRequiredFields.value = res.data
      buildDynamicFormRules()
    } catch {
    }
  }

  if (prop === 'sku' && val) {
    try {
      const res = await checkSkuUniqueness(val, currentRow.value?.id)
      if (!res.data.unique && res.data.duplicateGoods) {
        ElMessage.warning(
          `SKU编码重复，已被商品"${res.data.duplicateGoods.name}"使用`
        )
      }
    } catch {
    }
  }

  if (prop === 'brandId' || prop === 'categoryId') {
    if (goodsForm.brandId && goodsForm.categoryId && goodsForm.merchantId) {
      try {
        const res = await checkBrandCategoryCombo({
          brandId: goodsForm.brandId,
          categoryId: goodsForm.categoryId,
          merchantId: goodsForm.merchantId
        })
        if (!res.data.authorized) {
          ElMessageBox.alert(
            res.data.message || '该品牌在当前类目下未获得授权',
            '品牌授权提醒',
            { type: 'warning', confirmButtonText: '我知道了' }
          )
        }
      } catch {
      }
    }
  }
}

const handleFieldBlur = async (prop: string) => {
  if (prop === 'sku' && goodsForm.sku) {
    try {
      const res = await checkSkuUniqueness(goodsForm.sku, currentRow.value?.id)
      if (!res.data.unique && res.data.duplicateGoods) {
        ElMessage.warning(
          `SKU编码重复，已被商品"${res.data.duplicateGoods.name}"使用`
        )
      }
    } catch {
    }
  }
}

const handleFormValidate = (_prop: string | string[], isValid: boolean, _message: string) => {
  if (!isValid) {
    formErrorClass.value = 'is-shake'
    nextTick(() => {
      formErrorClass.value = ''
    })
  }
}

const handleSubmit = async () => {
  if (!goodsFormRef.value) return
  try {
    await goodsFormRef.value.validate()
    submitting.value = true

    if (dialogMode.value === 'add') {
      const { createGoods } = await import('@/api/goods')
      await createGoods(goodsForm as Partial<Goods>)
      ElMessage.success('新增成功')
      goodsDialogVisible.value = false
      fetchData()
    } else if (dialogMode.value === 'edit') {
      const goodsId = currentRow.value.id as number
      const res = await executeGoodsEdit(goodsId, goodsForm as Partial<Goods>)

      const updateIndex = tableData.value.findIndex((r) => r.id === goodsId)
      if (updateIndex !== -1) {
        tableData.value[updateIndex] = { ...tableData.value[updateIndex], ...res.data }
      }

      ElMessage.success('编辑成功')
      goodsDialogVisible.value = false
      refreshCurrentPage()
    }
  } catch (err) {
    if ((err as { valid?: boolean }).valid === false) return
    ElMessage.error((err as Error).message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleTrace = async (row: Record<string, unknown>) => {
  traceActiveTab.value = 'merchant'
  traceDialogVisible.value = true
  traceLoading.value = true
  Object.assign(traceData, {
    merchant: undefined,
    category: undefined,
    editLogs: [],
    auditRecords: []
  })

  try {
    const res = await getGoodsFullTrace(row.id as number)
    Object.assign(traceData, res.data)
  } finally {
    traceLoading.value = false
  }
}

const handleRepeatCheck = async (row: Record<string, unknown>) => {
  repeatDialogVisible.value = true
  repeatCheckLoading.value = true
  consistencyResult.value = null
  repeatSuggestions.value = []

  try {
    const [consistencyRes, suggestionsRes] = await Promise.all([
      checkConsistency(row.id as number),
      getRepeatSuggestions(row.id as number)
    ])
    consistencyResult.value = consistencyRes.data
    repeatSuggestions.value = suggestionsRes.data
  } finally {
    repeatCheckLoading.value = false
  }
}

watch(
  () => goodsDialogVisible.value,
  (val) => {
    if (val) {
      nextTick(() => {
        goodsFormRef.value?.clearValidate()
      })
      if (dialogMode.value === 'add') {
        categoryRequiredFields.value = []
        buildDynamicFormRules()
      }
    } else {
      formErrorClass.value = ''
      submitDisabled.value = false
      formDisabled.value = false
    }
  }
)

fetchData()
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.goods-manage {
  background: #fff;
  border-radius: $radius-md;
  padding: $spacing-base;
  box-shadow: $shadow-light;

  .search-section {
    margin-bottom: $spacing-base;
    padding-bottom: $spacing-base;
    border-bottom: 1px solid $border-color-lighter;
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-base;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
    }
  }

  .pagination-wrapper {
    margin-top: $spacing-base;
    display: flex;
    justify-content: flex-end;
  }
}

.readonly-field-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

.goods-edit-dialog {
  :deep(.el-tabs__header) {
    margin-bottom: $spacing-base;
  }
}

.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mt-5 { margin-top: 20px; }
.mt-10 { margin-top: 40px; }
.py-10 { padding-top: 40px; padding-bottom: 40px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.ml-2 { margin-left: 8px; }
.ml-4 { margin-left: 16px; }
.mx-2 { margin-left: 8px; margin-right: 8px; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }
.text-sm { font-size: 12px; }
.text-muted { color: #909399; }
.text-primary { color: $primary-color; }
.text-warning { color: $warning-color; }
.text-danger { color: $danger-color; }
</style>

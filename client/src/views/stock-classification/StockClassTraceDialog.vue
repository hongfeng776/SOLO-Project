<template>
  <FinDialog
    v-model:visible="visible"
    title="分类溯源全周期变更记录"
    width="960px"
    :hide-footer="true"
  >
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else class="trace-container">
      <div class="trace-header">
        <span class="trace-header-name">{{ classInfo?.className || '-' }}</span>
        <span class="trace-header-code">{{ classInfo?.classCode || '-' }}</span>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="建档溯源" name="source">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="建档人">
              {{ sourceInfo?.createdBy || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="建档时间">
              {{ formatDateTime(sourceInfo?.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="分类编码">
              <span class="code-text">{{ classInfo?.classCode || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="分类名称">
              <span
                class="editable-field"
                @dblclick="startEdit('className')"
              >
                <template v-if="editingField === 'className'">
                  <el-input
                    ref="editInputRef"
                    v-model="editValue"
                    size="small"
                    @blur="saveEdit('className')"
                    @keyup.enter="saveEdit('className')"
                  />
                </template>
                <template v-else>
                  {{ classInfo?.className || '-' }}
                  <el-icon size="12" style="margin-left:4px;color:#909399"><Edit /></el-icon>
                </template>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="分类层级">
              {{ STOCK_CLASS_LEVEL_LABELS[classInfo?.classLevel as StockClassLevel] || classInfo?.classLevel || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="上级分类">
              {{ classInfo?.parentName || classInfo?.parentId || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="分类状态">
              <el-tag
                :type="(STOCK_CLASS_STATUS_TAG_TYPES[classInfo?.classStatus as StockClassStatus] as any) || 'info'"
                effect="light"
              >
                {{ STOCK_CLASS_STATUS_LABELS[classInfo?.classStatus as StockClassStatus] || classInfo?.classStatus || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="分类描述" :span="2">
              <span
                class="editable-field"
                @dblclick="startEdit('description')"
              >
                <template v-if="editingField === 'description'">
                  <el-input
                    v-model="editValue"
                    size="small"
                    type="textarea"
                    :rows="2"
                    @blur="saveEdit('description')"
                  />
                </template>
                <template v-else>
                  {{ classInfo?.description || '-' }}
                  <el-icon size="12" style="margin-left:4px;color:#909399"><Edit /></el-icon>
                </template>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="最后修改人">
              {{ sourceInfo?.updatedBy || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后修改时间">
              {{ formatDateTime(sourceInfo?.updatedAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="logs">
          <el-table
            v-if="operationLogs.length > 0"
            :data="operationLogs"
            border
            max-height="400"
          >
            <el-table-column prop="operation" label="操作内容" min-width="180" />
            <el-table-column prop="operationType" label="操作类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="STOCK_CLASS_OP_TYPE_TAG_TYPES[row.operationType as StockClassOperationType] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ STOCK_CLASS_OP_TYPE_LABELS[row.operationType as StockClassOperationType] || row.operationType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="username" label="操作人" width="100" />
            <el-table-column prop="ipAddress" label="IP地址" width="130" />
            <el-table-column prop="remark" label="备注" min-width="160" />
            <el-table-column label="操作时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无操作日志" />
        </el-tab-pane>

        <el-tab-pane label="层级逻辑校验" name="levelCheck">
          <div class="level-check">
            <el-alert
              title="系统自动校验分类层级逻辑合规性"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 16px"
            />
            <el-descriptions :column="1" border>
              <el-descriptions-item label="层级逻辑校验结果">
                <el-tag
                  :type="levelCheck?.passed ? 'success' : 'danger'"
                  effect="light"
                >
                  <el-icon v-if="levelCheck?.passed"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  {{ levelCheck?.passed ? '通过' : '未通过' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div
              v-if="levelCheck && levelCheck.issues && levelCheck.issues.length > 0"
              class="issues-section"
            >
              <h4>层级逻辑问题</h4>
              <el-table :data="levelCheck.issues" border size="small">
                <el-table-column prop="type" label="类型" width="140" />
                <el-table-column prop="severity" label="严重程度" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="message" label="描述" />
              </el-table>
            </div>

            <div
              v-if="classificationCheck"
              class="classification-check-section"
            >
              <h4>归类准确性校验</h4>
              <el-descriptions :column="3" border>
                <el-descriptions-item label="准确性校验">
                  <el-tag :type="classificationCheck.accuracyValid ? 'success' : 'danger'" effect="light">
                    <el-icon v-if="classificationCheck.accuracyValid"><CircleCheck /></el-icon>
                    <el-icon v-else><CircleClose /></el-icon>
                    {{ classificationCheck.accuracyValid ? '通过' : '未通过' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="重复分类">
                  <el-tag :type="classificationCheck.duplicateFound ? 'danger' : 'success'" effect="light">
                    <el-icon v-if="classificationCheck.duplicateFound"><CircleClose /></el-icon>
                    <el-icon v-else><CircleCheck /></el-icon>
                    {{ classificationCheck.duplicateFound ? '存在重复' : '无重复' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="无效分类">
                  <el-tag :type="classificationCheck.invalidFound ? 'danger' : 'success'" effect="light">
                    <el-icon v-if="classificationCheck.invalidFound"><CircleClose /></el-icon>
                    <el-icon v-else><CircleCheck /></el-icon>
                    {{ classificationCheck.invalidFound ? '存在无效' : '无无效' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <div
                v-if="classificationCheck.details && classificationCheck.details.length > 0"
                class="check-details"
              >
                <h4>校验明细</h4>
                <el-table :data="classificationCheck.details" border size="small">
                  <el-table-column prop="field" label="字段" min-width="140" />
                  <el-table-column prop="expected" label="期望值" min-width="140" />
                  <el-table-column prop="actual" label="实际值" min-width="140" />
                  <el-table-column label="校验结果" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.passed ? 'success' : 'danger'" size="small" effect="light">
                        {{ row.passed ? '通过' : '未通过' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="归类准确性核对" name="accuracy">
          <el-table
            v-if="classificationCheck && classificationCheck.details && classificationCheck.details.length > 0"
            :data="classificationCheck.details"
            border
            max-height="400"
          >
            <el-table-column prop="field" label="字段名称" min-width="140" />
            <el-table-column prop="expected" label="期望值" min-width="140" />
            <el-table-column prop="actual" label="实际值" min-width="140" />
            <el-table-column label="校验结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.passed ? 'success' : 'danger'" size="small" effect="light">
                  {{ row.passed ? '通过' : '未通过' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无核对数据" />
          <div
            v-if="classificationCheck && (!classificationCheck.accuracyValid || classificationCheck.duplicateFound || classificationCheck.invalidFound)"
            class="optimization-suggestions"
          >
            <h4>优化建议</h4>
            <el-alert
              v-if="!classificationCheck.accuracyValid"
              title="分类准确性未通过校验，请核实分类层级与归属关系是否正确"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 8px"
            />
            <el-alert
              v-if="classificationCheck.duplicateFound"
              title="存在重复分类数据，建议合并重复项以优化分类体系"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 8px"
            />
            <el-alert
              v-if="classificationCheck.invalidFound"
              title="存在无效分类数据，建议清理或作废无效分类以适配业务统计需求"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, CircleCheck, CircleClose, Edit } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as stockClassApi from '@/api/stockClassification'
import { formatDateTime } from '@/utils/format'
import {
  STOCK_CLASS_LEVEL_LABELS,
  STOCK_CLASS_STATUS_LABELS,
  STOCK_CLASS_STATUS_TAG_TYPES,
  STOCK_CLASS_OP_TYPE_LABELS,
  STOCK_CLASS_OP_TYPE_TAG_TYPES,
} from '@/constants/dictionaries'
import { StockClassLevel, StockClassStatus, StockClassOperationType } from '@/enums'
import type { IStockClassTraceData } from '@/types/api'

interface Props {
  visible: boolean
  classId: number | null
}

const props = withDefaults(defineProps<Props>(), {
  classId: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const activeTab = ref('source')
const sourceInfo = ref<IStockClassTraceData['sourceInfo'] | null>(null)
const classInfo = ref<Record<string, any> | null>(null)
const operationLogs = ref<IStockClassTraceData['operationLogs']>([])
const levelCheck = ref<IStockClassTraceData['levelCheck'] | null>(null)
const classificationCheck = ref<IStockClassTraceData['classificationCheck'] | null>(null)

const editingField = ref<string | null>(null)
const editValue = ref('')
const editInputRef = ref<any>(null)

type EditableField = 'className' | 'description'

function startEdit(field: EditableField) {
  editingField.value = field
  editValue.value = classInfo.value?.[field] ?? ''
  nextTick(() => {
    editInputRef.value?.focus()
  })
}

async function saveEdit(field: EditableField) {
  if (!props.classId || !editingField.value) return
  const oldValue = classInfo.value?.[field]
  if (editValue.value === oldValue) {
    editingField.value = null
    return
  }
  try {
    const res = await stockClassApi.update(props.classId, { [field]: editValue.value })
    if (res.code === 0) {
      if (classInfo.value) {
        classInfo.value[field] = editValue.value
      }
      ElMessage.success('修改成功')
    }
  } finally {
    editingField.value = null
  }
}

async function fetchData() {
  if (!props.classId) return
  loading.value = true
  try {
    const res = await stockClassApi.getTrace(props.classId)
    if (res.code === 0) {
      const data = res.data
      sourceInfo.value = data.sourceInfo
      classInfo.value = data.sourceInfo?.originalData || {}
      operationLogs.value = data.operationLogs || []
      levelCheck.value = data.levelCheck || null
      classificationCheck.value = data.classificationCheck || null
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.classId],
  ([visibleVal, id]) => {
    if (visibleVal && id) {
      fetchData()
    }
  },
)
</script>

<style lang="scss" scoped>
.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 8px;
  color: #909399;
}

.trace-container {
  :deep(.el-tabs__header) {
    position: sticky;
    top: 52px;
    z-index: 10;
    background: #fff;
  }
}

.trace-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 12px;

  .trace-header-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .trace-header-code {
    font-family: monospace;
    font-size: 13px;
    color: #909399;
  }
}

.code-text {
  font-family: monospace;
  color: #409eff;
}

.editable-field {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }
}

.level-check {
  .issues-section,
  .classification-check-section,
  .check-details {
    margin-top: 16px;

    h4 {
      margin-bottom: 8px;
      font-size: 14px;
      color: #303133;
    }
  }
}

.optimization-suggestions {
  margin-top: 16px;

  h4 {
    margin-bottom: 8px;
    font-size: 14px;
    color: #303133;
  }
}
</style>

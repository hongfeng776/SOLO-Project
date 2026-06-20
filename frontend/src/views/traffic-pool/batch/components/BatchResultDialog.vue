<template>
  <Teleport to="body">
    <Transition name="dialog-scale">
      <el-dialog
        v-model="innerVisible"
        title="批量操作结果"
        :width="560"
        destroy-on-close
      >
        <div class="result-summary">
          <div class="summary-item total">
            <div class="summary-label">操作总数</div>
            <div class="summary-value">{{ result?.total || 0 }}</div>
          </div>
          <div class="summary-item success">
            <div class="summary-label">成功</div>
            <div class="summary-value">{{ result?.success || 0 }}</div>
          </div>
          <div class="summary-item fail">
            <div class="summary-label">失败</div>
            <div class="summary-value">{{ result?.fail || 0 }}</div>
          </div>
        </div>

        <el-divider />

        <div class="result-detail">
          <div class="detail-title">
            <span>详细结果</span>
            <span class="operation-tag">
              {{ operationTypeName }}
            </span>
          </div>
          <el-table
            :data="result?.results || []"
            max-height="300"
            stripe
            size="small"
          >
            <el-table-column label="流量池名称" prop="poolName" min-width="160" />
            <el-table-column label="结果" width="80" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.success ? 'success' : 'danger'"
                  effect="light"
                  size="small"
                >
                  {{ row.success ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="错误信息" prop="error" min-width="180">
              <template #default="{ row }">
                <span v-if="row.error" class="error-text">{{ row.error }}</span>
                <span v-else class="success-text">-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <template #footer>
          <el-button type="primary" @click="innerVisible = false">确认</el-button>
        </template>
      </el-dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BatchOperationResult } from '@/types/business'

const props = defineProps<{
  modelValue: boolean
  result: BatchOperationResult | null
  operationType: 'quota' | 'rules' | 'enable' | 'disable'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const operationTypeName = computed(() => {
  const map: Record<string, string> = {
    quota: '批量配额调整',
    rules: '批量规则修改',
    enable: '批量启用',
    disable: '批量停用'
  }
  return map[props.operationType] || '批量操作'
})
</script>

<style lang="scss" scoped>
.dialog-scale-enter-active,
.dialog-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dialog-scale-enter-from,
.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.result-summary {
  display: flex;
  gap: 16px;

  .summary-item {
    flex: 1;
    text-align: center;
    padding: 16px;
    border-radius: 8px;
    background: #f5f7fa;

    &.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

      .summary-label,
      .summary-value {
        color: #fff;
      }
    }

    &.success {
      .summary-value {
        color: #67c23a;
      }
    }

    &.fail {
      .summary-value {
        color: #f56c6c;
      }
    }

    .summary-label {
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 6px;
    }

    .summary-value {
      font-size: 28px;
      font-weight: 600;
      font-family: 'DIN', monospace;
    }
  }
}

.result-detail {
  .detail-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;

    .operation-tag {
      font-size: 12px;
      font-weight: normal;
      color: #409eff;
      background: rgba(64, 158, 255, 0.1);
      padding: 2px 10px;
      border-radius: 10px;
    }
  }

  .error-text {
    color: #f56c6c;
    font-size: 12px;
  }

  .success-text {
    color: #67c23a;
  }
}
</style>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <el-dialog
        v-model="innerVisible"
        title="批量调整权重配比"
        width="560px"
        :close-on-click-modal="false"
        destroy-on-close
      >
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          class="mb-16"
          title="该操作仅超级运营权限可执行，将同时覆盖选中 {{ selectedIds.length }} 条规则的对应维度权重"
        />
        <el-form :model="form" label-width="120px">
          <div
            v-for="dim in dimensionList"
            :key="dim.key"
            class="adjust-row"
          >
            <el-checkbox v-model="form[dim.key].enabled">
              <span class="dim-name" :style="{ color: dim.color }">
                {{ dim.name }}
              </span>
            </el-checkbox>
            <el-input-number
              v-model="form[dim.key].value"
              :disabled="!form[dim.key].enabled"
              :min="0"
              :max="60"
              :step="1"
              style="width: 140px"
            />
            <span class="unit">%</span>
          </div>
          <div class="tips muted">
            勾选维度后将用新值覆盖所选规则，未勾选维度保持不变。
          </div>
        </el-form>

        <template #footer>
          <el-button @click="innerVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            确认批量调整
          </el-button>
        </template>
      </el-dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { batchTrafficWeightRule } from '@api/traffic-weight-rule'

interface Dim {
  key: string
  field: string
  name: string
  color: string
}

const props = defineProps<{
  modelValue: boolean
  selectedIds: number[]
  dimensionList: Dim[]
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'success': []
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const submitting = ref(false)
const buildForm = () => {
  const f: any = {}
  props.dimensionList.forEach(d => { f[d.key] = { enabled: false, value: 30 } })
  return f
}
const form = reactive<any>(buildForm())

watch(() => props.modelValue, (v) => {
  if (v) Object.assign(form, buildForm())
})

const handleSubmit = async () => {
  const hasAny = Object.values(form).some((v: any) => v.enabled)
  if (!hasAny) {
    ElMessage.warning('请至少选择一个要调整的维度')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认调整 ${props.selectedIds.length} 条规则？已勾选的维度将被覆盖。`,
      '二次确认',
      { type: 'warning' }
    )
  } catch { return }

  const targetWeights: Record<string, number> = {}
  props.dimensionList.forEach(dim => {
    if (form[dim.key].enabled) targetWeights[dim.field] = Number(form[dim.key].value) || 0
  })

  submitting.value = true
  try {
    const r = await batchTrafficWeightRule({
      operation: 'adjust',
      ids: [...props.selectedIds],
      targetWeights,
      reason: '批量调整权重'
    })
    ElMessage.success(`批量调整完成：成功 ${r.successCount} 条，拦截 ${r.blockedCount} 条`)
    emit('success')
    innerVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '批量调整失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.mb-16 { margin-bottom: 16px; }
.adjust-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  .dim-name {
    font-weight: 600;
  }
  .unit { color: $text-secondary; }
}
.tips {
  font-size: 12px;
  margin-top: 8px;
  padding: 8px 10px;
  background: #fafafa;
  border-radius: 4px;
}
</style>

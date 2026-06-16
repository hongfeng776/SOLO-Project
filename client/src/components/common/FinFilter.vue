<template>
  <el-form
    ref="formRef"
    :model="formData"
    class="fin-filter"
    @submit.prevent="handleSearch"
  >
    <el-row :gutter="16">
      <template v-for="(filter, index) in visibleFilters" :key="filter.prop">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
          <el-form-item :label="filter.label" :prop="filter.prop">
            <el-input
              v-if="filter.type === 'input'"
              v-model="formData[filter.prop]"
              :placeholder="filter.placeholder || '请输入' + filter.label"
              :clearable="filter.clearable !== false"
            />
            <el-select
              v-else-if="filter.type === 'select'"
              v-model="formData[filter.prop]"
              :placeholder="filter.placeholder || '请选择' + filter.label"
              :clearable="filter.clearable !== false"
              :multiple="filter.multiple || false"
            >
              <el-option
                v-for="option in filter.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-date-picker
              v-else-if="filter.type === 'date'"
              v-model="formData[filter.prop]"
              type="date"
              :placeholder="filter.placeholder || '请选择日期'"
              :value-format="filter.valueFormat || 'YYYY-MM-DD'"
              :clearable="filter.clearable !== false"
            />
            <el-date-picker
              v-else-if="filter.type === 'daterange'"
              v-model="formData[filter.prop]"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :value-format="filter.valueFormat || 'YYYY-MM-DD'"
              :clearable="filter.clearable !== false"
            />
            <el-date-picker
              v-else-if="filter.type === 'datetime'"
              v-model="formData[filter.prop]"
              type="datetime"
              :placeholder="filter.placeholder || '请选择日期时间'"
              :value-format="filter.valueFormat || 'YYYY-MM-DD HH:mm:ss'"
              :clearable="filter.clearable !== false"
            />
            <el-input-number
              v-else-if="filter.type === 'number'"
              v-model="formData[filter.prop]"
              :placeholder="filter.placeholder || '请输入数值'"
              :min="filter.min"
              :max="filter.max"
              :precision="filter.precision"
              :controls="filter.controls !== false"
              style="width: 100%"
            />
            <div v-else-if="filter.type === 'numberrange'" class="number-range">
              <el-input-number
                v-model="formData[filter.prop + 'Min']"
                :placeholder="'最小' + (filter.placeholder || filter.label)"
                :min="filter.min"
                :max="filter.max"
                :precision="filter.precision"
                :controls="false"
                style="width: calc(50% - 12px)"
              />
              <span class="range-separator">-</span>
              <el-input-number
                v-model="formData[filter.prop + 'Max']"
                :placeholder="'最大' + (filter.placeholder || filter.label)"
                :min="filter.min"
                :max="filter.max"
                :precision="filter.precision"
                :controls="false"
                style="width: calc(50% - 12px)"
              />
            </div>
          </el-form-item>
        </el-col>
      </template>
      <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
        <el-form-item class="filter-actions">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button
            v-if="hasAdvancedFilters"
            type="primary"
            link
            @click="toggleExpand"
          >
            {{ isExpanded ? '收起' : '展开' }}
            <el-icon class="expand-icon" :class="{ expanded: isExpanded }">
              <ArrowDown />
            </el-icon>
          </el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Search, Refresh, ArrowDown } from '@element-plus/icons-vue'

import type { IFilterOption, IFilterConfig } from '@/types/components'

interface IProps {
  filters: IFilterConfig[]
  defaultCollapsedCount?: number
}

const props = withDefaults(defineProps<IProps>(), {
  defaultCollapsedCount: 4
})

const emit = defineEmits<{
  search: [formData: Record<string, any>]
  reset: []
}>()

const formRef = ref<FormInstance>()
const formData = reactive<Record<string, any>>({})
const isExpanded = ref(false)

const basicFilters = computed(() => props.filters.filter((f) => !f.advanced))
const advancedFilters = computed(() => props.filters.filter((f) => f.advanced))
const hasAdvancedFilters = computed(() => advancedFilters.value.length > 0)

const visibleFilters = computed(() => {
  if (isExpanded.value) {
    return props.filters
  }
  return basicFilters.value.slice(0, props.defaultCollapsedCount)
})

function initFormData() {
  props.filters.forEach((filter) => {
    if (filter.type === 'numberrange') {
      formData[filter.prop + 'Min'] = filter.defaultValue?.min ?? null
      formData[filter.prop + 'Max'] = filter.defaultValue?.max ?? null
    } else {
      formData[filter.prop] = filter.defaultValue ?? null
    }
  })
}

initFormData()

function handleSearch() {
  const result: Record<string, any> = {}
  Object.keys(formData).forEach((key) => {
    const value = formData[key]
    if (value !== null && value !== undefined && value !== '' && !Array.isArray(value)) {
      result[key] = value
    } else if (Array.isArray(value) && value.length > 0) {
      result[key] = value
    }
  })
  emit('search', result)
}

function handleReset() {
  Object.keys(formData).forEach((key) => {
    formData[key] = null
  })
  initFormData()
  emit('reset')
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

defineExpose({
  formData,
  handleSearch,
  handleReset
})
</script>

<style lang="scss" scoped>
.fin-filter {
  padding: 20px 20px 4px;
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 16px;

  .number-range {
    display: flex;
    align-items: center;
    gap: 8px;

    .range-separator {
      color: var(--fin-text-secondary);
    }
  }

  .filter-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .expand-icon {
      transition: transform 0.3s;

      &.expanded {
        transform: rotate(180deg);
      }
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--fin-text-regular);
  }
}
</style>

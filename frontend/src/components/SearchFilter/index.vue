<template>
  <div class="search-filter">
    <el-form :model="internalModel" inline>
      <el-form-item
        v-for="(field, index) in visibleFields"
        :key="field.prop"
        :label="field.label"
      >
        <template v-if="field.type === 'input'">
          <el-input
            v-model="internalModel[field.prop]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </template>
        <template v-else-if="field.type === 'select'">
          <el-select
            v-model="internalModel[field.prop]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </template>
        <template v-else-if="field.type === 'date'">
          <el-date-picker
            v-model="internalModel[field.prop]"
            :type="field.dateType || 'date'"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :format="field.format || 'YYYY-MM-DD'"
            :value-format="field.valueFormat || 'YYYY-MM-DD'"
            clearable
            style="width: 200px"
          />
        </template>
        <template v-else-if="field.type === 'daterange'">
          <el-date-picker
            v-model="internalModel[field.prop]"
            type="daterange"
            :placeholder="field.placeholder || ['开始日期', '结束日期']"
            :format="field.format || 'YYYY-MM-DD'"
            :value-format="field.valueFormat || 'YYYY-MM-DD'"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
            style="width: 300px"
          />
        </template>
        <template v-else-if="field.type === 'number'">
          <el-input-number
            v-model="internalModel[field.prop]"
            :min="field.min"
            :max="field.max"
            :step="field.step || 1"
            :placeholder="field.placeholder || `请输入${field.label}`"
            clearable
            style="width: 200px"
          />
        </template>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">
          搜索
        </el-button>
        <el-button :icon="Refresh" @click="handleReset">
          重置
        </el-button>
        <el-button
          v-if="showToggle"
          :icon="expand ? ArrowUp : ArrowDown"
          @click="toggleExpand"
        >
          {{ expand ? '收起' : '展开' }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Search, Refresh, ArrowDown, ArrowUp } from '@element-plus/icons-vue'

const props = defineProps({
  fields: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  defaultShowCount: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'reset'])

const expand = ref(false)
const internalModel = reactive({})

const showToggle = computed(() => props.fields.length > props.defaultShowCount)

const visibleFields = computed(() => {
  if (expand.value) {
    return props.fields
  }
  return props.fields.slice(0, props.defaultShowCount)
})

const initModel = () => {
  Object.keys(internalModel).forEach((key) => delete internalModel[key])
  props.fields.forEach((field) => {
    if (props.modelValue[field.prop] !== undefined) {
      internalModel[field.prop] = props.modelValue[field.prop]
    } else if (field.defaultValue !== undefined) {
      internalModel[field.prop] = field.defaultValue
    } else {
      internalModel[field.prop] = field.type === 'daterange' ? [] : ''
    }
  })
}

const handleSearch = () => {
  const params = {}
  Object.keys(internalModel).forEach((key) => {
    if (internalModel[key] !== '' && internalModel[key] !== null && internalModel[key] !== undefined) {
      if (Array.isArray(internalModel[key]) && internalModel[key].length === 0) {
        return
      }
      params[key] = internalModel[key]
    }
  })
  emit('update:modelValue', params)
  emit('search', params)
}

const handleReset = () => {
  initModel()
  emit('update:modelValue', {})
  emit('reset')
}

const toggleExpand = () => {
  expand.value = !expand.value
}

watch(
  () => props.fields,
  () => {
    initModel()
  },
  { deep: true, immediate: true }
)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      Object.assign(internalModel, val)
    }
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.search-filter {
  .el-form {
    margin: 0;

    .el-form-item {
      margin-bottom: 12px;
      margin-right: 16px;
    }
  }
}
</style>

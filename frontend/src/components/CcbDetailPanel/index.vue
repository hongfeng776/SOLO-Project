<template>
  <div class="ccb-detail-panel">
    <el-descriptions
      :column="column"
      :border="border"
      :size="size"
      :title="title"
      :extra="extra"
    >
      <el-descriptions-item
        v-for="item in items"
        :key="item.prop"
        :label="item.label"
        :span="item.span"
      >
        <template v-if="item.slot">
          <slot :name="item.slot" :data="data" />
        </template>
        <template v-else-if="item.type === 'money'">
          ¥{{ formatMoney(data[item.prop]) }}
        </template>
        <template v-else-if="item.type === 'moneyComma'">
          ¥{{ formatMoneyWithComma(data[item.prop]) }}
        </template>
        <template v-else-if="item.type === 'date'">
          {{ formatDate(data[item.prop]) }}
        </template>
        <template v-else-if="item.type === 'datetime'">
          {{ formatDateTime(data[item.prop]) }}
        </template>
        <template v-else-if="item.type === 'tag' && item.dict">
          <el-tag
            :type="getTagType(data[item.prop], item.dict)"
            effect="light"
          >
            {{ getDictLabel(data[item.prop], item.dict) }}
          </el-tag>
        </template>
        <template v-else-if="item.type === 'status' && item.dict">
          <el-tag
            :type="getTagType(data[item.prop], item.dict)"
            effect="light"
          >
            {{ getDictLabel(data[item.prop], item.dict) }}
          </el-tag>
        </template>
        <template v-else-if="item.type === 'phone'">
          {{ maskPhone(String(data[item.prop] || '')) }}
        </template>
        <template v-else-if="item.type === 'idcard'">
          {{ maskIdCard(String(data[item.prop] || '')) }}
        </template>
        <template v-else>
          {{ data[item.prop] || '-' }}
        </template>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts">
import { formatMoney, formatMoneyWithComma, formatDate, formatDateTime, maskPhone, maskIdCard } from '@utils'
import type { DictItem } from '@types'

interface DetailItem {
  prop: string
  label: string
  span?: number
  type?: 'text' | 'money' | 'moneyComma' | 'date' | 'datetime' | 'tag' | 'status' | 'phone' | 'idcard'
  slot?: string
  dict?: DictItem[]
}

interface Props {
  data: Record<string, unknown>
  items: DetailItem[]
  title?: string
  extra?: string
  column?: number
  border?: boolean
  size?: 'large' | 'default' | 'small'
}

withDefaults(defineProps<Props>(), {
  data: () => ({}),
  items: () => [],
  title: '',
  extra: '',
  column: 2,
  border: true,
  size: 'default'
})

const getDictLabel = (value: unknown, dict: DictItem[]): string => {
  const item = dict.find((d) => d.value === value)
  return item?.label || String(value)
}

const getTagType = (value: unknown, dict: DictItem[]): string => {
  const item = dict.find((d) => d.value === value)
  return item?.type || ''
}
</script>

<style lang="scss" scoped>
.ccb-detail-panel {
  width: 100%;
}
</style>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="1100px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <ShopInfoManage v-if="dialogVisible" :merchant-id="merchantId" @saved="onSaved" />
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ShopInfoManage from '../shopInfoManage.vue'

const props = defineProps<{
  modelValue: boolean
  merchantId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const merchantId = ref(props.merchantId || 0)
const dialogTitle = computed(() => merchantId.value ? '店铺信息编辑' : '店铺信息设置')

watch(() => props.merchantId, (v) => { if (v) merchantId.value = v })
watch(() => props.modelValue, (v) => {
  if (v && props.merchantId) merchantId.value = props.merchantId
})

const onSaved = () => {
  emit('saved')
}
</script>

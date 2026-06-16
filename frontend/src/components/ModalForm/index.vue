<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <slot :form="formData" />
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

interface Props {
  modelValue: boolean;
  title?: string;
  width?: string;
  formData?: Record<string, any>;
  rules?: FormRules;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '600px',
  formData: () => ({}),
  rules: () => ({}),
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', formData: Record<string, any>): void;
}>();

const visible = ref(props.modelValue);
const formRef = ref<FormInstance>();
const formData = reactive<Record<string, any>>({ ...props.formData });

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      Object.assign(formData, props.formData);
    }
  }
);

watch(
  () => props.formData,
  (val) => {
    Object.assign(formData, val);
  },
  { deep: true }
);

const handleClose = () => {
  emit('update:modelValue', false);
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid) => {
    if (valid) {
      emit('submit', { ...formData });
    }
  });
};

const resetForm = () => {
  formRef.value?.resetFields();
};

defineExpose({ resetForm, formData });
</script>

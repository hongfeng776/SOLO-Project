<template>
  <el-dialog
    v-model="visible"
    width="420px"
    :show-close="false"
    :close-on-click-modal="false"
    custom-class="result-dialog"
    append-to-body
    destroy-on-close
    @open="handleOpen"
  >
    <div class="result-dialog-content fade-in-anim">
      <div class="result-icon-wrap" :class="iconClass">
        <el-icon :size="56">
          <component :is="iconComponent" />
        </el-icon>
        <div class="icon-circle-ripple"></div>
        <div class="icon-circle-ripple delay"></div>
      </div>
      <div class="result-title">{{ title }}</div>
      <div class="result-message">{{ message }}</div>

      <div v-if="result?.merchant" class="result-merchant mt-20">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="商家名称" :span="2">
            <b>{{ result.merchant.name }}</b>
          </el-descriptions-item>
          <el-descriptions-item label="商家ID">{{ result.merchant.id }}</el-descriptions-item>
          <el-descriptions-item label="业务类型">
            {{ getBusinessTypeLabel(result.merchant.businessType) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="showPermissionTip" class="permission-tip mt-20">
        <el-alert type="success" :closable="false" show-icon>
          <template #title>
            <b>权限已自动开通</b>
          </template>
          <ul class="tip-list mt-5">
            <li>✅ 对应品类经营权限已授予</li>
            <li>✅ 资源上架权限已开通</li>
            <li>✅ 入驻流程状态已完成</li>
          </ul>
        </el-alert>
      </div>

      <div v-if="showLockTip" class="permission-tip mt-20">
        <el-alert type="error" :closable="false" show-icon>
          <template #title>
            <b>入驻流程已锁定</b>
          </template>
          <div class="mt-5">请联系商家根据驳回原因修正资料后重新提交。</div>
        </el-alert>
      </div>

      <div v-if="showTempTip" class="permission-tip mt-20">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <b>审核状态已暂存</b>
          </template>
          <div class="mt-5">可稍后继续处理该商家的审核申请。</div>
        </el-alert>
      </div>

      <div class="result-actions mt-30">
        <el-button type="primary" @click="handleClose">
          我知道了
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CircleCheck, CircleClose, Clock, Warning } from '@element-plus/icons-vue'
import { MerchantBusinessTypeEnum, getEnumLabel } from '@/utils/enums'

const props = defineProps({
  modelValue: Boolean,
  result: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const getBusinessTypeLabel = v => getEnumLabel(MerchantBusinessTypeEnum, v) || '未知'

const resultType = computed(() => props.result?.type || 'success')

const iconComponent = computed(() => {
  const map = {
    pass: CircleCheck, reject: CircleClose, temporary: Clock, success: CircleCheck, warning: Warning
  }
  return map[resultType.value] || CircleCheck
})

const iconClass = computed(() => {
  const map = {
    pass: 'icon-success', reject: 'icon-fail', temporary: 'icon-temp',
    success: 'icon-success', warning: 'icon-warning'
  }
  return map[resultType.value] || 'icon-success'
})

const title = computed(() => {
  const map = {
    pass: props.result?.merchant?.auditLevel === 2 ? '终审通过成功' : '审核通过成功',
    reject: '审核驳回成功',
    temporary: '审核暂存成功',
    success: '操作成功'
  }
  return map[resultType.value] || '操作成功'
})

const message = computed(() => {
  return props.result?.message || '操作已完成'
})

const showPermissionTip = computed(() => {
  return resultType.value === 'pass' && props.result?.merchant?.auditStatus === 1
})
const showLockTip = computed(() => resultType.value === 'reject')
const showTempTip = computed(() => resultType.value === 'temporary')

const handleOpen = () => {}
const handleClose = () => { visible.value = false }

watch(
  () => props.modelValue,
  v => {
    if (v) {
      setTimeout(() => { document.querySelector('.result-dialog .el-dialog__body')?.classList.add('opened') }, 10)
    }
  }
)
</script>

<style lang="scss" scoped>
.result-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
    overflow: visible;
  }
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }
}

.result-dialog-content {
  padding: 30px 30px 25px;
  text-align: center;
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.fade-in-anim {
    animation: dialogFadeIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
}

@keyframes dialogFadeIn {
  0% { opacity: 0; transform: translateY(-25px) scale(0.92); }
  60% { opacity: 1; transform: translateY(3px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.result-icon-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  animation: iconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #fff;

  &.icon-success {
    background: linear-gradient(135deg, #52c41a, #95de64);
    box-shadow: 0 8px 24px rgba(82, 196, 26, 0.4);
  }
  &.icon-fail {
    background: linear-gradient(135deg, #ff4d4f, #ff7875);
    box-shadow: 0 8px 24px rgba(255, 77, 79, 0.4);
  }
  &.icon-temp {
    background: linear-gradient(135deg, #722ed1, #b37feb);
    box-shadow: 0 8px 24px rgba(114, 46, 209, 0.4);
  }
  &.icon-warning {
    background: linear-gradient(135deg, #faad14, #ffd666);
    box-shadow: 0 8px 24px rgba(250, 173, 20, 0.4);
  }
}

@keyframes iconBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.icon-circle-ripple {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid currentColor;
  opacity: 0.4;
  animation: rippleAnim 1.4s ease-out infinite;
}
.icon-circle-ripple.delay { animation-delay: 0.7s; }

@keyframes rippleAnim {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.8); opacity: 0; }
}

.result-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}
.result-message {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}
.result-actions {
  text-align: center;
  .el-button {
    min-width: 140px;
    height: 40px;
    border-radius: 8px;
    font-weight: 600;
  }
}
.tip-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  li {
    padding: 2px 0;
    font-size: 13px;
    color: #374151;
  }
}
.mt-5 { margin-top: 5px; }
.mt-20 { margin-top: 20px; }
.mt-30 { margin-top: 30px; }
</style>

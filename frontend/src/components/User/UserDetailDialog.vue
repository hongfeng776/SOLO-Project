<template>
  <el-dialog
    v-model="visible"
    title="用户详情"
    width="720px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="user-detail-dialog" v-loading="loading">
      <el-alert
        v-if="userData?.isAbnormal"
        :title="'异常用户：' + (userData.abnormalRemark || '存在异常风险')"
        type="error"
        :closable="false"
        show-icon
        class="abnormal-alert"
      />

      <div class="detail-header">
        <div class="avatar-section">
          <el-avatar :size="72" :src="userData?.avatar">
            {{ userData?.nickname?.charAt(0) || userData?.username?.charAt(0) || 'U' }}
          </el-avatar>
        </div>
        <div class="info-section">
          <p class="username">{{ userData?.nickname || userData?.username }}</p>
          <div class="meta-tags">
            <span :class="['user-level-tag', `level-${getLevelClass(userData?.userLevel)}`]">
              {{ getLevelLabel(userData?.userLevel) }}
            </span>
            <span :class="['user-status-tag', `status-${getStatusClass(userData?.status)}`]">
              {{ getStatusLabel(userData?.status) }}
            </span>
            <span
              v-for="tag in parsedTags"
              :key="tag"
              class="user-tag"
              :style="{ background: getTagColor(tag) + '20', color: getTagColor(tag) }"
            >
              {{ getTagLabel(tag) }}
            </span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="section-title">基础信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">用户ID：</span>
            <span class="value">{{ userData?.id || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">用户名：</span>
            <span class="value">{{ userData?.username || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">真实姓名：</span>
            <span
              class="value"
              :class="{ 'value-abnormal': !userData?.realName && userData?.userLevel >= 2 }"
            >
              <el-tooltip
                v-if="!userData?.realName && userData?.userLevel >= 2"
                content="中高级用户未实名认证，存在异常风险"
                placement="top"
              >
                <span>{{ userData?.realName || '未填写（异常）' }}</span>
              </el-tooltip>
              <span v-else>{{ userData?.realName || '-' }}</span>
            </span>
          </div>
          <div class="detail-item">
            <span class="label">手机号：</span>
            <span
              class="value"
              :class="{ 'value-abnormal': !userData?.phone && !userData?.email }"
            >
              <el-tooltip
                v-if="!userData?.phone && !userData?.email"
                content="联系方式缺失"
                placement="top"
              >
                <span>{{ userData?.phone || '未填写（异常）' }}</span>
              </el-tooltip>
              <el-tooltip
                v-else-if="userData?.phone && userData?.phone.length > 11"
                :content="userData.phone"
                placement="top"
              >
                <span>{{ maskPhone(userData?.phone) }}</span>
              </el-tooltip>
              <span v-else>{{ userData?.phone || '-' }}</span>
            </span>
          </div>
          <div class="detail-item">
            <span class="label">身份证号：</span>
            <span
              class="value"
              :class="{ 'value-abnormal': !userData?.idCard && userData?.userLevel >= 2 }"
            >
              <el-tooltip
                v-if="userData?.idCard"
                :content="userData.idCard"
                placement="top"
              >
                <span>{{ maskIdCard(userData?.idCard) }}</span>
              </el-tooltip>
              <el-tooltip
                v-else-if="!userData?.idCard && userData?.userLevel >= 2"
                content="中高级用户未实名认证"
                placement="top"
              >
                <span>未填写（异常）</span>
              </el-tooltip>
              <span v-else>-</span>
            </span>
          </div>
          <div class="detail-item">
            <span class="label">邮箱：</span>
            <span class="value">
              <el-tooltip
                v-if="userData?.email && userData.email.length > 20"
                :content="userData.email"
                placement="top"
              >
                <span>{{ userData.email }}</span>
              </el-tooltip>
              <span v-else>{{ userData?.email || '-' }}</span>
            </span>
          </div>
          <div class="detail-item">
            <span class="label">注册渠道：</span>
            <span class="value">{{ getChannelLabel(userData?.registerChannel) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">角色：</span>
            <span class="value">{{ userData?.role?.name || '-' }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="section-title">消费统计</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">订单数量：</span>
            <span class="value">{{ userData?.orderCount || 0 }} 单</span>
          </div>
          <div class="detail-item">
            <span class="label">累计消费：</span>
            <span class="value">¥ {{ userData?.totalAmount || '0.00' }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section" v-if="parsedBenefits">
        <h3 class="section-title">用户权益</h3>
        <div class="benefits-list">
          <div class="benefit-item">
            <div class="benefit-value">{{ (parsedBenefits.discount * 100).toFixed(0) }}折</div>
            <div class="benefit-label">消费折扣</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-value">{{ parsedBenefits.pointsRate }}x</div>
            <div class="benefit-label">积分倍率</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-value">
              <el-icon v-if="parsedBenefits.freeShipping" color="#52c41a">
                <CircleCheck />
              </el-icon>
              <el-icon v-else color="#909399">
                <CircleClose />
              </el-icon>
            </div>
            <div class="benefit-label">免运费</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-value">
              <el-icon v-if="parsedBenefits.prioritySupport" color="#52c41a">
                <CircleCheck />
              </el-icon>
              <el-icon v-else color="#909399">
                <CircleClose />
              </el-icon>
            </div>
            <div class="benefit-label">优先客服</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-value">
              <el-icon v-if="parsedBenefits.exclusiveService" color="#52c41a">
                <CircleCheck />
              </el-icon>
              <el-icon v-else color="#909399">
                <CircleClose />
              </el-icon>
            </div>
            <div class="benefit-label">专属服务</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-value">
              <el-icon v-if="parsedBenefits.vipLounge" color="#52c41a">
                <CircleCheck />
              </el-icon>
              <el-icon v-else color="#909399">
                <CircleClose />
              </el-icon>
            </div>
            <div class="benefit-label">VIP休息室</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="section-title">时间信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">注册时间：</span>
            <span class="value">{{ userData?.createdAt || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">最后登录：</span>
            <span class="value">{{ userData?.lastLoginTime || '-' }}</span>
          </div>
          <div class="detail-item" v-if="userData?.status === 2">
            <span class="label">冻结时间：</span>
            <span class="value value-abnormal">{{ userData?.freezeTime || '-' }}</span>
          </div>
          <div class="detail-item" v-if="userData?.status === 2">
            <span class="label">冻结原因：</span>
            <span class="value value-abnormal">
              <el-tooltip
                v-if="userData?.freezeReason && userData.freezeReason.length > 15"
                :content="userData.freezeReason"
                placement="top"
              >
                <span>{{ userData.freezeReason }}</span>
              </el-tooltip>
              <span v-else>{{ userData?.freezeReason || '-' }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import {
  UserLevelEnum,
  UserStatusEnum,
  RegisterChannelEnum,
  UserTagOptions,
  getEnumLabel
} from '@/utils/enums'
import { getUser } from '@/api/user'

const props = defineProps({
  modelValue: Boolean,
  userId: [Number, String]
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const userData = ref(null)

const parsedTags = computed(() => {
  if (!userData.value?.tags) return []
  try {
    return typeof userData.value.tags === 'string'
      ? JSON.parse(userData.value.tags)
      : userData.value.tags
  } catch (e) {
    return []
  }
})

const parsedBenefits = computed(() => {
  if (!userData.value?.benefits) return null
  try {
    return typeof userData.value.benefits === 'string'
      ? JSON.parse(userData.value.benefits)
      : userData.value.benefits
  } catch (e) {
    return null
  }
})

const getLevelClass = (level) => ({ 1: 'normal', 2: 'business', 3: 'vip' }[level] || 'normal')
const getLevelLabel = (level) => getEnumLabel(UserLevelEnum, level) || '-'
const getStatusClass = (status) => ({ 1: 'enabled', 0: 'disabled', 2: 'frozen' }[status] || 'enabled')
const getStatusLabel = (status) => getEnumLabel(UserStatusEnum, status) || '-'
const getChannelLabel = (channel) => getEnumLabel(RegisterChannelEnum, channel) || '-'

const getTagLabel = (value) => {
  const tag = UserTagOptions.find(t => t.value === value)
  return tag ? tag.label : value
}

const getTagColor = (value) => {
  const tag = UserTagOptions.find(t => t.value === value)
  return tag ? tag.color : '#909399'
}

const maskPhone = (phone) => {
  if (!phone) return '-'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const maskIdCard = (idCard) => {
  if (!idCard) return '-'
  if (idCard.length <= 8) return idCard
  return idCard.substring(0, 4) + '********' + idCard.substring(idCard.length - 4)
}

const fetchUserDetail = async () => {
  if (!props.userId) return
  loading.value = true
  try {
    const res = await getUser(props.userId)
    userData.value = res.data
  } catch (e) {
    userData.value = null
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  userData.value = null
}

watch(() => [props.modelValue, props.userId], ([val, id]) => {
  if (val && id) {
    fetchUserDetail()
  }
})
</script>

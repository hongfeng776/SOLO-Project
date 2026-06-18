<template>
  <el-dialog
    v-model="visible"
    title="用户权限配置"
    width="800px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="permission-config-dialog">
      <div class="user-info-bar" style="padding: 14px 16px; background: #f5f7fa; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
        <el-avatar :size="48" :src="userData?.avatar">
          {{ userData?.nickname?.charAt(0) || userData?.username?.charAt(0) }}
        </el-avatar>
        <div style="flex: 1;">
          <div style="font-size: 16px; font-weight: 600; color: #303133;">
            {{ userData?.nickname || userData?.username }}
          </div>
          <div style="font-size: 13px; color: #909399; margin-top: 4px;">
            <span :class="['user-level-tag', `level-${getLevelClass(userData?.userLevel)}`]" style="margin-right: 8px;">
              {{ getLevelLabel(userData?.userLevel) }}
            </span>
            共 {{ totalEnabled }} 项权限已启用
          </div>
        </div>
        <el-button type="primary" size="small" :icon="Tickets" @click="showLogs = true">
          变更记录
        </el-button>
      </div>

      <div style="display: flex; min-height: 400px;">
        <div class="permission-sidebar">
          <div
            v-for="(typeInfo, typeKey) in permissionTree"
            :key="typeKey"
            :class="['type-item', { active: activeType === typeKey }]"
            @click="activeType = typeKey"
          >
            <el-icon class="type-icon" :color="activeType === typeKey ? '#1890ff' : '#909399'">
              <component :is="getTypeIcon(typeKey)" />
            </el-icon>
            <span>{{ typeInfo.label }}</span>
          </div>
        </div>

        <div class="permission-body">
          <h3 class="section-title">
            {{ permissionTree[activeType]?.label }}
            <span style="font-size: 13px; color: #909399; font-weight: normal; margin-left: 10px;">
              共 {{ getTypePerms(activeType).length }} 项权限
            </span>
          </h3>

          <div class="permission-grid">
            <div
              v-for="perm in getTypePerms(activeType)"
              :key="perm.key"
              :class="['permission-item', {
                'is-checked': perm.enabled,
                'is-conflict': isConflictPerm(perm.key)
              }]"
              @click="togglePermission(perm)"
            >
              <el-checkbox :model-value="perm.enabled" @click.stop />
              <div style="flex: 1;">
                <div class="item-label">{{ perm.name }}</div>
                <div class="item-desc">{{ getPermDesc(perm) }}</div>
              </div>
              <el-tag
                v-if="perm.source && perm.source !== 'default'"
                size="small"
                :type="getSourceTagType(perm.source)"
              >
                {{ getSourceLabel(perm.source) }}
              </el-tag>
            </div>
          </div>

          <div v-if="conflicts.length > 0" class="conflict-tip">
            <el-icon><WarningFilled /></el-icon>
            <span>存在权限冲突：</span>
            <span v-for="(c, idx) in conflicts" :key="idx" class="conflict-reason">
              {{ c.reason }}
            </span>
          </div>
        </div>
      </div>

      <div class="config-footer">
        <div class="valid-date">
          <span class="label">生效时间：</span>
          <el-date-picker
            v-model="validFrom"
            type="date"
            placeholder="开始时间"
            value-format="YYYY-MM-DD"
            style="width: 140px;"
          />
          <span>至</span>
          <el-date-picker
            v-model="validTo"
            type="date"
            placeholder="结束时间（选填）"
            value-format="YYYY-MM-DD"
            style="width: 140px;"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="conflicts.length > 0" @click="handleSave">
        保存配置
      </el-button>
    </template>

    <el-dialog v-model="showLogs" title="权限变更记录" width="700px">
      <PermissionLogPanel :user-id="userId" :compact="true" />
    </el-dialog>

    <div v-if="showSuccess" class="success-check-popup">
      <el-icon class="check-icon"><CircleCheckFilled /></el-icon>
      <span>权限配置保存成功</span>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Van,
  Present,
  Suitcase,
  WarningFilled,
  Tickets,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import {
  UserLevelEnum,
  PermissionSourceEnum,
  getEnumLabel
} from '@/utils/enums'
import {
  getUserPermissions,
  saveUserPermission,
  getPermissionTree
} from '@/api/permission'
import PermissionLogPanel from './PermissionLogPanel.vue'

const props = defineProps({
  modelValue: Boolean,
  userId: [Number, String],
  userData: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const submitting = ref(false)
const activeType = ref('base')
const permissionTree = ref({})
const permissionData = reactive({})
const conflicts = ref([])
const showLogs = ref(false)
const showSuccess = ref(false)
const validFrom = ref('')
const validTo = ref('')

const MUTEX_RULES = [
  { type: 'mutex', permissions: ['free_change', 'insurance_gift'], reason: '免费改签与赠送保险互斥' },
  { type: 'level_require', permission: 'business_travel_booking', minLevel: 2, reason: '商旅预订仅对商旅及以上用户开放' },
  { type: 'level_require', permission: 'dedicated_manager', minLevel: 3, reason: '专属客户经理仅对VIP用户开放' },
  { type: 'level_require', permission: 'free_lounge', minLevel: 3, reason: '贵宾厅休息室仅对VIP用户开放' }
]

const totalEnabled = computed(() => {
  let count = 0
  for (const type in permissionData) {
    for (const key in permissionData[type]) {
      if (permissionData[type][key]?.enabled) count++
    }
  }
  return count
})

const getLevelClass = (level) => ({ 1: 'normal', 2: 'business', 3: 'vip' }[level] || 'normal')
const getLevelLabel = (level) => getEnumLabel(UserLevelEnum, level) || '-'

const getTypeIcon = (type) => {
  const map = { base: User, travel: Van, marketing: Present, business: Suitcase }
  return map[type] || User
}

const getTypePerms = (type) => {
  const perms = []
  const typeData = permissionData[type]
  if (!typeData) return perms
  for (const key in typeData) {
    perms.push({ key, ...typeData[key] })
  }
  return perms
}

const getPermDesc = (perm) => {
  if (perm.validFrom || perm.validTo) {
    const from = perm.validFrom?.substring?.(0, 10) || ''
    const to = perm.validTo?.substring?.(0, 10) || '永久'
    return `有效期: ${from || '开始'} ~ ${to}`
  }
  if (perm.status === 'expired') return '已过期'
  return perm.remark || '基础权限配置'
}

const getSourceLabel = (source) => getEnumLabel(PermissionSourceEnum, source) || source
const getSourceTagType = (source) => {
  const map = { manual: '', level: 'success', activity: 'warning', batch: 'info' }
  return map[source] || 'info'
}

const isConflictPerm = (key) => {
  return conflicts.value.some(c => {
    if (c.permissions) return c.permissions.includes(key)
    return c.permission === key
  })
}

const checkConflicts = () => {
  const enabledKeys = []
  for (const type in permissionData) {
    for (const key in permissionData[type]) {
      if (permissionData[type][key]?.enabled) enabledKeys.push(key)
    }
  }

  const found = []
  for (const rule of MUTEX_RULES) {
    if (rule.type === 'mutex') {
      if (rule.permissions.every(p => enabledKeys.includes(p))) {
        found.push(rule)
      }
    }
    if (rule.type === 'level_require') {
      if (enabledKeys.includes(rule.permission) && props.userData?.userLevel < rule.minLevel) {
        found.push(rule)
      }
    }
  }
  conflicts.value = found
}

const togglePermission = (perm) => {
  if (!permissionData[activeType.value]) return
  const p = permissionData[activeType.value][perm.key]
  if (p) {
    p.enabled = !p.enabled
    checkConflicts()
  }
}

const loadPermissions = async () => {
  if (!props.userId) return
  try {
    const [treeRes, userRes] = await Promise.all([
      getPermissionTree(),
      getUserPermissions(props.userId)
    ])

    permissionTree.value = treeRes.data || {}

    const userPerms = userRes.data?.permissions || {}
    for (const type in userPerms) {
      permissionData[type] = { ...userPerms[type]?.permissions } || {}
    }
    checkConflicts()
  } catch (e) {
    ElMessage.error(e.message || '加载权限配置失败')
  }
}

const handleSave = async () => {
  if (conflicts.value.length > 0) {
    ElMessage.error('请先解决权限冲突后再保存')
    return
  }
  submitting.value = true
  try {
    const saveData = {}
    for (const type in permissionData) {
      saveData[type] = {}
      for (const key in permissionData[type]) {
        const p = permissionData[type][key]
        saveData[type][key] = {
          enabled: p.enabled,
          configValue: p.configValue || null,
          validFrom: validFrom.value || null,
          validTo: validTo.value || null
        }
      }
    }
    await saveUserPermission(props.userId, saveData)
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 1200)
    setTimeout(() => {
      emit('success')
      visible.value = false
    }, 800)
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const handleClosed = () => {
  showSuccess.value = false
  validFrom.value = ''
  validTo.value = ''
  conflicts.value = []
}

watch(() => [props.modelValue, props.userId], ([val, id]) => {
  if (val && id) {
    loadPermissions()
  }
})
</script>

<template>
  <div class="permission-batch-panel">
    <div style="margin-bottom: 16px;">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="模板配置" name="template" />
        <el-tab-pane label="批量开关" name="toggle" />
        <el-tab-pane label="批量重置" name="reset" />
      </el-tabs>
    </div>

    <div v-show="activeTab === 'template'">
      <h3 style="font-size: 15px; font-weight: 600; margin: 0 0 16px 0;">选择权限模板</h3>
      <div class="template-grid">
        <div
          v-for="tpl in templateList"
          :key="tpl.key"
          :class="['template-card', { 'is-active': selectedTemplate === tpl.key }]"
          @click="selectedTemplate = tpl.key"
        >
          <span class="template-badge">已选</span>
          <div class="template-name">{{ tpl.name }}</div>
          <span
            class="template-level"
            :style="{
              background: getLevelColor(tpl.userLevel) + '20',
              color: getLevelColor(tpl.userLevel)
            }"
          >
            {{ getLevelLabel(tpl.userLevel) }}
          </span>
          <div class="template-desc">{{ tpl.description }}</div>
          <div class="template-perms">
            包含
            <span class="perm-count">{{ countTemplatePerms(tpl) }}</span>
            项启用权限
          </div>
        </div>
      </div>

      <el-form label-width="100px" style="margin-top: 16px;">
        <el-form-item label="配置说明">
          <el-input
            v-model="reason"
            type="textarea"
            :rows="2"
            placeholder="请输入批量配置说明（选填）"
          />
        </el-form-item>
      </el-form>
    </div>

    <div v-show="activeTab === 'toggle'">
      <h3 style="font-size: 15px; font-weight: 600; margin: 0 0 16px 0;">选择要批量操作的权限</h3>

      <div v-for="(typeInfo, typeKey) in permissionTree" :key="typeKey" style="margin-bottom: 20px;">
        <div style="font-size: 14px; font-weight: 500; color: #303133; margin-bottom: 10px; padding-left: 8px; border-left: 3px solid #1890ff;">
          {{ typeInfo.label }}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <el-checkbox
            v-for="perm in typeInfo.permissions"
            :key="perm.key"
            :model-value="togglePerms.includes(perm.key)"
            @change="(val) => togglePermChange(perm.key, val)"
          >
            {{ perm.name }}
          </el-checkbox>
        </div>
      </div>

      <el-form label-width="100px" style="margin-top: 16px;">
        <el-form-item label="操作类型">
          <el-radio-group v-model="toggleAction">
            <el-radio value="open">批量开通</el-radio>
            <el-radio value="close">批量关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="操作说明">
          <el-input
            v-model="toggleReason"
            type="textarea"
            :rows="2"
            placeholder="请输入操作说明（选填）"
          />
        </el-form-item>
      </el-form>
    </div>

    <div v-show="activeTab === 'reset'">
      <el-alert
        title="重置说明"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      >
        <template #default>
          <div>将所选用户的权限重置为其用户等级对应的默认权限模板。</div>
          <div style="margin-top: 6px; font-size: 13px;">
            普通用户 → 普通用户默认模板 &nbsp;|&nbsp;
            商旅用户 → 商旅用户标准模板 &nbsp;|&nbsp;
            VIP用户 → VIP尊享模板
          </div>
        </template>
      </el-alert>
      <el-form label-width="100px">
        <el-form-item label="重置原因">
          <el-input
            v-model="resetReason"
            type="textarea"
            :rows="2"
            placeholder="请输入重置原因（选填）"
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="batch-actions">
      <div class="selected-info">
        已选择 <span class="count">{{ selectedCount }}</span> 个用户
        <span v-if="hasVIP" style="color: #faad14; margin-left: 10px;">
          <el-icon><Warning /></el-icon>
          包含VIP用户，需管理员权限
        </span>
      </div>
      <div>
        <el-button :disabled="!canSubmit" @click="$emit('cancel')">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ submitText }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import {
  UserLevelEnum,
  getEnumLabel,
  getEnumColor,
  getEnumOptions
} from '@/utils/enums'
import {
  getPermissionTemplates,
  getPermissionTree,
  batchApplyPermissionTemplate,
  batchTogglePermissions,
  batchResetPermissions
} from '@/api/permission'

const props = defineProps({
  selectedIds: {
    type: Array,
    default: () => []
  },
  selectedRows: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['success', 'cancel'])

const activeTab = ref('template')
const selectedTemplate = ref('')
const templateList = ref([])
const permissionTree = ref({})
const togglePerms = ref([])
const toggleAction = ref('open')
const toggleReason = ref('')
const resetReason = ref('')
const reason = ref('')
const submitting = ref(false)

const selectedCount = computed(() => props.selectedIds.length)
const hasVIP = computed(() => props.selectedRows.some(r => r.userLevel === 3))

const getLevelLabel = (level) => getEnumLabel(UserLevelEnum, level) || '-'
const getLevelColor = (level) => getEnumColor(UserLevelEnum, level) || '#909399'

const canSubmit = computed(() => {
  if (selectedCount.value === 0) return false
  if (activeTab.value === 'template') return !!selectedTemplate.value
  if (activeTab.value === 'toggle') return togglePerms.value.length > 0
  if (activeTab.value === 'reset') return true
  return false
})

const submitText = computed(() => {
  if (activeTab.value === 'template') return '应用模板'
  if (activeTab.value === 'toggle') return toggleAction.value === 'open' ? '批量开通' : '批量关闭'
  return '批量重置'
})

const countTemplatePerms = (tpl) => {
  let count = 0
  for (const type in tpl.permissions) {
    for (const key in tpl.permissions[type]) {
      if (tpl.permissions[type][key]) count++
    }
  }
  return count
}

const togglePermChange = (key, val) => {
  if (val) {
    if (!togglePerms.value.includes(key)) togglePerms.value.push(key)
  } else {
    const idx = togglePerms.value.indexOf(key)
    if (idx > -1) togglePerms.value.splice(idx, 1)
  }
}

const handleTabChange = () => {}

const loadData = async () => {
  try {
    const [tplRes, treeRes] = await Promise.all([
      getPermissionTemplates(),
      getPermissionTree()
    ])
    const tpls = tplRes.data || {}
    templateList.value = Object.keys(tpls).map(key => ({ key, ...tpls[key] }))
    if (templateList.value.length > 0) {
      selectedTemplate.value = templateList.value[0].key
    }
    permissionTree.value = treeRes.data || {}
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

const handleSubmit = async () => {
  if (hasVIP.value) {
    try {
      await ElMessageBox.confirm(
        '选中用户包含VIP用户，批量操作需要管理员权限。确定继续吗？',
        '权限提示',
        { type: 'warning' }
      )
    } catch {
      return
    }
  }

  submitting.value = true
  try {
    let result
    if (activeTab.value === 'template') {
      result = await batchApplyPermissionTemplate(
        props.selectedIds,
        selectedTemplate.value,
        reason.value
      )
    } else if (activeTab.value === 'toggle') {
      result = await batchTogglePermissions(
        props.selectedIds,
        togglePerms.value,
        toggleAction.value === 'open',
        toggleReason.value
      )
    } else {
      result = await batchResetPermissions(props.selectedIds, resetReason.value)
    }
    ElMessage.success(`操作完成：成功${result.data?.success || 0}个，失败${result.data?.failed || 0}个`)
    emit('success')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

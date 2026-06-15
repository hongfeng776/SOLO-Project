<template>
  <div class="user-edit-page">
    <div class="edit-header">
      <el-button v-ripple @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <div class="header-actions">
        <el-button v-ripple @click="handleCancel">取消</el-button>
        <el-button type="primary" v-ripple :loading="submitLoading" @click="handleSave">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="edit-content">
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><UserFilled /></el-icon>
            <span>编辑用户信息</span>
          </div>
        </template>
        <el-form
          ref="formRef"
          :model="formData"
          label-width="100px"
          class="user-edit-form"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="用户ID">
                <el-input :value="formData.id" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用户名" prop="username">
                <HInput
                  v-model="formData.username"
                  placeholder="请输入用户名"
                  :rules="formRules.username"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="昵称" prop="nickname">
                <HInput
                  v-model="formData.nickname"
                  placeholder="请输入昵称"
                  :rules="formRules.nickname"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <HInput
                  v-model="formData.email"
                  type="email"
                  placeholder="请输入邮箱"
                  :rules="formRules.email"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用户角色">
                <el-input :value="getRoleName(formData.role)" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="账号状态" prop="status">
                <el-radio-group v-model="formData.status">
                  <el-radio :value="1">启用</el-radio>
                  <el-radio :value="0">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建时间">
                <el-input :value="formData.created_at" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <el-card class="tips-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>温馨提示</span>
          </div>
        </template>
        <div class="tips-content">
          <ul>
            <li>用户名长度为 2-20 个字符，创建后不可修改</li>
            <li>禁用状态的用户将无法登录系统</li>
            <li>用户角色需要在角色管理中进行分配</li>
          </ul>
        </div>
      </el-card>

      <div class="placeholder-height"></div>
    </div>

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { ArrowLeft, Check, UserFilled, InfoFilled } from '@element-plus/icons-vue'
import type { UserFormData, ValidationRule } from '@/types'
import type { UserItem } from '@/api/user'
import HInput from '@/components/HInput/index.vue'
import BackToTop from '@/components/BackToTop/index.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const mockData: UserItem[] = [
  { id: 1, username: 'admin', nickname: '系统管理员', email: 'admin@hongjing.com', status: 1, role: 'admin', created_at: '2026-06-01 10:00:00' },
  { id: 2, username: 'user001', nickname: '张三', email: 'zhangsan@hongjing.com', status: 1, role: 'user', created_at: '2026-06-02 11:30:00' },
  { id: 3, username: 'user002', nickname: '李四', email: 'lisi@hongjing.com', status: 1, role: 'user', created_at: '2026-06-03 09:15:00' },
  { id: 4, username: 'user003', nickname: '王五', email: 'wangwu@hongjing.com', status: 0, role: 'user', created_at: '2026-06-04 14:20:00' },
  { id: 5, username: 'user004', nickname: '赵六', email: 'zhaoliu@hongjing.com', status: 1, role: 'user', created_at: '2026-06-05 16:45:00' },
  { id: 6, username: 'user005', nickname: '钱七', email: 'qianqi@hongjing.com', status: 1, role: 'user', created_at: '2026-06-06 08:30:00' },
  { id: 7, username: 'user006', nickname: '孙八', email: 'sunba@hongjing.com', status: 1, role: 'user', created_at: '2026-06-07 13:10:00' },
  { id: 8, username: 'user007', nickname: '周九', email: 'zhoujiu@hongjing.com', status: 0, role: 'user', created_at: '2026-06-08 17:00:00' },
  { id: 9, username: 'user008', nickname: '吴十', email: 'wushi@hongjing.com', status: 1, role: 'user', created_at: '2026-06-09 10:25:00' },
  { id: 10, username: 'user009', nickname: '郑十一', email: 'zheng11@hongjing.com', status: 1, role: 'user', created_at: '2026-06-10 11:55:00' }
]

const formData = reactive<UserFormData>({
  id: 0,
  username: '',
  nickname: '',
  email: '',
  status: 1
})

const formRules: Record<string, ValidationRule[]> = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符' }
  ],
  nickname: [
    { required: true, message: '请输入昵称' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符' }
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { pattern: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/, message: '请输入正确的邮箱格式' }
  ]
}

const roleMap: Record<string, string> = {
  admin: '超级管理员',
  user: '普通用户'
}

function getRoleName(key?: string) {
  if (!key) return '-'
  return roleMap[key] || key
}

async function loadDetail() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const id = Number(route.params.id)
    const userInfo = mockData.find(item => item.id === id)
    
    if (!userInfo) {
      ElMessage.error('用户不存在')
      router.back()
      return
    }
    
    Object.assign(formData, {
      id: userInfo.id,
      username: userInfo.username,
      nickname: userInfo.nickname,
      email: userInfo.email,
      status: userInfo.status,
      role: userInfo.role,
      created_at: userInfo.created_at
    })
  } catch (error) {
    console.error('Load user detail error:', error)
    ElMessage.error('加载用户信息失败')
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.back()
}

function handleCancel() {
  router.back()
}

function validateForm(): boolean {
  let isValid = true
  
  for (const key of Object.keys(formRules)) {
    const value = (formData as any)[key]
    const rules = formRules[key]
    
    for (const rule of rules) {
      if (rule.required && !value) {
        ElMessage.error(rule.message || '请填写必填项')
        isValid = false
        break
      }
      
      if (value && rule.min !== undefined && String(value).length < rule.min) {
        ElMessage.error(rule.message || `最少输入 ${rule.min} 个字符`)
        isValid = false
        break
      }
      
      if (value && rule.max !== undefined && String(value).length > rule.max) {
        ElMessage.error(rule.message || `最多输入 ${rule.max} 个字符`)
        isValid = false
        break
      }
      
      if (value && rule.pattern && !rule.pattern.test(String(value))) {
        ElMessage.error(rule.message || '格式不正确')
        isValid = false
        break
      }
    }
    
    if (!isValid) break
  }
  
  return isValid
}

async function handleSave() {
  if (!validateForm()) {
    return
  }
  
  submitLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const index = mockData.findIndex(item => item.id === formData.id)
    if (index > -1) {
      mockData[index] = {
        ...mockData[index],
        nickname: formData.nickname,
        email: formData.email,
        status: formData.status
      }
    }
    
    ElMessage.success('保存成功')
    router.back()
  } catch (error) {
    console.error('Save user error:', error)
    ElMessage.error('保存失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped lang="scss">
.user-edit-page {
  min-height: 100%;
  padding: 20px;

  .edit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .edit-content {
    min-height: calc(100vh - 120px);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #303133;
  }

  .form-card {
    margin-bottom: 20px;

    .user-edit-form {
      padding-top: 8px;
    }
  }

  .tips-card {
    .tips-content {
      ul {
        margin: 0;
        padding-left: 20px;

        li {
          font-size: 13px;
          color: #606266;
          line-height: 2;
          list-style-type: disc;
        }
      }
    }
  }

  .placeholder-height {
    height: 400px;
  }
}
</style>

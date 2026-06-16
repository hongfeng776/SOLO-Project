<template>
  <div class="category-page">
    <div class="page-header">
      <h2 class="page-title">资源分类</h2>
    </div>

    <div class="content-wrapper card-wrapper">
      <div class="category-header">
        <el-radio-group v-model="categoryType" size="default" @change="handleTypeChange">
          <el-radio-button value="image">图片分类</el-radio-button>
          <el-radio-button value="video">视频分类</el-radio-button>
          <el-radio-button value="template">模板分类</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增分类</el-button>
      </div>

      <el-table :data="categories" style="width: 100%" row-key="id" border>
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="type" label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ typeLabel[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="500px"
      @closed="handleDialogClosed"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="模板" value="template" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const categoryType = ref('image')
const categories = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: 0,
  name: '',
  type: 'image',
  sort: 0,
  status: 'active'
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const typeLabel: Record<string, string> = {
  image: '图片',
  video: '视频',
  template: '模板'
}

const fetchCategories = async () => {
  try {
    categories.value = []
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const handleTypeChange = () => {
  fetchCategories()
}

const handleAdd = () => {
  isEdit.value = false
  formData.id = 0
  formData.name = ''
  formData.type = categoryType.value
  formData.sort = 0
  formData.status = 'active'
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${row.name}"吗？`, '提示', { type: 'warning' })
    ElMessage.success('删除成功')
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
        dialogVisible.value = false
        fetchCategories()
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDialogClosed = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.category-page {
  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .content-wrapper {
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
  }
}
</style>

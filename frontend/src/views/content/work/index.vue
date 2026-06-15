<template>
  <div class="work-manage-page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="作品标题">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入作品标题"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="作者昵称">
          <el-input
            v-model="searchForm.author_nickname"
            placeholder="请输入作者昵称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 150px"
          >
            <el-option label="已公开" :value="1" />
            <el-option label="已下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" v-ripple @click="handleSearch">搜索</el-button>
          <el-button v-ripple @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <el-button
          type="primary"
          v-ripple
          @click="handleAdd"
        >
          <el-icon><Plus /></el-icon>
          新增作品
        </el-button>
      </div>

      <Transition name="batch-bar-slide">
        <div v-if="selectedRows.length > 0" class="batch-action-bar">
          <div class="batch-info">
            已选择 <span class="batch-count">{{ selectedRows.length }}</span> 项
          </div>
          <div class="batch-actions">
            <el-button
              type="success"
              v-ripple
              :disabled="batchActionLoading"
              @click="handleBatchPublish"
            >
              <el-icon><Top /></el-icon>
              批量上架
            </el-button>
            <el-button
              type="warning"
              v-ripple
              :disabled="batchActionLoading"
              @click="handleBatchOffline"
            >
              <el-icon><Bottom /></el-icon>
              批量下架
            </el-button>
            <el-button
              type="danger"
              v-ripple
              :disabled="batchActionLoading"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button v-ripple @click="handleClearSelection">
              取消选择
            </el-button>
          </div>
        </div>
      </Transition>

      <div v-if="loading" class="skeleton-wrapper">
        <div class="skeleton-table">
          <div class="skeleton-header">
            <div v-for="i in 7" :key="i" class="skeleton-header-item"></div>
          </div>
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div v-for="j in 7" :key="j" class="skeleton-cell"></div>
          </div>
        </div>
      </div>

      <div v-else class="table-container">
        <el-table
          ref="tableRef"
          :data="tableData"
          :stripe="true"
          :border="true"
          :highlight-current-row="true"
          height="500"
          :row-class-name="getRowClassName"
          @selection-change="handleSelectionChange"
        >
          <el-table-column
            type="selection"
            width="55"
            fixed="left"
          />
          <el-table-column
            type="index"
            label="序号"
            width="70"
            fixed="left"
            align="center"
          >
            <template #default="{ $index }">
              {{ (pagination.page - 1) * pagination.pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column
            prop="title"
            label="作品标题"
            min-width="180"
            fixed="left"
            show-overflow-tooltip
          />
          <el-table-column
            prop="author_nickname"
            label="作者"
            width="120"
            align="center"
          />
          <el-table-column
            prop="category"
            label="分类"
            width="120"
            align="center"
          >
            <template #default="{ row }">
              {{ getCategoryName(row.category) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            label="状态"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small" effect="light">
                {{ row.status === 1 ? '已公开' : '已下架' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="view_count"
            label="浏览量"
            width="100"
            align="center"
          />
          <el-table-column
            prop="like_count"
            label="点赞数"
            width="100"
            align="center"
          />
          <el-table-column
            prop="created_at"
            label="创建时间"
            width="180"
            align="center"
          />
          <el-table-column
            label="操作"
            width="260"
            fixed="right"
            align="center"
          >
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                v-ripple
                @click="handleView(row)"
              >
                详情
              </el-button>
              <el-button
                link
                type="primary"
                v-ripple
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status === 1"
                link
                type="warning"
                v-ripple
                :disabled="statusLoadingIds.includes(row.id)"
                @click="handleOffline(row)"
              >
                下架
              </el-button>
              <el-button
                v-else
                link
                type="success"
                v-ripple
                :disabled="statusLoadingIds.includes(row.id)"
                @click="handlePublish(row)"
              >
                上架
              </el-button>
              <el-button
                link
                type="danger"
                v-ripple
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无作品数据" :image-size="80">
              <template #image>
                <el-icon :size="80" color="#c0c4cc">
                  <Document />
                </el-icon>
              </template>
            </el-empty>
          </template>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="pagination.pageSizes || [10, 20, 50, 100]"
          :layout="'total, sizes, prev, pager, next, jumper'"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <Teleport to="body">
      <Transition name="work-modal-scale">
        <div v-if="dialogVisible" class="work-modal-overlay" @click.self="handleOverlayClick">
          <div class="work-modal-wrapper" :style="{ width: dialogWidth }">
            <div class="work-modal-header">
              <span class="work-modal-title">{{ dialogTitle }}</span>
              <span class="work-modal-close" @click.stop="handleCancel">
                <el-icon :size="20"><Close /></el-icon>
              </span>
            </div>
            <div class="work-modal-body">
              <el-form
                ref="formRef"
                :model="formData"
                label-width="100px"
                class="work-form"
              >
                <el-form-item label="作品标题" prop="title">
                  <HInput
                    v-model="formData.title"
                    placeholder="请输入作品标题"
                    :rules="formRules.title"
                    :disabled="isView"
                  />
                </el-form-item>
                <el-form-item label="作者昵称" prop="author_nickname">
                  <HInput
                    v-model="formData.author_nickname"
                    placeholder="请输入作者昵称"
                    :rules="formRules.author_nickname"
                    :disabled="isView"
                  />
                </el-form-item>
                <el-form-item label="作品分类" prop="category">
                  <el-select
                    v-model="formData.category"
                    placeholder="请选择作品分类"
                    style="width: 100%"
                    :disabled="isView"
                  >
                    <el-option label="插画" value="illustration" />
                    <el-option label="漫画" value="comic" />
                    <el-option label="动画" value="animation" />
                    <el-option label="游戏" value="game" />
                    <el-option label="小说" value="novel" />
                    <el-option label="摄影" value="photography" />
                  </el-select>
                </el-form-item>
                <el-form-item label="封面图片" prop="cover_image">
                  <HInput
                    v-model="formData.cover_image"
                    placeholder="请输入封面图片地址"
                    :rules="formRules.cover_image"
                    :disabled="isView"
                  />
                </el-form-item>
                <el-form-item label="作品描述" prop="description">
                  <el-input
                    v-model="formData.description"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入作品描述"
                    :disabled="isView"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item label="作品状态" prop="status">
                  <el-radio-group v-model="formData.status" :disabled="isView">
                    <el-radio :value="1">已公开</el-radio>
                    <el-radio :value="0">已下架</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>
            </div>
            <div class="work-modal-footer">
              <el-button v-ripple @click.stop="handleCancel">{{ isView ? '关闭' : '取消' }}</el-button>
              <el-button v-if="!isView" type="primary" v-ripple @click.stop="handleSubmit">确定</el-button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="batch-modal-scale">
        <div v-if="batchDialogVisible" class="work-modal-overlay" @click.self="handleBatchDialogCancel">
          <div class="batch-modal-wrapper">
            <div class="work-modal-header">
              <span class="work-modal-title">{{ batchDialogTitle }}</span>
              <span class="work-modal-close" @click.stop="handleBatchDialogCancel">
                <el-icon :size="20"><Close /></el-icon>
              </span>
            </div>
            <div class="batch-modal-body">
              <div class="batch-modal-icon" :class="batchDialogType">
                <el-icon :size="48">
                  <component :is="batchDialogType === 'delete' ? 'Warning' : (batchDialogType === 'publish' ? 'Top' : 'Bottom')" />
                </el-icon>
              </div>
              <div class="batch-modal-content">
                <p class="batch-modal-text">{{ batchDialogMessage }}</p>
                <p class="batch-modal-count">共 <span>{{ selectedRows.length }}</span> 条数据</p>
              </div>
            </div>
            <div class="work-modal-footer">
              <el-button v-ripple @click.stop="handleBatchDialogCancel" :disabled="batchActionLoading">取消</el-button>
              <el-button
                :type="batchDialogType === 'delete' ? 'danger' : (batchDialogType === 'publish' ? 'success' : 'warning')"
                v-ripple
                @click.stop="handleBatchConfirm"
                :loading="batchActionLoading"
              >
                确定
              </el-button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Close, Document, Top, Bottom, Delete } from '@element-plus/icons-vue'
import type { PaginationConfig, ValidationRule, WorkFormData } from '@/types'
import type { WorkItem } from '@/api/work'
import HInput from '@/components/HInput/index.vue'

const router = useRouter()

interface SearchForm {
  title: string
  author_nickname: string
  status: number | null
}

const loading = ref(false)
const tableRef = ref()
const tableData = ref<WorkItem[]>([])
const total = ref(0)
const selectedRows = ref<WorkItem[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增作品')
const dialogWidth = ref('600px')
const isView = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const statusLoadingIds = ref<number[]>([])
const batchActionLoading = ref(false)
const batchDialogVisible = ref(false)
const batchDialogTitle = ref('')
const batchDialogType = ref<'publish' | 'offline' | 'delete'>('publish')
const batchDialogMessage = ref('')

const searchForm = reactive<SearchForm>({
  title: '',
  author_nickname: '',
  status: null
})

const pagination = reactive<PaginationConfig>({
  page: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50, 100]
})

const formData = reactive<WorkFormData>({
  title: '',
  description: '',
  cover_image: '',
  author_id: 0,
  author_nickname: '',
  category: '',
  status: 1
})

const formRules: Record<string, ValidationRule[]> = {
  title: [
    { required: true, message: '请输入作品标题' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符' }
  ],
  author_nickname: [
    { required: true, message: '请输入作者昵称' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符' }
  ],
  category: [
    { required: true, message: '请选择作品分类' }
  ],
  cover_image: [
    { required: true, message: '请输入封面图片地址' }
  ]
}

const mockData: WorkItem[] = [
  { id: 1, title: '晨曦中的森林', description: '一幅描绘清晨森林的插画作品', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%99%A8%E6%9B%A6%E4%B8%AD%E7%9A%84%E6%A3%AE%E6%9E%97%20%E6%8F%92%E7%94%BB%20%E8%87%AA%E7%84%B6%E9%A3%8E%E5%85%89&image_size=landscape_16_9', author_id: 2, author_nickname: '张三', category: 'illustration', status: 1, view_count: 1256, like_count: 328, comment_count: 45, created_at: '2026-06-01 10:00:00', updated_at: '2026-06-01 10:00:00' },
  { id: 2, title: '星际旅行者', description: '科幻题材的短篇漫画', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%98%9F%E9%99%85%E6%97%85%E8%A1%8C%E8%80%85%20%E7%A7%91%E5%B9%BB%20%E5%AE%87%E8%88%AA%E5%91%98%20%E6%BC%AB%E7%94%BB&image_size=landscape_16_9', author_id: 3, author_nickname: '李四', category: 'comic', status: 1, view_count: 2341, like_count: 567, comment_count: 89, created_at: '2026-06-02 11:30:00', updated_at: '2026-06-03 09:15:00' },
  { id: 3, title: '像素冒险', description: '复古风格的像素游戏', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%83%8F%E7%B4%A0%E5%86%92%E9%99%A9%20%E5%A4%8D%E5%8F%A4%E9%A3%8E%E6%A0%BC%20%E6%B8%B8%E6%88%8F&image_size=landscape_16_9', author_id: 4, author_nickname: '王五', category: 'game', status: 0, view_count: 876, like_count: 234, comment_count: 32, created_at: '2026-06-03 09:15:00', updated_at: '2026-06-03 09:15:00' },
  { id: 4, title: '城市夜景', description: '都市夜景摄影作品集', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%9F%8E%E5%B8%82%E5%A4%9C%E6%99%AF%20%E6%91%84%E5%BD%B1%20%E9%83%BD%E5%B8%82%E7%B3%9A%E7%82%8A&image_size=landscape_16_9', author_id: 5, author_nickname: '赵六', category: 'photography', status: 1, view_count: 3456, like_count: 890, comment_count: 156, created_at: '2026-06-04 14:20:00', updated_at: '2026-06-05 16:45:00' },
  { id: 5, title: '梦境守护者', description: '奇幻动画短片', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%A2%A6%E5%A2%83%E5%AE%88%E6%8A%A4%E8%80%85%20%E5%A5%87%E5%B9%BB%20%E5%8A%A8%E7%94%BB%20%E7%B2%BE%E7%81%B5&image_size=landscape_16_9', author_id: 2, author_nickname: '张三', category: 'animation', status: 1, view_count: 5678, like_count: 1234, comment_count: 234, created_at: '2026-06-05 16:45:00', updated_at: '2026-06-06 08:30:00' },
  { id: 6, title: '玄幻之巅', description: '长篇玄幻小说', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E7%8E%84%E5%B9%BB%E4%B9%8B%E5%B7%85%20%E5%B0%8F%E8%AF%B4%20%E4%BF%AE%E7%82%BC%20%E5%B0%91%E5%B9%B4&image_size=landscape_16_9', author_id: 6, author_nickname: '钱七', category: 'novel', status: 1, view_count: 8901, like_count: 2345, comment_count: 456, created_at: '2026-06-06 08:30:00', updated_at: '2026-06-07 13:10:00' },
  { id: 7, title: '海底世界', description: '深海探索插画系列', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%B5%B7%E5%BA%95%E4%B8%96%E7%95%8C%20%E6%B7%B1%E6%B5%B7%20%E6%8F%92%E7%94%BB%20%E7%94%9F%E7%89%A9&image_size=landscape_16_9', author_id: 7, author_nickname: '孙八', category: 'illustration', status: 0, view_count: 456, like_count: 123, comment_count: 18, created_at: '2026-06-07 13:10:00', updated_at: '2026-06-07 13:10:00' },
  { id: 8, title: '机械纪元', description: '蒸汽朋克风格漫画', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%9C%BA%E6%A2%B0%E7%BA%AA%E5%85%83%20%E8%92%B8%E6%B1%BD%E6%9C%8B%E5%85%8B%20%E6%BC%AB%E7%94%BB%20%E6%9C%BA%E6%A2%B0&image_size=landscape_16_9', author_id: 3, author_nickname: '李四', category: 'comic', status: 1, view_count: 2134, like_count: 567, comment_count: 78, created_at: '2026-06-08 17:00:00', updated_at: '2026-06-09 10:25:00' },
  { id: 9, title: '和风物语', description: '日式风格的休闲游戏', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%92%8C%E9%A3%8E%E7%89%A9%E8%AF%AD%20%E6%97%A5%E5%BC%8F%E9%A3%8E%E6%A0%BC%20%E4%BC%91%E9%97%B2%E6%B8%B8%E6%88%8F&image_size=landscape_16_9', author_id: 8, author_nickname: '周九', category: 'game', status: 1, view_count: 1567, like_count: 345, comment_count: 56, created_at: '2026-06-09 10:25:00', updated_at: '2026-06-10 11:55:00' },
  { id: 10, title: '山水之间', description: '中国风山水画摄影', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E5%B1%B1%E6%B0%B4%E4%B9%8B%E9%97%B4%20%E4%B8%AD%E5%9B%BD%E9%A3%8E%20%E5%B1%B1%E6%B0%B4%E7%94%BB%20%E6%91%84%E5%BD%B1&image_size=landscape_16_9', author_id: 9, author_nickname: '吴十', category: 'photography', status: 1, view_count: 4321, like_count: 987, comment_count: 123, created_at: '2026-06-10 11:55:00', updated_at: '2026-06-11 09:00:00' },
  { id: 11, title: '魔法学院', description: '校园魔法题材动画', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E9%AD%94%E6%B3%95%E5%AD%A6%E9%99%A2%20%E6%A0%A1%E5%9B%AD%20%E5%8A%A8%E7%94%BB%20%E9%AD%94%E6%B3%95&image_size=landscape_16_9', author_id: 5, author_nickname: '赵六', category: 'animation', status: 0, view_count: 234, like_count: 67, comment_count: 12, created_at: '2026-06-11 09:00:00', updated_at: '2026-06-11 09:00:00' },
  { id: 12, title: '末世求生', description: '末日题材网络小说', cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E6%9C%AB%E4%B8%96%E6%B1%82%E7%94%9F%20%E6%9C%AB%E6%97%A5%20%E5%B0%8F%E8%AF%B4%20%E4%BA%BA%E7%B1%BB&image_size=landscape_16_9', author_id: 6, author_nickname: '钱七', category: 'novel', status: 1, view_count: 6789, like_count: 1567, comment_count: 345, created_at: '2026-06-12 14:30:00', updated_at: '2026-06-13 16:20:00' }
]

const categoryMap: Record<string, string> = {
  illustration: '插画',
  comic: '漫画',
  animation: '动画',
  game: '游戏',
  novel: '小说',
  photography: '摄影'
}

function getCategoryName(key?: string) {
  if (!key) return '-'
  return categoryMap[key] || key
}

function getFilteredData() {
  let result = [...mockData]
  
  if (searchForm.title) {
    result = result.filter(item => 
      item.title.toLowerCase().includes(searchForm.title.toLowerCase())
    )
  }
  
  if (searchForm.author_nickname) {
    result = result.filter(item => 
      item.author_nickname.toLowerCase().includes(searchForm.author_nickname.toLowerCase())
    )
  }

  if (searchForm.status !== null) {
    result = result.filter(item => item.status === searchForm.status)
  }
  
  return result
}

function getRowClassName({ row }: { row: WorkItem }) {
  return row.status === 0 ? 'work-row-offline' : ''
}

async function loadData() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const filteredData = getFilteredData()
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    
    tableData.value = filteredData.slice(start, end)
    total.value = filteredData.length
  } catch (error) {
    console.error('Load work list error:', error)
    ElMessage.error('加载作品列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  searchForm.title = ''
  searchForm.author_nickname = ''
  searchForm.status = null
  handleSearch()
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

function handleSelectionChange(selection: WorkItem[]) {
  selectedRows.value = selection
}

function handleClearSelection() {
  tableRef.value?.clearSelection()
}

function resetForm() {
  formData.title = ''
  formData.description = ''
  formData.cover_image = ''
  formData.author_id = 0
  formData.author_nickname = ''
  formData.category = ''
  formData.status = 1
}

function handleAdd() {
  dialogTitle.value = '新增作品'
  isView.value = false
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

function handleView(row: WorkItem) {
  router.push(`/content/work/${row.id}`)
}

function handleEdit(row: WorkItem) {
  dialogTitle.value = '编辑作品'
  isView.value = false
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    title: row.title,
    description: row.description,
    cover_image: row.cover_image,
    author_id: row.author_id,
    author_nickname: row.author_nickname,
    category: row.category,
    status: row.status
  })
  dialogVisible.value = true
}

function handleOverlayClick() {
  handleCancel()
}

function handleCancel() {
  dialogVisible.value = false
}

async function handlePublish(row: WorkItem) {
  if (statusLoadingIds.value.includes(row.id)) return
  try {
    await ElMessageBox.confirm(`确定要上架作品 "${row.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    statusLoadingIds.value.push(row.id)
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = mockData.findIndex(item => item.id === row.id)
    if (index > -1) {
      mockData[index].status = 1
    }
    
    ElMessage.success('上架成功')
    loadData()
    
    setTimeout(() => {
      statusLoadingIds.value = statusLoadingIds.value.filter(id => id !== row.id)
    }, 300)
  } catch {
    statusLoadingIds.value = statusLoadingIds.value.filter(id => id !== row.id)
  }
}

async function handleOffline(row: WorkItem) {
  if (statusLoadingIds.value.includes(row.id)) return
  try {
    await ElMessageBox.confirm(`确定要下架作品 "${row.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    statusLoadingIds.value.push(row.id)
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = mockData.findIndex(item => item.id === row.id)
    if (index > -1) {
      mockData[index].status = 0
    }
    
    ElMessage.success('下架成功')
    loadData()
    
    setTimeout(() => {
      statusLoadingIds.value = statusLoadingIds.value.filter(id => id !== row.id)
    }, 300)
  } catch {
    statusLoadingIds.value = statusLoadingIds.value.filter(id => id !== row.id)
  }
}

async function handleDelete(row: WorkItem) {
  try {
    await ElMessageBox.confirm(`确定要删除作品 "${row.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = mockData.findIndex(item => item.id === row.id)
    if (index > -1) {
      mockData.splice(index, 1)
    }
    
    ElMessage.success('删除成功')
    loadData()
  } catch {
  }
}

function handleBatchPublish() {
  batchDialogType.value = 'publish'
  batchDialogTitle.value = '批量上架'
  batchDialogMessage.value = '确定要将选中的作品批量上架吗？'
  batchDialogVisible.value = true
}

function handleBatchOffline() {
  batchDialogType.value = 'offline'
  batchDialogTitle.value = '批量下架'
  batchDialogMessage.value = '确定要将选中的作品批量下架吗？'
  batchDialogVisible.value = true
}

function handleBatchDelete() {
  batchDialogType.value = 'delete'
  batchDialogTitle.value = '批量删除'
  batchDialogMessage.value = '确定要删除选中的作品吗？此操作不可恢复！'
  batchDialogVisible.value = true
}

function handleBatchDialogCancel() {
  batchDialogVisible.value = false
}

async function handleBatchConfirm() {
  batchActionLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const ids = selectedRows.value.map(item => item.id)
    
    if (batchDialogType.value === 'publish') {
      ids.forEach(id => {
        const index = mockData.findIndex(item => item.id === id)
        if (index > -1) mockData[index].status = 1
      })
      ElMessage.success(`成功上架 ${ids.length} 个作品`)
    } else if (batchDialogType.value === 'offline') {
      ids.forEach(id => {
        const index = mockData.findIndex(item => item.id === id)
        if (index > -1) mockData[index].status = 0
      })
      ElMessage.success(`成功下架 ${ids.length} 个作品`)
    } else if (batchDialogType.value === 'delete') {
      for (let i = mockData.length - 1; i >= 0; i--) {
        if (ids.includes(mockData[i].id)) {
          mockData.splice(i, 1)
        }
      }
      ElMessage.success(`成功删除 ${ids.length} 个作品`)
    }
    
    batchDialogVisible.value = false
    handleClearSelection()
    loadData()
  } catch (error) {
    console.error('Batch action error:', error)
    ElMessage.error('操作失败')
  } finally {
    batchActionLoading.value = false
  }
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
    }
    
    if (!isValid) break
  }
  
  return isValid
}

async function handleSubmit() {
  if (isView.value) {
    dialogVisible.value = false
    return
  }

  if (!validateForm()) {
    return
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (isEdit.value && editId.value) {
      const index = mockData.findIndex(item => item.id === editId.value)
      if (index > -1) {
        mockData[index] = {
          ...mockData[index],
          ...formData,
          updated_at: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
        }
      }
      ElMessage.success('编辑成功')
    } else {
      const newId = Math.max(...mockData.map(item => item.id)) + 1
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      mockData.unshift({
        id: newId,
        ...formData,
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        created_at: now,
        updated_at: now
      })
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('Submit error:', error)
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.work-manage-page {
  .search-card {
    margin-bottom: 16px;

    .search-form {
      margin: 0;
    }
  }

  .table-card {
    .table-toolbar {
      display: flex;
      justify-content: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }
  }

  .batch-action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    margin-bottom: 16px;
    background: linear-gradient(90deg, #ECF5FF 0%, #F0F7FF 100%);
    border-radius: 6px;
    border: 1px solid #D9ECFF;

    .batch-info {
      font-size: 14px;
      color: #606266;

      .batch-count {
        font-size: 18px;
        font-weight: 600;
        color: #409EFF;
        margin: 0 4px;
      }
    }

    .batch-actions {
      display: flex;
      gap: 8px;
    }
  }

  .skeleton-wrapper {
    width: 100%;
  }

  .skeleton-table {
    width: 100%;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .skeleton-header {
      display: flex;
      background-color: #fafafa;

      .skeleton-header-item {
        flex: 1;
        height: 48px;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: 14px;
          left: 12px;
          right: 12px;
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 2px;
        }
      }
    }

    .skeleton-row {
      display: flex;
      border-top: 1px solid #ebeef5;

      .skeleton-cell {
        flex: 1;
        height: 48px;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: 14px;
          left: 12px;
          right: 12px;
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 2px;
        }
      }
    }
  }

  .table-container {
    width: 100%;

    :deep(.el-table) {
      width: 100%;

      th.el-table__cell {
        background-color: #fafafa;
        color: #303133;
        font-weight: 600;
      }

      tr.el-table__row:hover > td {
        background-color: #f5f7fa;
      }

      tr.work-row-offline:hover > td {
        background: linear-gradient(90deg, rgba(240, 247, 255, 0.6) 0%, rgba(236, 245, 255, 0.6) 100%) !important;
        box-shadow: inset 0 0 12px rgba(64, 158, 255, 0.1);
      }

      .el-table__row--striped td {
        background-color: #fafafa;
      }

      .el-table__empty-block {
        min-height: 200px;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0 0 0;
    background-color: #fff;
  }
}

.batch-bar-slide-enter-active,
.batch-bar-slide-leave-active {
  transition: all 0.3s ease;
}

.batch-bar-slide-enter-from,
.batch-bar-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.work-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.work-modal-wrapper {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.batch-modal-wrapper {
  width: 440px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.work-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fff;

  .work-modal-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .work-modal-close {
    cursor: pointer;
    color: #909399;
    transition: color 0.3s;
    line-height: 1;

    &:hover {
      color: #409eff;
    }
  }
}

.work-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.batch-modal-body {
  padding: 32px 24px;
  display: flex;
  align-items: center;
  gap: 20px;

  .batch-modal-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.publish {
      background: #F0F9EB;
      color: #67C23A;
    }

    &.offline {
      background: #FDF6EC;
      color: #E6A23C;
    }

    &.delete {
      background: #FEF0F0;
      color: #F56C6C;
    }
  }

  .batch-modal-content {
    flex: 1;

    .batch-modal-text {
      font-size: 15px;
      color: #303133;
      margin: 0 0 8px 0;
      line-height: 1.6;
    }

    .batch-modal-count {
      font-size: 14px;
      color: #909399;
      margin: 0;

      span {
        color: #409EFF;
        font-weight: 600;
        font-size: 16px;
      }
    }
  }
}

.work-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 24px;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
}

.work-modal-scale-enter-active,
.work-modal-scale-leave-active {
  transition: opacity 0.3s ease;

  .work-modal-wrapper,
  .batch-modal-wrapper {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.work-modal-scale-enter-from,
.work-modal-scale-leave-to {
  opacity: 0;

  .work-modal-wrapper,
  .batch-modal-wrapper {
    transform: scale(0.9);
    opacity: 0;
  }
}

.batch-modal-scale-enter-active,
.batch-modal-scale-leave-active {
  transition: opacity 0.3s ease;

  .batch-modal-wrapper {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.batch-modal-scale-enter-from,
.batch-modal-scale-leave-to {
  opacity: 0;

  .batch-modal-wrapper {
    transform: scale(0.85);
    opacity: 0;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>

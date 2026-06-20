<template>
  <el-dialog
    v-model="dialogVisible"
    title="商品报名"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-steps :active="currentStep" finish-status="success" align-center class="mb-24">
      <el-step title="选择商品" />
      <el-step title="准入校验" />
      <el-step title="确认提交" />
    </el-steps>

    <div v-if="currentStep === 0" class="step-content">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入商品名称或ID搜索"
          clearable
          style="width: 300px"
          @keyup.enter="searchGoods"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="searchGoods">搜索</el-button>
        <el-upload
          class="ml-16"
          :show-file-list="false"
          accept=".xlsx,.xls"
          :before-upload="beforeImport"
        >
          <el-button>
            <el-icon><Upload /></el-icon>批量导入
          </el-button>
        </el-upload>
      </div>

      <div class="selected-count">
        已选择 <span class="count">{{ selectedGoods.length }}</span> 个商品
      </div>

      <div class="goods-list">
        <el-table
          :data="goodsList"
          height="360"
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" :selectable="isSelectable" />
          <el-table-column prop="goodsName" label="商品名称" min-width="200" />
          <el-table-column prop="categoryName" label="类目" width="100" />
          <el-table-column prop="price" label="价格" width="100" align="right">
            <template #default="{ row }">¥{{ row.price?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="80" align="center" />
          <el-table-column prop="complianceRating" label="评级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="getRatingType(row.complianceRating)" size="small">
                {{ getRatingLabel(row.complianceRating) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="violationCount" label="违规记录" width="90" align="center">
            <template #default="{ row }">
              <span :class="{ 'text-red': row.violationCount > 0 }">{{ row.violationCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="报名状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isApplied" type="info" size="small">已报名</el-tag>
              <el-tag v-else-if="!row.canApply" type="danger" size="small">不可报名</el-tag>
              <el-tag v-else type="success" size="small">可报名</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-12"
        background
        @current-change="loadGoods"
        @size-change="loadGoods"
      />
    </div>

    <div v-if="currentStep === 1" class="step-content">
      <div v-loading="validating" class="validate-content">
        <div v-if="validateResults.length > 0">
          <div class="summary">
            <span>校验结果：</span>
            <span class="success">{{ passCount }} 个通过</span>
            <span class="failed">{{ failCount }} 个未通过</span>
          </div>
          <el-table :data="validateResults" height="360" border>
            <el-table-column prop="goodsName" label="商品名称" min-width="180" />
            <el-table-column label="校验结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                  {{ row.passed ? '通过' : '未通过' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="errors" label="未通过原因" min-width="300">
              <template #default="{ row }">
                <div v-if="row.errors && row.errors.length > 0" class="error-list">
                  <div v-for="(err, idx) in row.errors" :key="idx" class="error-item">
                    <el-icon color="var(--el-color-danger)"><Warning /></el-icon>
                    <span>{{ err.message }}</span>
                  </div>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="warnings" label="警告信息" min-width="200">
              <template #default="{ row }">
                <div v-if="row.warnings && row.warnings.length > 0" class="warning-list">
                  <div v-for="(warn, idx) in row.warnings" :key="idx" class="warning-item">
                    <el-icon color="var(--el-color-warning)"><InfoFilled /></el-icon>
                    <span>{{ warn.message }}</span>
                  </div>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <div v-if="currentStep === 2" class="step-content">
      <div class="confirm-info">
        <el-alert
          :title="`确认提交 ${passCount} 个商品报名？`"
          type="info"
          :closable="false"
          show-icon
        />
        <div v-if="failCount > 0" class="mt-12">
          <el-alert
            :title="`有 ${failCount} 个商品未通过校验，将不会被提交`"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
        <div class="submit-form mt-20">
          <el-form :model="submitForm" label-width="100px">
            <el-form-item label="统一活动价">
              <el-input-number
                v-model="submitForm.activityPrice"
                :min="0"
                :precision="2"
                :step="1"
                placeholder="不填则使用商品原价"
                style="width: 200px"
              />
              <span class="tip ml-8">可选，统一设置活动价格</span>
            </el-form-item>
            <el-form-item label="活动库存">
              <el-input-number
                v-model="submitForm.stock"
                :min="0"
                :precision="0"
                :step="10"
                placeholder="不填则使用商品库存"
                style="width: 200px"
              />
              <span class="tip ml-8">可选，统一设置活动库存</span>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
      <el-button v-if="currentStep < 2" type="primary" @click="nextStep" :disabled="canNextDisabled">
        下一步
      </el-button>
      <el-button v-if="currentStep === 2" type="primary" @click="handleSubmit" :loading="submitting">
        确认提交
      </el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Upload,
  Warning,
  InfoFilled
} from '@element-plus/icons-vue'
import { validateApplyProduct, applyProducts } from '@/api/marketing'
import type { AdmissionValidateResult } from '@/types/business'

const props = defineProps<{
  modelValue: boolean
  marketingId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentStep = ref(0)
const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const goodsList = ref<any[]>([])
const selectedGoods = ref<any[]>([])
const validating = ref(false)
const submitting = ref(false)
const validateResults = ref<any[]>([])

const submitForm = reactive({
  activityPrice: undefined as number | undefined,
  stock: undefined as number | undefined
})

const passCount = computed(() => validateResults.value.filter(r => r.passed).length)
const failCount = computed(() => validateResults.value.filter(r => !r.passed).length)

const canNextDisabled = computed(() => {
  if (currentStep.value === 0) {
    return selectedGoods.value.length === 0
  }
  return false
})

const mockGoodsList = [
  { id: 1, goodsName: 'iPhone 15 Pro Max 256GB', categoryName: '电子产品', price: 9999, stock: 500, complianceRating: 1, violationCount: 0, canApply: true, isApplied: false },
  { id: 2, goodsName: '华为Mate 60 Pro 512GB', categoryName: '电子产品', price: 6999, stock: 200, complianceRating: 2, violationCount: 1, canApply: true, isApplied: false },
  { id: 3, goodsName: '小米14 Ultra 陶瓷版', categoryName: '电子产品', price: 5999, stock: 50, complianceRating: 3, violationCount: 2, canApply: false, isApplied: false },
  { id: 4, goodsName: '耐克Air Jordan 1 经典款', categoryName: '服装鞋帽', price: 1299, stock: 1000, complianceRating: 1, violationCount: 0, canApply: true, isApplied: true },
  { id: 5, goodsName: '阿迪达斯Ultraboost跑鞋', categoryName: '服装鞋帽', price: 899, stock: 800, complianceRating: 2, violationCount: 0, canApply: true, isApplied: false },
  { id: 6, goodsName: '三只松鼠坚果大礼包', categoryName: '食品饮料', price: 199, stock: 5000, complianceRating: 1, violationCount: 0, canApply: true, isApplied: false },
  { id: 7, goodsName: '良品铺子每日坚果', categoryName: '食品饮料', price: 129, stock: 3000, complianceRating: 2, violationCount: 0, canApply: true, isApplied: false },
  { id: 8, goodsName: '兰蔻小黑瓶精华液', categoryName: '美妆个护', price: 899, stock: 300, complianceRating: 1, violationCount: 0, canApply: true, isApplied: false },
  { id: 9, goodsName: '雅诗兰黛小棕瓶眼霜', categoryName: '美妆个护', price: 599, stock: 20, complianceRating: 4, violationCount: 3, canApply: false, isApplied: false },
  { id: 10, goodsName: '北欧风格实木餐桌', categoryName: '家居用品', price: 2999, stock: 100, complianceRating: 2, violationCount: 0, canApply: true, isApplied: false }
]

const loadGoods = () => {
  const start = (page.value - 1) * pageSize.value
  const end = start + pageSize.value
  let filtered = mockGoodsList

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = mockGoodsList.filter(
      g => g.goodsName.toLowerCase().includes(keyword) || g.id.toString().includes(keyword)
    )
  }

  total.value = filtered.length
  goodsList.value = filtered.slice(start, end)
}

const searchGoods = () => {
  page.value = 1
  loadGoods()
}

const handleSelectionChange = (selection: any[]) => {
  selectedGoods.value = selection.filter(g => g.canApply && !g.isApplied)
}

const isSelectable = (row: any) => {
  return row.canApply && !row.isApplied
}

const getRatingLabel = (rating?: number) => {
  const labels: Record<number, string> = { 1: 'A级', 2: 'B级', 3: 'C级', 4: 'D级' }
  return labels[rating ?? 4] || '未知'
}

const getRatingType = (rating?: number): 'success' | 'primary' | 'warning' | 'danger' => {
  const types: Record<number, 'success' | 'primary' | 'warning' | 'danger'> = {
    1: 'success',
    2: 'primary',
    3: 'warning',
    4: 'danger'
  }
  return types[rating ?? 4] || 'info' as any
}

const beforeImport = (file: File) => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  if (!isExcel) {
    ElMessage.error('请上传Excel文件')
    return false
  }
  ElMessage.success('导入功能演示：实际项目中需对接后端导入接口')
  return false
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    if (selectedGoods.value.length === 0) {
      ElMessage.warning('请先选择商品')
      return
    }
    currentStep.value = 1
    await runValidation()
  } else if (currentStep.value === 1) {
    if (passCount.value === 0) {
      ElMessage.warning('没有可提交的商品')
      return
    }
    currentStep.value = 2
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const runValidation = async () => {
  validating.value = true
  validateResults.value = []

  try {
    const results = []
    for (const goods of selectedGoods.value) {
      try {
        const res = await validateApplyProduct(props.marketingId, goods.id)
        results.push({
          goodsId: goods.id,
          goodsName: goods.goodsName,
          passed: res.data.passed,
          errors: res.data.errors || [],
          warnings: res.data.warnings || []
        })
      } catch (err) {
        results.push({
          goodsId: goods.id,
          goodsName: goods.goodsName,
          passed: false,
          errors: [{ message: '校验请求失败' }],
          warnings: []
        })
      }
    }
    validateResults.value = results
  } finally {
    validating.value = false
  }
}

const handleSubmit = async () => {
  if (passCount.value === 0) {
    ElMessage.warning('没有可提交的商品')
    return
  }

  submitting.value = true
  try {
    const passedGoods = validateResults.value.filter(r => r.passed)
    const goodsIds = passedGoods.map(r => r.goodsId)

    const res = await applyProducts({
      marketingId: props.marketingId,
      goodsIds,
      activityPrice: submitForm.activityPrice,
      stock: submitForm.stock
    })

    ElMessage.success(`提交成功：${res.data.success}个成功，${res.data.failed}个失败`)
    emit('success')
    dialogVisible.value = false
  } catch (err) {
    ElMessage.error((err as Error).message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  currentStep.value = 0
  selectedGoods.value = []
  validateResults.value = []
  submitForm.activityPrice = undefined
  submitForm.stock = undefined
  searchKeyword.value = ''
  page.value = 1
}

watch(() => props.modelValue, (val) => {
  if (val) {
    loadGoods()
  }
})
</script>

<style lang="scss" scoped>
.mb-24 {
  margin-bottom: 24px;
}

.mt-12 {
  margin-top: 12px;
}

.mt-20 {
  margin-top: 20px;
}

.ml-8 {
  margin-left: 8px;
}

.ml-16 {
  margin-left: 16px;
}

.step-content {
  min-height: 450px;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.selected-count {
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--el-text-color-regular);

  .count {
    color: var(--el-color-primary);
    font-weight: 600;
    font-size: 16px;
    margin: 0 4px;
  }
}

.goods-list {
  .text-red {
    color: var(--el-color-danger);
  }
}

.validate-content {
  .summary {
    margin-bottom: 12px;
    font-size: 14px;

    .success {
      color: var(--el-color-success);
      font-weight: 600;
      margin-left: 12px;
    }

    .failed {
      color: var(--el-color-danger);
      font-weight: 600;
      margin-left: 12px;
    }
  }

  .error-list {
    .error-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 4px;
      font-size: 12px;
      color: var(--el-color-danger);
    }
  }

  .warning-list {
    .warning-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 4px;
      font-size: 12px;
      color: var(--el-color-warning);
    }
  }
}

.confirm-info {
  .tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>

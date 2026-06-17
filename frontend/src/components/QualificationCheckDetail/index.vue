<template>
  <div class="qualification-check-detail">
    <div class="check-header">
      <div class="check-summary">
        <div class="summary-icon" :class="currentOverallPassed ? 'passed' : 'failed'">
          <el-icon v-if="currentOverallPassed"><CircleCheck /></el-icon>
          <el-icon v-else><CircleClose /></el-icon>
        </div>
        <div class="summary-info">
          <h3>资质校验结果</h3>
          <p :class="currentOverallPassed ? 'text-success' : 'text-danger'">
            {{ currentOverallPassed ? '全部校验通过' : `存在${currentViolationPoints.length}项异常` }}
          </p>
        </div>
        <el-button type="primary" :loading="checking" @click="handleRecheck">
          <el-icon><Refresh /></el-icon>
          重新校验
        </el-button>
      </div>
    </div>

    <div v-if="strictness" class="strictness-info">
      <el-alert :title="strictness.description" :type="strictness.strictness === 'high' ? 'warning' : 'info'" show-icon>
        <template #default>
          <div class="strictness-details">
            <el-tag size="small" :type="strictness.isNewDriver ? 'warning' : 'info'">
              {{ strictness.isNewDriver ? '新手司机' : '老司机' }}
            </el-tag>
            <el-tag size="small" :type="strictness.isLowReputation ? 'danger' : 'success'">
              {{ strictness.isLowReputation ? '低信誉' : '正常信誉' }}
            </el-tag>
            <el-tag size="small" :type="strictness.requireManualReview ? 'warning' : 'info'">
              {{ strictness.requireManualReview ? '需人工复核' : '系统自动审核' }}
            </el-tag>
          </div>
        </template>
      </el-alert>
    </div>

    <div v-if="currentViolationPoints.length > 0" class="violation-section">
      <h4 class="section-title">
        <el-icon><Warning /></el-icon>
        违规点位标注
      </h4>
      <div class="violation-list">
        <div
          v-for="(point, index) in currentViolationPoints"
          :key="index"
          class="violation-item"
          :class="'severity-' + point.severity"
        >
          <div class="violation-badge">
            <el-icon v-if="point.severity === 'high'"><CircleClose /></el-icon>
            <el-icon v-else><Warning /></el-icon>
          </div>
          <div class="violation-content">
            <div class="violation-header">
              <span class="violation-name">{{ point.name }}</span>
              <el-tag size="small" :type="point.severity === 'high' ? 'danger' : 'warning'">
                {{ point.severity === 'high' ? '高风险' : '中风险' }}
              </el-tag>
            </div>
            <p class="violation-message">{{ point.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="check-items">
      <h4 class="section-title">
        <el-icon><Document /></el-icon>
        详细校验项
      </h4>
      <div class="check-grid">
        <div
          v-for="check in currentChecks"
          :key="check.type"
          class="check-card"
          :class="{
            'passed': check.passed && !check.isExpired && !check.hasDuplicate && !check.isSuspicious,
            'failed': !check.passed || check.isExpired || check.hasDuplicate || check.isSuspicious,
            'expired': check.isExpired,
            'duplicate': check.hasDuplicate,
            'suspicious': check.isSuspicious
          }"
        >
          <div class="check-card-header">
            <el-icon class="check-icon" :class="getCheckIconClass(check)">
              <CircleCheck v-if="check.passed && !check.isExpired && !check.hasDuplicate && !check.isSuspicious" />
              <CircleClose v-else-if="check.isExpired || check.hasDuplicate || check.isSuspicious" />
              <Warning v-else />
            </el-icon>
            <span class="check-name">{{ check.name }}</span>
            <el-tag
              size="small"
              :type="getCheckTagType(check)"
            >
              {{ getCheckStatusText(check) }}
            </el-tag>
          </div>
          <div class="check-card-body">
            <p class="check-message" :class="{'text-danger': !check.passed || check.isExpired}">
              {{ check.message }}
            </p>
            <div class="check-details">
              <div v-if="check.hasImage !== undefined" class="detail-row">
                <span class="detail-label">资料照片：</span>
                <el-tag size="small" :type="check.hasImage ? 'success' : 'info'">
                  {{ check.hasImage ? '已上传' : '未上传' }}
                </el-tag>
              </div>
              <div v-if="check.validDate" class="detail-row">
                <span class="detail-label">有效期至：</span>
                <span :class="{'text-danger': check.isExpired}">{{ formatDate(check.validDate) }}</span>
              </div>
              <div v-if="check.score !== undefined" class="detail-row">
                <span class="detail-label">核验分数：</span>
                <el-progress
                  :percentage="check.score"
                  :color="check.score >= 80 ? '#67c23a' : '#e6a23c'"
                  :stroke-width="6"
                  style="width: 100px"
                />
              </div>
              <div v-if="check.hasDuplicate" class="detail-row">
                <span class="detail-label">重复账号：</span>
                <span class="text-danger">{{ check.duplicateCount }}个</span>
              </div>
              <div v-if="check.isSuspicious && check.suspiciousItems" class="detail-row">
                <span class="detail-label">可疑项：</span>
                <div class="suspicious-list">
                  <span v-for="(item, idx) in check.suspiciousItems" :key="idx" class="suspicious-item">
                    {{ item }}
                  </span>
                </div>
              </div>
              <div v-if="check.city" class="detail-row">
                <span class="detail-label">入驻城市：</span>
                <span>{{ getCityName(check.city) }}</span>
              </div>
              <div v-if="check.requiredScore" class="detail-row">
                <span class="detail-label">要求信誉分：</span>
                <span>{{ check.requiredScore }}分以上</span>
              </div>
              <div v-if="check.requiredYears" class="detail-row">
                <span class="detail-label">要求驾龄：</span>
                <span>{{ check.requiredYears }}年以上</span>
              </div>
              <div v-if="check.vehicleType" class="detail-row">
                <span class="detail-label">车型类别：</span>
                <span>{{ getVehicleTypeName(check.vehicleType) }}</span>
              </div>
              <div v-if="check.requiredLevel" class="detail-row">
                <span class="detail-label">要求等级：</span>
                <span>{{ check.requiredLevel === 1 ? '新手' : '老司机' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CircleCheck,
  CircleClose,
  Warning,
  Refresh,
  Document
} from '@element-plus/icons-vue'
import { checkQualificationApi, getAuditStrictnessApi } from '@/api/driver'
import { CityMap, VehicleTypeMap } from '@/enums/driver'
import { formatDate } from '@/utils/format'
import type { QualificationCheck, ViolationPoint, AuditStrictness } from '@/types/driver'

interface Props {
  driverId: number
  checks?: QualificationCheck[]
  violationPoints?: ViolationPoint[]
  overallPassed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  checks: () => [],
  violationPoints: () => [],
  overallPassed: true
})

const emit = defineEmits(['rechecked'])

const checking = ref(false)
const currentChecks = ref<QualificationCheck[]>(props.checks)
const currentViolationPoints = ref<ViolationPoint[]>(props.violationPoints)
const currentOverallPassed = ref(props.overallPassed)
const strictness = ref<AuditStrictness | null>(null)

watch(() => props.checks, (val) => {
  currentChecks.value = val
}, { immediate: true })

watch(() => props.violationPoints, (val) => {
  currentViolationPoints.value = val
}, { immediate: true })

watch(() => props.overallPassed, (val) => {
  currentOverallPassed.value = val
}, { immediate: true })

const getCheckIconClass = (check: QualificationCheck) => {
  if (check.passed && !check.isExpired && !check.hasDuplicate && !check.isSuspicious) {
    return 'icon-passed'
  }
  if (check.isExpired || check.hasDuplicate || check.isSuspicious) {
    return 'icon-danger'
  }
  return 'icon-warning'
}

const getCheckTagType = (check: QualificationCheck) => {
  if (check.passed && !check.isExpired && !check.hasDuplicate && !check.isSuspicious) {
    return 'success'
  }
  if (check.isExpired || check.hasDuplicate || check.isSuspicious) {
    return 'danger'
  }
  return 'warning'
}

const getCheckStatusText = (check: QualificationCheck) => {
  if (check.isExpired) return '已过期'
  if (check.hasDuplicate) return '重复账号'
  if (check.isSuspicious) return '疑似虚假'
  return check.passed ? '通过' : '未通过'
}

const getCityName = (code: string) => CityMap[code] || code
const getVehicleTypeName = (code: string) => VehicleTypeMap[code] || code

const handleRecheck = async () => {
  checking.value = true
  try {
    const res = await checkQualificationApi(props.driverId)
    currentChecks.value = res.data.checks
    currentViolationPoints.value = res.data.violationPoints
    currentOverallPassed.value = res.data.overallPassed

    const strictnessRes = await getAuditStrictnessApi(props.driverId)
    strictness.value = strictnessRes.data

    ElMessage.success('重新校验完成')
    emit('rechecked', res.data)
  } catch (error: any) {
    ElMessage.error(error.message || '校验失败')
  } finally {
    checking.value = false
  }
}

const loadStrictness = async () => {
  try {
    const res = await getAuditStrictnessApi(props.driverId)
    strictness.value = res.data
  } catch (error) {
    console.error('获取审核严格度失败', error)
  }
}

loadStrictness()
</script>

<style lang="scss" scoped>
.qualification-check-detail {
  .check-header {
    margin-bottom: 20px;

    .check-summary {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
      border-radius: 12px;

      .summary-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: #fff;

        &.passed {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
        }

        &.failed {
          background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
        }
      }

      .summary-info {
        flex: 1;

        h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #303133;
        }

        p {
          margin: 0;
          font-size: 14px;
        }

        .text-success {
          color: #67c23a;
        }

        .text-danger {
          color: #f56c6c;
        }
      }
    }
  }

  .strictness-info {
    margin-bottom: 20px;

    .strictness-details {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }
  }

  .violation-section {
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #f56c6c;
    }

    .violation-list {
      .violation-item {
        display: flex;
        gap: 12px;
        padding: 16px;
        background: #fff;
        border-radius: 8px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

        &:last-child {
          margin-bottom: 0;
        }

        .violation-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .violation-content {
          flex: 1;

          .violation-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;

            .violation-name {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }
          }

          .violation-message {
            margin: 0;
            font-size: 13px;
            color: #606266;
          }
        }

        &.severity-high {
          border-left: 4px solid #f56c6c;

          .violation-badge {
            background: #fef0f0;
            color: #f56c6c;
          }
        }

        &.severity-medium {
          border-left: 4px solid #e6a23c;

          .violation-badge {
            background: #fdf6ec;
            color: #e6a23c;
          }
        }
      }
    }
  }

  .check-items {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #303133;
    }

    .check-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .check-card {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #ebeef5;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .check-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;

        .check-icon {
          font-size: 20px;

          &.icon-passed {
            color: #67c23a;
          }

          &.icon-danger {
            color: #f56c6c;
          }

          &.icon-warning {
            color: #e6a23c;
          }
        }

        .check-name {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }
      }

      .check-card-body {
        .check-message {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #606266;

          &.text-danger {
            color: #f56c6c;
          }
        }

        .check-details {
          .detail-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 12px;
            color: #909399;

            &:last-child {
              margin-bottom: 0;
            }

            .detail-label {
              color: #909399;
              min-width: 80px;
            }

            .text-danger {
              color: #f56c6c;
            }

            .suspicious-list {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;

              .suspicious-item {
                padding: 2px 8px;
                background: #fef0f0;
                color: #f56c6c;
                border-radius: 4px;
                font-size: 11px;
              }
            }
          }
        }
      }

      &.passed {
        border-color: #e1f3d8;
        background: linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%);
      }

      &.failed, &.expired, &.duplicate, &.suspicious {
        border-color: #fbc4c4;
        background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
      }
    }
  }
}
</style>

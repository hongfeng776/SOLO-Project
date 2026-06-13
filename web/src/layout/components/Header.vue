<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessageBox } from 'element-plus'

defineProps({
  collapse: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['collapse'])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const breadcrumbs = computed(() => {
  return route.matched.filter((item) => item.meta && item.meta.title)
})

const username = computed(() => userStore.username)
const avatar = computed(() => userStore.avatar)

function handleCommand(command: string) {
  if (command === 'logout') {
    handleLogout()
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.handleLogout()
    router.push('/login')
  } catch (error) {
    // 用户取消操作
  }
}

function toggleCollapse() {
  emit('collapse')
}
</script>

<template>
  <div class="header-container">
    <div class="header-left">
      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon :size="20">
          <Fold v-if="!collapse" />
          <Expand v-else />
        </el-icon>
      </div>
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbs"
          :key="index"
          :to="index === breadcrumbs.length - 1 ? undefined : item.path"
        >
          {{ item.meta?.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-dropdown @command="handleCommand" trigger="click">
        <div class="user-info">
          <el-avatar :size="32" :src="avatar">
            <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <span class="username">{{ username }}</span>
          <el-icon :size="12" class="arrow-down"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-container {
  height: $header-height;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative;
  z-index: 1000;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .collapse-btn {
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color $transition-duration;

      &:hover {
        background-color: $background-color;
      }
    }

    .breadcrumb {
      :deep(.el-breadcrumb__item) {
        .el-breadcrumb__inner {
          font-weight: normal;
        }
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color $transition-duration;

      &:hover {
        background-color: $background-color;
      }

      .username {
        font-size: 14px;
        color: $text-regular;
      }

      .arrow-down {
        color: $text-secondary;
      }
    }
  }
}
</style>

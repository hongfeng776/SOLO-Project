<script setup lang="ts">
import { ref, reactive, onMounted, computed, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { contentApi, categoryApi, tagApi, uploadApi } from '@/api';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadProps } from 'element-plus';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import type { ContentInfo, CategoryInfo, TagInfo, TableColumn, ApiResponse } from '@/types';
import { sleep, formatThousand } from '@/utils/common';

const router = useRouter();
const tableRef = ref<InstanceType<typeof BaseTable>>();
const formRef = ref<FormInstance>();

const loading = ref(false);
const list = ref<ContentInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const searchKeyword = ref('');
const searchStatus = ref('');
const searchCategoryId = ref<number | ''>('');
const searchDateRange = ref<string[]>([]);
const selected = ref<ContentInfo[]>([]);
const showBackTop = ref(false);

const categoryList = ref<CategoryInfo[]>([]);
const tagList = ref<TagInfo[]>([]);

const modalVisible = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const editingId = ref<number | null>(null);
const modalLoading = ref(false);
const submitDisabled = ref(false);
const batchDeleting = ref(false);

const form = reactive({
  title: '',
  content: '',
  coverImage: '',
  status: 'pending' as ContentInfo['status'],
  categoryId: null as number | null,
  tagIds: [] as number[],
  publishTime: '',
});

const rules: FormRules = {
  title: [
    { required: true, message: '请输入内容标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题 2-200 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入正文内容', trigger: 'blur' },
    { min: 10, message: '正文至少 10 个字符', trigger: 'blur' },
  ],
  categoryId: [
    { required: true, message: '请选择内容分类', trigger: 'change' },
  ],
  status: [
    { required: true, message: '请选择内容状态', trigger: 'change' },
  ],
};

const statusOptions = [
  { value: 'draft', label: '草稿', type: 'info' },
  { value: 'pending', label: '待审核', type: 'warning' },
  { value: 'published', label: '已发布', type: 'success' },
  { value: 'offline', label: '已下线', type: 'danger' },
];

type SortTabKey = 'publishTime' | 'views' | 'likes';
interface SortTabOption {
  key: SortTabKey;
  label: string;
  icon: string;
}
const sortTabOptions: SortTabOption[] = [
  { key: 'publishTime', label: '最新发布', icon: 'Clock' },
  { key: 'views', label: '浏览量', icon: 'View' },
  { key: 'likes', label: '点赞量', icon: 'Star' },
];
const activeSortTab = ref<SortTabKey>('publishTime');
const sortTabDir = ref<'ASC' | 'DESC'>('DESC');
const sortAnimating = ref(false);
const listWrapEl = ref<HTMLElement | null>(null);

const toggleSortTab = (key: SortTabKey) => {
  if (activeSortTab.value === key) {
    sortTabDir.value = sortTabDir.value === 'DESC' ? 'ASC' : 'DESC';
  } else {
    activeSortTab.value = key;
    sortTabDir.value = 'DESC';
  }
  tableRef.value?.clearSort?.();
  sortAnimating.value = true;
  page.value = 1;
  if (listWrapEl.value) {
    listWrapEl.value.style.opacity = '0.3';
    listWrapEl.value.style.transform = 'translateY(4px)';
  }
  fetchData().then(() => {
    nextTick(() => {
      if (listWrapEl.value) {
        listWrapEl.value.style.opacity = '';
        listWrapEl.value.style.transform = '';
      }
      setTimeout(() => { sortAnimating.value = false; }, 280);
    });
  });
};

const columns: TableColumn<ContentInfo>[] = [
  { prop: 'id', label: 'ID', width: 80, align: 'center' },
  {
    prop: 'coverImage',
    label: '封面',
    width: 120,
    align: 'center',
    slot: 'cover',
  },
  {
    prop: 'title',
    label: '标题',
    minWidth: 200,
    ellipsis: true,
    sortable: true,
  },
  {
    prop: 'category',
    label: '分类',
    width: 120,
    align: 'center',
    slot: 'category',
  },
  {
    prop: 'tags',
    label: '标签',
    minWidth: 180,
    slot: 'tags',
  },
  {
    prop: 'status',
    label: '状态',
    width: 100,
    align: 'center',
    slot: 'status',
  },
  {
    prop: 'views',
    label: '浏览量',
    width: 100,
    align: 'right',
    sortable: true,
    formatter: (_r, _c, val) => formatThousand(val),
  },
  {
    prop: 'likes',
    label: '点赞量',
    width: 100,
    align: 'right',
    sortable: true,
    formatter: (_r, _c, val) => formatThousand(val ?? 0),
  },
  {
    prop: 'publishTime',
    label: '发布时间',
    width: 180,
    align: 'center',
    sortable: true,
    formatter: (_r, _c, val) => (val ? new Date(val).toLocaleString('zh-CN') : '-'),
  },
  {
    prop: 'actions',
    label: '操作',
    width: 230,
    fixed: 'right',
    align: 'center',
    slot: 'actions',
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value,
      orderBy: activeSortTab.value,
      orderDir: sortTabDir.value,
    };
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    if (searchStatus.value) params.status = searchStatus.value;
    if (searchCategoryId.value !== '') params.categoryId = searchCategoryId.value;
    if (searchDateRange.value && searchDateRange.value.length === 2) {
      params.startDate = searchDateRange.value[0];
      params.endDate = searchDateRange.value[1];
    }
    const sort = tableRef.value?.getSortState?.() || { prop: '', order: null };
    if (sort.prop && sort.order) {
      params.orderBy = sort.prop;
      params.orderDir = sort.order === 'ascending' ? 'ASC' : 'DESC';
    }

    const res = await contentApi.list(params);
    if (res.code === 0 && res.data) {
      list.value = res.data.list;
      total.value = res.data.total;
    }
  } catch {
    /* error handled by axios interceptor */
  } finally {
    loading.value = false;
  }
};

const fetchCategoryAndTag = async () => {
  try {
    const [catRes, tagRes] = await Promise.all([categoryApi.list(), tagApi.list()]);
    if (catRes.code === 0 && catRes.data) {
      categoryList.value = catRes.data.list;
    }
    if (tagRes.code === 0 && tagRes.data) {
      tagList.value = tagRes.data.list;
    }
  } catch {
    /* error handled */
  }
};

const handleSearch = () => {
  page.value = 1;
  fetchData();
};

const handleSearchReset = () => {
  searchKeyword.value = '';
  searchStatus.value = '';
  searchCategoryId.value = '';
  searchDateRange.value = [];
  page.value = 1;
  fetchData();
};

const handlePageChange = (p: number, s: number) => {
  page.value = p;
  pageSize.value = s;
  fetchData();
};

const handleRowSelect = (rows: ContentInfo[]) => {
  selected.value = rows;
};

const handleRowDblClick = (row: ContentInfo) => {
  openEdit(row);
};

const handleSortChange = () => {
  fetchData();
};

const handleScroll = () => {
  showBackTop.value = window.scrollY > 500;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const openDetail = (row: ContentInfo) => {
  router.push(`/content/contents/${row.id}`);
};

const openCreate = async () => {
  modalMode.value = 'create';
  editingId.value = null;
  Object.assign(form, {
    title: '',
    content: '',
    coverImage: '',
    status: 'pending',
    categoryId: null,
    tagIds: [],
    publishTime: new Date().toISOString().slice(0, 10),
  });
  await fetchCategoryAndTag();
  modalVisible.value = true;
};

const openEdit = async (row: ContentInfo) => {
  modalMode.value = 'edit';
  editingId.value = row.id;
  await fetchCategoryAndTag();
  Object.assign(form, {
    title: row.title,
    content: row.content,
    coverImage: row.coverImage || '',
    status: row.status,
    categoryId: row.categoryId || null,
    tagIds: row.tags?.map(t => t.id) || [],
    publishTime: row.publishTime ? new Date(row.publishTime).toISOString().slice(0, 10) : '',
  });
  modalVisible.value = true;
};

const createRipple = (evt: MouseEvent) => {
  const target = evt?.currentTarget as HTMLElement | null | undefined;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;
  const span = document.createElement('span');
  span.className = 'ripple-effect';
  span.style.width = span.style.height = `${diameter}px`;
  span.style.left = `${evt.clientX - rect.left - radius}px`;
  span.style.top = `${evt.clientY - rect.top - radius}px`;
  target.appendChild(span);
  setTimeout(() => span.remove(), 700);
};

const handleModalOk = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitDisabled.value = true;
  modalLoading.value = true;
  try {
    let res: ApiResponse<ContentInfo>;
    const payload = { ...form, tagIds: form.tagIds } as any;
    if (modalMode.value === 'create') {
      res = await contentApi.create(payload);
    } else if (editingId.value) {
      res = await contentApi.update(editingId.value, payload);
    } else return;

    if (res.code === 0) {
      ElMessage.success(modalMode.value === 'create' ? '创建成功' : '更新成功');
      modalVisible.value = false;
      fetchData();
    }
  } catch {
    /* error handled by axios interceptor */
  } finally {
    await sleep(300);
    submitDisabled.value = false;
    modalLoading.value = false;
  }
};

const handleDelete = async (row: ContentInfo) => {
  if (row.status === 'published') {
    ElMessage.warning('已发布内容不能删除，请先下线');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除内容 "${row.title}" 吗？\n此操作不可恢复！`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'confirm-dialog',
    });
    const res = await contentApi.remove(row.id);
    if (res.code === 0) {
      ElMessage.success('删除成功');
      fetchData();
    }
  } catch {
    /* cancel */
  }
};

const handleBatchDelete = async (evt: MouseEvent) => {
  createRipple(evt);
  if (selected.value.length === 0) {
    ElMessage.warning('请先选择要删除的内容');
    return;
  }
  const invalidItems = selected.value.filter(r => r.status === 'published');
  if (invalidItems.length > 0) {
    ElMessage.warning('已发布内容不能删除，请先下线');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selected.value.length} 条内容吗？\n此操作不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    batchDeleting.value = true;
    await Promise.all(selected.value.map((r) => contentApi.remove(r.id)));
    ElMessage.success(`成功删除 ${selected.value.length} 条内容`);
    tableRef.value?.clearSelection?.();
    selected.value = [];
    await nextTick();
    fetchData();
  } catch {
    /* cancel */
  } finally {
    setTimeout(() => { batchDeleting.value = false; }, 280);
  }
};

const beforeCoverUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = rawFile.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('❌ 格式不支持：只能上传图片文件（JPG / PNG / GIF / WebP）');
    return false;
  }
  const isLt2M = rawFile.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    const sizeMB = (rawFile.size / 1024 / 1024).toFixed(2);
    ElMessage.error(`❌ 图片过大：当前 ${sizeMB}MB，要求不超过 2MB`);
    return false;
  }
  return true;
};

const coverUploading = ref(false);
const coverUploadPercent = ref(0);
const coverUploadError = ref('');

const handleCoverChange: UploadProps['onChange'] = async (uploadFile: any) => {
  if (!uploadFile.raw) return;
  const valid = beforeCoverUpload(uploadFile.raw);
  if (!valid) return;

  coverUploading.value = true;
  coverUploadPercent.value = 0;
  coverUploadError.value = '';

  try {
    const res = await uploadApi.image(uploadFile.raw, (p) => {
      coverUploadPercent.value = p;
    }) as any;

    if (res.code === 0 && res.data) {
      coverUploadPercent.value = 100;
      form.coverImage = res.data.url;
      ElMessage.success('✅ 封面上传成功');
      setTimeout(() => {
        coverUploading.value = false;
        coverUploadPercent.value = 0;
      }, 450);
    } else {
      throw new Error(res.msg || '上传失败');
    }
  } catch (err: any) {
    const msg = err?.message || '封面上传失败';
    coverUploadError.value = msg;
    ElMessage.error(`❌ 上传失败：${msg}`);
    coverUploading.value = false;
  }
};

const statusTagType = computed(() => (status: string) => {
  const opt = statusOptions.find(o => o.value === status);
  return opt?.type || 'info';
});

const statusLabel = computed(() => (status: string) => {
  const opt = statusOptions.find(o => o.value === status);
  return opt?.label || status;
});

const categoryName = computed(() => (id: number) => {
  const cat = categoryList.value.find(c => c.id === id);
  return cat?.name || '-';
});

onMounted(() => {
  fetchCategoryAndTag();
  fetchData();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="page-wrap">
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-item">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入内容标题"
            clearable
            class="filter-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
        <div class="filter-item">
          <el-select
            v-model="searchStatus"
            placeholder="选择内容状态"
            clearable
            class="filter-input"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <el-select
            v-model="searchCategoryId"
            placeholder="选择内容分类"
            clearable
            class="filter-input"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="cat in categoryList"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <el-date-picker
            v-model="searchDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="filter-input date-range"
            @change="handleSearch"
          />
        </div>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>查询
        </el-button>
        <el-button @click="handleSearchReset">
          <el-icon><RefreshRight /></el-icon>重置
        </el-button>
        <div class="spacer" />
        <el-button type="success" plain @click="openCreate">
          <el-icon><Plus /></el-icon>新增内容
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="selected.length === 0 || batchDeleting"
          :loading="batchDeleting"
          @click="handleBatchDelete"
          class="ripple-btn"
        >
          <template v-if="!batchDeleting">
            <el-icon><Delete /></el-icon>批量删除
          </template>
          <template v-else>正在删除 {{ selected.length }} 条...</template>
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div class="sort-tabs-wrap">
        <div class="sort-tabs" :class="{ animating: sortAnimating }">
          <div
            v-for="tab in sortTabOptions"
            :key="tab.key"
            class="sort-tab"
            :class="{ active: activeSortTab === tab.key }"
            @click="toggleSortTab(tab.key)"
          >
            <el-icon>
              <component :is="tab.icon" />
            </el-icon>
            <span>{{ tab.label }}</span>
            <el-icon class="sort-dir" :class="{ asc: sortTabDir === 'ASC', hidden: activeSortTab !== tab.key }">
              <CaretTop />
            </el-icon>
          </div>
        </div>
        <div class="sort-result-tip">
          共 <strong>{{ formatThousand(total) }}</strong> 条内容
          <span v-if="selected.length > 0" class="selected-tip">· 已选 {{ selected.length }} 条</span>
        </div>
      </div>

      <div ref="listWrapEl" class="list-wrap">
        <BaseTable
          ref="tableRef"
          :columns="columns"
          :data="list"
          :loading="loading"
          :total="total"
          v-model:page="page"
          v-model:page-size="pageSize"
          :show-selection="true"
          :highlight-current-row="true"
          table-key="cms-contents"
          @pageChange="handlePageChange"
          @selectionChange="handleRowSelect"
          @rowDoubleClick="handleRowDblClick"
          @sortChange="handleSortChange"
        >
          <template #cover="{ row }">
            <div v-if="row.coverImage" class="cover-preview">
              <el-image
                :src="row.coverImage"
                :preview-src-list="[row.coverImage]"
                :preview-teleported="true"
                fit="cover"
                class="cover-img"
              >
                <template #error>
                  <span class="no-cover">-</span>
                </template>
              </el-image>
            </div>
            <span v-else class="no-cover">-</span>
          </template>
          <template #category="{ row }">
            <el-tag size="small" effect="light">{{ categoryName(row.categoryId) }}</el-tag>
          </template>
          <template #tags="{ row }">
            <div class="tag-list">
              <el-tag
                v-for="tag in row.tags"
                :key="tag.id"
                :style="{ backgroundColor: tag.color + '20', borderColor: tag.color, color: tag.color }"
                size="small"
                effect="plain"
              >
                {{ tag.name }}
              </el-tag>
            </div>
          </template>
          <template #status="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="light">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
          <template #actions="{ row }">
            <div class="row-actions">
              <el-button link type="primary" size="small" @click="openDetail(row)">
                <el-icon><View /></el-icon>详情
              </el-button>
              <el-button link type="primary" size="small" @click="openEdit(row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                :disabled="row.status === 'published'"
                @click="handleDelete(row)"
              >
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </div>
          </template>
        </BaseTable>
      </div>
    </el-card>

    <BaseModal
      v-model:visible="modalVisible"
      :title="modalMode === 'create' ? '新增内容' : '编辑内容'"
      width="760px"
      :confirm-loading="modalLoading || submitDisabled"
      @ok="handleModalOk"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="right">
        <el-form-item label="内容标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入内容标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="内容分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="cat in categoryList"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内容状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="内容标签">
          <el-select
            v-model="form.tagIds"
            multiple
            filterable
            placeholder="请选择标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in tagList"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="form.publishTime"
            type="date"
            placeholder="选择发布日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="封面图">
          <div class="cover-upload">
            <el-upload
              class="cover-uploader"
              :show-file-list="false"
              :on-change="handleCoverChange"
              :auto-upload="false"
              :disabled="coverUploading"
              accept="image/*"
            >
              <div v-if="coverUploading" class="cover-uploading-wrap">
                <div class="cover-progress-ring">
                  <svg viewBox="0 0 100 100" class="ring-svg">
                    <circle cx="50" cy="50" r="42" stroke="#e4e7ed" stroke-width="6" fill="none" />
                    <circle
                      cx="50" cy="50" r="42"
                      stroke="#1677ff" stroke-width="6" fill="none"
                      stroke-linecap="round"
                      :stroke-dasharray="264"
                      :stroke-dashoffset="264 - (264 * coverUploadPercent) / 100"
                      class="ring-progress"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <span class="ring-percent">{{ coverUploadPercent }}%</span>
                </div>
                <div class="upload-text">上传中...</div>
              </div>
              <div v-else-if="form.coverImage" class="cover-preview-wrap">
                <el-image :src="form.coverImage" fit="cover" class="cover-preview-img" />
                <div class="cover-preview-mask">
                  <el-icon :size="20"><RefreshRight /></el-icon>
                  <span>点击替换</span>
                </div>
              </div>
              <div v-else class="cover-upload-tip">
                <el-icon :size="28"><Plus /></el-icon>
                <div class="upload-text">上传封面</div>
              </div>
            </el-upload>
            <transition name="slide-fade">
              <div v-if="coverUploadError" class="upload-error">
                <el-icon><Warning /></el-icon>
                <span>{{ coverUploadError }}</span>
                <el-button link type="danger" size="small" @click="coverUploadError = ''">关闭</el-button>
              </div>
            </transition>
            <div class="upload-hint">
              <el-icon><InfoFilled /></el-icon>
              <span>支持 JPG、PNG、GIF、WebP 格式，大小不超过 2MB</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="正文内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="请输入正文内容..."
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer="{ ok, cancel, loading }">
        <el-button @click="cancel">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="loading || submitDisabled"
          @click="(e: MouseEvent) => { createRipple(e); ok(); }"
          class="submit-btn ripple-btn"
        >
          {{ modalMode === 'create' ? '确认新增' : '保存修改' }}
        </el-button>
      </template>
    </BaseModal>

    <transition name="fade">
      <div v-show="showBackTop" class="back-to-top" @click="scrollToTop" title="返回顶部">
        <el-icon :size="22"><Top /></el-icon>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.filter-card {
  padding: $spacing-md $spacing-lg !important;
  border-radius: $radius-lg;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-input {
  width: 220px;
  transition:
    box-shadow $duration-fast $ease-in-out,
    transform $duration-fast $ease-in-out;
  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.18) !important;
    transform: scale(1.018);
    border-color: #1677ff !important;
  }
  &.date-range {
    width: 260px;
  }
}

.spacer {
  flex: 1;
}

.table-card {
  padding: $spacing-md !important;
  border-radius: $radius-lg;
}

.sort-tabs-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 16px;
}

.sort-tabs {
  display: inline-flex;
  padding: 4px;
  background: #f5f7fa;
  border-radius: 10px;
  gap: 2px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  &.animating {
    opacity: 0.88;
  }
}

.sort-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  user-select: none;
  :deep(svg) { font-size: 15px; }
  &:hover {
    background: #fff;
    color: #1677ff;
    transform: translateY(-1px);
  }
  &.active {
    background: linear-gradient(135deg, #1677ff, #4096ff);
    color: #fff;
    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
    transform: translateY(-1px);
    :deep(svg) { color: #fff; }
  }
  .sort-dir {
    font-size: 11px;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    &.hidden { visibility: hidden; }
    &.asc { transform: rotate(0deg); }
    &:not(.asc) { transform: rotate(180deg); }
  }
  &.active .sort-dir {
    visibility: visible !important;
  }
}

.sort-result-tip {
  font-size: 13px;
  color: #909399;
  strong {
    color: #1677ff;
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    margin: 0 4px;
  }
  .selected-tip {
    margin-left: 8px;
    color: #f59e0b;
    font-weight: 500;
  }
}

.list-wrap {
  transition: opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1), transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
}

.cover-preview {
  width: 80px;
  height: 60px;
  margin: 0 auto;
  .cover-img {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    cursor: pointer;
  }
}

.no-cover {
  color: $color-text-placeholder;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.cover-upload {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  width: 100%;
}

.cover-uploader {
  :deep(.el-upload) {
    display: block;
  }
}

.cover-uploading-wrap {
  width: 160px;
  height: 120px;
  border-radius: $radius-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  background: linear-gradient(135deg, #f7faff, #eef3ff);
  border: 1px dashed #9bb5ef;
  position: relative;
  overflow: hidden;
}

.cover-progress-ring {
  position: relative;
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  .ring-svg {
    width: 100%;
    height: 100%;
  }
  .ring-progress {
    transition: stroke-dashoffset 0.18s linear;
    filter: drop-shadow(0 0 4px rgba(22, 119, 255, 0.5));
  }
  .ring-percent {
    position: absolute;
    font-size: 12px;
    font-weight: 700;
    color: #1677ff;
    font-variant-numeric: tabular-nums;
  }
}

.cover-preview-wrap {
  width: 160px;
  height: 120px;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1px dashed $color-border-light;
  position: relative;
  transition: all $duration-fast;
  cursor: pointer;
  &:hover {
    border-color: $color-primary;
    .cover-preview-mask { opacity: 1; }
  }
}

.cover-preview-img {
  width: 100%;
  height: 100%;
}

.cover-preview-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity $duration-fast;
  backdrop-filter: blur(2px);
}

.cover-upload-tip {
  width: 160px;
  height: 120px;
  border: 1px dashed $color-border-light;
  border-radius: $radius-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  color: $color-text-placeholder;
  cursor: pointer;
  transition: all $duration-fast;
  &:hover {
    border-color: $color-primary;
    color: $color-primary;
    transform: scale(1.02);
    background: linear-gradient(135deg, rgba(22, 119, 255, 0.03), rgba(22, 119, 255, 0.06));
  }
  .upload-text {
    font-size: $font-size-sm;
  }
}

.upload-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  color: #f56c6c;
  font-size: 13px;
  :deep(svg) { flex-shrink: 0; }
  span { flex: 1; }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: $font-size-xs;
  color: $color-text-placeholder;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transition: filter 0.2s ease, transform 0.12s ease;
  &:active:not(:disabled) {
    transform: scale(0.985);
  }
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  transform: scale(0);
  animation: ripple 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  z-index: 1;
}

.submit-btn .ripple-effect {
  background: rgba(255, 255, 255, 0.42);
}

@keyframes ripple {
  to {
    transform: scale(3.2);
    opacity: 0;
  }
}

.submit-btn {
  &:active:not(:disabled) {
    background: #1677ff !important;
    border-color: #1677ff !important;
  }
}

.back-to-top {
  position: fixed;
  right: 40px;
  bottom: 60px;
  width: 48px;
  height: 48px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  cursor: pointer;
  transition:
    all $duration-fast $ease-in-out,
    color $duration-fast $ease-in-out;
  z-index: $z-index-backtop;
  &:hover {
    color: $color-primary;
    border-color: $color-primary;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(22, 119, 255, 0.2);
  }
  &:active {
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity $duration-base $ease-in-out,
    transform $duration-base $ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

<template>
	<div class="system-role-container">
		<el-card shadow="never" class="glass-card mb-4">
			<!-- 顶部搜索域 -->
			<div class="search-header">
				<div class="search-inputs">
					<el-input v-model="state.tableData.param.name" placeholder="搜索病害名称..." clearable class="custom-input"> 
						<template #prefix><el-icon><Search /></el-icon></template>
					</el-input>
					<el-select v-model="state.tableData.param.cropType" placeholder="作物分类" clearable class="custom-select">
						<el-option v-for="item in state.cropTypes" :key="item" :label="item" :value="item"></el-option>
					</el-select>
				</div>
				<div class="search-actions">
					<el-button type="primary" @click="getTableData()" :loading="state.tableData.loading" class="action-btn query-btn">
						查询
					</el-button>
					<el-button type="success" @click="onOpenAddDisease('add')" class="action-btn add-btn">
						<el-icon class="mr-1"><Plus /></el-icon> 新增记录
					</el-button>
				</div>
			</div>

			<!-- 数据容器 -->
			<div class="table-wrapper">
				<el-table 
					:data="state.tableData.data" 
					v-loading="state.tableData.loading" 
					class="custom-table"
				>
					<el-table-column prop="num" label="#" width="60" align="center" />
					<el-table-column prop="cropType" label="作物" width="100">
						<template #default="scope">
							<el-tag size="small" effect="plain" type="success" class="brand-tag">{{ scope.row.cropType }}</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="name" label="病害名称" width="160" />
					<el-table-column prop="symptoms" label="典型症状" show-overflow-tooltip min-width="200" />
					<el-table-column prop="causes" label="发病诱因" show-overflow-tooltip min-width="180" />
					<el-table-column prop="prevention" label="防治方案" show-overflow-tooltip min-width="200" />
					<el-table-column label="图谱" width="80" align="center">
						<template #default="scope">
							<el-image 
								class="table-img"
								:src="scope.row.image" 
								:preview-src-list="[scope.row.image]"
								:preview-teleported="true"
								fit="cover"
							/>
						</template>
					</el-table-column>
					<el-table-column label="操作" width="160" fixed="right" align="right">
						<template #default="scope">
							<el-button link type="primary" @click="onOpenDetail(scope.row)">详情</el-button>
							<el-button link type="primary" @click="onOpenEditDisease('edit', scope.row)">编辑</el-button>
							<el-button link type="danger" @click="onRowDel(scope.row)">删除</el-button>
						</template>
					</el-table-column>
				</el-table>

				<div class="pagination-footer mt-4">
					<el-pagination
						@size-change="onHandleSizeChange"
						@current-change="onHandleCurrentChange"
						:pager-count="5"
						:page-sizes="[10, 20, 50]"
						v-model:current-page="state.tableData.param.pageNum"
						background
						v-model:page-size="state.tableData.param.pageSize"
						layout="total, sizes, prev, pager, next"
						:total="state.tableData.total"
					/>
				</div>
			</div>
		</el-card>

		<DiseaseDialog ref="diseaseDialogRef" @refresh="getTableData()" />
		<DiseaseDetail ref="diseaseDetailRef" />
	</div>
</template>

<script setup lang="ts" name="systemRole">
import { defineAsyncComponent, reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import request from '/@/utils/request';
import { Search, Plus } from '@element-plus/icons-vue';

// 引入组件
const DiseaseDialog = defineAsyncComponent(() => import('./dialog.vue'));
const DiseaseDetail = defineAsyncComponent(() => import('./detail.vue'));

// 定义变量内容
const diseaseDialogRef = ref();
const diseaseDetailRef = ref();
const state = reactive({
	tableData: {
		data: [] as any,
		total: 0,
		loading: false,
		param: {
			name: '',
			cropType: '',
			pageNum: 1,
			pageSize: 10,
		},
	},
	cropTypes: ['玉米', '水稻', '小麦', '马铃薯', '棉花', '苹果', '葡萄', '番茄', '草莓']
});

// 获取表格数据
const getTableData = () => {
	state.tableData.loading = true;
	request.get('/api/disease', { params: state.tableData.param }).then((res) => {
		if (res.code == 0) {
			state.tableData.data = res.data.records.map((item: any, index: number) => ({
				...item,
				num: (state.tableData.param.pageNum - 1) * state.tableData.param.pageSize + index + 1
			}));
			state.tableData.total = res.data.total;
			setTimeout(() => { state.tableData.loading = false; }, 300);
		} else {
			state.tableData.loading = false;
			ElMessage.error(res.msg);
		}
	});
};

const onOpenAddDisease = (type: string) => diseaseDialogRef.value.openDialog(type);
const onOpenEditDisease = (type: string, row: Object) => diseaseDialogRef.value.openDialog(type, row);
const onOpenDetail = (row: any) => diseaseDetailRef.value.openDialog(row);

const onRowDel = (row: any) => {
	if (state.tableData.loading) return;
	ElMessageBox.confirm(`此操作将永久删除该病害信息，是否继续?`, '提示', {
		type: 'warning',
		confirmButtonText: '确认',
		cancelButtonText: '取消',
	}).then(() => {
		request.delete('/api/disease/' + row.id).then((res) => {
			if (res.code == 0) {
				ElMessage.success('删除成功！');
				getTableData();
			} else {
				ElMessage.error(res.msg);
			}
		});
	}).catch(() => {});
};

const onHandleSizeChange = (val: number) => {
	state.tableData.param.pageSize = val;
	getTableData();
};
const onHandleCurrentChange = (val: number) => {
	state.tableData.param.pageNum = val;
	getTableData();
};

onMounted(() => getTableData());
</script>

<style scoped lang="scss">
.system-role-container {
	padding: 20px;
	height: 100%;
	background: transparent;

	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(12px);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.5);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
		padding: 20px;
	}
}

.search-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	gap: 20px;

	.search-inputs {
		display: flex;
		gap: 12px;
		.custom-input { width: 220px; }
		.custom-select { width: 140px; }

		:deep(.el-input__wrapper) {
			border-radius: 8px;
			background: rgba(255, 255, 255, 0.5);
			box-shadow: 0 0 0 1px rgba(0,0,0,0.05) inset;
			&:hover { box-shadow: 0 0 0 1px #10B981 inset; }
			&.is-focus { box-shadow: 0 0 0 1px #10B981 inset !important; }
		}
	}

	.search-actions {
		display: flex;
		gap: 10px;
	}
}

.action-btn {
	border-radius: 8px;
	padding: 8px 16px;
	font-weight: 600;
	transition: all 0.2s;
	&:hover { transform: translateY(-2px); }
}

.query-btn {
	background: linear-gradient(135deg, #3B82F6, #2563EB) !important;
	border: none !important;
}

.add-btn {
	background: linear-gradient(135deg, #10B981, #059669) !important;
	border: none !important;
}

.table-wrapper {
	background: rgba(255, 255, 255, 0.4);
	border-radius: 12px;
	padding: 10px;
	border: 1px solid rgba(255, 255, 255, 0.2);
}

.custom-table {
	background: transparent !important;
	--el-table-bg-color: transparent;
	--el-table-tr-bg-color: transparent;
	--el-table-header-bg-color: rgba(248, 250, 252, 0.8);

	:deep(.el-table__header) th {
		font-weight: 700;
		color: #1e293b;
		background: transparent !important;
		padding: 12px 0;
	}

	:deep(.el-table__row) {
		transition: all 0.2s;
		&:hover td { background-color: rgba(16, 185, 129, 0.05) !important; }
	}

	.table-img {
		width: 40px; height: 40px; border-radius: 8px;
		box-shadow: 0 2px 5px rgba(0,0,0,0.1);
	}

	.brand-tag {
		border-radius: 4px;
		font-weight: 600;
	}
}

.pagination-footer {
	display: flex;
	justify-content: flex-end;
}
</style>
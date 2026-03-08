<template>
	<div class="system-role-container">
		<el-card shadow="never" class="glass-card mb-4">
			<!-- 顶部搜索域 -->
			<div class="search-header">
				<div class="search-inputs">
					<el-input v-model="state.tableData.param.search" placeholder="搜索用户名..." clearable class="custom-input"> 
						<template #prefix><el-icon><Search /></el-icon></template>
					</el-input>
				</div>
				<div class="search-actions">
					<el-button type="primary" @click="getTableData()" :loading="state.tableData.loading" class="action-btn query-btn">
						查询用户
					</el-button>
					<el-button type="success" @click="onOpenAddRole('add')" class="action-btn add-btn">
						<el-icon class="mr-1"><Plus /></el-icon> 新增用户
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
					
					<el-table-column label="账户头像" width="100" align="center">
						<template #default="scope">
							<el-avatar :size="48" :src="scope.row.avatar" class="user-avatar" />
						</template>
					</el-table-column>

					<el-table-column prop="username" label="登录账号" width="120" />
					<el-table-column prop="name" label="真实姓名" width="120" />
					
					<el-table-column prop="role" label="权限角色" width="120">
						<template #default="scope">
							<el-tag :type="roleType(scope.row.role)" effect="light" class="role-tag">
								{{ scope.row.role }}
							</el-tag>
						</template>
					</el-table-column>

					<el-table-column prop="sex" label="性别" width="80" align="center" />
					<el-table-column prop="email" label="邮箱地址" show-overflow-tooltip />
					<el-table-column prop="tel" label="联系电话" width="140" />

					<el-table-column label="操作" width="160" fixed="right" align="right">
						<template #default="scope">
							<el-button link type="primary" @click="onOpenEditRole('edit', scope.row)">修改</el-button>
							<el-button link type="danger" @click="onRowDel(scope.row)">彻底移除</el-button>
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

		<RoleDialog ref="roleDialogRef" @refresh="getTableData()" />
	</div>
</template>

<script setup lang="ts" name="systemRole">
import { defineAsyncComponent, reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import request from '/@/utils/request';
import { Search, Plus } from '@element-plus/icons-vue';

// 引入组件
const RoleDialog = defineAsyncComponent(() => import('./dialog.vue'));

const roleDialogRef = ref();
const state = reactive({
	tableData: {
		data: [] as any,
		total: 0,
		loading: false,
		param: {
			search: '',
			pageNum: 1,
			pageSize: 10,
		},
	},
});

const roleType = (role: string) => {
	if (role === '管理员') return 'danger';
	if (role === '普通用户') return 'primary';
	return 'info';
};

const getTableData = () => {
	state.tableData.loading = true;
	request.get('/api/user', { params: state.tableData.param }).then((res) => {
		if (res.code == 0) {
			state.tableData.data = res.data.records.map((item: any, index: number) => {
				const roleLabel = item.role === 'admin' ? '管理员' : (item.role === 'common' ? '普通用户' : '其他用户');
				return {
					...item,
					num: (state.tableData.param.pageNum - 1) * state.tableData.param.pageSize + index + 1,
					role: roleLabel
				};
			});
			state.tableData.total = res.data.total;
			setTimeout(() => { state.tableData.loading = false; }, 300);
		} else {
			state.tableData.loading = false;
			ElMessage.error(res.msg);
		}
	});
};

const onOpenAddRole = (type: string) => roleDialogRef.value.openDialog(type);
const onOpenEditRole = (type: string, row: Object) => roleDialogRef.value.openDialog(type, row);

const onRowDel = (row: any) => {
	ElMessageBox.confirm(`此操作将永久删除该用户账号，是否继续?`, '提示', {
		type: 'warning',
		confirmButtonText: '确认',
		cancelButtonText: '取消',
	}).then(() => {
		request.delete('/api/user/' + row.id).then((res) => {
			if (res.code == 0) {
				ElMessage.success('用户已彻底移除');
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
		.custom-input { width: 220px; }
		:deep(.el-input__wrapper) {
			border-radius: 8px;
			background: rgba(255, 255, 255, 0.5);
			box-shadow: 0 0 0 1px rgba(0,0,0,0.05) inset;
		}
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

	:deep(.el-table__header) th {
		font-weight: 700;
		color: #1e293b;
		background: transparent !important;
		padding: 12px 0;
	}

	:deep(.el-table__row) {
		height: 72px;
		&:hover td { background-color: rgba(16, 185, 129, 0.05) !important; }
	}

	.user-avatar {
		border: 2px solid #fff;
		box-shadow: 0 4px 10px rgba(0,0,0,0.1);
	}

	.role-tag {
		border-radius: 4px;
		font-weight: 600;
		padding: 2px 10px;
	}
}

.pagination-footer {
	display: flex;
	justify-content: flex-end;
}
</style>

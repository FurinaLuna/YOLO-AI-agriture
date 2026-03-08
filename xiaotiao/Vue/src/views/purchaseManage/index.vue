<template>
	<div class="system-role-container">
		<el-card shadow="never" class="glass-card mb-4">
			<!-- 顶部搜索域 -->
			<div class="search-header">
				<div class="search-inputs">
					<el-input v-model="state.tableData.param.search" placeholder="产品名称..." clearable class="custom-input ml-2" />
					<el-input v-model="state.tableData.param.supplier" placeholder="供货商..." clearable class="custom-input ml-2" />
					<el-input v-model="state.tableData.param.manager" placeholder="采购员..." clearable class="custom-input ml-2" />
				</div>
				<div class="search-actions">
					<el-button type="primary" @click="getTableData" :loading="state.tableData.loading" class="action-btn query-btn">
						执行查询
					</el-button>
					<el-button type="success" @click="onOpenAddPurchase('add')" class="action-btn add-btn">
						<el-icon class="mr-1"><Plus /></el-icon> 新增单据
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
					<el-table-column prop="productName" label="产品名称" show-overflow-tooltip width="150" />
					<el-table-column prop="price" label="结算单价" width="120">
						<template #default="scope">
							<span class="text-orange-600 font-bold">¥{{ scope.row.price }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="quantity" label="采购数量" width="100" align="center" />
					
					<el-table-column prop="supplier" label="合作供货商" show-overflow-tooltip />
					<el-table-column prop="region" label="所属地区" width="120" />
					<el-table-column prop="manager" label="经办人" width="120" align="center" />
					<el-table-column prop="phone" label="联系方式" width="140" />

					<el-table-column label="操作" width="140" fixed="right" align="right">
						<template #default="scope">
							<el-button link type="primary" @click="onOpenEditPurchase('edit', scope.row)">修改</el-button>
							<el-button link type="danger" @click="onRowDel(scope.row)">作废</el-button>
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

		<PurchaseDialog ref="purchaseDialogRef" @refresh="getTableData" />
	</div>
</template>

<script setup lang="ts" name="purchaseManage">
import { defineAsyncComponent, reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import request from '/@/utils/request';
import { Search, Plus } from '@element-plus/icons-vue';

const PurchaseDialog = defineAsyncComponent(() => import('./dialog.vue'));
const purchaseDialogRef = ref();
const state = reactive({
	tableData: {
		data: [] as any,
		total: 0,
		loading: false,
		param: {
			search: '', supplier: '', region: '', manager: '',
			pageNum: 1, pageSize: 10,
		},
	},
});

const getTableData = () => {
	state.tableData.loading = true;
	request.get('/api/purchase', { params: state.tableData.param }).then((res) => {
		if (res.code == 0) {
			state.tableData.data = res.data.records.map((item: any, idx: number) => ({
				...item,
				num: (state.tableData.param.pageNum - 1) * state.tableData.param.pageSize + idx + 1
			}));
			state.tableData.total = res.data.total;
			state.tableData.loading = false;
		}
	});
};

const onOpenAddPurchase = (type: string) => purchaseDialogRef.value.openDialog(type);
const onOpenEditPurchase = (type: string, row: Object) => purchaseDialogRef.value.openDialog(type, row);

const onRowDel = (row: any) => {
	ElMessageBox.confirm(`确认作废该采购单据？`, '警告', { type: 'warning' }).then(() => {
		request.delete('/api/purchase/' + row.id).then((res) => {
			if (res.code == 0) {
				ElMessage.success('单据已作废');
				getTableData();
			}
		});
	}).catch(() => {});
};

const onHandleSizeChange = (val: number) => { state.tableData.param.pageSize = val; getTableData(); };
const onHandleCurrentChange = (val: number) => { state.tableData.param.pageNum = val; getTableData(); };

onMounted(() => getTableData());
</script>

<style scoped lang="scss">
.system-role-container {
	padding: 20px;
	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(12px);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.5);
		padding: 20px;
	}
}

.search-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;

	.search-inputs {
		display: flex;
		.custom-input { width: 160px; margin-right: 10px; }
		:deep(.el-input__wrapper) { border-radius: 8px; background: rgba(255, 255, 255, 0.5); }
	}
}

.action-btn { border-radius: 8px; font-weight: 600; }
.query-btn { background: linear-gradient(135deg, #3B82F6, #2563EB) !important; border: none !important; }
.add-btn { background: linear-gradient(135deg, #10B981, #059669) !important; border: none !important; }

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
		height: 60px;
		&:hover td { background-color: rgba(16, 185, 129, 0.05) !important; }
	}
}

.pagination-footer { display: flex; justify-content: flex-end; }
</style>
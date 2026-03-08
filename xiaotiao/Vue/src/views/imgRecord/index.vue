<template>
	<div class="system-role-container">
		<el-card shadow="never" class="glass-card mb-4">
			<!-- 搜索栏 -->
			<div class="search-header">
				<div class="search-inputs">
					<el-input v-model="state.tableData.param.search1" placeholder="搜索农作物种类..." clearable class="custom-input">
						<template #prefix><el-icon><Search /></el-icon></template>
					</el-input>
				</div>
				<div class="search-actions">
					<el-button type="primary" @click="getTableData()" :loading="state.tableData.loading" class="action-btn query-btn">
						查询记录
					</el-button>
				</div>
			</div>

			<!-- 数据表格 -->
			<div class="table-wrapper">
				<el-table :data="state.tableData.data" v-loading="state.tableData.loading" class="custom-table">
					<el-table-column type="expand">
						<template #default="props">
							<div class="expand-content">
								<h4 class="detail-title">详细识别结果对比</h4>
								<el-table :data="props.row.family" class="inner-table" border size="small">
									<el-table-column prop="label" label="识别类别" />
									<el-table-column prop="confidence" label="置信度">
										<template #default="scope">
											<el-progress :percentage="Number((scope.row.confidence * 100).toFixed(1))" :color="statusColor(scope.row.confidence)" />
										</template>
									</el-table-column>
									<el-table-column prop="startTime" label="采集时间" width="180" />
								</el-table>
							</div>
						</template>
					</el-table-column>
					
					<el-table-column prop="num" label="#" width="60" align="center" />
					
					<el-table-column label="原始样张" width="120" align="center">
						<template #default="scope">
							<el-image class="table-preview-img" :src="scope.row.inputImg" :preview-src-list="[scope.row.inputImg]" preview-teleported fit="cover" />
						</template>
					</el-table-column>

					<el-table-column label="识别结果" width="120" align="center">
						<template #default="scope">
							<el-image class="table-preview-img result-img" :src="scope.row.outImg" :preview-src-list="[scope.row.outImg]" preview-teleported fit="cover" />
						</template>
					</el-table-column>

					<el-table-column prop="cropType" label="作物种类">
						<template #default="scope">
							<el-tag size="small" effect="light" type="success">{{ scope.row.cropType }}</el-tag>
						</template>
					</el-table-column>
					
					<el-table-column prop="weight" label="使用模型" show-overflow-tooltip />
					<el-table-column prop="conf" label="阈值" width="80" align="center" />
					<el-table-column prop="allTime" label="耗时" width="100" align="center" />
					<el-table-column prop="startTime" label="识别时间" width="180" align="center" />
					<el-table-column prop="username" label="操作员" width="100" align="center" />

					<el-table-column label="操作" width="100" fixed="right" align="right">
						<template #default="scope">
							<el-button link type="danger" @click="onRowDel(scope.row)">彻底删除</el-button>
						</template>
					</el-table-column>
				</el-table>

				<div class="pagination-footer mt-4">
					<el-pagination @size-change="onHandleSizeChange" @current-change="onHandleCurrentChange"
						:pager-count="5" :page-sizes="[10, 20, 50]" v-model:current-page="state.tableData.param.pageNum"
						background v-model:page-size="state.tableData.param.pageSize"
						layout="total, sizes, prev, pager, next" :total="state.tableData.total" />
				</div>
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="imgRecord">
import { reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import request from '/@/utils/request';
import { useUserInfo } from '/@/stores/userInfo';
import { storeToRefs } from 'pinia';
import { Search } from '@element-plus/icons-vue';

const stores = useUserInfo();
const { userInfos } = storeToRefs(stores);

const state = reactive({
	tableData: {
		data: [] as any,
		total: 0,
		loading: false,
		param: {
			search: '',
			search1: '',
			pageNum: 1,
			pageSize: 10,
		},
	},
});

const statusColor = (conf: number) => {
	if (conf > 0.8) return '#10B981';
	if (conf > 0.5) return '#F59E0B';
	return '#EF4444';
};

const getTableData = () => {
	state.tableData.loading = true;
	if (userInfos.value.userName != 'admin') {
		state.tableData.param.search = userInfos.value.userName;
	}
	request.get('/api/imgRecords', { params: state.tableData.param }).then((res) => {
		if (res.code == 0) {
			state.tableData.data = res.data.records.map((item: any, index: number) => {
				const confidences = JSON.parse(item.confidence || '[]');
				const labels = JSON.parse(item.label || '[]');
				return {
					...item,
					num: (state.tableData.param.pageNum - 1) * state.tableData.param.pageSize + index + 1,
					cropType: item.kind || '-',
					family: labels.map((label: string, i: number) => ({
						label,
						confidence: confidences[i],
						startTime: item.startTime
					}))
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

const onRowDel = (row: any) => {
	ElMessageBox.confirm(`此操作将永久删除该识别记录，是否继续?`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	}).then(() => {
		request.delete('/api/imgRecords/' + row.id).then((res) => {
			if (res.code == 0) {
				ElMessage.success('删除成功！');
				getTableData();
			} else {
				ElMessage.error(res.msg);
			}
		});
	}).catch(() => { });
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
	font-weight: 600;
	transition: all 0.2s;
	&:hover { transform: translateY(-2px); }
}

.query-btn {
	background: linear-gradient(135deg, #3B82F6, #2563EB) !important;
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
		height: 80px;
		&:hover td { background-color: rgba(16, 185, 129, 0.05) !important; }
	}

	.table-preview-img {
		width: 100px; height: 56px; border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		transition: transform 0.2s;
		&:hover { transform: scale(1.05); }
	}

	.result-img {
		border: 1px solid rgba(16, 185, 129, 0.3);
	}
}

.expand-content {
	padding: 20px 40px;
	background: rgba(248, 250, 252, 0.5);
	
	.detail-title {
		font-size: 14px;
		color: #10B981;
		margin-bottom: 12px;
		font-weight: 700;
	}

	.inner-table {
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0,0,0,0.05);
	}
}

.pagination-footer {
	display: flex;
	justify-content: flex-end;
}
</style>

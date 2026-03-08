<template>
	<div class="system-role-container">
		<el-card shadow="never" class="glass-card mb-4">
			<!-- 搜索栏 -->
			<div class="search-header">
				<div class="search-inputs">
					<el-input v-model="state.tableData.param.search1" placeholder="搜索作物类型..." clearable class="custom-input">
						<template #prefix><el-icon><Search /></el-icon></template>
					</el-input>
				</div>
				<div class="search-actions">
					<el-button type="primary" @click="getTableData()" :loading="state.tableData.loading" class="action-btn query-btn">
						查询监控记录
					</el-button>
				</div>
			</div>

			<!-- 数据表格 -->
			<div class="table-wrapper">
				<el-table :data="state.tableData.data" v-loading="state.tableData.loading" class="custom-table">
					<el-table-column prop="num" label="#" width="60" align="center" />
					
					<el-table-column label="录制结果" width="220" align="center">
						<template #default="scope">
							<div class="video-preview-box result-box">
								<video class="table-video" :key="scope.row.outVideo + uniqueKey" preload="metadata">
									<source :src="scope.row.outVideo" type="video/mp4" />
								</video>
								<div class="video-overlay"><el-icon><Camera /></el-icon></div>
							</div>
						</template>
					</el-table-column>

					<el-table-column prop="kind" label="农作物种类">
						<template #default="scope">
							<el-tag size="small" effect="light" type="success" class="brand-tag">{{ scope.row.kind || '-' }}</el-tag>
						</template>
					</el-table-column>
					
					<el-table-column prop="weight" label="使用模型" show-overflow-tooltip />
					<el-table-column prop="conf" label="置信阈值" width="100" align="center" />
					<el-table-column prop="username" label="操作员" width="100" align="center" />
					<el-table-column prop="startTime" label="识别时间" width="180" align="center" />

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

<script setup lang="ts" name="cameraRecord">
import { reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import request from '/@/utils/request';
import { useUserInfo } from '/@/stores/userInfo';
import { storeToRefs } from 'pinia';
import { Search, Camera } from '@element-plus/icons-vue';

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

const uniqueKey = ref(0);

const getTableData = () => {
	state.tableData.loading = true;
	if (userInfos.value.userName != 'admin') {
		state.tableData.param.search = userInfos.value.userName;
	}
	request.get('/api/cameraRecords', { params: state.tableData.param }).then((res) => {
		if (res.code == 0) {
			state.tableData.data = res.data.records.map((item: any, index: number) => ({
				...item,
				num: (state.tableData.param.pageNum - 1) * state.tableData.param.pageSize + index + 1
			}));
			state.tableData.total = res.data.total;
			uniqueKey.value++;
			setTimeout(() => { state.tableData.loading = false; }, 300);
		} else {
			state.tableData.loading = false;
			ElMessage.error(res.msg);
		}
	});
};

const onRowDel = (row: any) => {
	ElMessageBox.confirm(`此操作将永久删除该监控录制记录，是否继续?`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	}).then(() => {
		request.delete('/api/cameraRecords/' + row.id).then((res) => {
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
		height: 120px;
		&:hover td { background-color: rgba(16, 185, 129, 0.05) !important; }
	}

	.video-preview-box {
		position: relative;
		width: 180px;
		height: 100px;
		border-radius: 10px;
		overflow: hidden;
		background: #000;
		box-shadow: 0 4px 12px rgba(0,0,0,0.2);
		cursor: default;

		.table-video { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
		
		.video-overlay {
			position: absolute; top: 0; left: 0; width: 100%; height: 100%;
			display: flex; align-items: center; justify-content: center;
			background: rgba(0,0,0,0.1);
			color: #fff; font-size: 28px;
			opacity: 0.5;
		}

		&:hover {
			.table-video { opacity: 1; transform: scale(1.02); }
		}
	}

	.result-box {
		border: 1px solid rgba(16, 185, 129, 0.4);
	}

	.brand-tag {
		font-weight: 600;
	}
}

.pagination-footer {
	display: flex;
	justify-content: flex-end;
}
</style>

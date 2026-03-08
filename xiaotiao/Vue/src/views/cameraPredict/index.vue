<template>
	<div class="system-predict-container">
		<div class="system-predict-padding">
			<!-- 工具栏 -->
			<div class="header">
				<div class="kind">
					<el-select v-model="kind" placeholder="选择作物" size="large" style="width: 140px" @change="getData">
						<el-option v-for="item in state.kind_items" :key="item.value" :label="item.label" :value="item.value" />
					</el-select>
				</div>
				<div class="weight">
					<el-select v-model="weight" placeholder="选择模型" size="large" style="width: 160px" @change="onWeightChange">
						<el-option v-for="item in state.weight_items" :key="item.value" :label="item.label" :value="item.value" />
					</el-select>
				</div>
				<div class="conf-section">
					<span class="label">置信度: {{ conf }}%</span>
					<el-slider v-model="conf" :format-tooltip="formatTooltip" style="width: 200px;" />
				</div>
				
				<div class="button-group">
					<el-button 
						type="success" 
						@click="start" 
						class="action-btn" 
						:disabled="state.cameraisShow || state.suggestionLoading"
						:loading="state.suggestionLoading"
					>🔴 {{ state.suggestionLoading ? '启动中' : '开始录制' }}</el-button>
					<el-button 
						type="danger" 
						plain 
						@click="stop" 
						class="action-btn"
						:disabled="!state.cameraisShow"
					>⏹ 结束录制</el-button>
				</div>

				<!-- 进度条 -->
				<div class="progress-box" v-if="state.isShow">
					<el-progress :text-inside="true" :stroke-width="18" :percentage="state.percentage">
						<span>{{ state.type_text }} {{ state.percentage }}%</span>
					</el-progress>
				</div>
			</div>

			<!-- 主体内容：摄像头流 + AI 建议 -->
			<el-row :gutter="20" class="main-content">
				<el-col :span="16">
					<el-card shadow="hover" class="video-card">
						<div class="video-wrapper">
							<img v-if="state.cameraisShow" class="video-stream" :src="state.video_path">
							<!-- 激光扫描线动画 -->
							<div v-if="state.cameraisShow" class="scanning-line"></div>
							<!-- 未开启状态 -->
							<div v-if="!state.cameraisShow" class="empty-state">
								<el-icon><Camera /></el-icon>
								<p>摄像头未开启，点击“开始录制”启动</p>
							</div>
						</div>
					</el-card>
				</el-col>

				<el-col :span="8">
					<el-card shadow="hover" class="ai-suggestion-card">
						<div class="image-title ai-card-header">
							<div class="ai-badge">
								<span class="ai-dot"></span>
								<span>智谱 GLM · 实时监控</span>
							</div>
						</div>
						
						<div class="suggestion-content">
							<div v-if="state.aiSuggestion" class="suggestion-markdown markdown-body" v-html="renderMarkdown(state.aiSuggestion)"></div>
							<div v-else-if="state.suggestionLoading" class="ai-loading">
								<div class="ai-loading-dots"><span></span><span></span><span></span></div>
								<p>GLM 正在通过镜头诊断...</p>
							</div>
							<div v-else class="placeholder">
								<el-icon><Histogram /></el-icon>
								<span>AI 正在等待视频流输入</span>
							</div>
						</div>
					</el-card>
				</el-col>
			</el-row>
		</div>
	</div>
</template>

<script setup lang="ts" name="cameraPredict">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '/@/utils/request';
import { useUserInfo } from '/@/stores/userInfo';
import { storeToRefs } from 'pinia';
import { SocketService } from '/@/utils/socket';
import { formatDate } from '/@/utils/formatTime';
import MarkdownIt from 'markdown-it';
import { Camera, Histogram } from '@element-plus/icons-vue';

// 初始化 Markdown 渲染器
const md = new MarkdownIt({ breaks: true, linkify: true });
const renderMarkdown = (text: string) => md.render(text || '');

const stores = useUserInfo();
const conf = ref(50);
const kind = ref('');
const weight = ref('');
const { userInfos } = storeToRefs(stores);

const state = reactive({
	weight_items: [] as any,
	kind_items: [
    { value: 'corn', label: '玉米' },
    { value: 'rice', label: '水稻' },
    { value: 'wheat', label: '小麦' },
    { value: 'potato', label: '马铃薯' },
    { value: 'tomato', label: '番茄' },
    { value: 'cotton', label: '棉花' },
    { value: 'apple', label: '苹果' },
    { value: 'grape', label: '葡萄' },
    { value: 'strawberry', label: '草莓' },
	],
	video_path: '',
	type_text: "正在保存",
	percentage: 50,
	isShow: false,
	cameraisShow: false,
	aiSuggestion: '',
	suggestionLoading: false,
	form: {
		username: '',
		weight: '',
		conf: null as any,
		kind: '',
		startTime: ''
	},
});

const socketService = new SocketService();

socketService.on('message', (data) => {
	ElMessage.success(data);
});

const formatTooltip = (val: number) => {
	return val / 100
}

socketService.on('progress', (data) => {
	state.percentage = parseInt(data);
	if (parseInt(data) < 100) {
		state.isShow = true;
	} else {
		ElMessage.success("保存成功！");
		setTimeout(() => {
			state.isShow = false;
			state.percentage = 0;
		}, 2000);
	}
});

const onWeightChange = (val: string) => {
	if (!val) return;
	const matchedKind = state.kind_items.find(item => val.toLowerCase().includes(item.value.toLowerCase()));
	if (matchedKind) {
		kind.value = matchedKind.value;
	}
};

const getData = () => {
	if (!weight.value || !weight.value.includes(kind.value)) {
		weight.value = ''; 
	}
	request.get('/api/flask/file_names').then((res) => {
		if (res.code == 0) {
			res.data = JSON.parse(res.data);
			if (kind.value) {
				state.weight_items = res.data.weight_items.filter(item => item.value.includes(kind.value));
			} else {
				state.weight_items = res.data.weight_items;
			}
		}
	});
};

const start = () => {
	if (!kind.value) {
		ElMessage.warning('请选择作物种类');
		return;
	}
	if (!weight.value) {
		ElMessage.warning('请选择模型');
		return;
	}
	if (conf.value === null || isNaN(Number(conf.value)) || Number(conf.value) === 0) {
		ElMessage.warning('请设置有效的置信度阈值（需大于0）');
		return;
	}
	state.form.weight = weight.value;
	state.form.kind = kind.value;
	state.form.conf = (Number(conf.value)/100);
	state.form.username = userInfos.value.userName;
	state.form.startTime = formatDate(new Date(), 'YYYY-mm-dd HH:MM:SS');
	
	const queryParams = new URLSearchParams(state.form).toString();
	state.cameraisShow = true
	state.video_path = `http://127.0.0.1:5000/predictCamera?${queryParams}`;
	state.aiSuggestion = '';
	state.suggestionLoading = true;

	setTimeout(() => {
		state.suggestionLoading = false;
		state.aiSuggestion = `### 智谱 GLM 实时在线监控
- **检测模式**: 摄像头实时录制
- **识别目标**: ${state.kind_items.find(i => i.value === kind.value)?.label}
- **状态**: 正在通过视觉传感器捕获场中影像。
- **专家提示**: 请确保摄像头镜头清洁并保持光照充足，以获得最佳 AI 识别精度。`;
	}, 1500);
};

const stop = () => {
	request.get('/flask/stopCamera').then((res) => {
		if (res.code == 0) {
			res.data = JSON.parse(res.data);
			state.weight_items = res.data.weight_items;
		} else {
			ElMessage.error(res.msg);
		}
	});
	state.cameraisShow = false;
	state.aiSuggestion = '';
};

onMounted(() => {
	getData();
});
</script>

<style scoped lang="scss">
.system-predict-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	background: transparent;

	.system-predict-padding {
		padding: 15px;
		min-height: calc(100% - 60px);
	}
}

.header {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px 20px;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(12px);
	border-radius: 12px;
	border: 1px solid rgba(255, 255, 255, 0.5);
	margin-bottom: 20px;

	.conf-section {
		display: flex;
		align-items: center;
		gap: 12px;
		.label { font-size: 13px; color: #64748b; white-space: nowrap; }
	}

	.button-group {
		display: flex;
		gap: 10px;
	}

	.progress-box {
		flex: 1;
		margin-left: 20px;
	}
}

.main-content {
	margin-top: 10px;
}

.video-card {
	background: rgba(255,255,255,0.8) !important;
	backdrop-filter: blur(10px);
	border-radius: 16px !important;
	border: 1px solid rgba(255,255,255,0.4) !important;
	overflow: hidden;

	.video-wrapper {
		position: relative;
		width: 100%;
		height: 520px;
		background: #000;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
		overflow: hidden;

		.video-stream {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
		}

		.empty-state {
			color: #475569;
			text-align: center;
			i { font-size: 48px; margin-bottom: 12px; opacity: 0.3; }
			p { font-size: 14px; opacity: 0.5; }
		}

		.scanning-line {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 4px;
			background: linear-gradient(to bottom, rgba(16, 185, 129, 0), rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 0));
			box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);
			animation: scan 3s linear infinite;
			z-index: 10;
		}
	}
}

@keyframes scan {
	0% { top: 0; }
	100% { top: 100%; }
}

.ai-suggestion-card {
	background: rgba(255, 255, 255, 0.8) !important;
	backdrop-filter: blur(12px);
	border-radius: 16px !important;
	height: 100%;
	display: flex;
	flex-direction: column;

	.ai-card-header {
		padding-bottom: 12px;
		border-bottom: 1px solid rgba(0,0,0,0.05);
		margin-bottom: 16px;
	}

	.ai-badge {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		color: #1e293b;
		background: rgba(16, 185, 129, 0.1);
		padding: 4px 12px;
		border-radius: 100px;
		font-size: 13px;
	}

	.ai-dot {
		width: 8px; height: 8px; background: #10B981; border-radius: 50%;
		animation: pulse-dot 2s infinite;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	.suggestion-content {
		flex: 1;
		overflow-y: auto;
		min-height: 440px;
	}
}

.ai-loading {
	height: 300px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	color: #64748b;
	font-size: 13px;

	.ai-loading-dots {
		display: flex; gap: 6px;
		span {
			width: 8px; height: 8px; background: #10B981; border-radius: 50%;
			animation: bounce 1.4s infinite ease-in-out both;
			&:nth-child(1) { animation-delay: -0.32s; }
			&:nth-child(2) { animation-delay: -0.16s; }
		}
	}
}

@keyframes bounce {
	0%, 80%, 100% { transform: scale(0); }
	40% { transform: scale(1.0); }
}

.suggestion-markdown {
	font-size: 13px;
	line-height: 1.8;
	color: #334155;
	:deep(h3) { font-size: 15px; color: #10B981; margin: 12px 0 8px; }
	:deep(ul) { padding-left: 20px; }
	:deep(li) { margin-bottom: 6px; }
}

.placeholder {
	height: 300px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	color: #94a3b8;
	i { font-size: 32px; }
}

.action-btn {
	border-radius: 8px;
	font-weight: 600;
	transition: all 0.2s;
	&:hover { transform: translateY(-2px); }
}
</style>
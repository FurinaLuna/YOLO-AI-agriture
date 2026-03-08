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
				
				<el-upload v-model="state.form.inputVideo" ref="uploadFile" class="video-uploader"
					action="http://localhost:9999/files/upload" :show-file-list="false"
					:on-success="handleAvatarSuccessone"
					:disabled="aiStore.videoPredict.loading"
				>
					<el-button type="info" plain class="action-btn" :disabled="aiStore.videoPredict.loading">📁 上传视频</el-button>
				</el-upload>

				<el-button 
					type="primary" 
					@click="upData" 
					class="predict-button" 
					:loading="aiStore.videoPredict.loading"
					:disabled="aiStore.videoPredict.loading"
				>▶ {{ aiStore.videoPredict.loading ? 'AI 启动中' : '开始 AI 识别' }}</el-button>

				<!-- 进度条 -->
				<div class="progress-box" v-if="state.isShow">
					<el-progress :text-inside="true" :stroke-width="18" :percentage="state.percentage">
						<span>{{ state.type_text }} {{ state.percentage }}%</span>
					</el-progress>
				</div>
			</div>

			<!-- 主体内容：视频 + AI 建议 -->
			<el-row :gutter="20" class="main-content">
				<el-col :span="16">
					<el-card shadow="hover" class="video-card">
						<div class="video-wrapper" ref="videoRef">
							<!-- 实时流模式 (识别中) -->
							<img v-if="state.video_path && !state.local_video_url" class="video-stream" :src="state.video_path">
							<!-- 本地播放模式 (识别后支持拖动) -->
							<video v-else-if="state.local_video_url" class="video-stream" controls autoplay :src="state.local_video_url"></video>
							
							<!-- 激光扫描线动画 -->
							<div v-if="state.video_path && !state.isShow" class="scanning-line"></div>
							
							<!-- 未加载状态 -->
							<div v-if="!state.video_path && !state.local_video_url" class="empty-state">
								<el-icon><VideoCamera /></el-icon>
								<p>等待视频源加载...</p>
							</div>

							<!-- 全屏按钮 -->
							<div class="video-controls" v-if="state.video_path || state.local_video_url">
								<el-tooltip content="全屏切换" placement="top">
									<div class="control-btn" @click="toggleFullScreen">
										<el-icon><FullScreen /></el-icon>
									</div>
								</el-tooltip>
							</div>
						</div>
					</el-card>
				</el-col>

				<el-col :span="8">
					<el-card shadow="hover" class="ai-suggestion-card">
						<div class="image-title ai-card-header">
							<div class="ai-badge">
								<span class="ai-dot"></span>
								<span>智谱 GLM · 动态分析</span>
							</div>
						</div>
						
						<div class="suggestion-content">
							<div v-if="aiStore.videoPredict.aiSuggestion" class="suggestion-markdown markdown-body" v-html="renderMarkdown(aiStore.videoPredict.aiSuggestion)"></div>
							<div v-else-if="aiStore.videoPredict.loading" class="ai-loading">
								<div class="ai-loading-dots"><span></span><span></span><span></span></div>
								<p>GLM 正在深度诊断...</p>
							</div>
							<div v-else class="placeholder">
								<el-icon><Monitor /></el-icon>
								<span>识别进行中，AI 建议将流式生成</span>
							</div>
						</div>
					</el-card>
				</el-col>
			</el-row>
		</div>
	</div>
</template>


<script setup lang="ts" name="videoPredict">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '/@/utils/request';
import { useUserInfo } from '/@/stores/userInfo';
import { storeToRefs } from 'pinia';
import type { UploadInstance, UploadProps } from 'element-plus';
import { SocketService } from '/@/utils/socket';
import { formatDate } from '/@/utils/formatTime';
import MarkdownIt from 'markdown-it';
import { VideoCamera, Monitor, FullScreen } from '@element-plus/icons-vue';
import { useAIStore } from '/@/stores/aiStore';

// 初始化 Markdown 渲染器
const md = new MarkdownIt({ breaks: true, linkify: true });
const renderMarkdown = (text: string) => md.render(text || '');

const aiStore = useAIStore();
const videoRef = ref<HTMLDivElement | null>(null);
const uploadFile = ref<UploadInstance>();
const stores = useUserInfo();
const conf = ref(50);
const kind = ref('');
const weight = ref('');
const { userInfos } = storeToRefs(stores);

const handleAvatarSuccessone: UploadProps['onSuccess'] = (response, uploadFile) => {
	ElMessage.success('上传成功！');
	state.form.inputVideo = response.data;
};
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
	data: {} as any,
	video_path: '',
	local_video_url: '', // 新增：保存后的本地播放地址
	type_text: "正在保存",
	percentage: 0,
	isShow: false,
	form: {
		username: '',
		inputVideo: null as any,
		weight: '',
		conf: null as any,
		kind: '',
		startTime: ''
	},
});

const socketService = new SocketService();

socketService.on('message', (data) => {
	console.log('Received message:', data);
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
		//两秒后隐藏进度条
		ElMessage.success("处理成功！即将开启回放模式");
		setTimeout(() => {
			state.isShow = false;
			state.percentage = 0;
		}, 2000);
	}
	console.log('Received message:', data);
});

socketService.on('video_result', (data: { url: string }) => {
	console.log('Received video result:', data.url);
	state.local_video_url = data.url;
	// 切换到回放模式
	aiStore.videoPredict.loading = false;
});

// 模型选择变化时的回调
const onWeightChange = (val: string) => {
	if (!val) return;
	// 根据模型文件名自动匹配种类
	const matchedKind = state.kind_items.find(item => val.toLowerCase().includes(item.value.toLowerCase()));
	if (matchedKind) {
		kind.value = matchedKind.value;
	}
};

const getData = () => {
	// 如果已经选了模型且种类匹配，就不清空了
	if (!weight.value || !weight.value.includes(kind.value)) {
		weight.value = ''; 
	}
	request.get('/api/flask/file_names').then((res) => {
		if (res.code == 0) {
			res.data = JSON.parse(res.data);
			// 如果没有选种类，显示所有模型；如果选了种类，执行过滤
			if (kind.value) {
				state.weight_items = res.data.weight_items.filter(item => item.value.includes(kind.value));
			} else {
				state.weight_items = res.data.weight_items;
			}
		} else {
			ElMessage.error(res.msg || '获取模型列表失败');
		}
	});
};


const upData = () => {
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
	if (!state.form.inputVideo) {
		ElMessage.warning('请上传视频');
		return;
	}

	// 先清空，再重新赋值，强制浏览器重载资源流
	state.video_path = '';
	state.local_video_url = '';
	aiStore.videoPredict.aiSuggestion = '';
	aiStore.videoPredict.loading = true;

	setTimeout(() => {
		state.form.weight = weight.value;
		state.form.conf = (Number(conf.value) / 100);
		state.form.username = userInfos.value.userName;
		state.form.kind = kind.value;
		state.form.startTime = formatDate(new Date(), 'YYYY-mm-dd HH:MM:SS');
		
		const queryParams = new URLSearchParams(state.form).toString();
		state.video_path = `http://127.0.0.1:5000/predictVideo?${queryParams}`;
		ElMessage.success('正在建立 AI 直连...');

		// 模拟 GLM 获取动态建议
		setTimeout(() => {
			aiStore.videoPredict.loading = false;
			aiStore.videoPredict.aiSuggestion = `### 智谱 GLM 实时视频分析报告
- **识别作物**: ${state.kind_items.find(i => i.value === kind.value)?.label}
- **模型**: ${weight.value}
- **当前状态**: 视频流检测中，正在捕捉动态病害特征。
- **建议**: 已开启边缘计算模式，识别到疑似病灶后将实时触发预警报警。`;
		}, 2000);
	}, 100);
};

// 全屏控制
const toggleFullScreen = () => {
    if (!videoRef.value) return;
    if (!document.fullscreenElement) {
        videoRef.value.requestFullscreen().catch(err => {
            ElMessage.error(`全屏失败: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
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

		/* 激光扫描线 */
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

/* 视频内悬浮控制 */
.video-controls {
	position: absolute;
	right: 15px;
	bottom: 15px;
	z-index: 20;
	display: flex;
	gap: 10px;

	.control-btn {
		width: 36px;
		height: 36px;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid rgba(255, 255, 255, 0.1);

		&:hover {
			background: rgba(16, 185, 129, 0.6);
			transform: scale(1.05);
		}
	}
}

/* 适配全屏状态下的布局 */
:fullscreen {
	.video-stream {
		width: 100vw !important;
		height: 100vh !important;
		object-fit: contain;
	}
	.video-controls {
		bottom: 30px;
		right: 30px;
	}
}

/* AI 建议卡片 */
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
	font-size: 14px;
	line-height: 1.8;
	color: #334155;

	:deep(h3) { 
		font-size: 16px; color: #10B981; margin: 18px 0 10px; font-weight: 700;
		display: flex; align-items: center;
		&::before { content: ''; width: 3px; height: 16px; background: #10B981; margin-right: 8px; border-radius: 4px; }
	}
	:deep(ul) { padding-left: 20px; li { margin-bottom: 6px; &::marker { color: #10B981; } } }
	:deep(strong) { color: #0f172a; font-weight: 700; background: rgba(16, 185, 129, 0.05); padding: 0 4px; border-radius: 2px; }
	:deep(blockquote) {
		border-left: 4px solid #10B981; background: rgba(16, 185, 129, 0.03); padding: 10px 16px; margin: 15px 0; border-radius: 0 8px 8px 0;
	}
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
	span { font-size: 13px; }
}

.predict-button {
	background: linear-gradient(135deg, #10B981, #059669) !important;
	border: none !important;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	font-weight: 600;
	&:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(16,185,129,0.3); }
}

.action-btn {
	border-radius: 8px;
}

</style>
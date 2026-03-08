<template>
	<div class="system-predict-container">
		<div class="system-predict-padding">
			<!-- 高级信息头 -->
			<el-card shadow="never" class="glass-card mb-4 header-card">
				<div class="header-content">
					<div class="meta-section">
						<div class="meta-item">
							<span class="label">分析对象:</span>
							<el-tag effect="dark" type="success" class="brand-tag">{{ state.form.weight || '作物模型' }}</el-tag>
						</div>
						<div class="meta-item">
							<span class="label">执行用户:</span>
							<el-tag effect="plain" type="info">{{ state.form.username }}</el-tag>
						</div>
						<div class="meta-item">
							<span class="label">置信阈值:</span>
							<span class="value">{{ state.form.conf }}</span>
						</div>
						<div class="meta-item time">
							<span class="label">时间戳:</span>
							<span class="value">{{ state.form.startTime }}</span>
						</div>
					</div>
					<div class="action-section">
						<el-button-group>
							<el-button type="primary" @click="playVideos" :icon="VideoPlay">同步播放</el-button>
							<el-button type="success" plain @click="pauseVideos" :icon="VideoPause">暂停</el-button>
						</el-button-group>
					</div>
				</div>
			</el-card>

			<!-- 沉浸式对比区域 -->
			<div class="analysis-lab glass-card">
				<div class="lab-workspace" ref="cardsContainer">
					<!-- 原视频 -->
					<div class="video-panel left-panel" :style="{ width: leftWidth + '%' }">
						<div class="panel-label">ORIGINAL FEED</div>
						<video class="analysis-video" v-if="state.form.inputVideo" preload="auto" controls>
							<source :src="state.form.inputVideo" type="video/mp4" />
						</video>
					</div>

					<!-- 智能分割条 -->
					<div class="lab-splitter" @mousedown="startDrag">
						<div class="splitter-handle">
							<span></span><span></span><span></span>
						</div>
					</div>

					<!-- AI 处理视频 -->
					<div class="video-panel right-panel" :style="{ width: 100 - leftWidth + '%' }">
						<div class="panel-label ai-label">AI ANALYSIS</div>
						<video class="analysis-video" preload="auto" v-if="state.form.outVideo" controls>
							<source :src="state.form.outVideo" type="video/mp4" />
						</video>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '/@/utils/request';
import { useRoute } from 'vue-router';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';

const route = useRoute();
const leftWidth = ref(50);
const state = reactive({
	form: {} as any,
	id: '' as any
});

const getData = () => {
	request.get('/api/videoRecords/' + state.id).then((res) => {
		if (res.code == 0) {
			state.form = res.data;
		} else {
			ElMessage.error(res.msg);
		}
	});
};

const playVideos = () => {
    const videos = document.querySelectorAll('.analysis-video') as NodeListOf<HTMLVideoElement>;
    videos.forEach(v => v.play());
};

const pauseVideos = () => {
    const videos = document.querySelectorAll('.analysis-video') as NodeListOf<HTMLVideoElement>;
    videos.forEach(v => v.pause());
};

const startDrag = (e: MouseEvent) => {
	const container = document.querySelector('.lab-workspace') as HTMLElement;
	const startX = e.clientX;
	const startLeftWidth = leftWidth.value;
	const containerWidth = container.offsetWidth;

	const onMouseMove = (moveEvent: MouseEvent) => {
		const deltaX = moveEvent.clientX - startX;
		let newLeftWidth = startLeftWidth + (deltaX / containerWidth) * 100;
		leftWidth.value = Math.min(Math.max(newLeftWidth, 5), 95);
	};

	const onMouseUp = () => {
		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
	};

	document.addEventListener('mousemove', onMouseMove);
	document.addEventListener('mouseup', onMouseUp);
};

onMounted(() => {
	state.id = route.query.id;
	getData()
});
</script>

<style scoped lang="scss">
.system-predict-container {
	width: 100%;
	height: 100%;
	padding: 20px;
	background: transparent;

	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: 16px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
	}
}

.header-card {
	padding: 16px 24px;
	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
}

.meta-section {
	display: flex;
	gap: 24px;
	align-items: center;

	.meta-item {
		display: flex;
		align-items: center;
		gap: 8px;
		.label { font-size: 13px; color: #64748b; font-weight: 500; }
		.value { font-size: 14px; color: #1e293b; font-weight: 600; }
	}
}

.analysis-lab {
	height: calc(100% - 120px);
	padding: 10px;
	overflow: hidden;
	
	.lab-workspace {
		width: 100%;
		height: 100%;
		display: flex;
		background: #000;
		border-radius: 12px;
		overflow: hidden;
		position: relative;
	}
}

.video-panel {
	position: relative;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;

	.panel-label {
		position: absolute;
		top: 16px;
		left: 16px;
		background: rgba(0,0,0,0.5);
		color: #fff;
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1px;
		z-index: 10;
		border-left: 3px solid #94a3b8;
	}

	.ai-label {
		border-left-color: #10B981;
		background: rgba(16, 185, 129, 0.2);
		backdrop-filter: blur(4px);
	}

	.analysis-video {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
}

.lab-splitter {
	width: 6px;
	background: rgba(255,255,255,0.1);
	cursor: ew-resize;
	position: relative;
	z-index: 20;
	transition: background 0.2s;

	&:hover {
		background: rgba(16, 185, 129, 0.5);
		.splitter-handle { transform: translate(-50%, -50%) scale(1.2); }
	}

	.splitter-handle {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 24px;
		height: 48px;
		background: #fff;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 4px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		transition: all 0.2s;

		span {
			width: 2px; height: 8px; background: #cbd5e1; border-radius: 2px;
		}
	}
}

.brand-tag {
	font-weight: 700;
	border-radius: 6px;
}
</style>
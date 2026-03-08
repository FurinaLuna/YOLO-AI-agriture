import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig, loadEnv, ConfigEnv } from 'vite';
import vueSetupExtend from 'vite-plugin-vue-setup-extend';

const pathResolve = (dir: string) => {
	return resolve(__dirname, '.', dir);
};

const alias: Record<string, string> = {
	'/@': pathResolve('./src/'),
	'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
};

const viteConfig = defineConfig((mode: ConfigEnv) => {
	const env = loadEnv(mode.mode, process.cwd());
	const isProduction = mode.command === 'build';
	
	return {
		plugins: [vue(), vueSetupExtend()],
		root: process.cwd(),
		resolve: { alias },
		base: mode.command === 'serve' ? './' : env.VITE_PUBLIC_PATH,
		
		optimizeDeps: {
			include: [
				'element-plus/lib/locale/lang/zh-cn',
				'element-plus/lib/locale/lang/en',
				'element-plus/lib/locale/lang/zh-tw',
				'vue',
				'vue-router',
				'pinia',
			],
			exclude: ['@iconify/json'],
		},
		
		server: {
			host: '0.0.0.0',
			port: env.VITE_PORT as unknown as number,
			open: env.VITE_OPEN,
			hmr: true,
			cors: true,
			proxy: {
				'/api': {
					target: 'http://localhost:9999/',
					ws: true,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api/, ''),
				},
				'/flask': {
					target: 'http://localhost:5000/',
					ws: true,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/flask/, ''),
				},
			},
		},
		
		build: {
			outDir: 'dist',
			chunkSizeWarningLimit: 1000,
			minify: 'terser',
			terserOptions: {
				compress: {
					drop_console: isProduction,
					drop_debugger: isProduction,
					pure_funcs: isProduction ? ['console.log'] : [],
				},
				format: {
					comments: false,
				},
			},
			rollupOptions: {
				output: {
					entryFileNames: `assets/[name].[hash].js`,
					chunkFileNames: `assets/[name].[hash].js`,
					assetFileNames: `assets/[name].[hash].[ext]`,
					compact: true,
					manualChunks: (id) => {
						if (id.includes('node_modules')) {
							if (id.includes('vue') && !id.includes('vue-router') && !id.includes('pinia')) {
								return 'vue-vendor';
							}
							if (id.includes('vue-router')) {
								return 'vue-router';
							}
							if (id.includes('pinia')) {
								return 'pinia';
							}
							if (id.includes('element-plus')) {
								return 'element-plus';
							}
							if (id.includes('echarts') || id.includes('zrender')) {
								return 'echarts';
							}
							if (id.includes('axios')) {
								return 'axios';
							}
							if (id.includes('markdown-it')) {
								return 'markdown';
							}
							if (id.includes('@element-plus/icons-vue')) {
								return 'element-icons';
							}
							if (id.includes('lodash') || id.includes('lodash-es')) {
								return 'lodash';
							}
							return 'vendor';
						}
						
						if (id.includes('/src/views/')) {
							const match = id.match(/\/src\/views\/(.*)\.vue/);
							if (match) {
								const viewName = match[1].split('/')[0];
								return `views-${viewName}`;
							}
						}
						
						if (id.includes('/src/components/')) {
							return 'components';
						}
						
						if (id.includes('/src/stores/')) {
							return 'stores';
						}
						
						if (id.includes('/src/utils/')) {
							return 'utils';
						}
					},
				},
			},
			reportCompressedSize: true,
			sourcemap: !isProduction,
			target: 'es2015',
			cssCodeSplit: true,
		},
		
		css: {
			preprocessorOptions: {
				scss: {
					charset: false,
				},
				css: { charset: false },
			},
			devSourcemap: true,
		},
		
		define: {
			__VUE_I18N_LEGACY_API__: JSON.stringify(false),
			__VUE_I18N_FULL_INSTALL__: JSON.stringify(false),
			__INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
			__VERSION__: JSON.stringify(process.env.npm_package_version),
		},
	};
});

export default viteConfig;

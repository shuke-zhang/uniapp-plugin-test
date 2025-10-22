import type { UserConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(async ({ mode, command }) => {
  const env = loadEnv(mode, './')
  const _isBuild = command === 'build'

  const config: UserConfig = {

    plugins: [
      UniPages({
        homePage: 'pages/test/plugin-test-all',
        // homePage: 'pages/recorder/doubao/index',
      }),
      uni(),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler', // or "modern", "legacy"
          silenceDeprecations: ['legacy-js-api'],
        },
      },

    },
    define: {
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
      API_URL: `"${env.VITE_APP_API_URL}"`,
      APP_TITLE: `"${env.VITE_APP_TITLE}"`,
    },
  }
  return config
})
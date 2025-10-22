<script setup lang="ts">
import { onReady, onUnload } from '@dcloudio/uni-app' // ✅ 用 onReady，而不是 uni.ready
import { onUnmounted, ref } from 'vue'
import { doubaoSpeechSynthesisFormat } from '@/api/audio'
import { showToastSuccess } from '@/utils'
import { audio1, audio2, audio3 } from './audio'

// 原生插件
const plugin = uni.requireNativePlugin('shuke_audio_play')

const isRunning = ref(false)
const currentId = ref<number | null>(null)
const queueSize = ref(0)
const progress = ref(0)
const outputMode = ref<'speaker' | 'earpiece' | 'bluetooth'>('speaker')

const audioList = ref([
  { id: 0, text: '今天是个好日子', base64: audio1, mime: 'audio/mp4' },
  { id: 1, text: '天气很不错', base64: audio2, mime: 'audio/mp4' },
  { id: 2, text: '很适合睡觉', base64: audio3, mime: 'audio/mp4' },
])

/** 注册事件监听（保持只注册一次） */
function registerListener() {
  if (!plugin || !plugin.onEvent) {
    console.warn('⚠️ 原生插件不可用（仅 App 端有效，H5/小程序无效）')
    return
  }

  plugin.onEvent((res: any) => {
    const msg = typeof res === 'string' ? JSON.parse(res) : res
    const event = msg?.type // ✅ 关键：事件字段是 type
    const data = msg?.data || {}

    switch (event) {
      case 'ready':
        console.log('✅ 插件就绪')
        break
      case 'queued':
        queueSize.value = data.queueSize ?? queueSize.value
        console.log('queued，当前队列数：', queueSize.value)

        break
      case 'start':
        console.log('▶️ 开始播放 ID：', currentId.value)
        currentId.value = Number(data.id) || null
        progress.value = 0
        isRunning.value = true
        break
      case 'progress':
        console.log('🎵 播放进度：', data.progress)
        // 后端给了 progress(0~1) 以及 positionMs/durationMs
        progress.value = Math.floor((data.progress ?? 0) * 100)
        break
      case 'complete':
        console.log('✅ 播放完成 ID：', data.id)
        // 单条完成
        break
      case 'queueEmpty':
        console.log('🎉 播放队列已空')
        isRunning.value = false
        queueSize.value = 0
        currentId.value = null
        progress.value = 0

        break
      case 'modeChanged':
        console.log('🔄 输出模式切换为：', data.mode)
        outputMode.value = data.mode
        break
      case 'error':
        uni.showToast({ title: `❌ ${data.message || '播放出错'}`, icon: 'none' })
        console.error('播放错误：', data)
        break
      case 'released':
        console.log('播放器已释放')
        break
      default:
        console.log('📩 其他事件：', msg)
    }
  })
}

/** 启动播放：把列表全部入队 */
function startPlayProcess() {
  if (isRunning.value)
    return
  console.log('开始播放')
  try {
    plugin.clear?.()
    isRunning.value = true
    queueSize.value = 0
    currentId.value = null
    progress.value = 0

    // 注意：AudioModule.addTask 的签名是 (id, base64, callback)
    // for (const item of audioList.value) {
    //   plugin.addTask(String(item.id), item.base64, (ret: any) => {
    //   // 这里第三参传回调，避免把 mime 字符串误传给原生
    //     console.log('入队回调：', ret)
    //   })
    // }
    for (let i = 0; i < audioList.value.length; i++) {
      const element = audioList.value[i]
      plugin.addTask(String(element.id), element.base64, (ret: any) => {
        console.log('入队回调：', ret)
      })

      // doubaoSpeechSynthesisFormat({
      //   text: element.text,
      //   id: element.id,
      // }).then((res) => {
      //   const { audio_base64, text, id } = res
      //   console.log(`合成文本${text}`)
      //   plugin.addTask(id, audio_base64, (ret: any) => {
      //     console.log('入队回调：', ret)
      //   })
      // }).catch((error) => {
      //   console.error('合成失败：', error)
      // })
    }
  }
  catch (error) {
    console.error('播放出错：', error)
  }
}

/** 停止/清空 */
function stopPlayback() {
  plugin.clear?.()
  isRunning.value = false
  currentId.value = null
  progress.value = 0
}

/** 切换输出模式（speaker -> earpiece -> bluetooth 循环） */
function toggleOutputMode() {
  const next
    = outputMode.value === 'speaker'
      ? 'earpiece'
      : outputMode.value === 'earpiece'
        ? 'bluetooth'
        : 'speaker'
  outputMode.value = next
  plugin.setOutputMode?.(next, (ret: any) => console.log('切换通道：', ret))
}

/** 正确的注册时机：页面 onReady（App 端原生环境已初始化） */
onReady(() => {
  registerListener()
})

/** 页面销毁时做清理 */
onUnmounted(() => {
  stopPlayback()
})

/** App 端离开页面时彻底释放（可选） */
onUnload(() => {
  plugin.release?.()
})

function ssssss() {
  doubaoSpeechSynthesisFormat({
    text: '今天天气很不错',
    id: 0,
  }).then((res) => {
    const { audio_base64, text, id } = res
    showToastSuccess(`合成文本---${text}`)
    plugin.addTask(id, audio_base64, (ret: any) => {
      console.log('入队回调：', ret)
    })
  })
}
</script>

<template>
  <view class="page">
    <view class="title">
      🎧 舒克音频任务播放器
    </view>

    <view class="controls">
      <button :disabled="isRunning" @click="startPlayProcess">
        开始播放
      </button>

      <button :disabled="isRunning" @click="ssssss">
        接口调用
      </button>

      <button :disabled="!isRunning" @click="stopPlayback">
        停止
      </button>
      <button @click="toggleOutputMode">
        切换为
        {{
          outputMode === 'speaker'
            ? '听筒 🎧'
            : outputMode === 'earpiece'
              ? '蓝牙 🔵'
              : '扬声器 🔊'
        }}
      </button>
    </view>

    <view class="status">
      <text>当前播放 ID：{{ currentId ?? '-' }}</text>
      <text>播放进度：{{ progress }}%</text>
      <text>任务队列数：{{ queueSize }}</text>
      <text>
        输出通道：
        {{
          outputMode === 'speaker'
            ? '扬声器'
            : outputMode === 'earpiece'
              ? '听筒'
              : '蓝牙耳机'
        }}
      </text>
    </view>

    <view class="list">
      <text>📜 音频任务列表：</text>
      <view
        v-for="item in audioList" :key="item.id"
        class="item" :class="{ active: currentId === item.id }"
      >
        <text>{{ item.id }}. {{ item.text }}</text>
      </view>
    </view>

    <view>
      <text>插件信息：</text>
      {{ plugin }}
    </view>
  </view>
</template>

<style scoped>
.page {
  padding: 24rpx;
}
.title {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  justify-content: space-around;
  margin-bottom: 20rpx;
}
.status {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 20rpx;
}
.list .item {
  padding: 10rpx;
  background: #f5f5f5;
  margin-top: 8rpx;
  border-radius: 8rpx;
}
.item.active {
  background-color: #c7efff;
}
</style>

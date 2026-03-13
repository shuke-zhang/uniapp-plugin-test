<script setup lang="ts">
import { onReady, onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'

// 加载原生插件
const recorder = uni.requireNativePlugin('shuke_recorder')

// === 状态 ===
const hasPermission = ref(false)
const isRecording = ref(false)
const volume = ref(0)
const duration = ref(0)
const sampleRate = ref(16000)
const aec = ref(true)
const ns = ref(true)
const agc = ref(true)

let ctx: UniApp.CanvasContext | null = null
let waveform: number[] = []

// ===== 生命周期 =====
onReady(() => {
  ctx = uni.createCanvasContext('recorderCanvas')
  drawWaveform([])
})

onUnload(() => {
  stopRecord()
})

// ===== 请求权限 =====
function requestPermission() {
  recorder.requestPermission((res: any) => {
    console.log('🎯 权限结果:', res)
    if (res?.granted) {
      hasPermission.value = true
      uni.showToast({ title: '录音权限已授予 ✅', icon: 'none' })
    }
    else {
      uni.showToast({ title: '用户拒绝录音权限 ❌', icon: 'none' })
    }
  })
}

// ===== 开始录音 =====
function startRecord() {
  if (!hasPermission.value) {
    uni.showToast({ title: '请先授权录音权限', icon: 'none' })
    return
  }
  if (isRecording.value)
    return

  isRecording.value = true
  waveform = []
  duration.value = 0
  volume.value = 0

  const params = {
    sampleRate: sampleRate.value,
    enableAEC: aec.value,
    enableNS: ns.value,
    enableAGC: agc.value,
  }

  console.log('🎤 开始录音', params)
  recorder.startRecord(params, (res: any) => {
    const msg = typeof res === 'string' ? JSON.parse(res) : res
    const event = msg.event || msg.type

    switch (event) {
      case 'start':
        uni.showToast({ title: '录音开始 🎧', icon: 'none' })
        break
      case 'stop':
        isRecording.value = false
        uni.showToast({ title: '录音结束 🛑', icon: 'none' })
        break
      case 'error':
        isRecording.value = false
        uni.showToast({ title: msg.message || '录音错误', icon: 'none' })
        break
      default:
        if (msg.volume !== undefined)
          volume.value = msg.volume
        if (msg.duration !== undefined)
          duration.value = msg.duration
        if (msg.buffers) {
          const firstBuffer = msg.buffers[0]
          if (firstBuffer) {
            waveform = Object.values(firstBuffer).map(v => Number(v))
            drawWaveform(waveform)
          }
        }
    }
  })
}

// ===== 停止录音 =====
function stopRecord() {
  if (!isRecording.value)
    return
  console.log('🛑 停止录音')
  recorder.stopRecord((r: any) => {
    console.log('stopRecord 回调:', r)
  })
  isRecording.value = false
}

// ===== 音效选项处理 =====
function onChangeAEC(e: any) {
  aec.value = e.detail.value.length > 0
}
function onChangeNS(e: any) {
  ns.value = e.detail.value.length > 0
}
function onChangeAGC(e: any) {
  agc.value = e.detail.value.length > 0
}

// ===== 绘制波形 =====
function drawWaveform(samples: number[]) {
  if (!ctx)
    return
  const width = 300
  const height = 100
  ctx.clearRect(0, 0, width, height)
  ctx.setStrokeStyle('#00b7ff')
  ctx.setLineWidth(2)
  ctx.beginPath()
  if (samples.length === 0) {
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
  }
  else {
    const step = Math.max(1, Math.floor(samples.length / width))
    for (let x = 0; x < width; x++) {
      const idx = x * step
      const y = height / 2 - (samples[idx] / 32768) * (height / 2)
      if (x === 0)
        ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  ctx.draw()
}
</script>

<template>
  <view class="page">
    <view class="title">
      🎙️ 舒克录音测试（AEC/NS/AGC 波形）
    </view>

    <!-- 操作按钮 -->
    <view class="controls">
      <button @click="requestPermission">
        请求录音权限
      </button>
      <button :disabled="isRecording" @click="startRecord">
        开始录音
      </button>
      <button :disabled="!isRecording" @click="stopRecord">
        停止录音
      </button>
    </view>

    <!-- 音效选项 -->
    <view class="effects">
      <text>🎛️ 音效选项：</text>
      <label>
        <checkbox :checked="aec" @change="onChangeAEC" /> 回声消除(AEC)
      </label>
      <label>
        <checkbox :checked="ns" @change="onChangeNS" /> 降噪(NS)
      </label>
      <label>
        <checkbox :checked="agc" @change="onChangeAGC" /> 自动增益(AGC)
      </label>
    </view>

    <!-- 状态显示 -->
    <view class="status">
      <text>录音状态：{{ isRecording ? '🎤 录音中...' : '⏹ 已停止' }}</text>
      <text>实时音量：{{ volume }}</text>
      <text>录音时长：{{ (duration / 1000).toFixed(1) }} 秒</text>
      <text>采样率：{{ sampleRate }} Hz</text>
      <text>权限状态：{{ hasPermission ? '✅ 已授权' : '❌ 未授权' }}</text>
    </view>

    <!-- 波形画布 -->
    <view class="canvas-box">
      <text>🎵 实时音频波形：</text>
      <canvas canvas-id="recorderCanvas" class="wave-canvas" />
    </view>
  </view>
</template>

<style scoped>
.page {
  padding: 24rpx;
}
.title {
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 10rpx;
  margin-bottom: 20rpx;
}
.effects {
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 20rpx;
}
.status {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
}
.canvas-box {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 12rpx;
  padding: 10rpx;
}
.wave-canvas {
  width: 600rpx;
  height: 200rpx;
  background: #000;
  border-radius: 8rpx;
}
</style>

<route lang="json" type="page">
{
  "style": {
    "navigationBarTitleText": "录音测试",
    "navigationStyle": "default"
  }
}
</route>

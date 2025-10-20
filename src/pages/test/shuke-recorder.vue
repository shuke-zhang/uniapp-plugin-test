<script setup lang="ts">
import { onReady, onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { showToastSuccess } from '@/utils'

// ✅ 加载原生插件
const recorder = uni.requireNativePlugin('shuke_recorder')

// ====== 状态变量 ======
const hasPermission = ref(false)
const isRecording = ref(false)
const volume = ref(0)
const duration = ref(0)
const sampleRate = ref(16000)
const aec = ref(true)
const ns = ref(true)
const agc = ref(true)

const canvasId = 'recorderCanvas'
let ctx: UniApp.CanvasContext | null = null
let waveformData: number[] = []

// ====== 生命周期 ======
onReady(() => {
  ctx = uni.createCanvasContext(canvasId)
  drawWaveform([])
})

onUnload(() => {
  stopRecord()
})

// ====== 权限请求 ======
function requestPermission() {
  recorder.requestPermission((res: any) => {
    console.log('权限结果：', res)
    if (res?.granted) {
      hasPermission.value = true
      showToastSuccess('录音权限已授予')
    }
    else {
      uni.showToast({ title: '未获得录音权限', icon: 'none' })
    }
  })
}

// ====== 开始录音 ======
function startRecord() {
  if (!hasPermission.value) {
    uni.showToast({ title: '请先授权录音权限', icon: 'none' })
    return
  }
  if (isRecording.value)
    return

  isRecording.value = true
  duration.value = 0
  volume.value = 0
  waveformData = []

  const params = {
    type: 'default',
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
        showToastSuccess('录音已开始')
        break
      case 'stop':
        isRecording.value = false
        showToastSuccess('录音结束')
        break
      case 'error':
        isRecording.value = false
        uni.showToast({ title: msg.message || '录音错误', icon: 'none' })
        break
      default:
        // ✅ 实时帧回调
        if (msg.buffers) {
          const firstBuffer = msg.buffers[0]
          if (firstBuffer) {
            // Fastjson返回对象结构，将值提取为数组
            const values = Object.values(firstBuffer)
            waveformData = values.map(v => Number(v))
            drawWaveform(waveformData)
          }
        }
        if (msg.volume !== undefined)
          volume.value = msg.volume
        if (msg.duration !== undefined)
          duration.value = msg.duration
        break
    }
  })
}

// ====== 停止录音 ======
function stopRecord() {
  if (!isRecording.value)
    return
  console.log('🛑 停止录音')
  recorder.stopRecord((res: any) => {
    console.log('stopRecord回调', res)
  })
  isRecording.value = false
}

// ====== 事件处理函数（取代内联箭头函数） ======
function onChangeAEC(e: any) {
  aec.value = e.detail.value.length > 0
}
function onChangeNS(e: any) {
  ns.value = e.detail.value.length > 0
}
function onChangeAGC(e: any) {
  agc.value = e.detail.value.length > 0
}

// ====== 绘制实时波形 ======
function drawWaveform(samples: number[]) {
  if (!ctx)
    return
  const width = 300
  const height = 100
  ctx.clearRect(0, 0, width, height)
  ctx.setStrokeStyle('#3ba4ff')
  ctx.setLineWidth(2)
  ctx.beginPath()

  if (!samples || samples.length === 0) {
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
  }
  else {
    const step = Math.max(1, Math.floor(samples.length / width))
    for (let x = 0; x < width; x++) {
      const index = x * step
      const y = height / 2 - (samples[index] / 32768) * (height / 2)
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
      🎧 舒克录音测试（带波形显示）
    </view>

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

    <view class="status">
      <text>录音状态：{{ isRecording ? '录音中...' : '已停止' }}</text>
      <text>实时音量：{{ volume }}</text>
      <text>录音时长：{{ (duration / 1000).toFixed(1) }} 秒</text>
      <text>采样率：{{ sampleRate }} Hz</text>
      <text>权限状态：{{ hasPermission ? '✅ 已授权' : '❌ 未授权' }}</text>
    </view>

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
.effects {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx;
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
.canvas-box {
  background: #ffffff;
  border-radius: 12rpx;
  padding: 12rpx;
  border: 1px solid #e6e6e6;
}
.wave-canvas {
  width: 600rpx;
  height: 200rpx;
  background: #000000;
  border-radius: 8rpx;
}
</style>

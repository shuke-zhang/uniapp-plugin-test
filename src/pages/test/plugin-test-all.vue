<script setup lang="ts">
import { onReady, onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { showToastSuccess } from '@/utils'

const recorder = uni.requireNativePlugin('shuke_recorder')
const mic = uni.requireNativePlugin('shuke_microphone')
const player = uni.requireNativePlugin('shuke_audioPlay')

const hasPermission = ref(false)
const isRecording = ref(false)
const volume = ref(0)
const duration = ref(0)
const devices = ref<any[]>([])
const finalBase64 = ref<string | null>(null)
let pcmChunks: Int16Array[] = []

const canvasId = 'recorderCanvas'
let ctx: UniApp.CanvasContext | null = null
onReady(() => {
  ctx = uni.createCanvasContext(canvasId)
  drawWaveform([])
})

function requestPermission() {
  recorder.requestPermission((res: any) => {
    if (res?.granted) {
      hasPermission.value = true
      showToastSuccess('录音权限已授予')
    }
    else {
      uni.showToast({ title: '未获得录音权限', icon: 'none' })
    }
  })
}

function startRecord() {
  if (!hasPermission.value) {
    uni.showToast({ title: '请先授权录音权限', icon: 'none' })
    return
  }
  if (isRecording.value)
    return

  // ✅ 清除上一次录音
  pcmChunks = []
  finalBase64.value = null
  player.clear?.()

  isRecording.value = true
  const params = { sampleRate: 16000, enableAEC: true, enableNS: true, enableAGC: true }

  recorder.startRecord(params, (res: any) => {
    const msg = typeof res === 'string' ? JSON.parse(res) : res
    const event = msg.event || msg.type

    switch (event) {
      case 'start':
        showToastSuccess('录音开始')
        break
      case 'stop':
        isRecording.value = false
        break
      case 'error':
        isRecording.value = false
        uni.showToast({ title: msg.message || '录音错误', icon: 'none' })
        break
      default:
        if (msg.buffers) {
          const firstBuffer = msg.buffers[0]
          if (firstBuffer) {
            const values = Object.values(firstBuffer).map(v => Number(v))
            pcmChunks.push(Int16Array.from(values))
            drawWaveform(values)
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

async function stopRecord() {
  if (!isRecording.value)
    return
  recorder.stopRecord(() => {})
  isRecording.value = false
  showToastSuccess('正在合成音频...')

  try {
    const base64 = await pcmToWavBase64(pcmChunks, 16000)
    finalBase64.value = base64
    showToastSuccess('录音合成完成，可播放')
    console.log('✅ WAV Base64 头:', base64.slice(0, 60))
  }
  catch (e) {
    uni.showToast({ title: '合成失败', icon: 'none' })
    console.error(e)
  }
}

function playRecorded() {
  if (!finalBase64.value) {
    uni.showToast({ title: '暂无录音数据', icon: 'none' })
    return
  }

  const full = finalBase64.value.startsWith('data:')
    ? finalBase64.value
    : `data:audio/wav;base64,${finalBase64.value}`

  // ✅ 每次播放前清空旧任务
  player.clear?.()
  player.addTask('0', full, (ret: any) => {
    console.log('🎧 入队回调：', ret)
    player.play?.()
  })
}

function refreshDevices() {
  mic.getInputDevices((res: any) => {
    if (res.ok)
      devices.value = res.devices
    else uni.showToast({ title: res.msg || '获取失败', icon: 'none' })
  })
}
function setRoute(type: string) {
  mic.setInputRoute(type, (res: any) => {
    uni.showToast({ title: res.msg || '已切换', icon: 'none' })
  })
}

function drawWaveform(samples: number[]) {
  if (!ctx)
    return
  const width = 300
  const height = 100
  ctx.clearRect(0, 0, width, height)
  ctx.setStrokeStyle('#00e0ff')
  ctx.setLineWidth(2)
  ctx.beginPath()

  if (samples.length === 0) {
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
  }
  else {
    const ampScale = 5
    const step = Math.max(1, Math.floor(samples.length / width))
    for (let x = 0; x < width; x++) {
      const index = x * step
      const normalized = samples[index] / 32768
      const y = height / 2 - normalized * (height / 2) * ampScale
      if (x === 0)
        ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  ctx.draw()
}

function pcmToWavBase64(chunks: Int16Array[], sampleRate: number): Promise<string> {
  return new Promise((resolve) => {
    const length = chunks.reduce((sum, arr) => sum + arr.length, 0)
    const buffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(buffer)
    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(view, 36, 'data')
    view.setUint32(40, length * 2, true)
    let offset = 44
    chunks.forEach((chunk) => {
      for (let i = 0; i < chunk.length; i++, offset += 2) {
        view.setInt16(offset, chunk[i], true)
      }
    })
    const bytes = new Uint8Array(view.buffer)
    const binary = String.fromCharCode(...bytes)
    const base64 = btoa(binary)
    resolve(`data:audio/wav;base64,${base64}`)
  })
}
function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}

onUnload(() => {
  recorder.stopRecord(() => {})
  player.release?.()
})
</script>

<template>
  <scroll-view scroll-y style="height: 100vh" class="page">
    <view class="title">
      🎙️ 舒克录音与播放（自动清除优化版）
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
      <button :disabled="!finalBase64" @click="playRecorded">
        播放录音
      </button>
    </view>

    <view class="controls">
      <button @click="refreshDevices">
        查看输入设备
      </button>
      <button @click="setRoute('usb')">
        切换 USB 输入
      </button>
      <button @click="setRoute('bluetooth')">
        切换蓝牙输入
      </button>
    </view>

    <view v-if="devices.length > 0" class="device-box">
      <view v-for="(d, i) in devices" :key="i" class="device-item">
        {{ d.typeName }} - {{ d.productName }}
      </view>
    </view>

    <view class="status">
      <text>录音状态：{{ isRecording ? '录音中...' : '已停止' }}</text>
      <text>实时音量：{{ volume }}</text>
      <text>录音时长：{{ (duration / 1000).toFixed(1) }} 秒</text>
      <text>权限状态：{{ hasPermission ? '✅ 已授权' : '❌ 未授权' }}</text>
    </view>

    <view class="canvas-box">
      <text>🎵 实时波形：</text>
      <canvas canvas-id="recorderCanvas" class="wave-canvas" />
    </view>
  </scroll-view>
</template>

<style scoped>
.page {
  padding: 24rpx;
}
.title {
  font-size: 36rpx;
  font-weight: 600;
  margin: 20rpx 0;
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
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 20rpx;
}
.canvas-box {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10rpx;
  padding: 10rpx;
}
.wave-canvas {
  width: 600rpx;
  height: 200rpx;
  background: #000;
  border-radius: 8rpx;
}
.device-box {
  border: 1px solid #ddd;
  border-radius: 10rpx;
  padding: 12rpx;
  margin-bottom: 20rpx;
  background: #fafafa;
}
.device-item {
  padding: 8rpx 0;
  border-bottom: 1px dashed #ddd;
}
</style>

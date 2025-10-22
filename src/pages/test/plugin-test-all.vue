<script setup lang="ts">
import { onReady, onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { showToastSuccess } from '@/utils'

const recorder = uni.requireNativePlugin('shuke_recorder')
const mic = uni.requireNativePlugin('shuke_microphone')
const player = uni.requireNativePlugin('shuke_audio_play')

const hasPermission = ref(false)
const awaitingPermission = ref(false)
const isRecording = ref(false)
const volume = ref(0)
const duration = ref(0)
const devices = ref<any[]>([])
const finalBase64 = ref<string | null>(null)
let pcmChunks: Int16Array[] = []

// 🆕 录音通道信息
type RouteInfo = {
  label?: string
  typeName?: string
  deviceType?: number
  deviceId?: number
  productName?: string
  address?: string
  sampleRate?: number
  channels?: number
  format?: number
} | null
const routeInfo = ref<RouteInfo>(null)

let stoppedResolve: (() => void) | null = null

const canvasId = 'recorderCanvas'
let ctx: UniApp.CanvasContext | null = null

onReady(async () => {
  ctx = uni.createCanvasContext(canvasId)
  drawWaveform([])
  hasPermission.value = await checkMicPermission()
})

function waitForStop(): Promise<void> {
  return new Promise((resolve) => {
    stoppedResolve = resolve
  })
}

function checkMicPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof recorder?.checkPermission === 'function') {
      recorder.checkPermission((r: any) => {
        const ok = !!(r && (r.granted === true || r.ok === true || r === true))
        resolve(ok)
      })
      return
    }
    if (typeof recorder?.hasPermission === 'function') {
      recorder.hasPermission((r: any) => {
        const ok = !!(r && (r.granted === true || r.ok === true || r === true))
        resolve(ok)
      })
      return
    }
    resolve(false)
  })
}

async function waitPermissionAfterPrompt(maxWaitMs = 5000, intervalMs = 250): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const ok = await checkMicPermission()
    if (ok)
      return true
    await new Promise(r => setTimeout(r, intervalMs))
  }
  return false
}

async function requestPermission() {
  try {
    awaitingPermission.value = true
    recorder.requestPermission?.((_res: any) => {})
  }
  catch {}
  const ok = await waitPermissionAfterPrompt()
  awaitingPermission.value = false
  hasPermission.value = ok
  if (ok)
    showToastSuccess('录音权限已授予')
  else uni.showToast({ title: '未获得录音权限', icon: 'none' })
}

// 🆕 统一提取原生“route”消息里的 RouteInfo
function extractRouteInfo(msg: any): RouteInfo {
  if (!msg)
    return null
  const src = msg.data || msg.routeInfo || msg
  // 有效性判断：至少包含一种关键字段
  if (
    src
    && (src.typeName !== undefined
      || src.deviceType !== undefined
      || src.deviceId !== undefined
      || src.sampleRate !== undefined)
  ) {
    return {
      label: src.label,
      typeName: src.typeName,
      deviceType: toNumberOrUndef(src.deviceType),
      deviceId: toNumberOrUndef(src.deviceId),
      productName: src.productName,
      address: src.address,
      sampleRate: toNumberOrUndef(src.sampleRate),
      channels: toNumberOrUndef(src.channels),
      format: toNumberOrUndef(src.format),
    }
  }
  return null
}

function toNumberOrUndef(v: any): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

// 🆕 将编码常量转可读文本
function formatEncoding(enc?: number) {
  switch (enc) {
    case 2: return 'PCM_16BIT'
    case 3: return 'ENCODING_PCM_8BIT'
    case 4: return 'ENCODING_PCM_FLOAT'
    default: return enc !== undefined ? String(enc) : '--'
  }
}

async function startRecord() {
  if (isRecording.value)
    return
  if (!hasPermission.value) {
    await requestPermission()
    if (!hasPermission.value)
      return
  }
  // 清空上一次状态
  pcmChunks = []
  finalBase64.value = null
  routeInfo.value = null
  player.clear?.()
  isRecording.value = true

  const params = { sampleRate: 16000, enableAEC: true, enableNS: true, enableAGC: true }
  recorder.startRecord(params, (res: any) => {
    const msg = typeof res === 'string' ? JSON.parse(res) : res
    const event = msg.event || msg.type

    // 🆕 处理“录音通道”事件
    if (event === 'route') {
      const info = extractRouteInfo(msg)
      if (info) {
        routeInfo.value = info
        // 也可以提示一下当前通道
        if (info.typeName) {
          uni.showToast({ title: `通道：${info.typeName}`, icon: 'none' })
        }
      }
      return
    }

    switch (event) {
      case 'start':
        showToastSuccess('录音开始')
        break
      case 'stop':
        isRecording.value = false
        if (stoppedResolve) {
          stoppedResolve()
          stoppedResolve = null
        }
        break
      case 'error':
        isRecording.value = false
        checkMicPermission().then((ok) => {
          hasPermission.value = ok
        })
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
  await waitForStop()
  isRecording.value = false
  showToastSuccess('正在合成音频...')
  try {
    const { dataUrl } = await pcmToWavBase64Safe(pcmChunks, 16000)
    finalBase64.value = dataUrl
    showToastSuccess('录音合成完成，可播放')
    console.log('✅ WAV Base64 起始:', dataUrl.slice(0, 64))
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
  const maybeDataUrl = finalBase64.value
  const base64Pure = maybeDataUrl.startsWith('data:') ? maybeDataUrl.split(',')[1] : maybeDataUrl
  player.clear?.()
  player.addTask('0', base64Pure, (ret: any) => {
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

async function pcmToWavBase64Safe(chunks: Int16Array[], sampleRate: number): Promise<{ base64Pure: string, dataUrl: string }> {
  const pcmLen = chunks.reduce((sum, arr) => sum + arr.length, 0)
  const wavBytes = 44 + pcmLen * 2
  const ab = new ArrayBuffer(wavBytes)
  const view = new DataView(ab)
  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + pcmLen * 2, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, pcmLen * 2, true)
  let offset = 44
  for (const seg of chunks) {
    for (let i = 0; i < seg.length; i++) {
      view.setInt16(offset, seg[i], true)
      offset += 2
    }
  }
  const base64Pure: string = typeof uni.arrayBufferToBase64 === 'function'
    ? uni.arrayBufferToBase64(ab)
    : await arrayBufferToBase64Fallback(ab)
  return { base64Pure, dataUrl: `data:audio/wav;base64,${base64Pure}` }
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
}

function arrayBufferToBase64Fallback(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve) => {
    const bytes = new Uint8Array(buffer)
    const chunk = 0x8000
    let binary = ''
    for (let i = 0; i < bytes.length; i += chunk) {
      const slice = bytes.subarray(i, i + chunk)
      binary += String.fromCharCode.apply(null, Array.from(slice))
    }

    resolve(btoa(binary))
  })
}

onUnload(() => {
  recorder.stopRecord(() => {})
  player.release?.()
})
</script>

<template>
  <scroll-view scroll-y style="height: 100vh" class="page">
    <view class="title">
      🎙️ 录音与播放
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
      <button class="btn" @click="setRoute('wired')">
        有线耳机
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
      <text>
        权限状态：
        <text v-if="awaitingPermission">
          ⏳ 等待授权中…
        </text>
        <text v-else>
          {{ hasPermission ? '✅ 已授权' : '❌ 未授权' }}
        </text>
      </text>
    </view>

    <!-- 🆕 录音通道信息展示 -->
    <view class="route-card">
      <view class="route-title">
        📡 当前录音通道
      </view>
      <view v-if="routeInfo">
        <view class="route-row">
          <text class="k">
            通道类型
          </text><text class="v">
            {{ routeInfo.typeName || '--' }}
          </text>
        </view>
        <view class="route-row">
          <text class="k">
            设备名称
          </text><text class="v">
            {{ routeInfo.productName || '--' }}
          </text>
        </view>
        <view class="route-row">
          <text class="k">
            设备ID
          </text><text class="v">
            {{ routeInfo.deviceId ?? '--' }}
          </text>
        </view>
        <view class="route-row">
          <text class="k">
            设备Type
          </text><text class="v">
            {{ routeInfo.deviceType ?? '--' }}
          </text>
        </view>
        <view class="route-row">
          <text class="k">
            地址
          </text><text class="v">
            {{ routeInfo.address || '--' }}
          </text>
        </view>
        <view class="route-row">
          <text class="k">
            采样率
          </text><text class="v">
            {{ routeInfo.sampleRate ?? '--' }}
          </text>
        </view>
        <view class="route-row">
          <text class="k">
            通道数
          </text><text class="v">
            {{ routeInfo.channels ?? '--' }}
          </text>
        </view>
        <view class="route-row">
          <text class="k">
            格式
          </text><text class="v">
            {{ formatEncoding(routeInfo.format) }}
          </text>
        </view>
        <view v-if="routeInfo.label" class="route-hint">
          {{ routeInfo.label }}
        </view>
      </view>
      <view v-else class="route-empty">
        -- 尚未获取到通道信息 --
      </view>
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
.route-card {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}
.route-title {
  font-weight: 600;
  margin-bottom: 12rpx;
}
.route-row {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  padding-right: 16rpx;
  border-bottom: 1px dashed #eee;
}
.route-row .k {
  color: #666;
}
.route-row .v {
  color: #111;
}
.route-hint {
  margin-top: 8rpx;
  color: #999;
  font-size: 24rpx;
}
.route-empty {
  color: #aaa;
  padding: 12rpx 0;
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

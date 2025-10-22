<script setup lang="ts">
import { ref } from 'vue'
import { SpeechSynthesisDoubao } from '.'

const inputText = ref('今天天气不错，我们一起出去玩吧。')
const logs = ref<string[]>([])
const isRunning = ref(false)
let tts: SpeechSynthesisDoubao | null = null

function log(msg: string) {
  logs.value.push(msg)
  console.log(msg)
}

function startSynthesis() {
  if (!inputText.value.trim()) {
    uni.showToast({ title: '请输入文本', icon: 'none' })
    return
  }

  isRunning.value = true
  logs.value = []

  tts = new SpeechSynthesisDoubao({
    APPID: '3810425215',
    AccessToken: 'mHT8sdy_o3wVHNSIw9jfJqCawEu0Aq5s',
    voiceType: 'zh_female_tianxinxiaomei_emo_v2_mars_big',
    audioFormat: 'mp3',
  })

  tts.on('log', log)
  tts.on('test', msg => log(`🧩 初始化: ${msg}`))
  tts.on('audio', msg => log(`🎵 音频事件: ${msg}`))

  try {
    tts.synthesizeSpeechStream(inputText.value)
  }
  catch (err) {
    log(`❌ 错误: ${(err as any).message}`)
  }

  const timer = setInterval(() => {
    if (tts?.isSocketRunning === false) {
      clearInterval(timer)
      isRunning.value = false
    }
  }, 1000)
}
</script>

<template>
  <view class="tts-container">
    <view class="header">
      🎙️ 多宝语音合成测试
    </view>

    <textarea
      v-model="inputText"
      class="input-area"
      placeholder="请输入要合成的文字"
      auto-height
    />

    <view class="button" :disabled="isRunning" @click="startSynthesis">
      {{ isRunning ? '合成中...' : '开始合成并播放' }}
    </view>

    <scroll-view scroll-y class="log-view">
      <text v-for="(item, i) in logs" :key="i" class="log-item">
        {{ item }}
      </text>
    </scroll-view>
  </view>
</template>

<style scoped>
.tts-container {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}
.header {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}
.input-area {
  width: 100%;
  min-height: 160rpx;
  border: 1px solid #ccc;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
}
.button {
  background-color: #409eff;
  color: white;
  padding: 24rpx;
  border-radius: 12rpx;
  text-align: center;
  margin-top: 30rpx;
  font-size: 30rpx;
}
.button[disabled] {
  background-color: #aaa;
}
.log-view {
  margin-top: 40rpx;
  height: 500rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 20rpx;
}
.log-item {
  font-size: 24rpx;
  color: #333;
  line-height: 40rpx;
}
</style>

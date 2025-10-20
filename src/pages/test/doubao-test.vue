<script setup lang="ts">
import { ref } from 'vue'
import { SpeechSynthesisDoubao } from '../recorder/doubao'

definePage({
  style: {
    navigationBarTitleText: '豆包语音合成',
  },
})

const APPID = '3810425215'
const AccessToken = 'mHT8sdy_o3wVHNSIw9jfJqCawEu0Aq5s'
const SecretKey = 'WcH7__6VXDbmzKbXaNkLt9PN9kFCyFy0'
const url = 'wss://openapi.xf-yun.com/v1/private/s453a306'
const speechSynthesisDoubaoCore = new SpeechSynthesisDoubao({
  APPID,
  AccessToken,
  SecretKey,
  url,
})
speechSynthesisDoubaoCore.on('log', (e) => {
  console.log(e)
})
speechSynthesisDoubaoCore.on('test', (e) => {
  console.log(e)
})
speechSynthesisDoubaoCore.on('audio', (e) => {
  console.log(e)
})

const text = ref('欢迎使用豆包语音合成')
</script>

<template>
  <view class="audioPlay">
    <input v-model="text" placeholder="请输入合成文本" class="text-input">
    <button>
      点击-合成语音
    </button>
  </view>
</template>

<style scoped>
.text-input {
  height: 80rpx;
  border: 1px solid #ccc;
  padding: 10rpx;
  font-size: 28rpx;
  margin: 20rpx;
}
</style>
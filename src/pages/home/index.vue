<script setup lang="ts">
function handleAppLanguage() {
  uni.navigateTo({
    url: '/pages/test/index',
  })
}

function handleRecorder() {
  uni.navigateTo({
    url: '/pages/recorder/plugin-test',
  })
}
</script>

<template>
  <view class="container">
    <button class="native-button" @click="handleAppLanguage">
      跳转app原生语言插件-简单示例
    </button>

    <button class="native-button" @click="handleRecorder">
      recorder-实时帧录音
    </button>
  </view>
</template>

<style scoped>
.native-button {
  background-color: green;
  color: white;
  margin-top: 20rpx;
}
</style>
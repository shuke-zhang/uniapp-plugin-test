<script setup lang="ts">
function toRoute(path: string) {
  uni.navigateTo({
    url: path,
  })
}
</script>

<template>
  <view class="container">
    <button class="btn" @click="toRoute('/pages/test/plugin-shuke')">
      plugin-shuke基础插件调试
    </button>

    <button class="btn" @click="toRoute('/pages/test/audio-play')">
      音频播放插件调试
    </button>

    <button class="btn" @click="toRoute('/pages/test/audio-test')">
      音频设备切换调试
    </button>

    <button class="btn" @click="toRoute('/pages/test/shuke-recorder')">
      音频录制实时帧
    </button>

    <button class="btn" @click="toRoute('/pages/test/plugin-test-all')">
      插件合集
    </button>
  </view>
</template>

<style  lang="scss">
.btn + .btn {
  margin-top: 10px;
}
</style>
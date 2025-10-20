<script setup lang="ts">
import { ref } from 'vue'

const plugin = uni.requireNativePlugin('shuke_microphone')

const devices = ref<any[]>([])
const lastMsg = ref('')

function refresh() {
  plugin.getInputDevices((res: any) => {
    if (res.ok)
      devices.value = res.devices
    else uni.showToast({ title: res.msg || '获取失败', icon: 'none' })
  })
}

function setRoute(type: string) {
  plugin.setInputRoute(type, (res: any) => {
    console.log('setInputRoute:', res)
    lastMsg.value = res.msg
  })
}
</script>

<template>
  <scroll-view scroll-y style="height: 100vh">
    <view class="p-3">
      <button class="btn" @click="setRoute('bluetooth')">
        蓝牙
      </button>
      <button class="btn" @click="setRoute('usb')">
        USB
      </button>
      <button class="btn" @click="setRoute('wired')">
        有线耳机
      </button>
      <button class="btn" @click="setRoute('builtin')">
        内置
      </button>
      <button class="btn plain" @click="refresh">
        刷新设备
      </button>

      <view class="mt-3">
        当前操作：{{ lastMsg }}
      </view>

      <view v-for="(d, i) in devices" :key="i" class="card">
        {{ d.typeName }} - {{ d.productName }}
      </view>
    </view>
  </scroll-view>
</template>

<style scoped>
.p-3 {
  padding: 30rpx;
}
.btn {
  background: #3b82f6;
  color: #fff;
  padding: 18rpx;
  border-radius: 10rpx;
  margin: 10rpx 0;
  text-align: center;
}
.btn.plain {
  background: #e5e7eb;
  color: #111;
}
.card {
  padding: 12rpx;
  border-bottom: 1px dashed #ddd;
}
.devlist {
  border: 1px solid #ddd;
  border-radius: 10rpx;
  margin-top: 20rpx;
  background: #fff;
}
</style>

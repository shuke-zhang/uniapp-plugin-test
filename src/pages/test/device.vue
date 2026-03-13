<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showToastSuccess } from '@/utils'

const androidId = ref<string>('—')
const finger = ref<string>('—')

function getDeviceId() {
  try {
    // ① 获取原生插件对象（与 package.json 内名称一致）
    const Device = uni.requireNativePlugin('shuke_device')
    console.log(Device, 'Device')

    // ② 获取 ANDROID_ID（Flutter 得到的 7f41283c69eaefc3）
    const aId = Device.getAndroidId()
    androidId.value = aId || '读取失败'

    // ③ 获取设备指纹（可选）
    const fp = Device.getFingerPrint()
    finger.value = fp || '读取失败'

    // 弹窗显示
    uni.showModal({
      title: '设备唯一识别码',
      content: `ANDROID_ID: ${androidId.value}\n指纹: ${finger.value}`,
      showCancel: false,
    })
  }
  catch (e) {
    console.error(e)
  }
}
onMounted(() => {
  showToastSuccess('这是个提示')
})
</script>

<template>
  <view style="padding: 40rpx;">
    <button type="button" @click="getDeviceId">
      获取设备唯一识别码
    </button>

    <view style="margin-top: 40rpx; font-size: 28rpx;">
      <view>ANDROID_ID：{{ androidId }}</view>
      <view style="margin-top: 10rpx;">
        指纹：{{ finger }}
      </view>
    </view>
  </view>
</template>

<style>
view {
  font-family: Arial, Helvetica, sans-serif;
}
</style>

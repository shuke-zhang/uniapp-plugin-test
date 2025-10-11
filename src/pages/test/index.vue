<script setup lang="ts">
import { ref } from 'vue'

// 输入的名字
const name = ref('')
// 插件回调结果
const reply = ref('')

// 调用插件方法
function callPlugin() {
  if (!name.value) {
    reply.value = '请输入名字'
    return
  }

  uni.requireNativePlugin('plugin_shuke')
    .sayHello(name.value, (res: any) => {
      // 插件返回数据
      reply.value = res.reply
    })
}
</script>

<template>
  <div class="container">
    <h2>插件调用示例</h2>

    <input
      v-model="name"
      type="text"
      placeholder="请输入名字"
      class="input"
    >

    <button class="btn" @click="callPlugin">
      调用插件
    </button>

    <p class="reply">
      插件返回：{{ reply || '-' }}
    </p>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
}

.input {
  padding: 8px;
  font-size: 16px;
  margin: 10px 0;
  width: 200px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.btn {
  padding: 8px 16px;
  font-size: 16px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn:hover {
  background: #36a572;
}

.reply {
  margin-top: 20px;
  font-size: 18px;
  color: #333;
}
</style>

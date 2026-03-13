# shuke_recorder 使用说明

## 1. 插件作用

`shuke_recorder` 是当前仓库里最完整的录音模块，主要能力包括：

- 录音权限检查和申请
- 基于 `AudioRecord` 的实时录音
- 可选启用 AEC / NS / AGC 音频处理
- 持续把录音帧、音量、时长回调给前端
- 在录音开始和路由变化时回调当前输入通道信息
- 提供本地文件保存、删除能力

它适合做：

- 实时语音采集
- 边录边分析音量
- 前端自己拼装 WAV / PCM 文件
- 和 `shuke_microphone` 配合完成“先切麦、再录音”

## 2. 当前仓库接入状态

当前仓库中，这个插件已经接入完成：

- 已在 `app/src/main/assets/dcloud_uniplugins.json` 注册为 `shuke_recorder`
- 已在 `app/build.gradle` 中加入 `implementation project(':shuke_recorder')`
- 已有测试页 `pages/test/shuke-recorder`

## 3. 前端引入方式

```js
const recorderPlugin = uni.requireNativePlugin('shuke_recorder')
```

## 4. 推荐使用顺序

建议按下面顺序来：

1. `checkPermission()` 或 `hasPermission()`
2. 如果没有权限，调用 `requestPermission()`
3. 如果你要指定输入设备，先调用 `shuke_microphone.setInputRoute()`
4. 调用 `startRecord(params, callback)` 开始录音
5. 在 `process` 事件里收集 PCM 帧
6. 调用 `stopRecord()` 停止录音
7. 前端自行把 PCM 拼成 WAV 或其他格式
8. 如需落盘，再调用 `uniSaveLocalFile()`

## 5. 权限相关方法

### 5.1 `requestPermission(callback)`

#### 作用

申请 `RECORD_AUDIO` 权限。

#### 返回结构

已授权或申请完成后：

```js
{
  ok: true,
  granted: true
}
```

用户拒绝：

```js
{
  ok: true,
  granted: false
}
```

异常情况：

```js
{
  ok: false,
  msg: '错误信息'
}
```

#### 示例

```js
recorderPlugin.requestPermission((res) => {
  const data = typeof res === 'string' ? JSON.parse(res) : res
  console.log('permission:', data)
})
```

### 5.2 `hasPermission(callback)`

#### 作用

检查当前是否已有录音权限。

#### 返回结构

```js
{
  ok: true,
  granted: true
}
```

### 5.3 `checkPermission(callback)`

#### 作用

和 `hasPermission()` 是同义接口，当前实现内部就是直接转调 `hasPermission()`。

## 6. 录音主流程

### 6.1 `startRecord(params, callback)`

#### 作用

开始录音，并把后续所有事件持续回调给前端。

#### 参数

```js
{
  sampleRate: 16000,
  enableAEC: true,
  enableNS: true,
  enableAGC: true
}
```

字段说明：

- `sampleRate`
  - 采样率
  - 默认 `16000`
- `enableAEC`
  - 是否启用回声消除
  - 默认 `true`
- `enableNS`
  - 是否启用噪声抑制
  - 默认 `true`
- `enableAGC`
  - 是否启用自动增益控制
  - 默认 `true`

#### 录音底层固定行为

当前源码里，录音会固定使用：

- `MediaRecorder.AudioSource.VOICE_COMMUNICATION`
- 单声道
- PCM 16bit

这意味着它更偏“通话/语音采集”场景，不是为高保真音乐采集设计的。

#### 事件回调

`startRecord()` 的 `callback` 不是“一次性回调”，而是持续事件流。

前端建议统一按下面方式处理：

```js
recorderPlugin.startRecord(params, (event) => {
  const e = typeof event === 'string' ? JSON.parse(event) : event
  console.log('record event:', e)
})
```

### 6.2 `start` 事件

```js
{
  event: 'start'
}
```

表示录音已经真正启动。

### 6.3 `process` 事件

```js
{
  event: 'process',
  volume: 36,
  duration: 1250,
  sampleRate: 16000,
  buffers: [
    {
      "0": 12,
      "1": -31,
      "2": 45
    }
  ]
}
```

字段说明：

- `volume`
  - 0 到 100 的相对音量值
  - 这是插件内部计算出来的平滑值，不是原始 dB
- `duration`
  - 已录制时长，单位毫秒
- `sampleRate`
  - 当前回调对应采样率
- `buffers`
  - 录音帧数据

#### `buffers` 的一个关键坑点

当前实现没有把原始 `short[]` 直接按数组返回，而是：

- 只取了第一块 buffer
- 再把每个采样点转成对象键值对

所以你前端拿到的不是：

```js
[12, -31, 45]
```

而是：

```js
{
  "0": 12,
  "1": -31,
  "2": 45
}
```

前端如果要还原成可处理的 PCM 数组，通常要这样转：

```js
const frameObject = event.buffers?.[0] || {}
const pcm = Object.values(frameObject).map((n) => Number(n))
```

### 6.4 `route` 事件

录音开始成功后，会立即回调一次当前路由；之后如果路由变化，也会继续推送。

```js
{
  event: 'route',
  data: {
    label: '开始录音',
    typeName: '蓝牙麦克风',
    deviceType: 7,
    deviceId: 12,
    productName: 'HFP Device',
    address: '',
    sampleRate: 16000,
    channels: 1,
    format: 2
  }
}
```

字段说明：

- `label`
  - 回调时机说明
- `typeName`
  - 当前输入通道名称
- `deviceType`
  - Android `AudioDeviceInfo.TYPE_*`
- `deviceId`
  - 设备 ID
- `productName`
  - 设备名
- `address`
  - 设备地址
- `sampleRate`
  - 当前 `AudioRecord` 采样率
- `channels`
  - 声道数
- `format`
  - 音频格式

### 6.5 `stop` 事件

```js
{
  event: 'stop'
}
```

表示录音线程已结束、底层资源已停止。

### 6.6 `error` 事件

```js
{
  event: 'error',
  message: '错误信息'
}
```

常见场景：

- 没有录音权限
- `AudioRecord` 初始化失败
- `start()` 过程中抛异常

## 7. 停止录音

### 7.1 `stopRecord(callback)`

#### 作用

停止录音。

#### 返回结构

```js
{
  ok: true
}
```

#### 示例

```js
recorderPlugin.stopRecord((res) => {
  console.log('stop result:', res)
})
```

#### 说明

当前实现里，即使当前不在录音，`stopRecord()` 回调也依然会直接给你：

```js
{ ok: true }
```

所以前端不要把这个 `ok` 理解为“本次一定存在录音并已成功停止”，它更像是“停止命令已执行”。

## 8. 本地文件操作

### 8.1 `uniSaveLocalFile(name, base64Data, callback)`

#### 作用

把 Base64 内容保存为本地文件。

#### 参数

- `name: string`
  - 文件名，例如 `voice.wav`
- `base64Data: string`
  - 纯 Base64 数据
  - 注意：当前实现不会自动剥离 `data:*;base64,` 前缀
- `callback: Function`

#### 保存目录

优先保存到：

- `context.getExternalFilesDir("recorder")`

如果拿不到，再退回：

- `context.getFilesDir()`

#### 返回结构

成功：

```js
{
  ok: true,
  path: '/storage/emulated/0/Android/data/包名/files/recorder/voice.wav',
  msg: '文件保存成功'
}
```

失败：

```js
{
  ok: false,
  msg: '错误信息'
}
```

#### 示例

```js
recorderPlugin.uniSaveLocalFile('voice.wav', pureBase64, (res) => {
  const data = typeof res === 'string' ? JSON.parse(res) : res
  console.log('save result:', data)
})
```

### 8.2 `uniRemoveLocalFile(path, callback)`

#### 作用

删除本地文件。

#### 返回结构

成功：

```js
{
  ok: true,
  msg: '文件已删除'
}
```

失败：

```js
{
  ok: false,
  msg: '错误信息'
}
```

#### 一个非常重要的限制

当前实现有安全限制：

- 只允许删除应用私有外部目录下的文件
- 也就是文件路径必须位于 `getExternalFilesDir(null)` 下面

如果你传入别的路径，会被拒绝删除。

## 9. 推荐前端示例

下面是一个比较接近当前实现的用法：

```js
const recorderPlugin = uni.requireNativePlugin('shuke_recorder')

let pcmChunks = []

function requestRecordPermission() {
  return new Promise((resolve) => {
    recorderPlugin.requestPermission((res) => {
      const data = typeof res === 'string' ? JSON.parse(res) : res
      resolve(!!data.granted)
    })
  })
}

async function startRecord() {
  const granted = await requestRecordPermission()
  if (!granted) {
    uni.showToast({ title: '没有录音权限', icon: 'none' })
    return
  }

  pcmChunks = []

  recorderPlugin.startRecord(
    {
      sampleRate: 16000,
      enableAEC: true,
      enableNS: true,
      enableAGC: true
    },
    (event) => {
      const e = typeof event === 'string' ? JSON.parse(event) : event

      switch (e.event) {
        case 'start':
          console.log('录音开始')
          break
        case 'process': {
          const frameObject = e.buffers?.[0] || {}
          const pcm = Object.values(frameObject).map((n) => Number(n))
          pcmChunks.push(Int16Array.from(pcm))
          console.log('音量:', e.volume, '时长:', e.duration)
          break
        }
        case 'route':
          console.log('当前输入通道:', e.data)
          break
        case 'stop':
          console.log('录音停止')
          break
        case 'error':
          console.error('录音错误:', e.message)
          break
      }
    }
  )
}

function stopRecord() {
  recorderPlugin.stopRecord((res) => {
    console.log('stop:', res)
  })
}
```

## 10. 注意事项

- `startRecord()` 不会主动申请权限。没权限时，它会通过同一个持续回调回发 `error` 事件。
- 当前录音源是 `VOICE_COMMUNICATION`，如果你要录“纯环境音”“高保真音乐”，这个选择未必合适。
- AEC / NS / AGC 只是“尝试启用”，前提是设备支持对应 `audiofx` 能力。
- `volume` 是插件内部映射后的 0 到 100 相对值，不是声压级，不要拿它做严格计量。
- `process.buffers` 的结构不标准，是“对象化数组”，前端必须自行还原。
- 当前模块并不会直接帮你生成 WAV 文件，它只是持续把 PCM 帧吐给前端。你要导出文件，需要前端自己拼头、拼数据。
- `uniSaveLocalFile()` 需要的是纯 Base64 字符串，不要直接把 `data:audio/wav;base64,xxxx` 整串传进去。
- `uniRemoveLocalFile()` 只能删应用私有目录下的文件，删不了任意外部路径。
- 存在一个边界情况：`uniSaveLocalFile()` 在极端情况下如果退回到了 `filesDir()` 保存，而 `uniRemoveLocalFile()` 的安全校验又只认 `externalFilesDir(null)`，那这个文件后续可能无法通过当前删除接口删掉。
- 路由详细信息依赖系统版本：
  - Android 6.0+ 才能较完整获取设备信息
  - Android 7.0+ 才支持路由变化监听
- 如果你在录音前想指定蓝牙麦、USB 麦、有线麦，先用 `shuke_microphone.setInputRoute()`，再 `startRecord()`，不要反过来。

## 11. 适用场景

适合：

- 实时语音采集
- 边录边做前端波形/音量展示
- 需要知道当前录音通道来源
- 和自定义 JS 侧音频编码逻辑配合

不适合：

- 一步到位直接导出复杂音频格式
- 不关心 PCM 细节、只想“一键录音保存”的简单页面

# shuke_audio_play 使用说明

## 1. 插件作用

`shuke_audio_play` 是一个基于 Android `MediaPlayer` 的顺序音频任务播放器，核心能力不是“单次播放一个音频”，而是：

- 维护一个待播放队列
- 按任务 `id` 严格顺序播放
- 通过事件持续把播放状态回传给前端
- 支持切换输出模式：扬声器、听筒、蓝牙

它比较适合下面这类场景：

- TTS 语音流分片播放
- 多段语音按顺序播报
- 播放过程中前端实时更新进度和队列状态

## 2. 当前仓库接入状态

当前仓库中，这个插件已经接入完成：

- 已在 `app/src/main/assets/dcloud_uniplugins.json` 注册为 `shuke_audio_play`
- 已在 `app/build.gradle` 中加入 `implementation project(':shuke_audio_play')`
- 已有前端测试页 `pages/test/audio-play`

## 3. 前端引入方式

```js
const audioPlayer = uni.requireNativePlugin('shuke_audio_play')
```

建议只在 `App-Android` 使用。

## 4. 先理解它的核心机制

这个插件最关键的一点是：**它不是“谁先来就先播”，而是“谁的数字 ID 最先轮到，谁才播放”。**

原生层内部维护了两个概念：

- `startPlayId`
  - 队列起点
- `expectedNextId`
  - 当前下一条“应该被播放”的任务 ID

实际行为如下：

- 调用 `init({ startPlayId: 5 })` 后，播放器会从 `5` 开始等
- 即使你先传入 `6`、`7`，也不会先播
- 必须等到 `5` 入队后才开始
- `5` 播完后，它才会等 `6`
- 如果 `6` 一直不来，`7` 即使已经在队列里，也不会播放

所以它是“**严格顺序队列播放器**”，不是“普通先进先出播放器”。

## 5. 标准接入顺序

推荐按这个顺序使用：

1. `init()` 初始化队列起点
2. `onEvent()` 监听事件
3. `addTask()` 按数字 ID 入队
4. 播放过程中根据需要 `setOutputMode()`
5. 页面销毁或业务结束时 `release()`

## 6. 可用方法

### 6.1 `init(options, callback)`

#### 作用

初始化播放器，并设置起始播放 ID。

#### 参数

```js
{
  startPlayId: 0
}
```

- `startPlayId: number`
  - 起始任务 ID
  - 默认是 `0`

#### 回调

当前实现回调不是对象，而是字符串：

```js
"startPlayId=0"
```

#### 示例

```js
audioPlayer.init({ startPlayId: 0 }, (res) => {
  console.log('init callback:', res)
})
```

### 6.2 `onEvent(callback)`

#### 作用

注册统一事件回调。这个回调会被长期保留，原生层通过 `invokeAndKeepAlive` 持续推送事件。

#### 事件统一结构

```js
{
  type: 'start',
  data: {}
}
```

#### 支持的事件类型

##### `ready`

表示前端已完成事件绑定。

```js
{
  type: 'ready',
  data: {}
}
```

##### `queued`

入队成功。

```js
{
  type: 'queued',
  data: {
    id: '0',
    queueSize: 1
  }
}
```

##### `start`

开始播放某条任务。

```js
{
  type: 'start',
  data: {
    id: '0',
    queueSize: 2
  }
}
```

##### `progress`

播放进度更新。

```js
{
  type: 'progress',
  data: {
    id: 'playing',
    positionMs: 300,
    durationMs: 1200,
    progress: 0.25
  }
}
```

注意：当前源码里 `progress.data.id` 固定写成了 `"playing"`，不是当前真实任务 ID。

##### `complete`

单条任务播放完成。

```js
{
  type: 'complete',
  data: {
    id: '0',
    queueSize: 1
  }
}
```

##### `queueEmpty`

自然播放完毕且队列为空。

```js
{
  type: 'queueEmpty',
  data: {}
}
```

##### `modeChanged`

输出模式切换。

```js
{
  type: 'modeChanged',
  data: {
    mode: 'SPEAKER'
  }
}
```

注意：这里的 `mode` 来自原生枚举名，通常是大写的 `SPEAKER` / `EARPIECE` / `BLUETOOTH`。

##### `error`

播放或入队出错。

```js
{
  type: 'error',
  data: {
    id: '1',
    message: 'invalid_id'
  }
}
```

##### `released`

播放器资源已释放。

```js
{
  type: 'released',
  data: {}
}
```

#### 示例

```js
audioPlayer.onEvent((event) => {
  const e = typeof event === 'string' ? JSON.parse(event) : event
  console.log('audio event:', e.type, e.data)
})
```

### 6.3 `addTask(id, base64, callback)`

#### 作用

向播放队列添加一个任务。

#### 参数

- `id: string`
  - 必须能被 `Integer.parseInt()` 成功解析
  - 推荐直接传字符串数字，如 `"0"`、`"1"`、`"2"`
- `base64: string`
  - 音频内容的 Base64 字符串
  - 支持 `data:*;base64,xxxx` 这类 Data URL，原生层会自动去掉前缀
- `callback: Function`
  - 入队回调

#### 回调

当前实现回调返回的是字符串，不是对象。

成功：

```js
"任务添加成功：0"
```

失败：

```js
"任务添加失败：错误信息"
```

#### 示例

```js
audioPlayer.addTask('0', audioBase64, (res) => {
  console.log('addTask callback:', res)
})
```

### 6.4 `clear()`

#### 作用

- 停止当前播放
- 清空待播放队列
- 把 `expectedNextId` 重置回 `startPlayId`

#### 示例

```js
audioPlayer.clear()
```

#### 重要说明

手动 `clear()` 属于“人为中断”，当前源码不会触发 `queueEmpty` 事件。

### 6.5 `setOutputMode(mode, callback)`

#### 作用

切换音频输出路由。

#### 可选值

- `speaker`
- `earpiece`
- `bluetooth`

#### 回调

当前实现返回字符串，例如：

```js
"切换为：speaker"
```

#### 示例

```js
audioPlayer.setOutputMode('bluetooth', (res) => {
  console.log(res)
})
```

### 6.6 `release()`

#### 作用

- 释放播放器
- 清空队列
- 解除事件回调引用

#### 示例

```js
audioPlayer.release()
```

建议在页面卸载、业务会话结束时调用。

## 7. 推荐前端示例

```js
const audioPlayer = uni.requireNativePlugin('shuke_audio_play')

function initAudioPlayer() {
  audioPlayer.init({ startPlayId: 0 }, (res) => {
    console.log('init:', res)
  })

  audioPlayer.onEvent((event) => {
    const e = typeof event === 'string' ? JSON.parse(event) : event
    const data = e.data || {}

    switch (e.type) {
      case 'ready':
        console.log('播放器已就绪')
        break
      case 'queued':
        console.log('入队成功', data.id, data.queueSize)
        break
      case 'start':
        console.log('开始播放', data.id)
        break
      case 'progress':
        console.log('播放进度', data.progress)
        break
      case 'complete':
        console.log('播放完成', data.id)
        break
      case 'queueEmpty':
        console.log('队列播放完成')
        break
      case 'modeChanged':
        console.log('输出切换为', data.mode)
        break
      case 'error':
        console.error('播放器错误', data)
        break
    }
  })
}

function playList(list) {
  audioPlayer.clear()

  list.forEach((item) => {
    audioPlayer.addTask(String(item.id), item.base64, (res) => {
      console.log('addTask:', res)
    })
  })
}

function destroyAudioPlayer() {
  audioPlayer.release()
}
```

## 8. 注意事项

- `id` 必须是可解析的数字字符串，像 `"a1"`、`"001a"` 这种会失败。
- 队列是严格顺序模型，不是普通 FIFO。缺少中间 ID 会导致后续任务全部等待。
- 小于 `startPlayId` 的任务会被直接忽略。
- 当前实现没有 `pause()`、`resume()`、`seek()`、`removeTask()` 这类能力。
- 当前实现是单例思路，内部通过 `static WeakReference<AudioQueuePlayer>` 持有播放器。不同页面如果反复调用，实际上可能在共享同一个原生播放器状态。
- `progress` 事件里的 `id` 不是当前真实任务 ID，而是固定字符串 `"playing"`。如果前端要标识当前任务，应以 `start` 事件里的 `id` 为准。
- 插件内部把 Base64 音频落成缓存目录下的临时文件，再交给 `MediaPlayer` 播放，所以大量超大音频连续入队时要注意缓存占用和解码耗时。
- 临时文件后缀固定写成了 `.mp3`，但源码没有真的校验格式。只要 `MediaPlayer` 能识别，别的格式也可能能播；如果不能识别，就会触发 `error`。
- `setOutputMode('bluetooth')` 只是尝试打开蓝牙 SCO，并不保证设备一定已经切换成功，真实效果依赖系统状态和外设连接状态。
- `clear()` 不会触发 `queueEmpty`，前端不要把“调用 clear 后没收到 queueEmpty”误判为 bug，这就是当前实现逻辑。
- 如果页面销毁时不 `release()`，下次进入页面时可能会继承上一次的播放器状态或事件绑定。

## 9. 什么时候适合用它

适合：

- 按句播放 TTS 结果
- 播放多个分片音频
- 需要监听“开始、进度、完成、队列结束”的播报类业务

不适合：

- 高精度音频编辑
- 复杂播放控制
- 多路并行播放器
- 需要精确蓝牙路由确认的严肃通话系统

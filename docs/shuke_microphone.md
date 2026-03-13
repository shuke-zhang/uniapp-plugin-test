# shuke_microphone 使用说明

## 1. 插件作用

`shuke_microphone` 不是录音插件，它更准确的定位是：

- 枚举当前可用输入设备
- 尝试切换麦克风输入路由
- 用短时探针录音验证路由是否真的切换成功

它适合放在真正录音前面，先把输入设备选好，再交给 `shuke_recorder` 去录。

## 2. 当前仓库接入状态

当前仓库中，这个插件已经接入完成：

- 已在 `app/src/main/assets/dcloud_uniplugins.json` 注册为 `shuke_microphone`
- 已在 `app/build.gradle` 中加入 `implementation project(':shuke_microphone')`
- 已有测试页 `pages/test/audio-test`

但是要注意一件事：

- 测试页里出现了 `requestRecordPermission()` 的调用
- 当前 `AudioDeviceLister.java` 里并没有这个方法

也就是说，**示例页和当前原生代码并不完全一致**。你写业务时应以当前原生模块实现为准。

## 3. 前端引入方式

```js
const microphonePlugin = uni.requireNativePlugin('shuke_microphone')
```

## 4. 先说最关键的使用原则

这个插件要做“路由探测验证”，原生层内部会短暂创建 `AudioRecord` 来判断当前麦克风到底有没有切到目标设备。

因此：

- 调用 `setInputRoute()` 之前，最好已经有录音权限
- 否则探测录音本身就可能失败，最终让你误以为“切路由失败”

当前插件本身**没有实现权限申请接口**，所以建议你：

- 使用 `shuke_recorder.requestPermission()`
- 或者在前端自行先处理录音权限

## 5. 可用方法

### 5.1 `getInputDevices(callback)`

#### 作用

获取当前系统可见的输入设备列表。

#### 回调返回结构

成功时：

```js
{
  ok: true,
  devices: [
    {
      id: 12,
      type: 7,
      typeName: '蓝牙麦克风',
      productName: 'HFP Device',
      address: '',
      isSource: true
    }
  ]
}
```

失败时：

```js
{
  ok: false,
  msg: '错误信息'
}
```

#### 字段说明

- `id`
  - 设备 ID
- `type`
  - Android `AudioDeviceInfo.TYPE_*`
- `typeName`
  - 原生层转换后的人类可读名称
- `productName`
  - 设备名称
- `address`
  - 设备地址，Android 9+ 才更有机会拿到
- `isSource`
  - 当前实现固定表示输入设备

#### 低版本说明

Android 6.0 以下没有 `AudioDeviceInfo` 能力。当前源码在低版本上不会给你完整设备列表，而是返回一个提示对象。

#### 示例

```js
microphonePlugin.getInputDevices((res) => {
  const data = typeof res === 'string' ? JSON.parse(res) : res
  console.log('输入设备列表：', data)
})
```

### 5.2 `setInputRoute(route, callback)`

#### 作用

尝试切换录音输入路由，并用“探针录音”验证结果。

#### 可选参数

```js
'bluetooth'
'usb'
'wired'
'builtin'
```

对应含义：

- `bluetooth`
  - 蓝牙通话麦克风
- `usb`
  - USB 外置麦克风
- `wired`
  - 有线耳机麦克风
- `builtin`
  - 机身内置麦克风

#### 回调返回结构

成功示例：

```js
{
  ok: true,
  method: 'setCommunicationDevice()+probe-verify',
  msg: '已切换至蓝牙麦克风（实测成功）',
  devicesSnapshot: '[{id=12, type=7(...)}]',
  preferredDeviceId: 12,
  target: {
    id: 12,
    type: 7,
    typeName: '蓝牙麦克风',
    productName: 'HFP Device',
    address: ''
  },
  actualRouted: {
    id: 12,
    type: 7,
    typeName: '蓝牙麦克风',
    productName: 'HFP Device',
    address: ''
  }
}
```

失败示例：

```js
{
  ok: false,
  method: 'none',
  msg: '切换失败：未检测到蓝牙麦克风',
  devicesSnapshot: '[]'
}
```

#### 字段说明

- `ok`
  - 是否切换并验证成功
- `method`
  - 原生层使用的切换方式
  - 常见值：
    - `none`
    - `probe-verify@A10`
    - `setCommunicationDevice()+probe-verify`
- `msg`
  - 人类可读提示
- `devicesSnapshot`
  - 当前输入设备快照
  - 注意：**它是字符串，不是数组**
- `target`
  - 目标设备信息
- `preferredDeviceId`
  - 原生层保存下来的首选设备 ID
- `actualRouted`
  - 探针录音实际命中的路由设备

#### 示例

```js
microphonePlugin.setInputRoute('bluetooth', (res) => {
  const data = typeof res === 'string' ? JSON.parse(res) : res
  console.log('切路由结果：', data)

  if (!data.ok) {
    uni.showToast({ title: data.msg || '切换失败', icon: 'none' })
  }
})
```

## 6. 推荐使用顺序

推荐按下面顺序来：

```js
const recorderPlugin = uni.requireNativePlugin('shuke_recorder')
const microphonePlugin = uni.requireNativePlugin('shuke_microphone')

function ensureMicPermission() {
  return new Promise((resolve) => {
    recorderPlugin.requestPermission((res) => {
      const data = typeof res === 'string' ? JSON.parse(res) : res
      resolve(!!data.granted)
    })
  })
}

async function switchMicToBluetooth() {
  const granted = await ensureMicPermission()
  if (!granted) {
    uni.showToast({ title: '没有录音权限', icon: 'none' })
    return
  }

  microphonePlugin.getInputDevices((res) => {
    console.log('devices:', res)
  })

  microphonePlugin.setInputRoute('bluetooth', (res) => {
    const data = typeof res === 'string' ? JSON.parse(res) : res
    console.log('route result:', data)
  })
}
```

## 7. 当前原生逻辑里的关键细节

### 7.1 它不是只“设置一下”，而是会做探针验证

原生层会：

- 创建一个短时 `AudioRecord`
- 如果有目标设备，就尝试 `setPreferredDevice()`
- 启动录音后读取 `getRoutedDevice()`
- 判断“实际命中的设备”是否和目标一致

所以返回 `ok: true` 的含义是：

- 原生层认为“切换后，探测录音确实跑到了目标设备上”

### 7.2 Android 12 及以上会优先尝试 `setCommunicationDevice`

如果系统版本够高、目标设备存在，原生层会先尝试：

- `AudioManager.setCommunicationDevice(target)`

之后仍然会继续做探针验证，不是只调用一下就算成功。

### 7.3 蓝牙模式会主动开 SCO

当路由目标是 `bluetooth` 时，原生层会：

- `startBluetoothSco()`
- `setBluetoothScoOn(true)`

其他目标则会主动关掉 SCO 并关闭外放。

## 8. 注意事项

- 当前模块没有 `requestRecordPermission()`。测试页里这个方法名是旧代码残留，不能照抄。
- `setInputRoute()` 依赖录音权限。你没先授权，结果很可能不可靠。
- `wired` 只匹配 `TYPE_WIRED_HEADSET`，不匹配“纯耳机无麦”那种输出设备。
- `bluetooth` 只匹配 `TYPE_BLUETOOTH_SCO`，不是所有蓝牙音频设备都能当输入麦克风。
- `builtin` 的成功判定是：探针录音最终路由到了 `TYPE_BUILTIN_MIC`。
- `devicesSnapshot` 是字符串快照，不是 JSON 数组，前端别直接拿它当数组渲染。
- 原生层会把“首选输入设备 ID”存进 `SharedPreferences`，但当前仓库没有暴露读取接口给前端，也没有看到 `shuke_recorder` 自动消费这个 ID。
- 这个插件会修改 `AudioManager` 的模式和蓝牙 SCO 状态，可能影响同时进行的播放、通话或录音。
- 探针录音参数是固定的：
  - 16000Hz
  - 单声道
  - PCM 16bit
  - 最多 4 次重试
- 如果设备系统对路由控制限制较严，即使外设真实已连接，也可能切换失败。
- 这个插件只负责“切输入路由”和“验证路由”，并不输出 PCM 数据，也不会帮你正式录音。

## 9. 适用场景

适合：

- 正式录音前选择输入设备
- 蓝牙麦、有线麦、USB 麦的接入判断
- 调试安卓端录音路由是否切换成功

不适合：

- 单独承担录音功能
- 没有权限流程的快速调用
- 要求百分之百稳定命中所有机型的音频路由业务

# shuke_device 使用说明

## 1. 插件作用

`shuke_device` 的作用很简单：读取设备侧的两个标识信息。

- `ANDROID_ID`
- `Build.FINGERPRINT`

它本质上是一个“设备信息读取模块”，不包含录音、播放、权限申请或其他复杂能力。

## 2. 当前仓库状态说明

这一项非常重要：**当前仓库里 `shuke_device` 还没有完成正式接入。**

我根据仓库现状确认到的情况是：

- 根目录存在 `shuke_device` 目录
- 目录里目前只有 `build` 产物，没有源码目录
- 通过编译产物反查，模块类名为 `com.example.shuke_device.DeviceIdModule`
- 但是当前项目里：
  - `settings.gradle` 没有 `include ':shuke_device'`
  - `app/build.gradle` 没有 `implementation project(':shuke_device')`
  - `app/src/main/assets/dcloud_uniplugins.json` 也没有注册 `shuke_device`

这意味着：

- 前端测试页里虽然写了 `uni.requireNativePlugin('shuke_device')`
- 但以当前仓库状态来看，这个模块并没有像另外几个插件一样完成正式挂载

所以这份文档会分成两部分：

- 先写“它本身能做什么”
- 再写“如果你要在当前项目里真的用起来，缺什么”

## 3. 当前已确认的原生方法

由于源码不在仓库中，这里是根据 `.class` 反查到的公开方法整理的。

### 3.1 `getAndroidId()`

#### 作用

读取 Android 系统的 `Settings.Secure.ANDROID_ID`。

#### 返回

同步返回字符串：

```js
const id = devicePlugin.getAndroidId()
```

原生逻辑等价于：

- 从当前 `Context` 获取 `ContentResolver`
- 调用 `Settings.Secure.getString(..., "android_id")`
- 如果拿到的是 `null`，返回空字符串 `""`
- 如果出现异常，也返回空字符串 `""`

#### 返回示例

```js
"9f4b1d8c0a2e7f31"
```

或：

```js
""
```

### 3.2 `getFingerPrint()`

#### 作用

读取系统构建指纹：`Build.FINGERPRINT`。

#### 返回

同步返回字符串：

```js
const fingerprint = devicePlugin.getFingerPrint()
```

原生逻辑等价于：

- 直接读取 `Build.FINGERPRINT`
- 如果为 `null`，返回空字符串 `""`

#### 返回示例

```js
"Xiaomi/duchamp/duchamp:14/UKQ1.231003.002/V816.0.8.0.UNLCNXM:user/release-keys"
```

或：

```js
""
```

## 4. 如果你已经把它接入了，前端应该怎么用

```js
const devicePlugin = uni.requireNativePlugin('shuke_device')

const androidId = devicePlugin.getAndroidId()
const fingerprint = devicePlugin.getFingerPrint()

console.log('ANDROID_ID:', androidId)
console.log('FINGERPRINT:', fingerprint)
```

更稳妥的写法：

```js
function readDeviceInfo() {
  try {
    const devicePlugin = uni.requireNativePlugin('shuke_device')

    const androidId = devicePlugin.getAndroidId() || ''
    const fingerprint = devicePlugin.getFingerPrint() || ''

    return {
      ok: true,
      androidId,
      fingerprint
    }
  } catch (err) {
    return {
      ok: false,
      androidId: '',
      fingerprint: '',
      message: err && err.message ? err.message : '读取失败'
    }
  }
}
```

## 5. 如果你要在当前仓库里真正启用它，需要补的接入项

### 5.1 在 `settings.gradle` 中加入模块

```gradle
include ':shuke_device'
```

### 5.2 在 `app/build.gradle` 中加入依赖

```gradle
implementation project(':shuke_device')
```

### 5.3 在 `app/src/main/assets/dcloud_uniplugins.json` 中注册模块

```json
{
  "hooksClass": "",
  "plugins": [
    {
      "type": "module",
      "name": "shuke_device",
      "class": "com.example.shuke_device.DeviceIdModule"
    }
  ]
}
```

### 5.4 确保 `shuke_device` 目录里有源码或可正常编译的模块内容

当前仓库中这个目录只保留了构建产物，后续如果你要长期维护，最好把源码补回仓库，而不是只依赖 `build` 目录里的历史编译结果。

## 6. 注意事项

- 当前文档中“方法列表”是根据编译产物反查得到的，不是直接读取源码整理的，所以如果你本地还有未提交源码，请以源码为准。
- 这两个方法都是同步取值方法，不是回调方法。
- 这两个方法当前逻辑里都没有权限申请，不需要额外向用户申请录音、存储等权限。
- `getAndroidId()` 只是读取系统提供的 `ANDROID_ID`，插件自身没有做持久化、加密、兜底拼装或多字段融合。
- `getFingerPrint()` 返回的是 ROM / 构建指纹，更适合诊断设备系统环境，不适合当作稳定业务主键。
- 一旦底层读取异常，这个插件会直接返回空字符串，不会告诉你失败原因，所以前端最好把空字符串当成“读取失败或系统未提供”处理。
- 如果你准备把它用于登录态绑定、风控、设备唯一标识，请先重新评估。按当前实现，它只是“直接透传系统值”，并没有做业务级可靠性保证。

## 7. 适用场景

适合：

- 调试设备信息
- 上报测试环境系统指纹
- 在内部工具页展示当前终端基本标识

不适合：

- 当作绝对稳定的用户唯一主键
- 需要强一致设备身份识别的业务
- 直接面向外部用户的隐私敏感场景

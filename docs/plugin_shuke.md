# plugin_shuke 使用说明

## 1. 插件作用

`plugin_shuke` 是一个最简单的 UniApp 原生模块示例，用来演示：

- 前端如何通过 `uni.requireNativePlugin()` 拿到原生模块
- 前端如何向 Android 原生层传参
- 原生层如何通过回调把结果返回给前端

按当前仓库实现，它只提供一个打招呼方法：把传入的名字拼成一句问候语返回。

## 2. 当前仓库接入状态

当前仓库中，这个插件已经接入完成：

- 已在 `app/src/main/assets/dcloud_uniplugins.json` 注册模块名 `plugin_shuke`
- 已在 `app/build.gradle` 中加入 `implementation project(':plugin_shuke')`
- 已有前端测试页 `pages/test/plugin-shuke`

也就是说，只要当前 App 工程正常运行，这个插件可以直接调用。

## 3. 前端调用方式

```js
const shukePlugin = uni.requireNativePlugin('plugin_shuke')
```

建议只在 `App-Android` 环境中使用。H5、小程序环境下没有这个原生模块。

## 4. 可用方法

### 4.1 `sayHello(name, callback)`

#### 作用

向原生层传入一个名字，由原生层拼装问候语后回调给前端。

#### 参数

- `name: string`
  - 要传给原生层的名字
- `callback: Function`
  - 回调函数

#### 返回

回调参数是一个对象，结构如下：

```js
{
  reply: '你好，' + name
}
```

#### 示例

```js
const shukePlugin = uni.requireNativePlugin('plugin_shuke')

shukePlugin.sayHello('舒克', (res) => {
  console.log('插件返回：', res)
  console.log(res.reply)
})
```

## 5. 推荐使用方式

这个插件本身没有复杂状态，直接调用即可：

```js
const shukePlugin = uni.requireNativePlugin('plugin_shuke')

function callPlugin(name) {
  if (!name) {
    uni.showToast({ title: '请输入名字', icon: 'none' })
    return
  }

  shukePlugin.sayHello(name, (res) => {
    uni.showModal({
      title: '原生插件返回',
      content: res.reply || '',
      showCancel: false
    })
  })
}
```

## 6. 注意事项

- 这是一个回调式接口，不是同步返回值接口，不能写成 `const result = shukePlugin.sayHello(...)`。
- 当前原生代码没有对空字符串、`null`、超长字符串做校验，前端最好自己先校验输入。
- 当前实现只是把字符串拼接后返回，没有任何业务逻辑、权限申请、线程切换控制之外的额外处理。
- 这个插件更适合作为接入范例，不适合作为复杂业务模块的设计参考，因为它没有错误码、没有统一状态管理、也没有生命周期处理。
- 如果你要在真实业务里扩展它，至少建议补上：
  - 参数校验
  - 错误回调
  - 返回结构统一化
  - 文档里约定字段名和错误码

## 7. 适用场景

适合下面这些场景：

- 你想验证 UniApp 原生插件链路是否已经打通
- 你想给团队演示最基础的 UniApp -> Android 调用流程
- 你准备以它为模板，继续开发更复杂的原生模块

// utils/logger.ts
const logFolderPath = '/storage/emulated/0/chat_log/log'
const logFileName = 'app-log.txt'

/**
 * 请求存储权限
 */
async function requestPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    plus.android.requestPermissions(
      [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      (result) => {
        resolve(result.granted.length > 0)
      },
      (error) => {
        console.error('❌ 权限请求失败', error)
        resolve(false)
      },
    )
  })
}

/**
 * 初始化日志目录和文件
 */
export async function initLogFolder() {
  const hasPermission = await requestPermission()
  if (!hasPermission) {
    // uni.showToast({ title: '请先开启文件权限', icon: 'none' })
    return false
  }

  // chat_log 根目录
  const chatLogDir = plus.android.newObject(
    'java.io.File',
    '/storage/emulated/0/chat_log',
  )
  if (!plus.android.invoke(chatLogDir, 'exists')) {
    const created = plus.android.invoke(chatLogDir, 'mkdirs')
    if (!created) {
      console.error('❌ chat_log 目录创建失败')
      return false
    }
  }

  // log 子目录
  const logDir = plus.android.newObject('java.io.File', logFolderPath)
  if (!plus.android.invoke(logDir, 'exists')) {
    const created = plus.android.invoke(logDir, 'mkdirs')
    if (!created) {
      console.error('❌ log 目录创建失败')
      return false
    }
  }

  // 日志文件
  const logFile = plus.android.newObject(
    'java.io.File',
    `${logFolderPath}/${logFileName}`,
  )
  if (!plus.android.invoke(logFile, 'exists')) {
    plus.android.invoke(logFile, 'createNewFile')
  }

  return true
}

/**
 * 写入日志（追加模式）
 */
export async function fileLog(msg: string) {
  const ready = await initLogFolder()
  if (!ready)
    return

  const now = new Date()
  const time = now.toISOString().replace('T', ' ').split('.')[0]
  const logText = `[${time}] ${msg}\n`

  try {
    plus.android.importClass('java.io.FileOutputStream')
    plus.android.importClass('java.io.OutputStreamWriter')

    const file = plus.android.newObject(
      'java.io.File',
      `${logFolderPath}/${logFileName}`,
    )

    // ✅ 追加模式：第二个参数 true
    const fos: any = (plus.android.newObject as any)(
      'java.io.FileOutputStream',
      file,
      true,
    )
    const osw: any = plus.android.newObject('java.io.OutputStreamWriter', fos)

    plus.android.invoke(osw, 'write', logText)
    plus.android.invoke(osw, 'flush')
    plus.android.invoke(osw, 'close')

    // console.log('✅ 日志写入成功:', logText.trim())
  }
  catch (e) {
    console.error('❌ 写日志失败:', e)
  }
}

/**
 * 将 base64 转回 ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // 1. 解码Base64为二进制字符串
  const binaryString = atob(base64)
  // 2. 创建一个新的Uint8Array来保存解码后的数据
  const arrayBuffer = new ArrayBuffer(binaryString.length)
  const uint8Array = new Uint8Array(arrayBuffer)
  // 3. 将二进制字符串中的每个字符转换为Uint8Array的相应值
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i)
  }
  return arrayBuffer
}

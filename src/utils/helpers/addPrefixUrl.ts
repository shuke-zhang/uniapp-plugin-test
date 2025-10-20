/**
 * 上传文件成功后返回的链接添加前缀
 * 前缀为 FILE_URL
 * @param url
 */
export function addPrefixUrl(url?: string) {
  if (!url)
    return ''
  // const base64 = /^data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/]+={0,2})$/
  const base64 = /^data:image\/(?:png|jpeg|jpg|gif);base64,[A-Za-z0-9+/]+={0,2}$/

  const httpOrHttps = /^[a-z]+:\/\//i
  if (base64.test(url))
    return url
  if (httpOrHttps.test(url))
    return url
  return FILE_URL + url
}

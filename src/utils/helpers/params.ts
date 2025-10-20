/**
 *  获取?后面的参数
 * @param url
 */
export function getParams(url?: string) {
  const _url = url || window.location.href
  const [, search] = _url.split('?')
  if (search && search.length) {
    const paramsList = search.split('&')
    const params: Record<string, any> = {}
    paramsList.forEach((e) => {
      const [key, value] = e.split('=')
      if (value !== undefined && value !== '') {
        params[key] = value
      }
    })
    return params
  }
  return {}
}

/**
 * 封装带?有查询参数的 URL
 * @param {string} baseUrl - 基础 URL
 * @param {object} params - 要附加到 URL 的查询参数对象
 * @returns {string} 返回附加了查询参数的完整 URL
 */
export function setParams(baseUrl: string, params: object): string {
  if (!Object.keys(params).length)
    return baseUrl
  let parameters = ''
  for (const key in params) {
    parameters += `${key}=${encodeURIComponent(params[key as keyof typeof params])}&`
  }

  parameters = parameters.replace(/&$/, '')
  return /\?$/.test(baseUrl) ? baseUrl + parameters : baseUrl.replace(/\/?$/, '?') + parameters
}

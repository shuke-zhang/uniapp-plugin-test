import { createToast } from './toast'
import { createLoading } from './loading'
import { createModal } from './modal'

/**
 * toast
 */
export const showToast = createToast('none')
export const showToastSuccess = createToast('success')
export const showToastError = createToast('none')

/**
 * modal
 */
export const showModal = createModal()
export const showAlert = createModal({ showCancel: false })

/**
 * loading
 */
let isLoading = false

export function getLoadingStatus() {
  return isLoading
}
const _showLoading = createLoading()

export function showLoading(title = '加载中...', options?: Omit<UniNamespace.ShowLoadingOptions, 'title'> | boolean) {
  if (!isLoading) {
    isLoading = true
    _showLoading(title, options)
  }
}

export async function hideLoading() {
  if (isLoading) {
    uni.hideLoading()
    await nextTick()
    isLoading = false
  }
}

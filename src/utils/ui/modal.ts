import { COLOR_BLACK_3 as COLOR_INFO, COLOR_PRIMARY } from '../const'

type ModalOptions = UniNamespace.ShowModalOptions
type CreateModalOptions = Omit<ModalOptions, 'title' | 'content'>
interface ModalActions { confirm: boolean, cancel: boolean, errMsg: string }
export function createModal(_defaultOptions?: CreateModalOptions) {
  const defaultOptions: CreateModalOptions = {
    cancelText: '取消',
    confirmText: '确认',
    ..._defaultOptions,
  }

  return (content: string, title = '提示', options?: CreateModalOptions) => {
    return new Promise<ModalActions>((resolve, reject) => {
      uni.showModal({
        ...defaultOptions,
        content,
        title,
        ...options,
        cancelColor: COLOR_INFO,
        confirmColor: COLOR_PRIMARY,
        success(result) {
          const res = result as ModalActions
          res.confirm ? resolve(res) : reject(res)
        },
        fail(result) {
          reject(result)
        },

      })
    })
  }
}

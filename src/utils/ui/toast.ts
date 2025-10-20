import { sleep } from '../helpers/sleep';

type ToastOptions = UniNamespace.ShowToastOptions;
type CreateToastOptions = Omit<ToastOptions, 'icon' | 'title'>;

export function createToast(icon: Required<ToastOptions>['icon']) {
  const defaultOptions: ToastOptions = {
    duration: 1500,
    mask: true,
    position: 'bottom',
  };
  return (title: string, options?: CreateToastOptions) => {
    return new Promise((resolve, reject) => {
      const mergeOpt = {
        ...defaultOptions,
        title,
        icon,
        ...options,
      };
      uni.showToast({
        ...mergeOpt,
        async success(res) {
          await sleep(mergeOpt.duration);
          resolve(res);
        },
        fail(e) {
          reject(e);
        },
      });
    });
  };
}
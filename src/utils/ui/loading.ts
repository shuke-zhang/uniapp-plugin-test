export function createLoading() {
  return (title = '加载中...', options?: Omit<UniNamespace.ShowLoadingOptions, 'title'> | boolean) => {
    uni.showLoading({
      title,
      mask: true,
      ...(typeof options == 'boolean' ? { mask: options } : options),
    });
  };
}

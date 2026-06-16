import { defineAsyncComponent } from 'vue'

const LoadingComponent = {
  template: '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#999;">加载中...</div>'
}

const ErrorComponent = {
  template: '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#ff4d4f;">加载失败</div>'
}

export function lazyLoad(loader) {
  return defineAsyncComponent({
    loader,
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    delay: 200,
    timeout: 10000
  })
}

export default lazyLoad

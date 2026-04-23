/**
 * createRequest 使用示例（与 reauest.ts 同目录）
 * 需已安装: axios、lodash
 *
 * 运行（示例）: npx ts-node reauest.example.ts
 * 或在你的 React/Vue 入口中复制「创建 request」与「发起请求」片段。
 */
import { createRequest, type ResponseData } from './reauest'

// ---------- 1. 在应用入口（或单例模块）中创建 request，只执行一次 ----------
const resCodeMap = { success: 0, unauthorized: 401 } as const

const request = createRequest({
  resCodeMap,
  // 与页面 store 配合：为 true 时该请求在拦截器里会被取消
  getIsLogout: () => false,

  onSaveFallbackUrl: (href) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('__fallBack__', href)
    }
  },
  onUnauthorized: () => {
    if (typeof location !== 'undefined') {
      location.hash = '/login'
    }
  },
  // 可换成 antd: import { message } from 'antd'; onBusinessError: (m) => message.error(m)
  onBusinessError: (msg) => { console.error('[业务错误]', msg) },
  onHttpError: (msg) => { console.error('[网络错误]', msg) },

  /** 公网/网关前缀；与下面 request 第一参的「相对路径」拼在一起 */
  axiosDefaults: {
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 20000,
  },
})

// ---------- 2. 你们业务推荐写法：baseURL + 相对路径，body 与成功码与后端约定一致 ----------
// 成功时响应体一般为 { code: 0, data?: ..., message?: string }（code 与 resCodeMap.success 一致）
async function demoBusinessApi() {
  const res = await request('/pre-complaint/detail', {
    method: 'post',
    data: { id: '123' },
  })
  if (res.code === resCodeMap.success) {
    console.log('业务数据', res)
  }
  return res
}

// ---------- 3. 相对路径 + baseURL（jsonplaceholder 返回体无 code 字段，会走「非成功码」提示一次，仅作联调 HTTP 参考） ----------
async function demoRelativePath() {
  const res: ResponseData = await request('/posts/1', { method: 'get' })
  console.log('GET /posts/1:', res)
  return res
}

// ---------- 4. 完整 URL + POST（httpbin 同理，响应体通常不符合 { code } 约定） ----------
async function demoFullUrl() {
  return request('https://httpbin.org/post', {
    method: 'post',
    data: { hello: 'world' },
  })
}

// 若直接执行本文件
async function main() {
  try {
    await demoRelativePath()
  } catch (e) {
    console.error('示例 GET 失败（可忽略，取决于网络/接口）', e)
  }
  try {
    await demoFullUrl()
  } catch (e) {
    console.error('示例 POST 失败', e)
  }
}

// eslint 在部分环境对顶层 await 不友好，用 void main()
void main()

export { request, demoBusinessApi, demoRelativePath, demoFullUrl }

import { extend, RequestOptionsInit, ResponseError } from 'umi-request'
import debounce from 'lodash/debounce'
import { message as Message } from 'antd'

import api from '@/utils/api'
import { resCodeMap } from '@/utils/consts'
import { lsSetItem } from '@/utils/util'
import _store from '@/redux/store'

interface Result {
  data: ResponseData
  response: Response
}

// 请求队列，用于管理并发请求
class RequestQueue {
  private queue: Array<() => void> = []
  private maxConcurrent = 6
  private currentConcurrent = 0

  async enqueue(fn: () => Promise<any>): Promise<any> {
    if (this.currentConcurrent < this.maxConcurrent) {
      this.currentConcurrent++
      try {
        return await fn()
      } finally {
        this.currentConcurrent--
        this.processQueue()
      }
    }

    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          return await fn()
        } finally {
          resolve(undefined)
        }
      })
    })
  }

  private processQueue() {
    while (this.queue.length > 0 && this.currentConcurrent < this.maxConcurrent) {
      const task = this.queue.shift()
      if (task) {
        this.currentConcurrent++
        task().finally(() => {
          this.currentConcurrent--
          this.processQueue()
        })
      }
    }
  }
}

const requestQueue = new RequestQueue()

const extensions: RequestOptionsInit = {
  method: 'post',
  timeout: 20000, // 减少超时时间，避免长时间等待
  getResponse: true,
  requestType: 'json',
  credentials: 'include',
  // 添加请求头，启用 HTTP/1.1 Keep-Alive 保持连接
  headers: {
    'Connection': 'keep-alive',
  },
}

const umiRequest = extend(extensions)

// 请求缓存，用于相同请求的去重
const requestCache = new Map<string, Promise<any>>()

// 请求去重 key 的超时时间（毫秒）
const CACHE_DURATION = 1000

umiRequest.use(async (ctx, next) => {
  if (_store.getState().app?.userInfo?.isLogout) {
    return
  }
  await next()
})

const successCodes: any[] = [resCodeMap.success]

const debounceMessage = debounce(message => {
  Message.error(message)
}, 400)

const checkLogin = (result: Result) => {
  const { data } = result
  if (data?.code === resCodeMap.unauthorized) {
    lsSetItem('__fallBack__', location.href)
    location.hash = '/login'
  }
  return result
}

const checkSuccess = (result: Result) => {
  const { data } = result
  if (!successCodes.includes(data?.code)) {
    debounceMessage(data.message)
  }
  return result
}

const dataHandler = (result: Result) => {
  const { data } = result
  if (successCodes.includes(data?.code)) {
    return { ...data, code: resCodeMap.success }
  }
  return { ...data }
}

const errorHandler = (error: ResponseError) => {
  if (error.name === 'ResponseError') {
    Message.error(error.message || '网络错误')
  }
  return error
}

/**
 * 生成请求缓存 key
 */
const generateCacheKey = (url: string, options: RequestOptionsInit = {}): string => {
  // 只对 GET 请求进行缓存（如果有 GET 请求）
  const method = options.method || extensions.method
  const data = options.data ? JSON.stringify(options.data) : ''
  return `${method}:${url}:${data}`
}

/**
 * 执行请求
 */
const executeRequest = (url: string, options: RequestOptionsInit = {}): Promise<ResponseData> => {
  return umiRequest(api[url as keyof typeof api], { ...extensions, ...options })
    .then(checkLogin)
    .then(checkSuccess)
    .then(dataHandler)
    .catch(error => {
      return errorHandler(error)
    })
}

/**
 * 带缓存和去重的请求函数
 */
const request = (url: string, options: RequestOptionsInit = {}): Promise<ResponseData> => {
  const cacheKey = generateCacheKey(url, options)

  // 如果存在相同的请求正在进行，直接返回该 Promise
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!
  }

  // 执行新的请求
  const requestPromise = executeRequest(url, options).finally(() => {
    // 请求完成后，设置延迟清除缓存
    setTimeout(() => {
      requestCache.delete(cacheKey)
    }, CACHE_DURATION)
  })

  // 缓存该请求的 Promise
  requestCache.set(cacheKey, requestPromise)

  return requestPromise
}

export default request

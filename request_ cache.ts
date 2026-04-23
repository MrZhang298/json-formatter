import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, Method } from 'axios'
import debounce from 'lodash/debounce'

/** 与后端约定一致的 JSON 体 */
export interface ResponseData {
  code?: number
  message?: string
  [key: string]: unknown
}

interface Result {
  data: ResponseData
  response: Pick<AxiosResponse, 'status' | 'statusText' | 'headers' | 'config' | 'data'>
}

/** 仅依赖业务侧注入；不在此文件内 import 项目路径 */
export interface CreateRequestOptions {
  /** 与原先 `api[url]` 一致：短 key -> 实际请求 URL */
  api: Record<string, string>
  resCodeMap: { success: number; unauthorized: number }
  successCodes?: number[]
  getIsLogout?: () => boolean
  /** 未授权时回跳前写入（对应原 `lsSetItem('__fallBack__', href)`） */
  onSaveFallbackUrl?: (href: string) => void
  /** 未授权时跳转（对应原 `location.hash = '/login'`） */
  onUnauthorized?: () => void
  /** 业务错误（非 successCodes） */
  onBusinessError?: (message: string) => void
  /** 网络或 HTTP 层错误 */
  onHttpError?: (message: string) => void
  /** 默认与原先 `extensions` 对齐 */
  axiosDefaults?: Partial<AxiosRequestConfig>
  /** 去重 key 的保留时间，默认 1000 */
  cacheDuration?: number
  /** 与原先 debounce 400ms 一致 */
  debounceErrorMs?: number
}

// 请求缓存，用于相同请求的去重
const requestCache = new Map<string, Promise<ResponseData>>()

const generateCacheKey = (url: string, method: string, data?: unknown, params?: unknown): string => {
  const payload = data != null
    ? JSON.stringify(data)
    : params != null
      ? JSON.stringify(params)
      : ''
  return `${method}:${url}:${payload}`
}

const CACHE_DURATION = 1000
const DEFAULT_DEBOUNCE_MS = 400

const buildErrorMessageHandler = (opts: CreateRequestOptions) => {
  const debounceMs = opts.debounceErrorMs ?? DEFAULT_DEBOUNCE_MS
  const onBiz = opts.onBusinessError
  if (!onBiz) {
    return (msg: string) => { console.error(msg) }
  }
  return debounce((message: string) => {
    onBiz(message)
  }, debounceMs)
}

const checkLogin = (opts: CreateRequestOptions, result: Result) => {
  const { data } = result
  if (data?.code === opts.resCodeMap.unauthorized) {
    opts.onSaveFallbackUrl?.(typeof location !== 'undefined' ? location.href : '')
    opts.onUnauthorized?.()
  }
  return result
}

const checkSuccess = (successCodes: number[], debouncedMessage: (m: string) => void, result: Result) => {
  const { data } = result
  if (data && !successCodes.includes(data.code as number)) {
    debouncedMessage(String(data.message ?? ''))
  }
  return result
}

const dataHandler = (successCodes: number[], resMapSuccess: number, result: Result) => {
  const { data } = result
  if (data && successCodes.includes(data.code as number)) {
    return { ...data, code: resMapSuccess } as ResponseData
  }
  return { ...data } as ResponseData
}

const errorHandler = (opts: CreateRequestOptions, error: unknown) => {
  const onHttp = opts.onHttpError ?? ((m: string) => { console.error(m) })
  if (axios.isAxiosError(error)) {
    const msg = (error as AxiosError).message || '网络错误'
    onHttp(msg)
  } else {
    onHttp('网络错误')
  }
  return Promise.reject(error)
}

/**
 * 使用 axios + lodash 创建与原先 umi-request 版行为等价的 `request`。
 * 在应用入口用项目内的 `api`、`resCodeMap`、`Message`、`store` 等组装 `CreateRequestOptions` 后调用一次即可。
 */
export function createRequest(opts: CreateRequestOptions): (url: string, requestOptions?: AxiosRequestConfig) => Promise<ResponseData> {
  const successCodes = opts.successCodes ?? [opts.resCodeMap.success]
  const debounceMessage = buildErrorMessageHandler(opts)
  const cacheDuration = opts.cacheDuration ?? CACHE_DURATION

  const defaultMethod: Method = (opts.axiosDefaults?.method as Method) || 'post'
  const instance: AxiosInstance = axios.create({
    method: defaultMethod,
    timeout: 20000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
    },
    validateStatus: () => true,
    ...opts.axiosDefaults,
  })

  const runChain = (result: Result): Promise<ResponseData> => {
    const r1 = checkLogin(opts, result)
    checkSuccess(successCodes, debounceMessage, r1)
    return Promise.resolve(dataHandler(successCodes, opts.resCodeMap.success, r1))
  }

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (opts.getIsLogout?.()) {
        return Promise.reject(new Error('CANCEL_WHEN_LOGOUT'))
      }
      return config
    },
    (err: unknown) => Promise.reject(err)
  )

  const executeRequest = (pathKey: string, requestOptions: AxiosRequestConfig = {}): Promise<ResponseData> => {
    const finalUrl = opts.api[pathKey as keyof typeof opts.api] ?? pathKey
    return instance
      .request({ url: finalUrl, ...requestOptions })
      .then((res: AxiosResponse<ResponseData>) => {
        const result: Result = {
          data: (res.data ?? {}) as ResponseData,
          response: {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
            config: res.config,
            data: res.data,
          },
        }
        return runChain(result)
      })
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && (err as Error).message === 'CANCEL_WHEN_LOGOUT') {
          return Promise.reject(err)
        }
        return errorHandler(opts, err)
      })
  }

  const request = (url: string, requestOptions: AxiosRequestConfig = {}): Promise<ResponseData> => {
    const m = (requestOptions.method as string) || String(defaultMethod)
    const cacheKey = generateCacheKey(url, m, requestOptions.data, requestOptions.params)
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey) as Promise<ResponseData>
    }
    const p = executeRequest(url, requestOptions).finally(() => {
      setTimeout(() => {
        requestCache.delete(cacheKey)
      }, cacheDuration)
    })
    requestCache.set(cacheKey, p)
    return p
  }

  return request
}

export type RequestFn = ReturnType<typeof createRequest>
export default createRequest

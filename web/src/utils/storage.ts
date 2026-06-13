const TOKEN_KEY = 'cuyan_token'
const USER_INFO_KEY = 'cuyan_user_info'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUserInfo<T = any>(): T | null {
  const data = localStorage.getItem(USER_INFO_KEY)
  return data ? JSON.parse(data) : null
}

export function setUserInfo<T = any>(userInfo: T): void {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

export function removeUserInfo(): void {
  localStorage.removeItem(USER_INFO_KEY)
}

export function clearStorage(): void {
  removeToken()
  removeUserInfo()
}

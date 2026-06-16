import Cookies from 'js-cookie'

const TOKEN_KEY = 'Admin-Token'

export const getToken = () => {
  return Cookies.get(TOKEN_KEY)
}

export const setToken = (token: string) => {
  return Cookies.set(TOKEN_KEY, token, { expires: 7 })
}

export const removeToken = () => {
  return Cookies.remove(TOKEN_KEY)
}

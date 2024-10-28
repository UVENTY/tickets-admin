import axiosHttp from 'axios'
import Cookies from 'universal-cookie'
import { API_URL } from '../consts'
import { getFormData } from './utils'

const cookies = new Cookies()

export const axios = axiosHttp.create({
  baseURL: API_URL
})

axios.interceptors.request.use(config => {
  const { data } = config
  const formData = (data instanceof URLSearchParams || data instanceof FormData) ? data : getFormData(data)
  const token = cookies.get('token')
  const u_hash = cookies.get('u_hash')
  if (token && u_hash && ![token, u_hash].includes('undefined')) {
    formData.append('token', token)
    formData.append('u_hash', u_hash)
  }
  config.data = formData
  return config
})
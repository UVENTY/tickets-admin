import Cookies from 'universal-cookie'
import axios from '../../utils/axios'
import toFormData from '../../utils/formData'
import { setToken, setLoading, setProfile } from '.'

export const login = params => async (dispatch) => {
  dispatch(setLoading(true))
  try {
    const formData = toFormData({ ...params, type: 'e-mail' })
    const { data } = await axios.post('/auth', formData)
    if (!data.auth_hash || !['2', '4'].includes(data.auth_user?.u_role)) {
      return false
    }
    await dispatch(getToken(data.auth_hash))
    dispatch(setProfile({ ...data.auth_user, authorized: true }))
    return data.auth_user?.u_role
  } catch(e) {
    console.error(e)
  } finally {
    dispatch(setLoading(false))
  }
}

export const logout = async (dispatch) => {
  const cookies = new Cookies()
  dispatch(setProfile({ authorized: false }))
  cookies.remove('token')
  cookies.remove('u_hash')
}

export const authorizeByTokens = async (dispatch) => {
  dispatch(setLoading(true))
  const cookies = new Cookies()
  const token = cookies.get('token')
  const u_hash = cookies.get('u_hash')
  if (!token && !u_hash) {
    dispatch(setLoading(false))
    return false
  }
  const formData = toFormData({ token, u_hash })
  try {
    const res = await axios.post('/user/authorized', formData)
    const user = res.data?.auth_user
    if (!user) {
      return false
    }
    dispatch(setProfile({ ...user, authorized: true }))
    return res.data?.auth_user?.u_role
  } catch(e) {
    console.error(e)
  } finally {
    dispatch(setLoading(false))
  }
}

export const getToken = hash => async (dispatch) => {
  const cookies = new Cookies()
  try {
    const formData = toFormData({ auth_hash: hash })
    const res = await axios.post('/token', formData)
    const tokens = res.data?.data
    if (tokens) {
      dispatch(setToken(tokens))
      cookies.set('token', tokens.token)
      cookies.set('u_hash', tokens.u_hash)
    }
    return tokens
  } catch(e) {
    console.error(e)
  }
}
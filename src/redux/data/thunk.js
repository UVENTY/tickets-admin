import { mapValues } from 'lodash'
import { axios } from 'api/axios'
import {
  setLoading,
  setLoaded,
  setSubmitting,
  updateData,
  setData,
  setStadiumScheme,
  setStadiumSchemeStatus,
  setNotifications,
  setFetchingNotifications
} from '.'

export const fetchData = (params = { fields: 'F', easy: true }) => async (dispatch) => {
  dispatch(setLoading(true))
  try {
    const res = await axios.get('/data', { params })
    const data = res.data?.data?.data
    const schedule = mapValues(data.schedule, item => {
      if (!item.datetime) return item
      return {
        ...item,
        datetime: item.datetime.split('+')[0]
      }
    })
    dispatch(setData({ ...data, schedule }))
  } catch(e) {
    console.error(e)
  } finally {
    dispatch(setLoaded(true))
    dispatch(setLoading(false))
  }
}

export const postData = params => async (dispatch) => {
  dispatch(setSubmitting(true))
  try {
    const resp = await axios.postWithAuth('/data', {
      data: JSON.stringify(params)
    })
    dispatch(updateData(params))
    return resp.data
  } catch(e) {
    console.error(e)
  } finally {
    dispatch(setSubmitting(false))
  }
}

export const fetchStadiumScheme = stadiumId => async (dispatch) => {
  dispatch(setStadiumSchemeStatus({ id: stadiumId, isLoading: true }))
  try {
    const { data } = await axios.post(`/data?fields=1&key=${stadiumId}`)
    dispatch(setStadiumSchemeStatus({ id: stadiumId, isLoading: false, isLoaded: true }))
    const schemeJson = data?.data?.data?.stadiums[stadiumId].scheme
    const scheme = schemeJson ? JSON.parse(schemeJson.replaceAll('\'', '"')) : null
    dispatch(setStadiumScheme({ id: stadiumId, scheme }))
  } catch (e) {
    dispatch(setStadiumSchemeStatus({ id: stadiumId, isLoading: false }))
    console.error(e)
  }
}

export const fetchNotifications = async (dispatch) => {
  dispatch(setFetchingNotifications(true))
  try {
    const { data } = await axios.postWithAuth('/query/select', {
      sql: 'SELECT cart_block.id_user as u_id, cart_block.product as prod, cart_block.property as prop, u.name, u.family, u.middle, u.phone FROM cart_block LEFT JOIN (SELECT schedule.id_schedule FROM schedule LEFT JOIN trip ON trip.from = CAST(CONCAT("sc_id",schedule.id_schedule) as char) WHERE schedule.active = "1" and schedule.start_datetime >= now()) sc ON sc.id_schedule = cart_block.product LEFT JOIN users u on u.id_user=cart_block.id_user WHERE sc.id_schedule IS NOT NULL'
    })
    const notices = (data.data || []).map((item, id) => ({
      id,
      u_id: item.u_id,
      match_id: item.prod,
      blocks: (item.prop || '').split(';'),
      user: {
        id: item.u_id,
        name: item.name,
        middle: item.middle,
        family: item.family
      }
    }))
    dispatch(setNotifications(notices))
  } catch (e) {
    console.error(e)
  } finally {
    dispatch(setFetchingNotifications(false))
  }
}
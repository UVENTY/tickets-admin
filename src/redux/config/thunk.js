import axios from '../../utils/axios'
import { setLoading, setLoaded, setConfig, setUpdating } from '.'

export const fetchConfig = async (dispatch) => {
  dispatch(setLoading(true))
  try {
    const resp = await axios.get('/data')
    const { data } = resp.data
    const {
      currencies,
      lang_vls,
      langs: respLangs,
      cities: respCities,
      countries: respCountries } = data.data
    const currency = {
      default: data.default_currency,
      map: Object.keys(currencies).reduce((acc, code) => ({ ...acc, [code]: { ...currencies[code], code } }), {})
    }
    const langs = Object.keys(respLangs).reduce((acc, id) => ({ ...acc, [id]: { ...respLangs[id], id } }), {})
    const countries = Object.keys(respCountries).reduce((acc, id) => ({ ...acc, [id]: { ...respCountries[id], id } }), {})
    const cities = Object.keys(respCities).reduce((acc, id) => ({ ...acc, [id]: { ...respCities[id], id } }), {})
    dispatch(setConfig({ currency, langs, cities, countries, langValues: lang_vls }))
    dispatch(setLoaded(true))
  } catch(e) {
    console.error(e)
  } finally {
    dispatch(setLoading(false))
  }
}

export const updateLang = lang_vls => async (dispatch) => {
  dispatch(setUpdating(true))
  try {
    await axios.postWithAuth('/data', {
      data: JSON.stringify({ lang_vls })
    })
    dispatch(fetchConfig)
  } catch (e) {
    console.error(e)
  } finally {
    dispatch(setUpdating(false))
  }
}
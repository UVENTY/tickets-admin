import { createSelector } from 'reselect'
import { getOptions, toOptions } from '../../utils/utils'

export const getDefaultCurrency = createSelector(
  state => state.config.data?.currency,
  currency => currency.default
)

export const getCurrencyList = createSelector(
  state => state.config.data?.currency || {},
  currency => Object.values(currency.map)
)

export const getLang = createSelector(
  state => state.config.data?.langs,
  (state, key) => key,
  (langs, key) => key ? langs[key] : Object.values(langs)
)

export const getCity = createSelector(
  state => state.config.data?.cities,
  (state, cityId) => cityId,
  (cities, id) => cities[id]
)

export const getCities = createSelector(
  state => state.config.data?.cities,
  cities => cities
)

export const getCitiesOptions = createSelector(
  state => state.config.data?.cities,
  cities => toOptions(cities)
)

export const getCountries = createSelector(
  state => state.config.data?.countries,
  countries => countries
)

export const getCountriesOptions = createSelector(
  state => state.config.data?.countries,
  countries => toOptions(countries)
)

const emptyLang = {}

export const getLangValue = createSelector(
  state => state.config.data?.langValues,
  (state, key) => key,
  (values, key) => key ? (values[key] || emptyLang) : values
)

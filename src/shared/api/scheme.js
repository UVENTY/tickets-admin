import { keyBy } from 'lodash'
import { axios } from 'api/axios';
import { getCategories, transformScheme } from 'utils/svg';

export async function fetchScheme(url) {
  const json = await axios.get(url).then(resp => resp.data)
  return transformResponse(json)
}

export const transformResponse = response => {
  if (!response) return
  if (!response.seatParams && response.customProps) {
    response.seatParams = response.customProps
  }
  const mapCurrentCategories = keyBy(response.categories, 'value')
  const categories = getCategories(transformScheme(response.scheme)).map(item => ({
    ...item,
    ...mapCurrentCategories[item.value]
  }))
  
  return {
    ...response,
    categories
  }
}
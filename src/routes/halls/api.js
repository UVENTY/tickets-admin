import { axios } from 'api/axios'
import { parseJson } from 'utils/utils'

const defaultSorter = (a, b) => 0
const defaultFilter = () => true

export const selector = {
  list: ({ sorter = defaultSorter, filter = defaultFilter } = {}) => map =>
    Object.entries(map)
      .reduce((acc, [id, item]) => ([ ...acc, { ...item, id }]), [])
      .filter(filter)
      .sort(sorter),

  item: idOrFunc => map => typeof idOrFunc === 'function' ?
    Object.entries(map).find(([ key, item ]) => idOrFunc(item, key, map)) :
    map[idOrFunc]
}

export const query = {
  queryKey: ['halls'],
  queryFn: () => axios.get('/data', { params: { fields: 1 } })
    .then(response => {
      const map = response.data?.data?.data?.stadiums || {}
      Object.entries(map).forEach(([id, hall]) => {
        const options = parseJson(hall.scheme)
        if (!options) return
        hall.base = options?.base
        if (options.parent && map[options.parent]) {
          const parent = map[options.parent]
          hall.id = id
          hall.parent = parent
          hall.city = parent.city
          hall.country = parent.country
          hall.en = parent.en
          hall.address_en = parent.address_en
        }
      })
      return map
    }),
  staleTime: 3 * 60 * 1000
}

export const updateData = (data) => axios.post('/data', { data: JSON.stringify(data) })

export const getCreatedId = (response) => response.data?.data?.data?.stadiums?.[0]?.id

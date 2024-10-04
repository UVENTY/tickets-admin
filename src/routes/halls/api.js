import { axios } from 'api/axios'
import { parseJson } from 'routes/utils'

export const query = {
  queryKey: ['halls'],
  queryFn: () => axios.get('/data', { params: { fields: 1 } })
    .then(response => {
      const map = response.data?.data?.data?.stadiums || {}
      return map
    }),
  select: (map) => Object.entries(map).reduce(
    (acc, [id, item]) => {
      if (item.country && item.city && item.scheme) {
        item.scheme = parseJson(item.scheme)
        acc.unshift({ ...item, id })
      }
      return acc
    }, []
  ).sort((a, b) => a.country.localeCompare(b.country))
}

export const updateData = (data) => axios.post('/data', { data: JSON.stringify(data) })

export const getCreatedId = (response) => response.data?.data?.data?.stadiums?.[0]?.id
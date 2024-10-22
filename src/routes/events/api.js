import { axios } from 'api/axios'
import { parseJson } from 'utils/utils'

export const selectOrderedList = map => Object.entries(map)
  .reduce((acc, [id, item]) => ([{ id, date: new Date(item.datetime), ...item }, ...acc]), [])
  .sort((a, b) => a.date.getTime() > b.date.getTime() ? 1 : -1)

export const query = {
  queryKey: ['data', 'events'],
  queryFn: () => axios.get('/data', { params: { fields: 2 } })
    .then(response => response.data?.data?.data?.schedule || {}),
  select: selectOrderedList,
  staleTime: 3 * 60 * 1000
}

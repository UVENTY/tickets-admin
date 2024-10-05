import { QueryClient } from '@tanstack/react-query'
import { get } from 'lodash'

export default (function Cache() {
  let queryClient = null

  return async function result(query, update) {
    if (query instanceof QueryClient) {
      queryClient = query
      return
    }
    if (!queryClient) return

    const data = queryClient.getQueryData(query.queryKey) ?? (await queryClient.fetchQuery(query))
    return data
  }
})()
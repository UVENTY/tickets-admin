import { defer } from 'react-router-dom'

export const getDeferred = (queryClient, queryMap) => async (options) => {
  const loaders = Object.entries(queryMap).reduce((acc, [key, query]) => ({
    ...acc,
    [key]: getLoader(queryClient, query)(options)
  }), {})
  return defer(loaders)
}

export const getLoader = (
  queryClient,
  query,
  {
    // Если true, возвращает промис даже для кэшированных данных
    resolveCache
  } = {}
) => async ({ params }) => {
  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}

export const getLoaders = (queryClient, queryMap) => async (options) => {
  const keys = Object.keys(queryMap)
  const loaders = keys.map(key => {
    const query = queryMap[key]
    return {
      key,
      loader: getLoader(queryClient, query, { resolveCache: true })(options)
    }
  })
  const results = await Promise.all(
    loaders.map(({ key, loader }) => loader.then(result => ({ key, result })))
  )
  return results.reduce((acc, { key, result }) => ({
    ...acc,
    [key]: result
  }), {})
}
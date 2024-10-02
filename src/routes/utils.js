
export const getLoader = (queryClient, query, callback) => async ({ params }) => {
  const res = (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
  return callback ? callback(res) : res
}

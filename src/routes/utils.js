
export const getLoader = (queryClient, query, callback) => async ({ params }) => {
  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}

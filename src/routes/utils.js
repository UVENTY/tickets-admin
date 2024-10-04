
export const getLoader = (queryClient, query, callback) => async ({ params }) => {
  const res = (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
  return callback ? callback(res) : res
}


export const parseJson = (str, catchFn = () => { }) => {
  let result = null
  try {
    result = JSON.parse(str)
  } catch (e) {
    catchFn(e)
  }
  return result
}
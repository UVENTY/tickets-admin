import { axios } from '../axios'

export async function fetchData(params) {
  const response = await axios.get('/data', { params })
  return response.data?.data?.data
}

export async function updateData(params) {
  const response = await axios.post('/data', params)
  return response.data
}
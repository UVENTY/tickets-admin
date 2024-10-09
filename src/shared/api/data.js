import { axios } from 'api/axios';

export async function updateInstance(name, data) {
  const response = await axios.post('/data', {
    data: JSON.stringify({ [name]: data })
  })
  return response.data
}

export async function updateCity(data) {
  const cities = [{ en: data.city, country: data.country }]
  return updateInstance('cities', cities)
}

export async function updateStadium(data) {
  return updateInstance('countries', data)
}

export async function updateTour(data) {
  return updateInstance('tournaments', data)
}
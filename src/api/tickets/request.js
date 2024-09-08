import { axios } from '../axios'

export async function fetchTickets(params) {
  const [response, response2] = await Promise.all([
    axios.post('/trip/get', params),
    axios.post('/schedule/ticket/select', { sc_id: params.filter, code_qr: true })
  ])
  return { old: response.data?.data, new: response2.data?.data }
}

export async function createTickets(params) {
  const response = await axios.post('/trip', params)
  return response.data
}

export async function editTickets(t_id, params) {
  const response = await axios.post(`/trip/get/${t_id}/ticket/edit`, params)
  return response.data
}

export async function getTicketPdf(params: { seat: string, t_id: string }) {
  const response = await axios.post(
    `trip/get/${params.t_id}/ticket/read/`, {
      seat: params.seat,
      pdf: true
    },
    {
      responseType: 'blob'
    }
  )
  return response.data
}
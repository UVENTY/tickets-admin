import { TICKETMAN_ROLE } from 'consts'
import { axios } from 'api/axios'

export async function fetchTicketmans() {
  const response = await axios.post('/query/select', {
    sql: `SELECT * FROM users WHERE active=1 AND deleted!=1 AND id_role=${TICKETMAN_ROLE}`
  })
  return response.data?.data
}

export const query = {
  queryKey: ['ticketmans'],
  queryFn: fetchTicketmans
}
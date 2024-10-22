import { TICKETMAN_ROLE } from 'consts'
import { axios } from 'api/axios'

export async function fetchTicketmans() {
  /* const response = await axios.post('/query/select', {
    sql: `SELECT * FROM users WHERE active=1 AND deleted!=1` //  AND id_role=${TICKETMAN_ROLE}
  }) */
  const response = await axios.post('/user')
  const list = Object.values(response.data?.data?.user)
  return list.filter(user => user.u_role === '6')
}

export const query = {
  queryKey: ['ticketmans'],
  queryFn: fetchTicketmans
}
/**
 * @typedef { Object } TicketOptions
 * @property { string } event_id - id мероприятия, для которого получаем билеты
 * @property { number } skip - кол-во пропущенных с начала списка записей 
 * @property { number } limit - ограничение по количеству выбираемых записей
 */

import { useQuery } from '@tanstack/react-query'
import { filter, group, order, pipe, renameKeys } from '../utils'
import { selectFlatArray } from './selector'
import { fetchTickets } from './request'

/**
 * @param { TicketOptions } options 
 * @returns { import('@tanstack/react-query').UseQueryResult }
 */
export const useTickets = (options = {}, fn = {}, queryOptions = {}) => useQuery({
  ...queryOptions,
  queryKey: ['tickets', options],
  queryFn: () => fetchTickets(renameKeys({ event_id: 'filter', skip: 'lo', limit: 'lc' }, options)),
  select: data => pipe(
    selectFlatArray,
    filter(fn.filter),
    order(fn.order),
    group(fn.group)
  )(data)
})
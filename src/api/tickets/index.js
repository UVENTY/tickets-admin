/**
 * @typedef { Object } Ticket
 * @property { string } category - категория места
 * @property { string } row - ряд
 * @property { string } seat - место
 * @property { number } count - количество билетов (для категорий без местНу )
 * @property { number } price - цена
 * @property { string } currency - валюта
 */


import { useMutation, useQuery } from '@tanstack/react-query'
import { filter, group, order, pipe, renameKeys } from '../utils'
import { selectFlatArray } from './selector'
import { fetchTickets } from './request'

/**
 * @param { object } options
 * @param { string } options.event_id - id мероприятия, для которого получаем билеты
 * @param { number } options.skip - кол-во пропущенных с начала списка записей 
 * @param { number } options.limit - ограничение по количеству выбираемых записей
 * @param { object } fn
 * @param { Function } fn.filter - функция фильтрации данных
 * @param { Function } fn.order - функция сортировки данных
 * @param { Function } fn.group - функция группировки данных
 * @param { import('@tanstack/react-query').UseQueryOptions } queryOptions
 * @returns { import('@tanstack/react-query').UseQueryResult }
 */
export const transformFetchQuery = query => renameKeys({ event_id: 'filter', skip: 'lo', limit: 'lc' }, query)

export const useTickets = ({ event_id, ...params } = {}, fn = {}, { select, ...queryOptions } = {}) => useQuery({
  ...queryOptions,
  queryKey: ['tickets', event_id, params],
  queryFn: () => fetchTickets(transformFetchQuery({ event_id, ...params })),
  select: pipe(
    selectFlatArray,
    filter(fn.filter),
    order(fn.order),
    group(fn.group),
    select
  )
})

/**
 * @param { object } options
 * @param { string } options.event_id
 * @param { string } options.hall_id
 * @param { Ticket[] } options.tickets
 * @returns { import('@tanstack/react-query').UseMutationResult }
 */
const useCreate = (options) => {
  const { event_id, hall_id, tickets } = options
  if (!event_id || !hall_id) throw new Error('Не переданы обязательные параметры')
  const params = tickets.reduce((acc, ticket) => {
    const key = [hall_id, ticket.category, ticket.row, ticket.seat].join(';')
    const price = [ticket.price, ticket.currency].filter(Boolean).join(' ').toUpperCase()
    let priceIndex = acc.price.indexOf(price)
    if (priceIndex === -1) {
      acc.price.push(price)
      priceIndex = acc.price.length - 1
    }
    acc.t_options[key] = priceIndex
    return acc
  }, {
    t_options: {},
    price: [],
  })
  params.t_start_address = `sc_id\u0000${event_id}`
  const data = JSON.stringify({
    ...params,
    t_start_address: `sc_id\u0000${event_id}`
  })
  return useMutation({
    mutationFn: () => fetchTickets({ data })
  })
}

export default {
  useFetch: useTickets,
  useCreate
}


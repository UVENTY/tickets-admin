import { renameKeys } from '../utils'

const isArray = Array.isArray
const entries = Object.entries

/**
 * @typedef {Object} Ticket
 * @property {string} event_id - Event ID
 * @property {string} hall_id - Hall ID
 * @property {string} date_start - Start date
 * @property {string} section - Section
 * @property {string} row - Row
 * @property {number} seat - Seat
 * @property {number} price - Price
 * @property {string} currency - Currency
 * @property {boolean} disabled - Is ticket sold
 * @property {boolean} is_sold - Is ticket sold
 * @property {boolean} is_reserved - Is ticket reserved
 * @property {object} sold_info - Sold info
 * @property {string} sold_info.user_id
 * @property {string} sold_info.buy_id
 * @property {object} reserved_info - Reserved info
 * @property {string} reserved_info.user_id
 * @property {string} reserved_info.until_date - Reserved until date
 *
 *
 * @param {*} data
 * @returns {Ticket[]} Array of tickets
 */
export const selectFlatArray = ({ old: data, new: list }) => {
  const newDataMap = (list?.ticket || []).reduce((acc, item) => {
    const [ , section, row, seat ] = item.seat.split(';')
    const { currency, code, code_qr_base64 } = item
    const key = [section, row, seat].join(';')
    acc[key] = { currency, code, code_qr_base64, fullSeat: item.seat }
    return acc
  }, {})
  console.log(newDataMap);
  
  return Object.values(data.trip).reduce((tickets, group) => {    
    const commonData = renameKeys({
      sc_id: 'event_id',
      stadium: 'hall_id',
      t_start_datetime: 'date_start',
      t_id: 'fuckingTrip'
    }, group, true)
    const { seats_sold = {}, price: pricesList = [] } = group.t_options || {}
    entries(seats_sold).forEach(([section, rows]) => {
      entries(rows).forEach(([row, seats]) => {
        entries(seats).forEach(([seat, seatOptions]) => {
          const priceString = pricesList[isArray(seatOptions) ? seatOptions[0] : null]
          const [ price, currency ] = typeof priceString === 'string' ? priceString.split(' ') : []
          let range = seat.split(';').map(Number).filter(Boolean)
          if (range.length <= 1) range = [seat]
          let status = {}
          if (seatOptions.length > 1) {
            const [ , user_id, buy_id, until_date ] = seatOptions
            status = {
              disabled: true,
              is_sold: seatOptions.length === 3,
              is_reserved: seatOptions.length === 4,
              sold_info: until_date ? {} : {
                user_id,
                buy_id
              },
              reserved_info: !until_date ? {} : {
                user_id,
                buy_id,
                until_date
              }
            }
          }
          Array.from(
            { length: range.length === 2 ? range[1] - range[0] + 1 : 1 },
            (_, i) => Number(range[0]) ? i + Number(range[0]) : range[0]
          ).forEach(seat => console.log(seat) || tickets.push({
            ...commonData,
            section,
            row,
            seat,
            price: Number(price),
            currency,
            ...status,
            ...newDataMap[[section, row, seat].join(';')]
          }))
        })
      })
    })

    return tickets.filter(seat => seat.row !== '0')
  }, [])
}

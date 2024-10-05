import { uniq } from 'lodash'
import { getValidSvg, tryToNumber } from './utils'

export const transformScheme = svg => {
  const doc = getValidSvg(svg)
  if (!doc) return null
  const seats = doc.querySelectorAll('*[class*="c-"]')
  Array.from(seats).forEach(el => {
    Array.from(el.classList).forEach(val => {
      const res = val.match(/^([c|r|p])-(.*)/)
      if (!res) return
      const [, key, value] = res
      const prop = { c: 'category', r: 'row', p: 'seat' }[key]
      el.setAttribute(`data-${prop}`, value)
      el.classList.remove(val)
    })
    el.classList.add('svg-seat')
  })
  return doc
}

export const getCategories = doc => {
  if (!doc) return null
  return Array.from(doc.querySelectorAll('.svg-seat')).reduce((acc, seat) => {
    const cat = seat.getAttribute('data-category')
    if (!acc.find(item => item.value === cat)) {
      const count = doc.querySelectorAll(`*[data-category="${cat}"]`).length
      acc.push({
        id: acc.length + 1,
        value: cat, 
        label: cat.replaceAll('_', ' '),
        color: seat.getAttribute('fill'),
        icon: null,
        rows: getRows(doc, cat),
        seats: getSeats(doc, cat),
        seatsCount: count <= 1 ? 0 : count
      })
    }
    return acc
  }, [])
}

export const getRows = (doc, category) => {
  if (!doc) return null
  return uniq(Array.from(doc.querySelectorAll(`.svg-seat[data-category="${category}"]`)).map((seat) => {
    const cat = seat.getAttribute('data-category')
    const row = tryToNumber(seat.getAttribute('data-row'))
    return row
  })).sort((a, b) => typeof a === 'number' ? (a > b ? 1 : -1) : a.localeCompare(b))
}

export const getSeats = (doc, category) => {
  if (!doc) return null
  return Array.from(doc.querySelectorAll(`.svg-seat[data-category="${category}"]`)).map((seat) => {
    const cat = seat.getAttribute('data-category')
    const row = tryToNumber(seat.getAttribute('data-row'))
    const seatNum = tryToNumber(seat.getAttribute('data-seat'))
    return { cat, row, seat: seatNum }
  })
}

export const removeColorsAndSerialize = doc => {
  if (!doc) return
  Array.from(doc.querySelectorAll('.svg-seat')).forEach(el => {
    el.removeAttribute('fill')
  })
  const s = new XMLSerializer()
  return s.serializeToString(doc)
}
import { merge } from 'lodash'

export default class TicketsSvgScheme {
  constructor(data, options = {}) {
    this.parser = new DOMParser()
    this.options = merge({
      seat: {
        selector: '*[class*="c-"]',
        className: 'seat'
      }
    }, options)
    if (typeof data === 'string') {
      this.dom = this.parseDOM(data)
      this.seats = this.initSeats()
    } else if (typeof data === 'object') {
      this.dom = this.parseDOM(data.svg)
    }
  }

  parseDOM = svg => {
    const doc = this.parser.parseFromString(svg, 'image/svg+xml')
    return doc.querySelector('parsererror') ? { error: 'Invalid svg' } : doc
  }

  init = source => {
    this.dom = this.parseDOM(source)
    this.seats = this.initSeats(this.dom.querySelectorAll(this.options.seat.selector))
    this.seatsParams = this.getSeatParams()
  }
  
  initSeats = () => {
    const seats = this.dom.querySelectorAll(this.options.seat.selector)
    return Array.from(seats).map(el => {
      Array.from(el.classList).forEach(val => {
        const res = val.match(/^([c|r|p])-(.*)/)
        if (!res) return
        const [, key, value] = res
        el.setAttribute(`data-${key}`, value)
        el.classList.remove(val)
      })
      el.classList.add(this.options.seat.className)
    })
  }

  getSeatParams() {
    if (!this.seats) return []
    const categories = Object.values(
      this.seats.reduce((acc, el) => {
        const category = el.getAttribute('data-c')
        if (acc[category]) return acc
        const fill = el.getAttribute('fill')
        acc[category] = { color: fill, value: category }
        return acc
      }, {})
    )
    return [
      {
        name: 'c',
        label: 'Category',
        options: categories,
        params: [
          { type: 'color', name: 'color', label: 'Color' },
          { type: 'file', name: 'icon', label: 'Icon', accept: '.svg' }
        ]
      }, {
        name: 'r',
        label: 'Row'
      }, {
        name: 'p',
        label: 'Seat'
      }, {
        name: 'text', 
        label: 'Text'
      }, {
        name: 'icon',
        type: 'file',
        label: 'Icon'
      }
    ]
  }
}
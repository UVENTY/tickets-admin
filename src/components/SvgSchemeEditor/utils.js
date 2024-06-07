export const transformScheme = svg => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return doc
  const seats = doc.querySelectorAll('*[class*="c-"]')
  Array.from(seats).forEach(el => {
    Array.from(el.classList).forEach(val => {
      const res = val.match(/^([c|r|p])-(.*)/)
      if (!res) return
      const [, key, value] = res
      el.setAttribute(`data-${key}`, value)
      el.classList.remove(val)
    })
    el.classList.add('svg-seat')
  })
  return doc
}

export const getCategories = doc => {
  return Array.from(doc.querySelectorAll('.svg-seat')).reduce((acc, seat) => {
    const cat = seat.getAttribute('data-c')
    if (!acc.find(item => item.value === cat)) acc.push({ value: cat, label: cat, color: seat.getAttribute('fill'), icon: null })
    return acc
  }, [])
}
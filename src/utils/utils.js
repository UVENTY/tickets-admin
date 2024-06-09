import { map, uniq, orderBy } from 'lodash'

export const capitalizeFirstLetter = str => {
  return str[0].toUpperCase() + str.substr(1)
}

export const getFileExt = (fileName, withDot = false) => {
  if (!fileName || typeof fileName !== 'string') return ''
  const parts = fileName.split('.')
  const ext = parts[parts.length - 1]
  return withDot ? `.${ext}` : ext
}

export const toBase64 = file => new Promise((resolve, reject) => {
  const filename = (file.name || '').split('.').slice(0, -1).join('.')
  const fakeJson = new File([file], `${filename}.json`, {
    type: 'application/json',
    lastModified: new Date(),
  })
  const reader = new FileReader()
  reader.readAsDataURL(fakeJson)
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
})

export const toText = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.addEventListener('load', () => resolve(reader.result), false)
  reader.addEventListener('error', reject, false)
  reader.readAsText(file)
})

export const getOptions = (arr, path) =>
  orderBy(uniq(map(arr, path))).filter(item => item)

export const getValidSvg = src => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(src, 'image/svg+xml')
  return doc.querySelector('parsererror') === null ? doc : null
}

// Замена всех цветов в fill и stroke на currentColor для дальнейшего изменения цвета через CSS
export const setCurrentColor = (svg) => svg.replaceAll(/(fill|stroke)=["']([^none].*?)["']/g, '$1="currentColor"')
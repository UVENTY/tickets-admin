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

export const getOptions = (arr, path) =>
  orderBy(uniq(map(arr, path))).filter(item => item)

export const isValidSvg = src => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(src)
  return doc.querySelector('parsererror') === null
}
export const API_URL = process.env.REACT_APP_API_URL

const SCHEME_PREFIX = 'svg-scheme-'

export const NEW_ITEM_ID = 'create'

export const EMPTY_HALL = {
  en: '',
  address_en: '',
  country: null,
  city: null,
  scheme_blob: null
}


export const USER_ROLES_COLOR = {
  '1': '#2db7f5',
  '2': '#87d068',
  '4': '#f50'
}

export const USER_ROLES = {
  '1': 'User',
  '2': 'Seller',
  '4': 'Admin'
}

export const EMPTY_ARRAY = []
export const EMPTY_OBJECT = {}
export const EMPTY_FUNC = () => {}

export const NON_SEAT_ROW = '-1'

export const DATA_TYPES = [
  {
    value: 'string',
    label: 'String'
  }, {
    value: 'number',
    label: 'Number'
  }, {
    value: 'select',
    label: 'Select'
  }, {
    value: 'checkbox',
    label: 'Checkbox'
  }, {
    value: 'color',
    label: 'Color'
  }, {
    value: 'file',
    label: 'File'
  }
]
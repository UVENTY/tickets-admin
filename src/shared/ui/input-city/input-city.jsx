import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Form, Select, Space } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import cn from 'classnames'
import { mapToOptions } from 'utils/utils'
import s from './input-city.module.scss'
import { isLowerIncludes } from 'api/utils'
import { ClockCircleOutlined, EnterOutlined, PlusOutlined } from '@ant-design/icons'
import { NEW_ITEM_ID } from 'consts'

const createCityOptions = {
  value: NEW_ITEM_ID,
  label: <><PlusOutlined style={{ fontSize: '0.94em' }} /> Create new city</>
}

const   InputCity = forwardRef((props, ref) => {
  const {
    defaultValue = [],
    label = [],
    name = [],
    required,
    rules,
    value = [],
    onChange = () => {},
  } = props

  const [countryState, setCountry] = useState(value[0] || defaultValue[0])
  const [cityState, setCity] = useState(value[1] || defaultValue[1])
  const [citySearch, setCitySearch] = useState('')

  const country = value[0] ?? countryState
  const city = value[1] ?? cityState

  const hasCountry = !!countryState
  const hasCity = !!cityState

  const queryClient = useQueryClient()
  const config = queryClient.getQueryData(['config'])?.options || {}
  const countries = useMemo(() => mapToOptions(config.countries, 'en').sort((a, b) => a.label.localeCompare(b.label)), [config.countries])
  const cities = useMemo(() => {
    const list = country ? mapToOptions(config.cities, 'en', { pick: ['country'] }).filter(item => item.country === country) : []
    return list
  }, [config.cities, country])
  
  const handleChange = useCallback((value, option) => {
    const isCity = !isNaN(Number(value))
    const set = isCity ? setCity : setCountry
    set(value)
    if (!isCity) {
      setCity(null)
      setCitySearch('')
    }
  })

  useEffect(() => onChange([countryState, cityState]), [countryState, cityState])
  
  return (
    <Space.Compact className={s.inputCity}>
      <Form.Item
        label={label[0]}
        className={cn(s.select, { [s.select_full]: !hasCountry })}
        rules={rules}
        required={required}
      >
        <Select
          options={countries}
          onChange={handleChange}
          value={country}
          filterOption={(value, option) => isLowerIncludes(value, option.label)}
          labelRender={label => <><span class={`fi fi-${label.value}`}></span> {label.label}</>}
          optionRender={label => <><span class={`fi fi-${label.value}`}></span> {label.label}</>}
          showSearch
        />
      </Form.Item>
      {hasCountry &&
        <Form.Item
          label={label[1]}
          className={s.select}
          rules={rules}
          required={required}
        >
          <Select
            options={cities}
            onChange={handleChange}
            onSearch={setCitySearch}
            value={city}
            filterOption={(value, option) => isLowerIncludes(value, option.label)}
            showSearch
          />
        </Form.Item>
      }
    </Space.Compact>
  )
})

export default InputCity
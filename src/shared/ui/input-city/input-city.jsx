import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Form, Select, Space } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import classNames from 'classnames'
import { cn as bem } from '@bem-react/classname'
import { mapToOptions } from 'utils/utils'
import { isLowerIncludes } from 'api/utils'
import { ClockCircleOutlined, EnterOutlined, PlusOutlined } from '@ant-design/icons'
import { NEW_ITEM_ID } from 'consts'
import './input-city.scss'

const cn = bem('input-city')

const createCityOptions = {
  value: NEW_ITEM_ID,
  label: <><PlusOutlined style={{ fontSize: '0.94em' }} /> Create new city</>
}

const InputCity = forwardRef((props, ref) => {
  const {
    defaultValue = [],
    label = [],
    form,
    required,
    rules,
    name = ['country', 'city'],
    value = [],
    onChange = () => {},
  } = props
  const [citySearch, setCitySearch] = useState('')

  const country = Form.useWatch(name[0], form)
  const city = Form.useWatch(name[1], form)

  const hasCountry = !!country
  const hasCity = !!city

  const queryClient = useQueryClient()
  const config = queryClient.getQueryData(['config'])?.options || {}
  const countries = useMemo(() => mapToOptions(config.countries, 'en').sort((a, b) => a.label.localeCompare(b.label)), [config.countries])
  const cities = useMemo(() => {
    const list = country ? mapToOptions(config.cities, 'en', { pick: ['country'] }).filter(item => item.country === country) : []
    return list
  }, [config.cities, country])
  
  const handleChange = useCallback((value, option) => {
    const isCity = !isNaN(Number(value))
    if (!isCity) {
      setCitySearch('')
    }
    const result = isCity ? [country, value] : [value, city]
    onChange && onChange(result)
  }, [country, city, onChange])
  
  return (
    <Space.Compact className={cn()}>
      <Form.Item
        name={name[0]}
        label={label[0]}
        className={classNames(cn('select', { full: !hasCountry }))}
        rules={rules}
        required={required}
      >
        <Select
          options={countries}
          // onChange={handleChange}
          filterOption={(value, option) => isLowerIncludes(value, option.label)}
          labelRender={label => <><span class={`fi fi-${label.value}`}></span> {label.label}</>}
          optionRender={label => <><span class={`fi fi-${label.value}`}></span> {label.label}</>}
          showSearch
        />
      </Form.Item>
      {hasCountry &&
        <Form.Item
          name={name[1]}
          label={label[1]}
          className={cn('select')}
          rules={rules}
          required={required}
        >
          <Select
            options={cities}
            // onChange={handleChange}
            onSearch={setCitySearch}
            filterOption={(value, option) => isLowerIncludes(value, option.label)}
            className=''
            showSearch
          />
        </Form.Item>
      }
    </Space.Compact>
  )
})

export default InputCity
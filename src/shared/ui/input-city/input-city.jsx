import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Col, Divider, Form, Input, Modal, Row, Select, Space } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import classNames from 'classnames'
import { cn as bem } from '@bem-react/classname'
import { mapToOptions } from 'utils/utils'
import { getCreatedId, isLowerIncludes } from 'api/utils'
import { ClockCircleOutlined, EnterOutlined, PlusOutlined } from '@ant-design/icons'
import { NEW_ITEM_ID } from 'consts'
import { mutate as layoutMutate } from 'shared/layout'
import './input-city.scss'
import { updateCity } from 'shared/api/data'

const cn = bem('input-city')

const createCityOptions = {
  value: NEW_ITEM_ID,
  label: <><PlusOutlined style={{ fontSize: '0.94em' }} /> Create new city</>
}

const renderWithFlag = label => <><span className={`fi fi-${label.value}`}></span> {label.label}</>
const filterOption = (value, option) => isLowerIncludes(value, option.label)

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
  const cityRef = useRef(null)

  const country = Form.useWatch(name[0], form)
  const city = Form.useWatch(name[1], form)
  const createCity = Form.useWatch(['create', 'city'], form)
  const createCityCountry = Form.useWatch(['create', 'country'], form)
  
  const hasCountry = !!country
  const hasCity = !!city

  const queryClient = useQueryClient()
  const config = queryClient.getQueryData(['config'])?.options || {}
  const countries = useMemo(() => mapToOptions(config.countries, 'en').sort((a, b) => a.label.localeCompare(b.label)), [config.countries])
  const cities = useMemo(() => {
    const list = country ? mapToOptions(config.cities, 'en', { pick: ['country'] }).filter(item => item.country === country) : []
    list.push({
      label: <i><PlusOutlined style={{ transform: 'skew(-14deg, 0)' }} /> Add city</i>,
      value: NEW_ITEM_ID
    })
    return list
  }, [config.cities, country])

  
  const addCity = useMutation({
    mutationKey: ['config', 'cities'],
    mutationFn: updateCity
  })

  /* useEffect(() => {
    form.setFieldValue(name[1], '')
    cityRef.current?.focus()
  }, [country]) */
  
  const handleChange = useCallback((value, option) => {
    const isCity = !isNaN(Number(value))
    if (!isCity) {
      setCitySearch('')
    }
    const result = []// isCity ? [country, value] : [value, city]
    onChange && onChange({ country, value })
  }, [country, city, onChange])  
  
  return (
    <>
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
            filterOption={filterOption}
            labelRender={renderWithFlag}
            optionRender={renderWithFlag}
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
              filterOption={(value, option) => option.value === NEW_ITEM_ID || isLowerIncludes(value, option.label)}
              showSearch
              autoFocus
            />
          </Form.Item>
        }
      </Space.Compact>
      {city === NEW_ITEM_ID && <Modal
        okText='Save'
        okButtonProps={{ loading: addCity.isPending}}
        cancelButtonProps={{ disabled: addCity.isPending }}
        onOk={() => addCity.mutateAsync({ country: createCityCountry, city: createCity }).then(getCreatedId).then(cityId => {
          queryClient.invalidateQueries(['config'])
          console.log(cityId, typeof cityId);
          
          form.setFieldValue(name[1], String(cityId))
        })}
        onClose={() => form.setFieldValue('city', '')}
        onCancel={() => form.setFieldValue('city', '')}
        width={450}
        open
      >
        <div className='modal-title'>Add city</div>
        <Form.Item
          label='Country'
          name={['create', 'country']}
          initialValue={country}
          labelCol={{ span: 4 }}
        >
          <Select
            options={countries}
            filterOption={filterOption}
            labelRender={renderWithFlag}
            optionRender={renderWithFlag}
            showSearch
          />
        </Form.Item>

        <Form.Item
          label='City'
          name={['create', 'city']}
          initialValue={citySearch}
          labelCol={{ span: 4 }}
        >
          <Input
            defaultValue={citySearch}
          />
        </Form.Item>
      </Modal>}
    </>
  )
})

export default InputCity
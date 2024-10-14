import { useCallback, useEffect, useMemo, useState } from 'react'
import { Col, ColorPicker, Form, Input, InputNumber, Row, Select, Switch } from 'antd'
import { cn as bem } from '@bem-react/classname'
import { filterUnique, setCurrentColor } from 'utils/utils'
import InputSvg from 'components/input-svg'
import './seat-form.scss'
import Fieldset from 'shared/ui/fieldset'
import { Link } from 'react-router-dom'

const cn = bem('seat-form')

const SeatFormField = ({ item = {}, values, onChange }) => {
  const { type, seats, name: key } = item
  const isCheckbox = type === 'checkbox'
  const rest = isCheckbox ? {
    checked: values[key],
    onChange: checked => onChange({ [key]: checked })
  } : {
    value: values[key],
    onChange: e => onChange({ [key]: e.currentTarget?.value })
  }
  
  if (isCheckbox) {
    return (
      <label style={{ marginBottom: 20, display: 'block' }}>
        <Switch
          {...rest}
          className='checkbox'
          style={{ marginRight: 10 }}
          onChange={checked => onChange({ [key]: checked })}
        />
        {item.label}
      </label>
    )
  }

  return (
    <Form.Item
      label={item.label}
      initialValue={rest.value}
    >
      {(!type || type === 'string') && <Input {...rest} />}
      {type === 'select' && <Select {...rest} options={item.options || []} />}
      {type === 'number' && <InputNumber {...rest} min={item.min} max={item.max} />}
      {type === 'color' && <ColorPicker {...rest} showText />}
      {type === 'file' && (
        <InputSvg
          {...rest}
          beforeChange={icon => item.originalColor ? icon : setCurrentColor(icon)}
        />
      )}
    </Form.Item>
  )
}


export default function SeatForm(props) {
  const { categories, params, seats, currency, onChange } = props
  const initialValues = useMemo(
    () => [
      { name: 'category' },
      { name: 'row' },
      { name: 'seat' },
      ...params
    ]
      .reduce((acc, seat) => {
        const param = seat.name || seat.value
        if (!param) return acc
        const diff = seats.find(el => el.getAttribute(`data-${param}`) !== seats[0].getAttribute(`data-${param}`))
        acc[param] = diff ? null : seats[0].getAttribute(`data-${param}`)
        return acc
      }, {}),
    [params, seats]
  )
  
  const [values, setValues] = useState(initialValues)
  
  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const handleChange = useCallback((inject) => {
    onChange && onChange(inject)
    setValues(values => ({ ...values, ...inject }))
  }, [onChange])

  const renderOption = category => (
    <>
      <span
        className={cn('category', { color: true })}
        style={{ background: category.data?.color }}
      />
      {category.label}
    </>
  )
  const renderLabel = label => (
    <>
      <span
        className={cn('category', { color: true })}
        style={{ background: categories.find(cat => cat.value === values.category)?.color }}
      />
      {label.label}
    </>
  )
  const isSingle = seats.length === 1

  return (
    <div className={cn()}>
      <Row gutter={20}>
        <Col span={8}>
          <Form.Item label='Price'>
            <InputNumber addonAfter={currency} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label='Category'>
        <Select
          options={categories}
          optionRender={renderOption}
          labelRender={renderLabel}
          value={values.category}
          onChange={category => handleChange({ category })}
        />
      </Form.Item>
      <Row gutter={20}>
        <Col span={12}>
          <Form.Item label='Row'>
            <Input
              disabled={!isSingle}
              value={values.row}
              onChange={e => handleChange({ row: e.currentTarget.value })}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label='Ticket price'>
            <Input
              disabled={!isSingle}
              value={values.seat}
              onChange={e => handleChange({ seat: e.currentTarget.value })}
            />
          </Form.Item>
        </Col>
      </Row>
      {params.map((item, i) => <SeatFormField
        key={i}
        item={item}
        values={values}
        onChange={handleChange}
      />)}
    </div>
  )
}
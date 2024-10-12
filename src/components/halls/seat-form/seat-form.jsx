import { useCallback, useEffect, useMemo, useState } from 'react'
import { Col, ColorPicker, Form, Input, InputNumber, Row, Select, Switch } from 'antd'
import { cn as bem } from '@bem-react/classname'
import { filterUnique, setCurrentColor } from 'utils/utils'
import InputSvg from 'components/input-svg'
import './seat-form.scss'

const cn = bem('seat-form')

const renderField = (field, { values, onChange }) => {
  
}

export default function SeatForm(props) {
  const { categories, params, seats, onChange } = props
  const initialValues = useMemo(() => [
    { value: 'category' }, { value: 'row' }, { value: 'seat' }, ...params
  ].reduce((acc, { value: param }) => {
    if (!param) return acc
    const diff = seats.find(el => el.getAttribute(`data-${param}`) !== seats[0].getAttribute(`data-${param}`))
    acc[param.value || param] = diff ? null : seats[0].getAttribute(`data-${param}`)
    return acc
  }, {}), [params, seats])
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
          <Form.Item label='Seat'>
            <Input
              disabled={!isSingle}
              value={values.seat}
              onChange={e => handleChange({ seat: e.currentTarget.value })}
            />
          </Form.Item>
        </Col>
      </Row>
      {params.map(item => renderField(item, { values, onChange: handleChange }))}
    </div>
  )
}
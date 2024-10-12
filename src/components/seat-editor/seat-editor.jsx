import { useCallback, useEffect, useMemo, useState } from 'react'
import { Col, ColorPicker, Form, Input, InputNumber, Row, Select, Switch } from 'antd'
import { cn as bem } from '@bem-react/classname'
import { filterUnique, setCurrentColor } from 'utils/utils'
import InputSvg from 'components/input-svg'
import './seat-editor.scss'

const cn = bem('seat-editor')

const renderField = (field, { values, onChange }) => {
  const { type, seats } = field
  const isCheckbox = type === 'checkbox'
  const rest = isCheckbox ? {
    checked: values[field.value],
    onChange: checked => onChange({ [field.value]: checked })
  } : {
    value: values[field.value],
    onChange: e => onChange({ [field.value]: e.currentTarget?.value })
  }
  
  if (isCheckbox) {
    return (<label>
      <Switch
        {...rest}
        className='checkbox'
        style={{ marginRight: 10 }}
        onChange={checked => onChange({ [field.value]: checked })}
      />
      {field.label}
    </label>)
  }

  return (
    <Form.Item label={cn('label')} initialValue={rest.value}>
      {!isCheckbox && <label className={cn('label-checkbox')}>{field.label}</label>}
      {!type && <Input {...rest} />}
      {type === 'select' && <Select {...rest} options={field.options || []} />}
      {type === 'number' && <InputNumber {...rest} min={field.min} max={field.max} />}
      {type === 'color' && <ColorPicker {...rest} showText />}
      {type === 'file' && (
        <InputSvg
          {...rest}
          beforeChange={icon => field.originalColor ? icon : setCurrentColor(icon)}
        />
      )}
    </Form.Item>
  )
}

export default function SeatEditor(props) {
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
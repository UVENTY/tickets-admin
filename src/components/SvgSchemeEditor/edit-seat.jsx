import { Fragment, useCallback, useEffect, useState } from 'react'
import { Button, Card, Checkbox, Flex, Input, Select, Typography, Upload } from 'antd'
import cn from 'classnames'
import InputSvg from '../InputSvg'
import s from './svg-scheme-editor.module.scss'
import { setCurrentColor } from '../../utils/utils'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { Title } = Typography


export default function SvgSchemeEditSeat({
  categories = [],
  fields = [],
  values = {},
  onOk,
  onCancel,
  onChange
}) {
  const [ changedValues, setChangedValue ] = useState({})
  const { category, row, seat } = values

  useEffect(() => {
    onChange && onChange(changedValues)
  }, [changedValues])

  return (
    <Card
      className={s.edit}
      title={<Title level={4} style={{ margin: 0 }}>{row && seat ? <>Row <b>{row}</b>, seat <b>{seat}</b></> : `Category ${category?.label}`}</Title>}
    >
      <label className={s.label}>Category</label>
      <Select
        options={categories}
        defaultValue={category}
        onChange={value => setChangedValue({ ...changedValues, category: value })}
        labelRender={({ value }) => {
          const item = categories.find(c => c.value === value)
          return (
            <Flex gap={8} align='center' className={s.catOption}>
            {!item?.icon ? 
              <div className={cn(s.catOptionIcon, `svg-scheme-bg-cat-${item?.value}`)} /> :
              <div className={cn(s.catOptionIcon, `svg-scheme-icon-cat-${item?.value}`)} dangerouslySetInnerHTML={{ __html: item?.icon }} />
            }
            <div>{item?.label}</div>
          </Flex>)
        }}
        optionRender={({ data }) =>
          <Flex gap={8} align='center' className={s.catOption}>
            {!data?.icon ? 
              <div className={cn(s.catOptionIcon, `svg-scheme-bg-cat-${data?.value}`)} /> :
              <div className={cn(s.catOptionIcon, `svg-scheme-icon-cat-${data?.value}`)} dangerouslySetInnerHTML={{ __html: data?.icon }} />
            }
            <div>{data?.label}</div>
          </Flex>}
      />
      <Flex className={s.row3} gap={20}>
        {!!row && <div>
          <label className={s.label}>Row</label>
          <Input defaultValue={row} disabled />
        </div>}
        {!!seat && <div>
          <label className={s.label}>Seat</label>
          <Input defaultValue={seat} disabled />
        </div>}
        <div>
          <label className={s.label}>Icon</label>
          <InputSvg
            defaultValue={values.icon}
            onChange={icon => setChangedValue({ ...changedValues, icon })}
            svgClassName={`svg-scheme-icon-cat-${changedValues.category || category}`}
            beforeChange={icon => setCurrentColor(icon)}
          />
        </div>
      </Flex>
      {fields.filter(f => !['seat', 'icon', 'row'].includes(f.value)).map(field => {
        const rest = {
          onChange: value => setChangedValue({ ...changedValues, [field.value]: value?.target ? (value.target?.value || value.target?.checked) : value }),
        }
        const isCheckbox = field.type === 'checkbox'
        if (isCheckbox) rest.defaultChecked = values[field.value]
        else rest.defaultValue = values[field.value]
        return (
          <Fragment key={field.value}>
            {!isCheckbox && <label className={s.label}>{field.label}</label>}
            {!field.type && <Input {...rest} />}
            {field.type === 'select' && <Select {...rest} options={field.options || []} />}
            {isCheckbox && <Checkbox className={s.checkbox} {...rest}>{field.label}</Checkbox>}
            {field.type === 'file' && (
              field.accept === '.svg' ? <InputSvg {...rest} /> : <Upload accept={field.accept} itemRender={() => null} />
            )}
          </Fragment>
        )
      })}
      <Flex gap={16} style={{ marginTop: 20 }}>
        <Button type='primary' icon={<ArrowLeftOutlined />} size='large' ghost onClick={() => onOk && onOk(changedValues)} style={{ flex: '1 1 0' }}>
          Back
        </Button>
      </Flex>
    </Card>
  )
}
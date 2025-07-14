import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Card, Checkbox, ColorPicker, Flex, Input, InputNumber, Select, Typography, Upload } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import { mapValues } from 'lodash'
import cn from 'classnames'
import InputSvg from '../InputSvg'
import s from './svg-scheme-editor.module.scss'
import { axios } from '../../api/axios'
import { downloadBlob, setCurrentColor } from '../../utils/utils'
import { API_URL } from '../../consts'
import { getTicketPdf } from '../../api/tickets/request'

const { Title } = Typography

const isArray = val => (ifTrue, ifFalse = val) => Array.isArray(val) ? ifTrue : ifFalse

export default function SvgSchemeEditSeat({
  tickets = [],
  categories = [],
  fields = [],
  seats = [],
  onOk,
  onChange
}) {
  const formRef = useRef()
  const [ changedValues, setChangedValue ] = useState({})
  
  const handleChange = (name, value) => setChangedValue(prev => {
    const changed = { ...prev, [name]: value}
    onChange && onChange(changed)
    return changed
  })

  const fieldsToShow = useMemo(() => fields.filter(f => seats.length > 1 ? f.groupEditable : true), [seats, fields])

  const seatsData = useMemo(() => seats.map(seat => Object.assign({}, seat.dataset)), [seats])

  const values = useMemo(() => mapValues(
    seats.reduce((acc, el) => {
      const data = Object.assign({}, el.dataset)
      const keys = ['category'].concat(fieldsToShow.map(f => f.value))
      keys.forEach(field => {
        const val = data[field] || null
        if (!acc[field]) acc[field] = [val]
        else if (!acc[field].includes(val)) acc[field].push(val)
      })
      return acc
    }, {}),
    val => val.length <= 1 ? (val[0] || null) : val
  ), [seats, fieldsToShow])

  const { disabled, category, row, seat, price, count, busyCount } = values
  
  const isDisabled = disabled === 'true'
  const ticket = tickets.find(item => String(item.section) === String(category) && (String(item.row) === '-1' || (String(item.row) === String(row) && String(item.seat) === String(seat))))

  // --- вычисление значений для инпутов ---
  let inputPrice = '';
  let inputCount = '';
  let inputBusyCount = '';
  let groupPrice = '';
  if (seats.length === 1) {
    const seat = seats[0];
    // Сначала ищем индивидуальный билет
    let ticket = tickets.find(
      t => String(t.section) === String(seat.dataset.category)
        && String(t.row) === String(seat.dataset.row)
        && String(t.seat) === String(seat.dataset.seat)
    );
    // Если не нашли — ищем по категории (row === -1)
    if (!ticket) {
      ticket = tickets.find(
        t => String(t.section) === String(seat.dataset.category)
          && String(t.row) === '-1'
      );
    }
    if (ticket) {
      inputPrice = typeof ticket.price === 'number' ? ticket.price : '';
      inputCount = typeof ticket.count === 'number' ? ticket.count : '';
      inputBusyCount = typeof ticket.busyCount === 'number' ? ticket.busyCount : '';
    }
  }
  if (seats.length > 1) {
    const prices = seats.map(seat => {
      const ticket = tickets.find(
        t => String(t.section) === String(seat.dataset.category)
          && String(t.row) === String(seat.dataset.row)
          && String(t.seat) === String(seat.dataset.seat)
      ) || tickets.find(
        t => String(t.section) === String(seat.dataset.category)
          && String(t.row) === '-1'
      );
      return typeof ticket?.price === 'number' ? ticket.price : undefined;
    });
    const uniquePrices = Array.from(new Set(prices.filter(p => typeof p === 'number')));
    if (uniquePrices.length === 1) groupPrice = uniquePrices[0];
  }
  return (
    <Card
      className={s.edit}
      title={<Title level={4} style={{ margin: 0 }}>
        {seats.length === 1 && (row && seat ? <>Row <b>{row}</b>, seat <b>{seat}</b></> : `Category ${category?.label}`)}
        {seats.length > 1 && `Edit ${seats.length} seats`}
      </Title>}
    >
      <label className={s.label}>Category</label>
      <Select
        options={categories}
        placeholder={isArray(category)('Multiple categories')}
        defaultValue={isArray(category)(null)}
        onChange={value => handleChange('category', value)}
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
          <Input value={row ?? ''} disabled />
        </div>}
        {!!seat && <div>
          <label className={s.label}>Seat</label>
          <Input value={seat ?? ''} disabled />
        </div>}
        {!row && !seat && <>
          <div>
            <label className={s.label}>Booking / sold</label>
            <InputNumber value={seats.length === 1 ? inputBusyCount : (typeof busyCount === 'number' ? busyCount : '')} style={{ width: '100%' }} disabled />
          </div>
          <div>
            <label className={s.label}>Tickets leave</label>
            <InputNumber value={seats.length === 1 ? inputCount : (typeof count === 'number' ? count : '')} style={{ width: '100%' }} onChange={value => handleChange('count', value)} />
          </div>
        </>}
        <div>
          <label className={s.label}>Price</label>
          <InputNumber value={seats.length === 1 ? inputPrice : groupPrice} onChange={value => handleChange('price', value)} disabled={isDisabled} />
        </div>
      </Flex>
      {fieldsToShow.filter(f => !['seat', 'row', 'price', 'count', 'busyCount'].includes(f.value)).map(field => {
        const isCheckbox = field.type === 'checkbox'
        const rest = {
          onChange: (val) => val && handleChange(field.value, isCheckbox ? val.target?.checked : (val.target?.value || val)),
        }
        const isArrayField = isArray(values[field.value])
        if (isCheckbox) {
          rest.checked = isArrayField(false, values[field.value] === true)
          rest.indeterminate = isArrayField(true, undefined)
        } else {
          rest.value = typeof values[field.value] === 'number' || typeof values[field.value] === 'string' ? values[field.value] : ''
          rest.placeholder = isArrayField('Multiple values', '')
        }
        return (
          <Fragment key={field.value}>
            {!isCheckbox && <label className={s.label}>{field.label}</label>}
            {!field.type && <Input {...rest} />}
            {field.type === 'select' && <Select {...rest} options={field.options || []} />}
            {field.type === 'number' && <InputNumber {...rest} min={field.min} max={field.max} />}
            {field.type === 'color' && <ColorPicker {...rest} showText />}
            {isCheckbox && <Checkbox className={s.checkbox} {...rest}>{field.label}</Checkbox>}
            {field.type === 'file' && (
      /*         field.accept === '.svg' ? */
              <div className={`svg-scheme-icon-cat-${category}`}>
                <InputSvg
                  {...rest}
                  beforeChange={icon => field.originalColor ? icon : setCurrentColor(icon)}
                />
              </div>/*  :
              <Upload accept={field.accept} itemRender={() => null} /> */
            )}
          </Fragment>
        )
      })}
      {seats.length === 1 && !!ticket && !!row &&
        <Flex gap={16} style={{ marginTop: 20 }}>
          <Button type='primary' icon={<DownloadOutlined />} size='large' onClick={async () => {
            const pdf = await getTicketPdf({ t_id: ticket.fuckingTrip, seat: ticket.fullSeat })
            downloadBlob(pdf, 'ticket.pdf')
          }}>
            Download pdf
          </Button>
        </Flex>
      }
      <Flex gap={16} style={{ marginTop: 20 }}>
        <Button type='primary' icon={<ArrowLeftOutlined />} size='large' ghost onClick={() => onOk && onOk(changedValues)} style={{ flex: '1 1 0' }}>
          Back
        </Button>
      </Flex>
    </Card>
  )
}
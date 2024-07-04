
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Upload, Input, Typography, ColorPicker, Flex, Select, Form, Space } from 'antd'
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { clearFillAndStringify, getCategories, transformScheme } from './utils'
import { EMPTY_ARRAY, EMPTY_FUNC, NON_SEAT_ROW } from '../../consts'
import SvgScheme from '../SvgScheme'
import s from './svg-scheme-editor.module.scss'
import axios from 'axios'
import SvgSchemeSeatPreview from '../SvgScheme/preview'
import SvgSchemeEditSeat from './edit-seat'
import { getValidSvg, isMacintosh, renderHiddenHTML, setCurrentColor, toText } from '../../utils/utils'
import FieldForm from './field-form'

const { Title } = Typography

const seatClassName = 'svg-seat'
const activeSeatClassName = 'active'

const defaultCustomProps = [
  {
    value: 'row',
    label: 'Row'
  }, {
    value: 'seat',
    label: 'Seat'
  }, {
    value: 'count',
    label: 'Tickets leave',
    type: 'number',
  }, {
    value: 'busyCount',
    label: 'Booking / Sold',
    type: 'number',
  }, {
    value: 'price',
    label: 'Price',
    type: 'number',
    groupEditable: true,
    system: true
  }, {
    value: 'icon',
    label: 'Place Icon',
    type: 'file',
    accept: '.svg',
    originalColors: false,
    groupEditable: true
  }, {
    value: 'text',
    label: 'Text',
    groupEditable: true
  }, {
    value: 'disabled',
    label: 'Disabled',
    type: 'checkbox',
    groupEditable: true
  }
]

const getSelectionKey = selected => {
  const key = selected.map(el => `${el.getAttribute('data-row')}-${el.getAttribute('data-seat')}`).join('_')
  return key
}

const isMac = isMacintosh()

const labelClass = 'ant-col ant-form-item-label'

export default function SvgSchemeEditor({ value, onChange, tickets, onTicketsChange = EMPTY_FUNC}) {
  const [ categories, setCategories ] = useState(value?.categories || EMPTY_ARRAY)
  const [ customProps, setCustomProps ] = useState(value?.customProps || defaultCustomProps)
  const [ scheme, setScheme ] = useState(value?.scheme || '')
  const [ selectedSeats, setSelectedSeats ] = useState([])
  const [ editProp, setEditProp ] = useState('categories')
  const svgRef = useRef()

  useEffect(() => {
    if (typeof value === 'string' && value?.startsWith('http')) {
      axios.get(value).then(({ data }) => {
        const svg = renderHiddenHTML(data.scheme)
        if (!svg) return
        const nonSeatCount = {}
        tickets.forEach(({ section, row, seat, price, is_sold, is_reserved }) => {
          if (row === NON_SEAT_ROW) {
            const key = is_sold || is_reserved ? 'busyCount' : 'count'
            nonSeatCount[section] = (nonSeatCount[section] || {})
            nonSeatCount[section][key] = (nonSeatCount[section][key] || 0) + 1
            if (!nonSeatCount[section].price) nonSeatCount[section].price = price
            return
          }
          svg.querySelector(`.${seatClassName}[data-row="${row}"][data-seat="${seat}"]`)?.setAttribute('data-price', price)
        })
        Object.entries(nonSeatCount).map(([ key, value ]) => {
          const el = svg.querySelector(`.${seatClassName}[data-category="${key}"]`)
          el?.setAttribute('data-price', value.price || 0)
          el?.setAttribute('data-count', value.count || 0)
          el?.setAttribute('data-busyCount', value.busyCount || 0)
        })
        const s = new XMLSerializer();
        setScheme(s.serializeToString(svg))
        setCategories(data.categories)
        
        // Первые билеты создавались без цены, для таких вручную добавляем это поле
        // Вообще, скорее всего, уже все билеты давно с ценой. Проверить и удалить блок
        if (!data.customProps.find(prop => prop.value == 'count')) {
          data.customProps = [ ...data.customProps.slice(0, 2), {
            value: 'count',
            label: 'Tickets leave',
            type: 'number',
          }, {
            value: 'busyCount',
            label: 'Booking / Sold',
            type: 'number',
          }, ...data.customProps.slice(2)]
        }
        setCustomProps(data.customProps)
        document.body.removeChild(svg.parentNode)
      })
    }
  }, [])

  useEffect(() => onChange({
    categories,
    customProps,
    scheme,
  }), [scheme, categories, customProps])

  useEffect(() => {
    svgRef.current.querySelectorAll(`.${seatClassName}.${activeSeatClassName}`).forEach(el => el.classList.remove(activeSeatClassName))
    selectedSeats.forEach(el => el.classList.add(activeSeatClassName))
  }, [selectedSeats])

  const handleChangeCategory = useCallback((index, key, value) => {
    setCategories(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))
  }, [setCategories])

  const deleteCategory = useCallback((value) => {
    if (svgRef.current) {
      Array.from(svgRef.current.querySelectorAll(`.${seatClassName}[data-category="${value}"]`))
        .forEach(el => el.removeAttribute('data-category'))
    }
    setCategories(prev => prev.filter((cat) => cat.value !== value))
  }, [setCategories, svgRef.current])

  const toggleSelect = ({ detail, target: el, ctrlKey, metaKey }) => {
    const isDoubleClick = detail > 1
    setSelectedSeats(prev => {
      if (isDoubleClick) {
        const cat = el.getAttribute('data-category')
        const group = Array.from(svgRef.current.querySelectorAll(`.${seatClassName}[data-category="${cat}"]`))
        const isFullIncludes = group.every(el => prev.includes(el))
        return ctrlKey || metaKey ? 
          (isFullIncludes ? prev.filter(el => !group.includes(el)) : prev.filter(el => !group.includes(el)).concat(group)) :
          group
      }
      if (ctrlKey || metaKey) {
        return prev.includes(el) ? prev.filter(item => item !== el) : [...prev, el] 
      }
      return prev.length === 1 ? (prev[0] === el ? [] : [el]) : [el]
    })
  }

  const changeSelected = (values) => {
    const changesMap = {}
    setSelectedSeats(prev => prev.map(el => {
      // Вытаскиваем цену из свг для сохранения в бд. Атрибут с ценой перед сохранением удаляем
      if (values.price || values.count) {
        const [cat, seat, row] = ['category', 'seat', 'row'].map(key => el.getAttribute(`data-${key}`))
        if (!seat && !row) {
          changesMap[cat] = values
        } else if (values.price) {
          const key = [cat, row, seat].filter(Boolean).join(';')
          changesMap[key] = values.price
        }
      }
      Object.entries(values).forEach(([key, value]) => value ?
        el.setAttribute(`data-${key}`, value) :
        el.removeAttribute(`data-${key}`)
      )
      return el
    }))
    if (Object.keys(changesMap).length) onTicketsChange(changesMap)
    updateFromSvg()
  }

  const updateFromSvg = (cb) => {
    const node = svgRef.current.cloneNode(true)
    node.querySelectorAll(`.${seatClassName}[data-price]`).forEach(el => el.removeAttribute('data-price'))
    node.querySelectorAll(`.${seatClassName}[data-count]`).forEach(el => el.removeAttribute('data-count'))
    node.querySelectorAll(`.${seatClassName}.${activeSeatClassName}`).forEach(el => el.classList.remove(activeSeatClassName))
    setScheme(node.innerHTML)
    cb && cb(null)
  }

  const propOptions = useMemo(() => ([
    { value: 'categories', label: 'Categories' },
    ...customProps
  ]), [customProps])

  const activeProp = editProp === 'new' ?
    { isNewField: true } :
    customProps.find(({ value }) => value == editProp)
  
  return (
    <Flex className={s.form}>
      <div className={s.scheme}>
        <div className={labelClass}>Seating plan</div>
        {!scheme && <Upload
          accept='.svg'
          itemRender={() => null}
          customRequest={e => toText(e.file)
            .then(transformScheme)
            .then(scheme => ({ categories: getCategories(scheme), scheme: clearFillAndStringify(scheme) }))
            .then(({ categories, scheme }) => {
              setScheme(scheme)
              setCategories(categories)
              setCustomProps(defaultCustomProps)
            })}
        >
          <Button size='large' type='primary' htmlType='button' icon={<UploadOutlined />}>Upload from svg</Button>
        </Upload>}
        <div className={s.root}>
          {!!scheme && <Button
            size='large'
            type='primary'
            htmlType='button'
            icon={<DeleteOutlined />}
            onClick={() => {
              setScheme(null)
              setCategories([])
              setCustomProps([])
            }}
            style={{
              zIndex: 100,
              position: 'absolute',
              left: 10,
              top: 10
            }}
            danger
          />}
          <SvgScheme
            categories={categories}
            src={scheme}
            ref={svgRef}
            onSeatClick={toggleSelect}
            onSeatDoubleClick={toggleSelect}
            tooltip={data => {
              const ticket = tickets.find(t => t.section === data.category && t.row === data.row && `${t.seat}` === `${data.seat}`)
              return (
                <SvgSchemeSeatPreview
                  className={s.preview}
                  categories={categories}
                  {...data}
                  footer={<div className={s.previewFooter}>
                    {!!ticket &&<div className={s.previewQr}>
                      <b>QR-code</b><br />
                      {ticket.code_qr_base64 ? <img src={ticket?.code_qr_base64} alt='QR-code' /> : 'would generated after next save'}
                    </div>}
                    <div className={s.previewActions}>
                      <div><b>Click</b> to edit seat</div>
                      {selectedSeats.length > 0 && <div><b>{isMac ? '⌘' : 'Ctrl'} + click</b> to add to edit list</div>}
                      <div><b>Double click</b> to edit all seats with the same category</div>
                    </div>
                  </div>}
                />
              )
            }}
          />
        </div>
      </div>
      <div className={s.params}>
        {!!scheme && selectedSeats.length > 0 && <>
          <div className={labelClass}>Seating properties</div>
          <SvgSchemeEditSeat
            key={getSelectionKey(selectedSeats)}
            categories={categories}
            seats={selectedSeats}
            fields={customProps}
            onOk={() => updateFromSvg(() => setSelectedSeats([]))}
            onChange={changeSelected}
          />
        </>}
        {!!scheme && !selectedSeats.length && <>
          <div className={labelClass}>Available seating settings</div>
          <Space.Compact style={{ display: 'flex' }}>
            <Select
              size='large'
              value={editProp}
              onChange={setEditProp}
              options={propOptions.filter(({ value }) => !['row', 'seat', 'count', 'count_sold'].includes(value)).map(({ label, value }) => ({ label, value }))}
              disabled={editProp === 'new'}
            />
            <Button
              size='large'
              type='primary'
              style={{ background: '#fff' }}
              onClick={() => {
                setEditProp('new')
              }}
              disabled={editProp === 'new'}
              ghost
            >
              <PlusOutlined /> Add option
            </Button>
          </Space.Compact>
          {editProp === 'categories' ?
            <Card>
              <Title level={5} className={s.title}>Options</Title>
              <Flex gap={16} wrap>
                {categories.map((item, i) => (
                  <Flex gap={8} key={item.value} className={s.catItem} align='center'>
                    {!item.icon ?
                      <Upload
                        accept='.svg'
                        itemRender={() => null}
                        customRequest={e => toText(e.file).then(setCurrentColor).then(icon => handleChangeCategory(i, 'icon', icon))}
                      >
                        <Button className={s.addIcon} type='dashed' shape='circle'><UploadOutlined /><div>Icon</div></Button>
                      </Upload> :
                      <Flex
                        className={s.catIcon}
                        align='center'
                        justify='center'
                        title='Clear Icon'
                        style={{ color: item.color }}
                        onClick={() => handleChangeCategory(i, 'icon', null)}
                        dangerouslySetInnerHTML={{ __html: item.icon }}
                      />
                    }
                    <Input
                      placeholder='Label'
                      defaultValue={item.label}
                      className={s.catName}
                      onBlur={e => handleChangeCategory(i, 'label', e.target.value)}
                    />
                    <ColorPicker
                      defaultValue={item.color}
                      onChangeComplete={(color) => handleChangeCategory(i, 'color', `#${color.toHex()}`)}
                      className={s.catColor}
                      showText
                    />
                    <Button className={s.deleteCat} icon={<DeleteOutlined />} onClick={() => deleteCategory(item.value)} danger />
                  </Flex>
                ))}
              </Flex>
              <Button type='dashed' className={s.addCat} onClick={() => setCategories([...categories, { value: `cat${categories.length + 1}`, label: '', icon: null, color: '#000' }])} block>
                <PlusOutlined /> Add category
              </Button>
            </Card> :
            <FieldForm
              key={activeProp.value}
              {...activeProp}
              onCreate={values => {
                setCustomProps(prev => ([ ...prev, values ]))
                setEditProp(values.value)
              }}
              onCancel={() => setEditProp('categories')}
              onChange={(name, value) => editProp !== 'new' && setCustomProps(prev => {
                const index = prev.findIndex(({ value }) => value === activeProp.value)
                if (index > -1) {
                  const newProps = [ ...prev ]
                  newProps[index] = { ...activeProp, [name]: value }
                  return newProps
                }
                return prev
              })}
              onDelete={value => {
                setEditProp('categories')
                setCustomProps(prev => prev.filter(item => item.value !== value))
              }}
            />
          }
        </>}
      </div>
    </Flex>
  )
}

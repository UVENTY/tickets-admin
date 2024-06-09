
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Card, Upload, Input, Typography, ColorPicker, Flex } from 'antd'
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { clearFillAndStringify, getCategories, transformScheme } from './utils'
import { EMPTY_ARRAY } from '../../consts'
import SvgScheme from '../SvgScheme'
import s from './svg-scheme-editor.module.scss'
import axios from 'axios'
import SvgSchemeTooltop from '../SvgScheme/tooltip'
import SvgSchemeSeatPreview from '../SvgScheme/preview'
import SvgSchemeEditSeat from './edit-seat'
import { setCurrentColor, toText } from '../../utils/utils'
import { omit } from 'lodash'

const { Title } = Typography

const defaultCustomProps = [
  {
    value: 'row',
    label: 'Row'
  }, {
    value: 'seat',
    label: 'Seat'
  }, {
    value: 'icon',
    label: 'Place Icon',
    type: 'file',
    accept: '.svg'
  }, {
    value: 'text',
    label: 'Text',
  }, {
    value: 'disabled',
    label: 'Disabled',
    type: 'checkbox'
  }
]

const getSeatData = (el) => {
  if (!(el instanceof Element)) return {}
  return Object.assign({}, el.dataset)
}

export default function SvgSchemeEditor({ value, onChange }) {
  const [ categories, setCategories ] = useState(value.categories || EMPTY_ARRAY)
  const [ customProps, setCustomProps ] = useState(value.customProps || defaultCustomProps)
  const [ scheme, setScheme ] = useState(value.scheme || '')
  const [ editingSeat, setEditingSeat ] = useState(null)
  const [ tooltipSeat, setTooltipSeat ] = useState(null)
  const svgRef = useRef()

  useEffect(() => {
    if (typeof value === 'string' && value.startsWith('http')) {
      axios.get(value).then(({ data }) => {
        setScheme(data.scheme)
        setCategories(data.categories)
        setCustomProps(data.customProps)
      })
    }
  }, [])

  useEffect(() => onChange({
    categories,
    customProps,
    scheme,
  }), [scheme, categories, customProps])

  const handleChangeCategory = useCallback((index, key, value) => {
    setCategories(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))
  }, [setCategories])

  const deleteCategory = useCallback((value) => {
    if (svgRef.current) {
      Array.from(svgRef.current.querySelectorAll(`*[data-category="${value}"]`))
        .forEach(el => {
          el.setAttribute('fill', '#000')
          el.removeAttribute('data-category')
      })
    }
    setCategories(prev => prev.filter((cat) => cat.value !== value))
  }, [setCategories, svgRef.current])

  const editSeat = useCallback((e) => {
    const { target: el } = e
    if (editingSeat && editingSeat !== el) {
      updateFromSvg(() => setEditingSeat(null))
    }
    setEditingSeat(el)
  }, [editingSeat])

  const handleChangeSeat = useCallback((values) => {
    const data = { ...getSeatData(tooltipSeat), ...values }
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        editingSeat.setAttribute(`data-${key}`, value)
      } else {
        editingSeat.removeAttribute(`data-${key}`)
      }
    })
  }, [editingSeat])

  const updateFromSvg = useCallback((cb) => {
    setScheme(svgRef.current.innerHTML)
    cb && cb(null)
  }, [svgRef.current])

  const showTooltop = useCallback((e) => setTooltipSeat(e.target), [])
  const hideTooltip = useCallback(() => setTooltipSeat(null), [])

  return (
    <div>
      <Flex gap={24}>
        <Upload
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
          <Button size='large' type='primary' ghost icon={<UploadOutlined />}>Upload{!scheme ? ' ' : ' new '}scheme</Button>
        </Upload>
        {!!scheme && <Button
          size='large'
          icon={<DeleteOutlined />}
          onClick={() => {
            setScheme(null)
            setCategories([])
            setCustomProps([])
          }}
          danger
        >
          Delete scheme
        </Button>}
      </Flex>
      <Flex className={s.form}>
        <div className={s.scheme}>
          <SvgSchemeTooltop
            for={tooltipSeat}
          >
            <SvgSchemeSeatPreview
              className={s.preview}
              {...getSeatData(tooltipSeat)}
              categories={categories}
              price='16$'
              footer={<div className={s.previewFooter}>
                <div>Click to edit seat</div>
                {/* <div>Double click to edit category</div> */}
              </div>}
            />
          </SvgSchemeTooltop>
          <SvgScheme
            categories={categories}
            src={scheme}
            ref={svgRef}
            onSeatClick={editSeat}
            onSeatOver={showTooltop}
            onSeatOut={hideTooltip}
          />
        </div>
        <div className={s.params}>
          {!!scheme && !!editingSeat && <>
            <SvgSchemeEditSeat
              key={editingSeat && `${editingSeat.getAttribute('data-row')}-${editingSeat.getAttribute('data-seat')}`}
              categories={categories}
              values={getSeatData(editingSeat)}
              fields={customProps}
              onOk={seat => {
                handleChangeSeat(seat)
                updateFromSvg(() => setEditingSeat(null))
              }}
              onChange={handleChangeSeat}
              onCancel={() => setEditingSeat(null)}
            />
          </>}
          {!!scheme && !editingSeat && <>
            <Card
              title={<Title level={4} style={{ margin: 0 }}>Categories</Title>}
            >
              <Flex gap={16} wrap>
                {categories.map((item, i) => (
                  <Flex gap={8} key={item.value} align='center' className={s.catItem}>
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
            </Card>
          </>}
        </div>
      </Flex>
    </div>
  )
}

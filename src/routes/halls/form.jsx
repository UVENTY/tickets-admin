import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import classNames from 'classnames'
import { pick } from 'lodash'
import { BarsOutlined, BorderBottomOutlined, BorderTopOutlined, CheckCircleOutlined, CheckSquareOutlined, ClearOutlined, ClockCircleFilled, ControlOutlined, EnvironmentOutlined, InboxOutlined, InsertRowAboveOutlined, PlusOutlined, RedoOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'
import { Typography, Button, Col, Descriptions, Divider, Flex, Form, Input, Modal, Row, Segmented, Select, Space, Steps, Table, Upload } from 'antd'
import { useAppState } from 'shared/contexts'
import { jsonBase64, toBase64, toText } from 'utils/utils'
import { defaultSeatParams, findSeatElement, getCategories, isEqualSeats, removeColorsAndSerialize, transformScheme } from 'utils/svg'
import { activeSeatClassName, seatClassName } from 'components/SvgSchemeEditor/consts'
import SvgScheme from 'components/svg-scheme'
import Categories, { Category } from 'components/SvgSchemeEditor/categories'
import { clearFillAndStringify } from 'components/SvgSchemeEditor/utils'
import { SortableList } from 'components/sortable-list'
import { DATA_TYPES, NEW_ITEM_ID, NON_SEAT_ROW } from 'consts'
import InputCity from 'shared/ui/input-city'
import { useLocalStorage } from 'utils/hooks'
import cache from 'shared/api/cache'
import Fieldset from 'shared/ui/fieldset'
import SeatEditor from 'components/seat-editor'
import SeatProperty from 'components/seat-property'
import { axios } from 'api/axios'
import { query, updateData } from './api'
import { useQuery } from '@tanstack/react-query'

const getEmptyCategory = (categories) => ({
  id: `cat${categories.length + 1}`,
  value: `cat${categories.length + 1}`,
  label: '',
  icon: null,
  color: '#000'
})


function SchemeTooltip(props) {
  const { category = {}, seat, row } = props

  const items = [{
    key: 'cat',
    label: <span className='scheme-tooltip-category' style={{ background: category.color }} />,
    children: <span className='scheme-tooltip-label'>{category.label}</span>
  }]

  return <div className='scheme-tooltip' style={{ borderColor: category.color }}>
    <b>{category.label}</b>
    {!!row && <div>
      <small>row</small> <b>{row}</b>, <small>seat</small> <b>{seat}</b>
    </div>}
  </div>
}

export default function HallForm({ form, schemeFile }) {
  const svgRef = useRef(null)
  const { hall_id } = useParams()
  const [{ langCode }] = useAppState()
  // const [selectHover, setSelectHover] = useState(false)
  const [scheme, setScheme] = useState({ categories: [], seatParams: defaultSeatParams, scheme: '' })
  const [selectedSeats, setSelectedSeats] = useState([])
  const [showSeatsEdit, setShowSeatsEdit] = useState(false)
  const [editSeatParams, setEditSeatParams] = useState(null)
  const [editSeatIndex, setEditSeatIndex] = useState(null)

  const schemeJson = useQuery({
    queryKey: ['scheme', hall_id],
    queryFn: () => axios.get(schemeFile).then(res => res.data),
    enabled: !!schemeFile && hall_id !== 'create'
  })

  useEffect(() => {
    if (!schemeJson.data) return
    setScheme({
      ...schemeJson.data,
      categories: schemeJson.data.categories?.map((item, i) => ({ id: i + 1, ...item})),
      seatParams: schemeJson.data.customProps
    })
  }, [schemeJson.data])
  
  const handleChangeCategory = useCallback((index, key, value) => {
    setScheme(prev => ({ ...prev, categories: prev.categories.map((item, i) => i === index ? { ...item, [key]: value } : item) }))
  }, [])

  const deleteCategory = useCallback((value) => {
    setScheme(prev => ({ ...prev, categories: prev.categories.filter((cat) => cat.value !== value) }))
  }, [])

  const addCategory = useCallback(() => {
    setScheme(prev => ({ ...prev, categories: [...prev.categories, getEmptyCategory(prev.categories)] }))
  }, [])

  /* useEffect(() => {
    const handleMouseUp = () => setSelectHover(false)
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, []) */

  const handleClickSeat = ({ detail, target: el, ctrlKey, metaKey }) => {
    const isDoubleClick = detail > 1
    if (selectedSeats.length === 0) {
      setShowSeatsEdit(true)
    }
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
      const next = prev.length === 1 ? (prev[0] === el ? [] : [el]) : [el]
      return prev.length === 1 ? (prev[0] === el ? [] : [el]) : [el]
    })
  }

  /* const handleMouseDown = useCallback((e) => {
    setSelectHover(true)
  }, [])

  const handleMouseOver = useCallback((e) => {
    if (!selectHover) return
    const validParams = scheme.seatParams.map(param => param.value)
    const data = pick(e.target.dataset, ['category', ...validParams])
    setSelectedSeats(prev => prev.find(seat => isEqualSeats(seat, data) ? prev : [...prev, data]))
  }, [scheme.seatParams, selectHover]) */

  useEffect(() => {
    if (!svgRef.current) return
    svgRef.current.querySelectorAll(`.${seatClassName}.${activeSeatClassName}`).forEach(el => el.classList.remove(activeSeatClassName))
    selectedSeats.forEach(el => el.classList.add(activeSeatClassName))
    // updateFromSvg()
  }, [selectedSeats])

  const seatHandlers = useMemo(() => ({
    onClick: handleClickSeat,
    onDoubleClick: handleClickSeat
  }), [handleClickSeat])

  const showEditSeat = useCallback((index = null) => {
    if (index === null) {
      setEditSeatIndex(true)
      setEditSeatParams({ name: '', label: '', type: 'string' })
      return
    }
    if (scheme.seatParams[index]) {
      setEditSeatIndex(index)
      setEditSeatParams({ ...scheme.seatParams[index]  })
    }
  }, [scheme.seatParams])

  const hideEditSeat = useCallback(() => {
    setEditSeatIndex(null)
    setEditSeatParams(null)
  }, [])

  const saveSeatProp = useCallback(() => {
    const newParams = [ ...scheme.seatParams ]
    if (editSeatIndex === true) {
      newParams.push(editSeatParams)
    } else if (newParams[editSeatIndex]) {
      newParams[editSeatIndex] = { ...newParams[editSeatIndex], ...editSeatParams }
    }
    setScheme(prev => ({ ...prev, seatParams: newParams }))
    hideEditSeat()
  }, [editSeatParams, editSeatIndex, hideEditSeat])

  const handleDelete = useCallback(() => {
    const seatParams = scheme.seatParams.filter((item, i) => i !== editSeatIndex)
    setScheme(prev => ({ ...prev, seatParams }))
    hideEditSeat()
  }, [editSeatIndex])

  // const updateFromSvg = (cb) => {
  //   const node = svgRef.current.cloneNode(true)
  //   node.querySelectorAll(`.${seatClassName}[data-price]`).forEach(el => el.removeAttribute('data-price'))
  //   node.querySelectorAll(`.${seatClassName}[data-count]`).forEach(el => el.removeAttribute('data-count'))
  //   node.querySelectorAll(`.${seatClassName}.${activeSeatClassName}`).forEach(el => el.classList.remove(activeSeatClassName))
  //   setScheme(node.innerHTML)
  //   cb && cb(null)
  // }

  const handleChangeSeat = useCallback((values) => { 
    selectedSeats.forEach(el => {
      Object.entries(values).forEach(([key, value]) => {
        if (!value) {
          el.removeAttribute(`data-${key}`)
        } else {
          el.setAttribute(`data-${key}`, value)
        }
      })
    })
  }, [selectedSeats])

  const isSelected = selectedSeats.length > 0
  const isEditSeat = editSeatIndex === true || typeof editSeatIndex === 'number'

  return (
    <Form
      size='large'
      layout='vertical'
      className='hall-form'
      form={form}
      onFieldsChange={(changed, values) => {
        console.log(values)
      }}
      onFinish={async ({ location, ...values }) => {
        if (hall_id !== NEW_ITEM_ID) values.id = hall_id
        const categories = scheme.categories.map(({ seats, rows, seatsCount, ...item }) => item)
        values.scheme_blob = await jsonBase64({ ...scheme, categories })
        const response = await updateData({ stadiums: [values] })
      }}
    >
      {hall_id !== NEW_ITEM_ID && <Form.Item name='id' style={{ display: 'none' }}><input type='hidden' value={hall_id} /></Form.Item>}
      <Typography.Title level={2} className='hall-title'>
        <Form.Item name={langCode} style={{ marginBottom: 0, flex: '1 1 auto' }}>
          <Input
            className='hall-name'
            placeholder='with the name'
            rules={[{ required: true }]}
            variant='borderless'
            autoFocus
          />
        </Form.Item>
      </Typography.Title>
      
      <Fieldset title='located in' icon={<EnvironmentOutlined className='fs-icon' />}>
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <InputCity
              name={['country', 'city']}
              label={['Country', 'City']}
              form={form}
              onAddCity={console.log}
              required
            />
          </Col>
          <Col span={12}>
            <Form.Item
              name={`address_${langCode}`}
              label='Address'
              required
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Fieldset>

      <Fieldset
        title={<>
          seat properties 
          <Button size='small' type='link' icon={<PlusOutlined />} onClick={() => showEditSeat(null)} />
        </>}
        icon={<SettingOutlined className='fs-icon' />}
      >
        <Table
          className='hall-form-seat-props'
          size='small'
          onRow={(record, index) => ({
            onClick: () => showEditSeat(index)
          })}
          columns={[
            {
              dataIndex: 'label',
              title: 'Label',
              width: 200
            }, {
              dataIndex: 'type',
              title: 'Type',
              render: type => DATA_TYPES.find(t => t.value === type)?.label || 'String',
              width: 200
            }, {
              dataIndex: 'name',
              title: 'System name',
              width: 200
            }, {
              key: 'options',
              title: 'Options',
              render: (_, item) => {
                const output = [
                  !!item.defaultValue && `Default value: ${item.defaultValue}`,
                  !!item.placeholder && `Placeholder: ${item.placeholder}`,
                  (!!item.minlength && !item.maxlength) && `Length not less than ${item.minlength}`,
                  (!item.minlength && !!item.maxlength) && `Length not more than ${item.maxlength}`,
                  (!!item.minlength && !!item.maxlength) && `Length from ${item.minlength} to ${item.maxlength}`,
                  (!!item.min && !item.max) && `Value not less than ${item.minlength}`,
                  (!item.min && !!item.max) && `Value not more than ${item.maxlength}`,
                  (!!item.min && !!item.max) && `Value from range ${item.minlength} to ${item.maxlength}`,
                  item.searchable && 'Searchable',
                  item.type === 'file' && (item.multiple ? 'Multiple file' : 'Single file'),
                  item.type === 'file' && `File formats: ${item.accept || 'any'}`
                ].filter(Boolean)
                return output.join('; ')
              }
            }
          ]}
          dataSource={scheme.seatParams}
          pagination={false}
          bordered
        />
        {isEditSeat && <Modal
          width={450}
          open={isEditSeat}
          onCancel={hideEditSeat}
          footer={[
            editSeatIndex !== true && <Button key='delete' onClick={handleDelete} danger>
              Delete
            </Button>,
            <Button key='cancel' onClick={hideEditSeat}>
              Cancel
            </Button>,
            <Button
              key='Save'
              type="primary"
              // loading={loading}
              onClick={saveSeatProp}
            >
              Save
            </Button>,
          ].filter(Boolean)}
        >
          <SeatProperty
            title={`${editSeatIndex === true ? 'New' : 'Edit'} seat property`}
            {...editSeatParams}
            onChange={setEditSeatParams}
          />
        </Modal>}
      </Fieldset>
      
      <Flex gap={20} className='scheme-fieldset'>
        <Fieldset
          title={<>scheme  {!!scheme.scheme && <Button type='link' size='small' icon={<ClearOutlined />} onClick={() => setScheme({ categories: [], seatParams: defaultSeatParams, scheme: '' })} danger />}</>}
          style={{ flex: '0 0 65%' }}
          icon={<InsertRowAboveOutlined className='fs-icon' />}
        >
          {scheme.scheme ?
            <SvgScheme
              ref={svgRef}
              src={scheme.scheme}
              categories={scheme.categories}
              renderTooltip={SchemeTooltip}
              seat={seatHandlers}
              /* onSeatMuseDown={handleMouseDown}
              onSeatOver={handleMouseOver} */
            /> :
            <Upload.Dragger
              accept='.svg'
              itemRender={() => null}
              customRequest={e => toText(e.file)
                .then(transformScheme)
                .then(scheme => setScheme({
                  categories: getCategories(scheme),
                  scheme: clearFillAndStringify(scheme),
                  seatParams: defaultSeatParams
                })
              )}
              block
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for a single svg-file
              </p>
            </Upload.Dragger>
          }
        </Fieldset>

        <Fieldset
          title={<>
            <span
              className={classNames({
                'scheme-tooltip-label_selected': !showSeatsEdit,
                'scheme-tooltip-label_active': showSeatsEdit && isSelected
              })}
              onClick={() => setShowSeatsEdit(false)}
            >
              <BarsOutlined className='fs-icon' /> <span>categories</span>
            </span>
            {!!scheme.scheme && false && <Button type='link' size='small' icon={<ClearOutlined />} danger />}
            <Divider type='vertical' />
            <span
              className={classNames({
                'scheme-tooltip-label_selected': showSeatsEdit && isSelected,
                'scheme-tooltip-label_active': !showSeatsEdit && isSelected,
                'scheme-tooltip-label_disabled': !isSelected
              })}
              onClick={isSelected ? () => setShowSeatsEdit(true) : undefined}
            >
              <CheckCircleOutlined className='fs-icon' /> <span>selected seats</span>
            </span>
          </>}
          style={{ flex: '1 1 auto' }}
        >
          {showSeatsEdit && isSelected ?
            <SeatEditor
              categories={scheme.categories}
              params={scheme.seatParams}
              seats={selectedSeats}
              onChange={handleChangeSeat}
            /> :
            <>
              {scheme.categories?.length > 0 && <SortableList
                items={scheme.categories}
                onChange={list => setScheme(prev => ({ ...prev, categories: list }))}
                renderItem={(item, i) => (
                  <SortableList.Item id={item.id}>
                    <Category
                      {...item}
                      onChange={inject => console.log(inject) ||
                       setScheme(prev => {
                        const categories = [...prev.categories]
                        categories[i] = { ...categories[i], ...inject }
                        return {
                          ...prev,
                          categories
                        }
                      })}
                      onDelete={deleteCategory}
                    />
                    <SortableList.DragHandle />
                  </SortableList.Item>
                )}
              />}
              <Button type='dashed' size='large' icon={<PlusOutlined />} onClick={addCategory} block>Add category</Button>
            </>
          }
        </Fieldset>
      </Flex>
    </Form>
  )
}
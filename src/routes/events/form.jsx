import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import classNames from 'classnames'
import { pick } from 'lodash'
import { cn as bem } from '@bem-react/classname'
import { BarcodeOutlined, BarsOutlined, BorderBottomOutlined, BorderTopOutlined, CheckCircleOutlined, CheckSquareOutlined, ClearOutlined, ClockCircleFilled, ClockCircleOutlined, ControlOutlined, DashboardOutlined, DollarOutlined, EnvironmentOutlined, FilePdfOutlined, InboxOutlined, InsertRowAboveOutlined, MailOutlined, MoneyCollectOutlined, PlusOutlined, RedoOutlined, SettingOutlined, SnippetsOutlined, UploadOutlined } from '@ant-design/icons'
import { Typography, Button, Col, Descriptions, Divider, Flex, Form, Input, Modal, Row, Select, Space, Steps, Table, Upload, Checkbox, DatePicker, InputNumber, Tabs, Result, Skeleton, AutoComplete } from 'antd'
import { useAppState } from 'shared/contexts'
import { jsonBase64, mapToOptions, toBase64, toText } from 'utils/utils'
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
import Fieldset, { FieldsetTitle } from 'shared/ui/fieldset'
import SeatEditor from 'components/seat-editor'
import SeatProperty from 'components/seat-property'
import { axios } from 'api/axios'
import { query, updateData } from './api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SchemeFieldset, SeatParamsFieldset } from 'components/halls'
import { fetchScheme } from 'shared/api/scheme'
import { FormTemplate } from 'components/events'

const cn = bem('events')

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

const eventFormTabs = ['Scheme', 'Tickets', 'Templates']

export default function EventForm({ form, schemeFile, hallOptions = [], tourOptions = [], onSubmit }) {
  const formHallId = Form.useWatch('stadium', form)
  const svgRef = useRef(null)
  const { event_id } = useParams()
  const [{ langCode }] = useAppState()
  // const [selectHover, setSelectHover] = useState(false)
  const [scheme, setScheme] = useState({ categories: [], seatParams: [], scheme: '' })
  const [selectedSeats, setSelectedSeats] = useState([])
  const [schemeStatus, setSchemeStatus] = useState('idle')
  const [showSeatsEdit, setShowSeatsEdit] = useState(false)
  const [activeTabIndex, setActiveTabIndex] = useState(1)
  
  const queryClient = useQueryClient()
  console.log(tourOptions)
  
  const [isTour, setIsTour] = useState(false)
  
  const config = queryClient.getQueryData(['config'])?.options || {}

  const currencies = useMemo(() => {
    return mapToOptions(config.currencies, item => item[langCode] || item.ru)
  }, [config.currencies])
  const schemeJson = queryClient.getQueryData(['scheme', formHallId])
  
  // useEffect(() => {
  //   if (!schemeJson) return
  //   const { seatParams, customProps, categories, ...scheme } = schemeJson
   
  //   setScheme({
  //     ...scheme,
  //     categories: categories?.map((item, i) => ({ id: i + 1, ...item })),
  //     seatParams: seatParams || customProps
  //   })
  // }, [schemeJson])

  const handleChangeCategory = useCallback((index, key, value) => {
    setScheme(prev => ({ ...prev, categories: prev.categories.map((item, i) => i === index ? { ...item, [key]: value } : item) }))
  }, [])

  const deleteCategory = useCallback((value) => {
    setScheme(prev => ({ ...prev, categories: prev.categories.filter((cat) => cat.value !== value) }))
  }, [])

  const addCategory = useCallback(() => {
    setScheme(prev => ({ ...prev, categories: [...prev.categories, getEmptyCategory(prev.categories)] }))
  }, [])

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

  useEffect(() => {
    if (!svgRef.current) return
    svgRef.current.querySelectorAll(`.${seatClassName}.${activeSeatClassName}`).forEach(el => el.classList.remove(activeSeatClassName))
    selectedSeats.forEach(el => el.classList.add(activeSeatClassName))
    // updateFromSvg()
  }, [selectedSeats])

  const fetchStadiumScheme = useCallback(async (option) => {
    setSchemeStatus('loading')
    setScheme({ scheme: '', categories: [], seatParams: [] })
    const scheme = await fetchScheme(option.scheme_blob)
    setScheme(scheme)
    setSchemeStatus('loaded')
  }, [])

  const seatHandlers = useMemo(() => ({
    onClick: handleClickSeat,
    onDoubleClick: handleClickSeat
  }), [handleClickSeat])

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

  const isDashboard = activeTabIndex === 0
  const isScheme = activeTabIndex === 1
  const isTickets = activeTabIndex === 2
  const isEmail = activeTabIndex === 3
  const isPdf = activeTabIndex === 4
  const schemeSelected = !!formHallId
  const isLoadingScheme = schemeStatus === 'loading'
  const isLoadedScheme = schemeStatus === 'loaded'

  return (
    <Form
      size='large'
      layout='vertical'
      className='events-form'
      form={form}
      onFinish={values => onSubmit && onSubmit(values, scheme)}
    >
      {event_id !== NEW_ITEM_ID && <Form.Item name='id' style={{ display: 'none' }}><input type='hidden' value={event_id} /></Form.Item>}
      <Typography.Title className={cn('header')} level={1} style={{ display: 'flex', margin: '0' }}>
        event
        <Form.Item name={langCode} style={{ marginBottom: 0, flex: '1 1 auto', position: 'relative', top: -7, left: 10 }}>
          <AutoComplete
            options={tourOptions}
            className='input_huge'
            placeholder='name or tour'
            rules={[{ required: true }]}
            variant='borderless'

            autoFocus
          />
        </Form.Item>
      </Typography.Title>
      <Row gutter={[16, 0]}>
        <Col span={12}>
          <Fieldset title='in the hall' icon={<EnvironmentOutlined className='fs-icon' />}>
            <Row>
              <Col span={24}>
                <Form.Item
                  name='stadium'
                >
                  <Select
                    rules={[{ required: true }]}
                    options={hallOptions}
                    onChange={(_, option) => fetchStadiumScheme(option)}
                    showSearch
                  />
                </Form.Item>
              </Col>
            </Row>
          </Fieldset>
        </Col>
        <Col span={4}>
          <Fieldset title='will take place on' icon={<ClockCircleOutlined className='fs-icon' />}>
            <Form.Item
              name='date'
            >
              <DatePicker placeholder='' showTime />
            </Form.Item>
          </Fieldset>
        </Col>
        <Col span={4}>
          <Fieldset title='with fee' icon={<DollarOutlined className='fs-icon' />}>
            <Form.Item
              name='fee'
            >
              <InputNumber
                style={{ width: '100%' }}
                addonAfter='%'
              />
            </Form.Item>
          </Fieldset>
        </Col>
        <Col span={4}>
          <Fieldset title='in currency' icon={<MoneyCollectOutlined className='fs-icon' />}>
            <Form.Item
              name='currency'
            >
              <Select
                options={currencies}
              />
            </Form.Item>
          </Fieldset>
        </Col>
      </Row>

      <div style={{ width: isScheme ? '65%' : 'auto' }}>
        <Divider orientation='left' orientationMargin='0' className='fieldset-title'>
          <FieldsetTitle
            active={isDashboard}
            disabled={event_id === 'create'}
            onClick={() => setActiveTabIndex(0)}
            title='Available after first save'
            icon={<DashboardOutlined />}
          >
            dashboard
          </FieldsetTitle>
          <Divider type='vertical' />
          <FieldsetTitle
            active={isScheme}
            onClick={() => setActiveTabIndex(1)}
            icon={<InsertRowAboveOutlined />}
          >
            scheme
          </FieldsetTitle>
          <Divider type='vertical' />
          <FieldsetTitle
            active={isTickets}
            onClick={() => setActiveTabIndex(2)}
            icon={<BarcodeOutlined />}
          >
            tickets
          </FieldsetTitle>
          <Divider type='vertical' />
          <FieldsetTitle
            active={isEmail}
            onClick={() => setActiveTabIndex(3)}
            icon={<MailOutlined />}
          >
            e-mail template
          </FieldsetTitle>
          <Divider type='vertical' />
          <FieldsetTitle
            active={isPdf}
            onClick={() => setActiveTabIndex(4)}
            icon={<FilePdfOutlined />}
          >
            pdf template
          </FieldsetTitle>
        </Divider>
      </div>

      {(isTickets || isScheme) && <>
        {!schemeSelected && <Result
          icon={<EnvironmentOutlined />}
          title={`To work with the ${isScheme ? 'schema' : 'tickets'}, select a hall`}
        />}
        {isLoadingScheme && <Skeleton.Button style={{ height: 500 }} active block />}
      </>}
      {isScheme && schemeSelected && !isLoadingScheme && <>
        <SchemeFieldset
          {...scheme}
          onChange={setScheme}
          title={null}
        />
        <SeatParamsFieldset
          items={scheme.seatParams}
          onChange={seatParams => setScheme(prev => ({ ...prev, seatParams }))}
        />
      </>}
      {isEmail && <div style={{ maxWidth: '65%', minWidth: 600 }}>
        <Form.Item
          label='Subject'
          name='template_subject'
        >
          <Input />
        </Form.Item>
        <Form.Item
          label='Body'
          name='template_body'
        >
          <Input.TextArea rows={10} />
        </Form.Item>
      </div>}
      {isPdf && <div style={{ maxWidth: '65%', minWidth: 600 }}>
        <Form.Item
          name='pdf_body'
        >
          <Input.TextArea rows={10} />
        </Form.Item>
      </div>}
    </Form>
  )
}

EventForm.Dashboard = () => (<div>Dashboard</div>)
EventForm.General = () => (<div>General</div>)
EventForm.Tickets = () => (<div>Tickets</div>)
EventForm.Templates = () => (<div>Templates</div>)

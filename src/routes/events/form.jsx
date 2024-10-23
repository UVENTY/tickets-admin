import { Fragment, useCallback, useMemo, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { cn as bem } from '@bem-react/classname'
import { useQueryClient } from '@tanstack/react-query'
import {
  BarcodeOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FilePdfOutlined,
  InsertRowAboveOutlined,
  MailOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons'
import {
  AutoComplete,
  Button,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Result,
  Select,
  Skeleton,
  Table,
  Tabs,
  Typography,
  Divider,
} from 'antd'
import { useAppState } from 'shared/contexts'
import { mapToOptions } from 'utils/utils'
import { NEW_ITEM_ID } from 'consts'
import Fieldset, { FieldsetTitle } from 'shared/ui/fieldset'
import { fetchScheme } from 'shared/api/scheme'
import { SchemeFieldset, SeatParamsFieldset } from 'components/halls'
import { FormTemplate } from 'components/events'

const cn = bem('events')

const formTabs = [
  [DashboardOutlined, 'dashboard'],
  [InsertRowAboveOutlined, 'scheme'],
  [BarcodeOutlined, 'tickets'],
  [MailOutlined, 'e-mail template'],
  [FilePdfOutlined, 'pdf ticket']
]

export default function EventForm({ form, schemeFile, hallOptions = [], tourOptions = [], onSubmit }) {
  const formHallId = Form.useWatch('stadium', form)
  const { event_id } = useParams()
  const [{ currency, langCode }] = useAppState()
  const [scheme, setScheme] = useState({ categories: [], seatParams: [], scheme: '' })
  const [schemeStatus, setSchemeStatus] = useState('idle')
  const [activeTabIndex, setActiveTabIndex] = useState(1)
  const [isTour, setIsTour] = useState(false)
  
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData(['config'])?.options || {}
  const currencies = useMemo(() => {
    return mapToOptions(config.currencies, item => item[langCode] || item.ru)
  }, [config.currencies])

  const fetchStadiumScheme = useCallback(async (option) => {
    setSchemeStatus('loading')
    setScheme({ scheme: '', categories: [], seatParams: [] })
    const scheme = await fetchScheme(option.scheme_blob)
    setScheme(scheme)
    setSchemeStatus('loaded')
  }, [])

  const schemeSelected = !!formHallId
  const activePage = formTabs[activeTabIndex][1]
  const isLoading = schemeStatus === 'loading'

  return (
    <Form
      size='large'
      layout='vertical'
      className='events-form'
      form={form}
      onFinish={values => onSubmit && onSubmit(values, scheme)}
    >
      {event_id !== NEW_ITEM_ID && <Form.Item
        name='id'
        style={{ display: 'none' }}
      >
        <input type='hidden' value={event_id} />
      </Form.Item>}
      <Typography.Title className={cn('header')} level={1} style={{ display: 'flex', margin: '0' }}>
        event
        <Form.Item
          name={langCode}
          style={{ marginBottom: 0, flex: '1 1 auto', position: 'relative', top: -7 }}
        >
          <AutoComplete
            options={tourOptions}
            className='input_huge'
            placeholder='name or tour'
            rules={[{ required: true }]}
            variant='borderless'
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
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
            <Form.Item name='date'>
              <DatePicker placeholder='' showTime />
            </Form.Item>
          </Fieldset>
        </Col>
        <Col span={4}>
          <Fieldset title='with fee' icon={<DollarOutlined className='fs-icon' />}>
            <Form.Item name='fee'>
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

      <div style={{ width: activePage === 'scheme' ? '65%' : 'auto' }}>
        <Divider orientation='left' orientationMargin='0' className='fieldset-title'>
          {formTabs.map(([Icon, title], i) => i === 0 && event_id === 'create' ? null : <Fragment key={i}>
            <FieldsetTitle
              active={activeTabIndex === i}
              icon={<Icon className='fs-icon' />}
              onClick={() => setActiveTabIndex(i)}
            >
              {title}
            </FieldsetTitle>
            {i < formTabs.length - 1 && <Divider type='vertical' />}
          </Fragment>)}
        </ Divider>
      </div>

      {['scheme', 'tickets'].includes(activePage) && <>
        {!schemeSelected && <Result
          title={<>To work with the {activePage}, select <EnvironmentOutlined style={{ color: 'var(--ant-blue)'}} /> a hall</>}
        />}
        {isLoading && <Flex justify='space-between' gap={20}>
          <div style={{ flex: '0 0 65%' }}>
            <Skeleton.Button style={{ height: 500 }} active block />
          </div>
          <div style={{ flex: '1 1 auto'}}>
            <Skeleton.Button style={{ height: 500 }} active block />
          </div>
        </Flex>}
      </>}
      {activePage === 'scheme' && schemeSelected && !isLoading && <>
        <SchemeFieldset
          {...scheme}
          onChange={setScheme}
          title={null}
          currency={currency}
        />
        <SeatParamsFieldset
          items={scheme.seatParams}
          onChange={seatParams => setScheme(prev => ({ ...prev, seatParams }))}
        />
      </>}
      {activePage === 'e-mail template' && <div style={{ maxWidth: '65%', minWidth: 600 }}>
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
      {activePage === 'pdf template' && <div style={{ maxWidth: '65%', minWidth: 600 }}>
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

import { get } from 'lodash'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { keyBy } from 'lodash'
import dayjs from 'dayjs'
import { Table, Col, Row, Form, Button, Select, DatePicker, TimePicker, message, Input, Collapse, InputNumber, List } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, DownloadOutlined, FilePdfOutlined } from '@ant-design/icons'
import TicketsApi from '../../api/tickets'
import { useData, useUpdateData } from '../../api/data'
import { axios } from '../../api/axios'
import SvgSchemeEditor from '../../components/SvgSchemeEditor'
import Sidebar from '../../components/Layout/sidebar'
import { getCitiesOptions, getCountriesOptions, getLangValue } from '../../redux/config'
import { downloadBlob, jsonBase64, qrBase64, toBase64 } from '../../utils/utils'
import './event.scss'
import { EMPTY_ARRAY, NON_SEAT_ROW } from '../../consts'
import Wysiwyg from '../../components/Wysiwyg'
import { getTicketPdf } from '../../api/tickets/request'
import { getColumnSearch } from '../../utils/components'

const getOptions = obj => Object.values(obj)
  .map(item => ({ label: item.en, value: item.id }))
  .sort((item1, item2) => item1.label > item2.label ? 1 : -1)

const updateLang = (lang_vls) => axios.post('/data', {
  data: JSON.stringify({ lang_vls })
})

const expandNonSeats = (changed, tickets = []) => {
  const { nonSeats, seats } = Object.entries(changed).reduce((acc, [key, value]) => {
    if (!key.includes(';')) acc.nonSeats = [...acc.nonSeats, [key, value]]
    else acc.seats[key] = value
    return acc
  }, { nonSeats: [], seats: {} })
  return nonSeats.reduce((acc, [key, data]) => {
    const { price, count } = data
    if (!price && !count && count !== 0) return []
    const freeTickets = tickets.filter(ticket => ticket.section === key && !ticket.is_sold && !ticket.is_reserved)
    let lastSeat = Math.max(...tickets.map(ticket => ticket.seat))
    lastSeat = isFinite(lastSeat) ? lastSeat : 0
    if (price) {
      acc = freeTickets.reduce((acc, ticket) => ({
        ...acc,
        [`${key};${NON_SEAT_ROW};${ticket.seat}`]: price,
      }), acc)
    }
    if (count) {
      const diff = count - freeTickets.length
      if (diff < 0) {
        acc = freeTickets.slice(0, diff * -1).reduce((acc, ticket) => ({
          ...acc,
          [`${key};${NON_SEAT_ROW};${ticket.seat}`]: -1,
        }), acc)
      } else if (diff > 0) {
        acc = Array.from({ length: diff }, (_, i) => i + lastSeat + 1).reduce((acc, i) => ({
          ...acc,
          [`${key};${NON_SEAT_ROW};${i}`]: price || freeTickets[0]?.price,
        }), acc)
      }
    }
    return acc
  }, seats)
}

const exportTickets = ( tickets, eventId ) => {
  const stringify = ( data ) => {
    const re = /^\s|\s$|[",\n\r]/;
    let ret = String( data || '' )
    if (re.test( ret )) ret = `"${ret.replaceAll( '"', '""' )}"`;
    return ret;
  }
  const headerRow = '\uFEFF' + [ 'Event', 'Category', 'Row', 'Seat', 'Price', 'Currency', 'Code', 'Status' ].join( ',' ) + '\r\n'
  const rows = tickets.
    sort( ( a, b ) =>
      a.section < b.section ? -1 : a.section > b.section ? 1 : 
      a.row < b.row ? -1 : a.row > b.row ? 1 : 
      Number( a.seat ) < Number( b.seat ) ? -1 : Number( a.seat ) > Number( b.seat ) ? 1 : 0
    ).
    map( ticket => [
      ticket.event_id,
      ticket.section,
      ticket.row == NON_SEAT_ROW ? '' : ticket.row,
      ticket.seat,
      ticket.price,
      ticket.currency,
      ticket.code,
      ticket.is_sold ? 'sold' : ticket.is_reserved ? 'ordered' : ticket.disabled ? 'block' : ''
    ].
    map( stringify ).
    join( ',' ) +
    '\r\n'
  )
  rows.unshift(headerRow)
  const blob = new Blob( rows, { type : 'text/csv; charset=utf-8' } )
  const url = URL.createObjectURL( blob )
  const a = document.createElement( 'a' )
  a.href = url
  a.download = `tickets_${eventId}_${(new Date).toISOString().substring(0,10)}.csv`
  a.click()
  URL.revokeObjectURL( url )
}

export default function EventForm() {
  const [ messageApi, contextHolder ] = message.useMessage()
  const navigate = useNavigate()
  const { id } = useParams()
  const [ form ] = Form.useForm()
  const [ isSending, setIsSending ] = useState(false)
  const [ changedPrice, setChangedPrice ] = useState({})
  const dispatch = useDispatch()

  const cities = useSelector(getCitiesOptions)
  const countries = useSelector(getCountriesOptions)

  const schemeData = Form.useWatch(['stadium', 'scheme_blob'], form)

  const { isLoading: isLoadingUsers, data: usersMap } = useQuery({
    queryKey: ['usersMap'],
    queryFn: async () => {
      const response = await axios.post('/query/select', {
        sql: `SELECT id_user,id_role,phone,email,name,family,middle,id_verification_status FROM users WHERE active=1 AND deleted!=1`
      })
      return (response.data?.data || []).reduce((acc, item) => ({ ...acc, [item.id_user]: item }), {})
    }
  })
  
  const isNew = id === 'create'
  const updateData = useUpdateData()
  const mutateTickets = useMutation({ mutationFn: TicketsApi.updateTickets })
  const { data, error, isLoading } = useData(null, {
    select: ({ data, default_lang }) => {
      const { schedule, stadiums, teams, tournaments } = data
      const event = { ...schedule[id] }
      event.date = dayjs(event.datetime)
      event.time = event.date?.utc()
      event.stadium = event.stadium ? { id: event.stadium, ...stadiums?.[event.stadium] } : null
      
      const options = {
        s: getOptions(Object.keys(stadiums || {}).map(id => ({ id, ...stadiums?.[id] })), 'en'),
        t: getOptions(Object.keys(tournaments || {}).map(id => ({ id, ...tournaments?.[id] })), 'en'),
        teams: getOptions(Object.keys(teams || {}).map(id => ({ id, ...teams?.[id] })), 'en'),
      }
      return {
        event,
        options,
        defaultLang: default_lang
      }
    }
  })
  
  const ticketsColumns = useMemo(() => [
    {
      dataIndex: 'section',
      title: 'Section',
      sorter: (a, b) => a.section?.localeCompare(b.section),
      ...getColumnSearch('section', { options: schemeData?.categories })
    }, {
      dataIndex: 'row',
      title: 'Row',
      sorter: (a, b) => parseInt(a.row, 10) < parseInt(b.row, 10) ? -1 : 1,
      ...getColumnSearch('row')
    }, {
      dataIndex: 'seat',
      title: 'Seat',
      sorter: (a, b) => parseInt(a.seat, 10) < parseInt(b.seat, 10) ? -1 : 1,
      ...getColumnSearch('seat')
    }, {
      dataIndex: 'price',
      title: 'Price',
    }, {
      dataIndex: 'sold_info',
      title: 'Buyer',
      ...getColumnSearch('sold_info', { getData: item => usersMap[item.sold_info?.user_id]?.email }),
      render: info => {
        const user = usersMap[info?.user_id]
        if (!user) return info?.user_id
        return user.email
      }
    }, {
      key: 'actions',
      title: 'Download',
      render: (_, item) => {
        return (
          <Button
            icon={<FilePdfOutlined />}
            onClick={async () => {
              const pdf = await getTicketPdf({ seat: item.fullSeat, t_id: item.fuckingTrip })
              downloadBlob(pdf, 'ticket.pdf')
            }}
          />
        )
      }
    }
  ], [usersMap, schemeData?.categories])
    
  const emailSubject = useSelector(state => getLangValue(state, `email_ticket_paid_subject_${id}`))
  const emailContent = useSelector(state => getLangValue(state, `email_ticket_paid_body_${id}`))
  const pdfContent = useSelector(state => getLangValue(state, `html_pdf_ticket_paid_body_${id}`))
  
  const tickets = TicketsApi.useTickets({ event_id: id }, { order: 'section' }, {
    enabled: !isNew
  })
  
  if ((!isNew && (isLoading || tickets.isLoading)) || !data) return null

  const panelStyle = {
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03),0 1px 6px -1px rgba(0, 0, 0, 0.02),0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    marginBottom: 20,
  }
  
  const initialValues = isNew ? {} : data.event
  return (
    <>
      <Sidebar buttons sticky>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/events')} block>Events</Button>
        <Button icon={<SaveOutlined />} type='primary' onClick={() => form.submit()} loading={isSending} block>Save</Button>
      </Sidebar>
      <Form
        style={{ flex: '1 1 0'}}
        layout='vertical'
        onFinish={async (dataValues) => {
          setIsSending(true)
          const { template_subject, template_body, pdf_body, ...values } = dataValues
          try {
            let { stadium: { scheme_blob, ...stadium }, date, time, ...event } = values
            stadium.scheme_blob = await jsonBase64(scheme_blob)
            event.datetime = `${date.format('YYYY-MM-DD')} ${time.format('HH:mm:ss')}+03:00`
            
            await updateLang({
              [`email_ticket_paid_subject_${id}`]: { [data.defaultLang]: template_subject },
              [`email_ticket_paid_body_${id}`]: { [data.defaultLang]: template_body },
              [`html_pdf_ticket_paid_body_${id}`]: { [data.defaultLang]: pdf_body }
            })

            if (!isNew) {
              stadium.id = data.event?.stadium?.id
              await mutateTickets.mutateAsync({
                event_id: id,
                hall_id: stadium?.id,
                tickets: expandNonSeats(changedPrice, tickets.data)
              }).then(res => updateData({
                schedule: [{ id, ...event }],
                stadiums: [stadium],
              }))
              messageApi.success(`Event successfully ${isNew ? 'created' : 'updated'}`)
              return
            }
            const eventData = { ...event }
            const createdStadium = await updateData({ stadiums: [stadium] })
            const stadiumId = get(createdStadium, 'data.created_id.stadiums.0')
            if (!stadiumId) {
              messageApi.error(`Error on creating stadium: ${JSON.stringify(data)}`)
              return
            }
            eventData.stadium = stadiumId
            const createdEvent = await updateData({
              schedule: [eventData],
            })
            const eventId = get(createdEvent, 'data.created_id.schedule.0')
            await mutateTickets.mutateAsync({
              event_id: eventId,
              hall_id: stadiumId,
              tickets: expandNonSeats(changedPrice, tickets.data)
            })
            await updateLang({
              [`email_ticket_paid_subject_${eventId}`]: { [data.defaultLang]: template_subject },
              [`email_ticket_paid_body_${eventId}`]: { [data.defaultLang]: template_body },
              [`html_pdf_ticket_paid_body_${eventId}`]: { [data.defaultLang]: pdf_body }
            })
            navigate(`/event/${eventId}`, { replace: true })
          } catch (e) {
            console.log(e)
            messageApi.error(e.message)
          } finally {
            setIsSending(false)
          }

          /* const datetime = `${date.format('YYYY-MM-DD')} ${time.format('HH:mm:ss')}+03:00`
          const match = { team1, team2, stadium, tournament, datetime, top: top ? '1' : '0' }
          if (!isNew) match.id = id
          dispatch(postData({ schedule: [match] }))
            .then(resp => {
              if (resp.status === 'error') {
                messageApi.error(resp.message)
              } else {
                navigate('/matches')
              }
            }) */
        }}
        initialValues={initialValues}
        form={form}
        className='eventForm'
        size='large'
      >
        <Collapse
          bordered={false}
          size='middle'
          defaultActiveKey={['1', '2', '3']}
          className='eventCollapse'
          items={[
            {
              key: '1',
              label: <b>Event data</b>,
              style: panelStyle,
              children: <Row gutter={20}>
                <Col span={6}>
                  <Form.Item
                    label='Artist'
                    name='team1'
                    rules={[{ required: true, message: 'Please input artist' }]}
                  >
                    <Select
                      placeholder='Artist'
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={data?.options?.teams || []}
                      style={{ width: '100%' }}
                      showSearch
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label='Date'
                    name='date'
                    rules={[{ required: true, message: 'Please input date' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label='Start time'
                    name='time'
                    rules={[{ required: true, message: 'Please input start time' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format='HH:mm'
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label='Tournament'
                    name='tournament'
                    rules={[{ required: true, message: 'Please input tournament' }]}
                  >
                    <Select
                      placeholder='Tournament'
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={data?.options?.t || []}
                      style={{ width: '100%' }}
                      showSearch
                    />
                  </Form.Item>
                </Col>
                <Col span={6} style={{ marginTop: 20 }}>
                  <Form.Item
                    label='Fee'
                    name='fee'
                  >
                    <InputNumber style={{ width: '100%' }} addonAfter='%' />
                  </Form.Item>
                </Col>
              </Row>
            },
            {
              key: '2',
              label: <b>Location</b>,
              style: panelStyle,
              children: <>
                <Row gutter={20}>
                  <Col span={6}>
                    <Form.Item label='Name' name={['stadium', 'en']}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label='Country' name={['stadium', 'country']}>
                      <Select
                        placeholder='Country'
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={countries}
                        style={{ width: '100%' }}
                        showSearch
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label='City' name={['stadium', 'city']}>
                      <Select
                        placeholder='City'
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={cities}
                        style={{ width: '100%' }}
                        showSearch
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label='Address' name={['stadium', 'address_en']}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item className='scheme_blob' name={['stadium', 'scheme_blob']}>
                  <SvgSchemeEditor
                    tickets={tickets.data}
                    onTicketsChange={val => console.log(val) || setChangedPrice(prev => ({ ...prev, ...val }))}
                  />
                </Form.Item>
              </>
            },
            {
              key: '3',
              label: <b>Remainings</b>,
              style: panelStyle,
              children:
                <div>
                  <List
                    grid={{ gutter: 16, column: 4 }}
                    dataSource={schemeData?.categories || EMPTY_ARRAY}
                    renderItem={(item, index) => {
                      const t = tickets?.data || EMPTY_ARRAY
                      const totalCount = t.filter(ticket => ticket.section === item.value).length
                      const soldCount = t.filter(ticket => ticket.section === item.value && ticket.is_sold).length
                      const reservedCount = t.filter(ticket => ticket.section === item.value && ticket.is_reserved).length
                      const disabledCount = t.filter(ticket => ticket.section === item.value && ticket.disabled).length - soldCount - reservedCount
                      const remainsCount = totalCount - (soldCount + reservedCount + disabledCount)
                      return (
                        <List.Item style={{ marginBottom: 40, textAlign: 'right' }}>
                          <List.Item.Meta
                            title={<span style={{ color: item.color }}><span style={{ verticalAlign: 'middle', marginRight: 6 }} dangerouslySetInnerHTML={{ __html: item.icon }} />{item.label}</span>}
                            description={<>Total <b>{totalCount}</b> tickets</>}
                          />
                          Sold <b>{soldCount}</b><br />
                          Reserved <b>{reservedCount}</b><br />
                          Disabled <b>{disabledCount}</b><br />
                          Remains <b>{remainsCount}</b>
                        </List.Item>
                      )
                    }}
                  />
                </div>
            },
            {
              key: '4',
              label: <b>E-mail template</b>,
              style: panelStyle,
              children:
                <div>
                  <Form.Item initialValue={emailSubject[data.defaultLang]} label='Subject' name='template_subject'>
                    <Input />
                  </Form.Item>
                  <Form.Item initialValue={emailContent[data.defaultLang]} label='Body' name='template_body'>
                    <Input.TextArea />
                  </Form.Item>
                </div>
            },
            {
              key: '5',
              label: <b>PDF ticket</b>,
              style: panelStyle,
              children:
                <div>
                  <Form.Item initialValue={pdfContent[data.defaultLang]} name='pdf_body'>
                    <Input.TextArea />
                  </Form.Item>
                </div>
            },
            {
              key: '6',
              label: <b>Tickets</b>,
              style: panelStyle,
              children:
                <>
                  <Button
                    size='large'
                    type='default'
                    htmlType='button'
                    icon={<DownloadOutlined />}
                    onClick={() => exportTickets(tickets.data, id)}
                  >
                    Download CSV
                  </Button>
                  <Table
                    dataIndex='code'
                    columns={ticketsColumns}
                    dataSource={tickets.data}
                  />
                </>
            }
          ]}
        />
        {contextHolder}
      </Form>
      <Sidebar />
    </>
  )
}

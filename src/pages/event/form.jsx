import { get } from 'lodash'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { Col, Row, Form, Button, Select, DatePicker, TimePicker, message, Input, Collapse, InputNumber, List } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, DownloadOutlined } from '@ant-design/icons'
import TicketsApi from '../../api/tickets'
import { useData, useUpdateData } from '../../api/data'
import SvgSchemeEditor from '../../components/SvgSchemeEditor'
import Sidebar from '../../components/Layout/sidebar'
import { getCitiesOptions, getCountriesOptions, getLangValue, updateLang } from '../../redux/config'
import { qrBase64, toBase64 } from '../../utils/utils'
import './event.scss'
import { EMPTY_ARRAY } from '../../consts'
import Wysiwyg from '../../components/Wysiwyg'

const getOptions = obj => Object.values(obj)
  .map(item => ({ label: item.en, value: item.id }))
  .sort((item1, item2) => item1.label > item2.label ? 1 : -1)

const expandNonSeats = (changed, tickets) => {
  const { nonSeats, seats } = Object.entries(changed).reduce((acc, [key, value]) => {
    if (!key.includes(';')) acc.nonSeats = [...acc.nonSeats, [key, value]]
    else acc.seats[key] = value
    return acc
  }, { nonSeats: [], seats: {} })
  return nonSeats.reduce((acc, [key, data]) => {
    const { price, count } = data
    if (!price && !count && count !== 0) return []
    const freeTickets = tickets.filter(ticket => ticket.section === key && !ticket.is_sold && !ticket.is_reserved)
    const lastSeat = Math.max(...tickets.map(ticket => ticket.seat))
    if (price) {
      acc = freeTickets.reduce((acc, ticket) => ({
        ...acc,
        [`${key};-1;${ticket.seat}`]: price,
      }), acc)
    }
    if (count) {
      const diff = count - freeTickets.length
      if (diff < 0) {
        acc = freeTickets.slice(0, diff * -1).reduce((acc, ticket) => ({
          ...acc,
          [`${key};-1;${ticket.seat}`]: -1,
        }), acc)
      } else if (diff > 0) {
        acc = Array.from({ length: diff }, (_, i) => i + lastSeat + 1).reduce((acc, i) => ({
          ...acc,
          [`${key};-1;${i}`]: price || freeTickets[0].price,
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
      ticket.row == -1 || ticket.row == '-1' ? '' : ticket.row,
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
  rows.unshift( headerRow)
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
  
  const isNew = id === 'create'
  const updateData = useUpdateData()
  const mutateTickets = useMutation({ mutationFn: TicketsApi.updateTickets })
  const { data, isLoading } = useData(null, {
    select: ({ data, default_lang }) => {
      const { schedule, stadiums, teams, tournaments } = data
      const event = { ...schedule[id] }
      event.date = dayjs(event.datetime)
      event.time = event.date?.utc()
      event.stadium = event.stadium ? { id: event.stadium, ...stadiums[event.stadium] } : null
      const options = {
        s: getOptions(Object.keys(stadiums).map(id => ({ id, ...stadiums[id] })), 'en'),
        t: getOptions(Object.keys(tournaments).map(id => ({ id, ...tournaments[id] })), 'en'),
        teams: getOptions(Object.keys(teams).map(id => ({ id, ...teams[id] })), 'en'),
      }
      return {
        event,
        options,
        defaultLang: default_lang
      }
    }
  })

  const emailSubject = useSelector(state => getLangValue(state, `email_ticket_paid_subject_${id}`))
  const emailContent = useSelector(state => getLangValue(state, `email_ticket_paid_body_${id}`))
  const pdfContent = useSelector(state => getLangValue(state, `html_pdf_ticket_paid_body_${id}`))
  
  const tickets = TicketsApi.useTickets({ event_id: id }, { order: 'section' }, {
    enabled: !isNew
  })
  
  if (!isNew && (isLoading || tickets.isLoading)) return null

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

          const lang_vls = {}
          lang_vls[ `email_ticket_paid_subject_${id}` ] = { [data.defaultLang]: template_subject }
          lang_vls[`email_ticket_paid_body_${id}`] = { [data.defaultLang]: template_body }
          lang_vls[`html_pdf_ticket_paid_body_${id}`] = { [data.defaultLang]: pdf_body }
          dispatch(updateLang( lang_vls ))

          try {
            let { stadium: { scheme_blob, ...stadium }, date, time, ...event } = values
            if (scheme_blob) {
              stadium.id = data.event?.stadium?.id || ''
              const scheme_file = scheme_blob && new File([JSON.stringify(scheme_blob)], 'scheme.json', {
                type: 'application/json',
              })
              if (scheme_file) {
                stadium.scheme_blob = await (scheme_file ? toBase64(scheme_file) : Promise.resolve())
              }
            }
            event.datetime = `${date.format('YYYY-MM-DD')} ${time.format('HH:mm:ss')}+03:00`
            if (!isNew) {
              try {
                Promise.all(
                  tickets.data.filter(ticket => !ticket.code_qr)
                    .map(ticket =>
                      qrBase64( )
                        .then(qr => ({ ...ticket, code_qr: qr }))
                        .catch(e => console.error(ticket.fullSeat, e.message))
                    )
                ).then(withQr => {
                  const postTickets = expandNonSeats(changedPrice, tickets.data)
                  const update = withQr.reduce((acc, item) => {
                    if (!item) return acc
                    const key = item.fullSeat.split(';').slice(1).join(';')
                    acc[key] = acc[key] || {}
                    if (typeof acc[key] === 'number' && acc[key] > 0) acc[key] = { price: acc[key] }
                    if (acc[key] !== -1) acc[key].code_qr = item.code_qr
                    return acc
                  }, postTickets)
                  const sendData = { event_id: id }
                  if (stadium) {
                    sendData.hall_id = stadium?.id
                    sendData.tickets = update
                  }
                  mutateTickets.mutateAsync(sendData).then(res => {
                    const dataUpdate = { schedule: [{ id, ...event }] }
                    if (stadium) {
                      dataUpdate.stadiums = [stadium]
                    }
                    return Promise.all([
                      updateData(dataUpdate),
                    ])
                  })
                })
              } catch (e) {
                console.log(e);
              }
              messageApi.success(`Event successfully ${isNew ? 'created' : 'updated'}`)
              return
            }
            const eventData = { ...event }
            if (Object.values(stadium).filter(Boolean).length > 0) {
              const createdStadium = await updateData({ stadiums: [stadium] })
              const stadiumId = get(createdStadium, 'data.created_id.stadiums.0')
              if (!stadiumId) {
                messageApi.error('Error on creating stadium')
                return
              }
              eventData.stadium = stadiumId
            }
            const [ createdEvent, createdTickets ] = await Promise.all([
              updateData({ schedule: [eventData] }),
              Promise.resolve()//editTickets({ stadium_id: stadiumId, event_id: id, price: prices })
            ])
            const eventId = get(createdEvent, 'data.created_id.schedule.0')
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
                    onTicketsChange={val => setChangedPrice(prev => ({ ...prev, ...val }))}
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
                    <Wysiwyg />
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
                    <Wysiwyg />
                  </Form.Item>
                </div>
            },
            {
              key: '6',
              label: <b>Tickets</b>,
              style: panelStyle,
              children:
                <Button
                  size='large'
                  type='default'
                  htmlType='button'
                  icon={<DownloadOutlined />}
                  onClick={ () => exportTickets( tickets.data, id ) }
                >
                  Download CSV
                </Button>
            }
          ]}
        />
        {contextHolder}
      </Form>
      <Sidebar />
    </>
  )
}

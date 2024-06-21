import { get } from 'lodash'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { Col, Row, Form, Button, Select, DatePicker, TimePicker, message, Input, Collapse } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import TicketsApi from '../../api/tickets'
import { useData, useUpdateData } from '../../api/data'
import SvgSchemeEditor from '../../components/SvgSchemeEditor'
import Sidebar from '../../components/Layout/sidebar'
import { getCitiesOptions, getCountriesOptions } from '../../redux/config'
import { toBase64 } from '../../utils/utils'
import './event.scss'

const getOptions = obj => Object.values(obj)
  .map(item => ({ label: item.en, value: item.id }))
  .sort((item1, item2) => item1.label > item2.label ? 1 : -1)

export default function EventForm() {
  const [ messageApi, contextHolder ] = message.useMessage()
  const navigate = useNavigate()
  const { id } = useParams()
  const [ form ] = Form.useForm()
  const [ isSending, setIsSending ] = useState(false)
  const [ changedPrice, setChangedPrice ] = useState({})

  const cities = useSelector(getCitiesOptions)
  const countries = useSelector(getCountriesOptions)

  const isNew = id === 'create'
  const updateData = useUpdateData()
  const mutateTickets = useMutation({ mutationFn: TicketsApi.updateTickets })
  const { data, isLoading } = useData(null, {
    enabled: !isNew,
    select: data => {
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
        options
      }
    }
  })
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
        onFinish={async (values) => {
          setIsSending(true)
          try {
            const { stadium: { scheme_blob, ...stadium }, date, time, ...event } = values
            stadium.id = data.event?.stadium?.id || ''
            const scheme_file = scheme_blob && new File([JSON.stringify(scheme_blob)], 'scheme.json', {
              type: 'application/json',
            })
            stadium.scheme_blob = await (scheme_file ? toBase64(scheme_file) : Promise.resolve())
            event.datetime = `${date.format('YYYY-MM-DD')} ${time.format('HH:mm:ss')}+03:00`

            if (!isNew) {
              try {
                mutateTickets.mutate({ tickets: changedPrice, event_id: id, hall_id: stadium.id })
                await Promise.all([
                  updateData({ stadiums: [stadium], schedule: [{ id, ...event }] }),
                ])
              } catch (e) {
                console.log(e);
              }
              messageApi.success(`Event successfully ${isNew ? 'created' : 'updated'}`)
              return
            }
            const createdStadium = await updateData({ stadiums: [stadium] })
            const stadiumId = get(createdStadium, 'data.created_id.stadiums.0')
            if (!stadiumId) {
              messageApi.error('Error on creating stadium')
              return
            }
            /* const [ createdEvent, createdTickets ] = await Promise.all([
              updateData({ schedule: [{ ...event, stadium: stadiumId }] }),
              editTickets({ stadium_id: stadiumId, event_id: id, price: prices })
            ]) */
            // const eventId = get(created, 'data.created_id.schedule.0')
            // navigate(`/event/${eventId}`, { replace: true })
          } catch (e) {
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
          ]}
        />
        {contextHolder}
      </Form>
      <Sidebar />
    </>
  ) 
}
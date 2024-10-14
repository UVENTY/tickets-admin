import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { omit, pick } from 'lodash'
import { Button, Card, Checkbox, Col, Descriptions, Dropdown, Form, List, Row, Select, Typography } from 'antd'
import { Link, Outlet, redirect, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeftOutlined, CloseOutlined, DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import { cn as bem } from '@bem-react/classname'
import Sidebar from 'shared/layout/sidebar'
import { useAppState } from 'shared/contexts'
import { listToOptions, mapToOptions, parseJson } from 'utils/utils'
import { EMPTY_EVENT, EMPTY_HALL, NEW_ITEM_ID } from 'consts'
import HallCard from 'components/hall-card'
import HallForm from './form'
import { query } from './api'
import './events.scss'
import dayjs from 'dayjs'
import { hallsQuery } from 'routes/halls'
import { query as toursQuery } from 'routes/tours'
import EventForm from './form'
import Ticket from 'shared/ui/ticket'

export { query as eventsQuery } from './api'
export { default as EventForm } from './form'

const cn = bem('events')

const periodFilterOptions = ['upcoming', 'past', 'all']
const orderOptions = [{
  value: 'date',
  label: 'date'
}, {
  value: 'country',
  label: 'country'
}, {
  value: 'name',
  label: 'name'
}]

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { event_id } = useParams()

  const [filter, setFilter] = useState({ date: 'upcoming' })
  const [order, setOrder] = useState({ by: 'date', dir: 'desc' })
  const [group, setGroup] = useState({ checked: false, value: null})
  const events = useQuery(query)
  const halls = useQuery({
    ...hallsQuery,
    select: data => mapToOptions(
        data,
        item => <><span className={`fi fi-${item.country}`} /> {item.en}</>,
        { pick: ['en', 'base', 'scheme_blob']}
      )
      .filter(item => item.scheme_blob && item.base)
  })
  const tours = useQuery({
    ...toursQuery,
    select: data => mapToOptions(data, 'en').map(item => ({ value: item.label }))
  })

  const items = useMemo(() => {
    if (!events.data) return
    if (['all', 'past'].includes(filter.date)) {
      const res = events.data
      return filter.data === 'all' ? res :
        res.data.filter(item => item.date.getTime() <= Date.now())
    }
    return events.data.filter(item => item.date.getTime() >= Date.now())
  }, [filter, order, events.data])

  const navigate = useNavigate()
  const [{ langCode }] = useAppState()
  const [form] = Form.useForm()
  const [isSending, setIsSending] = useState(false)
  const [isValid, setIsValid] = useState(event_id !== NEW_ITEM_ID)
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData(['config'])?.options || {}
  const countryMap = config?.countries
  const cityMap = config?.cities
  const title = 'event'

  const activeEvent = useMemo(() => {
    if (!event_id) return null
    return event_id === NEW_ITEM_ID ?
      EMPTY_EVENT :
      events.data.find(item => String(item.id) === event_id)
  }, [event_id])

  const periodFilter = periodFilterOptions
    .filter(item => item !== filter.date)
    .map(item => ({ key: item, label:
      <Link
        to={{ search: `?period=${item}` }}
      >
        {item}
      </Link>
    }))

  const renderPeriodFilter = useCallback(() => {
    return (
      <Dropdown
        placement='bottom'
        menu={{ items: periodFilter }}
        trigger={['click']}
      >
        <span className='dashed'>{filter.date}</span>
      </Dropdown> 
    )
  })

  const handleSubmit = useCallback(() => {

  }, [])
  
  return (<>
    <Sidebar buttons sticky>
      {!!event_id && <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/events`)} size='large' shape='default' />}
      <Button icon={event_id ? <SaveOutlined /> : <PlusOutlined />} type='primary' onClick={() => navigate(`/events/create`)} size='large' shape='default'  />
    </Sidebar>
    <div className={cn()}>
      {!event_id && <Typography.Title className={cn('header')} level={1} style={{ margin: '0 0 30px' }}>
        events
      </Typography.Title>}
      {!activeEvent ?
        <Row gutter={[16, 16]}>
          {items?.map(item => (
            <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate(`/halls/${item.id}`)}>
              {dayjs(item.date).format('MM.DD.YYYY')}
            </Col>
          ))}
        </Row> :
        <EventForm
          form={form}
          hallOptions={halls.data || []}
          tourOptions={tours.data || []}
          onSubmit={handleSubmit}
        />
      }
    </div>
    <Sidebar />
  </>
  )
}

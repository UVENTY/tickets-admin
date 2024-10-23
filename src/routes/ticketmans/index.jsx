import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { cn as bem } from '@bem-react/classname'
import TicketmanTable from 'components/ticketman-table/ticketman-table'
import { selectTicketmans } from './selector'
import { query } from './api'
import { query as eventQuery, selectOrderedList } from 'routes/events/api'
import Sidebar from 'shared/layout/sidebar'
import { Flex, Form, Modal, Select, Typography } from 'antd'
import './ticketmans.scss'
import { renderWithFlag } from 'shared/ui/input-city/input-city'
import { keyBy } from 'lodash'
import { formatDate } from 'utils/utils'
import TicketmanForm from './form'
import { EMPTY_OBJECT, NEW_ITEM_ID } from 'consts'
import dayjs from 'dayjs'
import { eventsQuery } from 'routes/events'
import { hallsQuery } from 'routes/halls'
import { toursQuery } from 'routes/tours'
import { useAppState } from 'shared/contexts'
import { axios } from 'api/axios'

const cn = bem('ticketmans')

export { query as ticketmansQuery }

function TicketmansPage() {
  const { data, isLoading } = useQuery(query)
  const [ changedEvents, setChangedEvents ] = useState(null)
  const [isPending, setIsPending] = useState(false)
 
  const renderEventLabel = item => (
    <div style={{ display: 'inline-flex'}}>
      <div style={{ flex: '0 0 100px' }}>
        {renderWithFlag({ value: item?.country, label: item?.city })}
      </div>
      <div style={{ flex: '0 0 150px' }}>
        {dayjs(item?.date).format('DD.MM.YYYY HH:mm')}
      </div>
      <div style={{ flex: '1 1 auto' }}>
        {item?.en || item?.tour?.en}
      </div>
    </div>
  )
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData(['config'])?.options || {}
  const cities = config?.cities || EMPTY_OBJECT
  const halls = useQuery(hallsQuery)
  const eventQuery = useQuery(eventsQuery)
  const tours = useQuery(toursQuery)
  
  const events = useMemo(() => {
    if (!tours.data || !eventQuery.data || !halls.data) return []
    const tourMap = keyBy(tours.data, 'id')
    return eventQuery.data.map(item => {
      const hall = halls.data[item.stadium]
      
      return {
        value: item.id,
        label: renderEventLabel({
          ...item,
          city: cities[hall?.city]?.en,
          country: hall?.country,
          tour: tourMap[item.tournament]
        })
      }
    })
  }, [eventQuery.data, halls.data, tours.data, cities])
  
  const eventFilter = useMemo(() => {
    if (!events.length) return []
    return [{
      value: 'any',
      label: 'regardless of event'
    }, {
      value: 'empty',
      label: 'without the event or with past event'
      }, ...events]
  }, [events])

  const { user_id } = useParams()
  const navigate = useNavigate()
  const [filter, setFilter] = useState({ event: 'any' })
  const form = Form.useForm()

  const handleDelete = useCallback((id_user: string) => {
    const newData = data.filter((item) => item.id_user !== id_user)
    //setDataSource(newData)
  }, [data])

  const initialForm = user_id && user_id !== NEW_ITEM_ID ?
    (data?.find(item => item.id_user === user_id) ?? {}) : {}
  
  const handleAdd = (num) => {
    const newData: DataType = {
      id_user: String(num),
      name: `Edward King ${num}`,
      phone: '32',
      email: `London, Park Lane no. ${num}`,
      sc_id: '5'
    }
    // setDataSource([...dataSource, newData])
    // setCount((num || 0) + 1)
  }

  const handleSave = (row) => {
    const newData = [...data]
    const index = newData.findIndex((item) => row.id_user === item.id_user)
    const item = newData[index]
    newData.splice(index, 1, {
      ...item,
      ...row,
    })
    // setDataSource(newData)
  }

  const changeFilter = useCallback((fieldname) => {
    return value => setFilter(prev => ({ ...prev, [fieldname]: value })) 
  }, [])
  const filteredData = useMemo(() => {
    if (!data) return []
    return data.filter(item => {
      if (filter.event === 'any') return true
      if (filter.event === 'empty') return !item.id_schedule
      return item.id_schedule === filter.event
    })
  }, [data, filter])
  
  return (
    <>
      <Sidebar.Left
        buttons={!user_id ? ['create'].concat(changedEvents ? ['save'] : []) : []/* ['save', 'back'] */}
        loading={isPending}
        onCreate={() => navigate('/ticketmans/create')}
        onSave={async () => {
          setIsPending(true)
          const promises = Object.entries(changedEvents).map(([user_id, item]) => axios.post(`/user/${user_id}`, { data: JSON.stringify(item) }))
          await Promise.all(promises)
          setIsPending(false)
        }}
      />
      <div className={cn()}>
        <Typography.Title className={cn('header')} level={1} style={{ margin: '0 0 30px' }}>
          ticketmans
          <Select
            size='large'
            value={filter.event}
            onChange={changeFilter('event')}
            options={eventFilter}
            className={cn('filter-event')}
          />
        </Typography.Title>
        <TicketmanTable
          data={filteredData}
          events={events}
          loading={isLoading || eventQuery.isLoading}
          pending={isPending}
          onChange={(user_id, field, value) => setChangedEvents({
            ...(changedEvents ?? {}),
            [user_id]: {
              ...(changedEvents?.[user_id] ?? {}),
              [field]: value
            }
          })}
          onCreate={handleAdd}
          onDelete={handleDelete}
          onSave={handleSave}
        />
        {!!user_id && <Modal
          title='Create ticketman'
          onCancel={() => navigate('/ticketmans')}
          footer={null}
          open
        >
          <TicketmanForm
            form={form}
            renderEvent={renderEventLabel}
            initialValues={initialForm}
            close={() => navigate('/ticketmans')}
            pending={isPending}
            events={events}
          />
        </Modal>}
      </div>
      <Sidebar />
    </>
  )
}

export default TicketmansPage
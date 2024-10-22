import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { NEW_ITEM_ID } from 'consts'

const cn = bem('ticketmans')

export { query as ticketmansQuery }

function TicketmansPage() {
  const { data, isLoading } = useQuery(query)
  const { data: events = [], isLoading: isLoadingEvents } = useQuery(eventQuery)
  const [ changedEvents, setChangedEvents ] = useState(null)
 
  const renderEventLabel = item => {
    const eventMap = keyBy(events, 'id')
    const event = eventMap[item?.sc_id] ?? Object.values(eventMap)[0]
    
    return {
      value: item.id,
      label: item.label ||
        <div style={{ display: 'inline-flex'}}>
          <div style={{ flex: '0 0 100px' }}>
            {renderWithFlag({ value: event?.country, label: event?.city })}
          </div>
          <div style={{ flex: '0 0 150px' }}>
            {formatDate(event?.datetme)}
          </div>
          <div style={{ flex: '1 1 auto' }}>
            {event?.name}
          </div>
        </div>
    }
  }
  
  const eventList = useMemo(() => {
    if (!data || !events) return []
    return [{
      id: 'any',
      label: 'regardless of event'
    }, {
      id: 'empty',
      label: 'without the event or with past event'
      }, ...events].map(renderEventLabel)
  }, [data, events])

  const { user_id } = useParams()
  const navigate = useNavigate()
  const [filter, setFilter] = useState({ event: 'any' })
  const form = Form.useForm()

  const handleDelete = useCallback((id_user: string) => {
    const newData = data.filter((item) => item.id_user !== id_user)
    //setDataSource(newData)
  }, [data])

  const initialForm = user_id && user_id !== NEW_ITEM_ID ?
    (data.find(item => item.id_user === user_id) ?? {}) : {}
  
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
  
  return (
    <>
      <Sidebar.Left
        buttons={!user_id ? ['create'].concat(changedEvents ? ['save'] : []) : []/* ['save', 'back'] */}
        onCreate={() => navigate('/ticketmans/create')}
      />
      <div className={cn()}>
        <Typography.Title className={cn('header')} level={1} style={{ margin: '0 0 30px' }}>
          ticketmans
          <Select
            size='large'
            value={filter.event}
            onChange={changeFilter('event')}
            options={eventList}
            className={cn('filter-event')}
          />
        </Typography.Title>
        <TicketmanTable
          data={data}
          events={eventList}
          loading={isLoading || isLoadingEvents}
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
          />
        </Modal>}
      </div>
      <Sidebar />
    </>
  )
}

export default TicketmansPage
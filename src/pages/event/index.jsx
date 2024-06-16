import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button, Table } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { fetchData } from '../../redux/data'
import { useTickets } from '../../api/tickets'
import { useData } from '../../api/data'
import dayjs from 'dayjs'
import Sidebar from '../../components/Layout/sidebar'

export default function PageEvent() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(state => state.user.profile)

  const events = useData(null, { select: data => {
    const { schedule, stadiums, teams, tournaments } = data
    return Object.keys(schedule).map(id => {
      const event = { ...schedule[id] }
      const { stadium, tournament, team1 } = event
      if (stadiums[stadium]) event.stadium = { id: stadium, ...stadiums[stadium] }
      if (tournaments[tournament]) event.tournament = { id: tournament, ...tournaments[tournament] }
      if (teams[team1]) event.team1 = { id: team1, ...teams[team1] }
      return { id, date: dayjs(event.datetime), ...event }
    })
  }})
  const ids = events.data && events.data.map(({ id }) => id).join(',')
  const tickets = useTickets(ids, { group: 'event_id' }, { enabled: !!ids })

  useEffect(() => {
    dispatch(fetchData())
  }, [])

  const columns = [
    {
      title: 'Artist',
      dataIndex: 'team1',
      key: 'team1',
      render: team => team && team.en,
    },
    {
      title: 'Hall',
      dataIndex: 'stadium',
      key: 'stadium',
      render: (stadium) => stadium ? stadium.en : null,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => date.format('DD.MM.YYYY'),
    },
    {
      key: 'tickets',
      title: 'Number of tickets',
      render: ({ id }) => tickets.data && tickets.data[id]?.length
    }
  ]

  return (
    <>
      <Sidebar buttons sticky>
        <Button icon={<PlusOutlined />} type='primary' onClick={() => navigate(`/event/create`)} block>Create</Button>
      </Sidebar>
      <Table
        style={{ flex: '1 1 0'}}
        className='event-table'
        columns={columns}
        dataSource={events.data}
        loading={events.isLoading}
        rowKey={({ id }) => id}
        onRow={record => ({
          onClick: () => user.u_role === '4' && navigate(`/event/${record.id}`)
        })}
      />
    </>
  )
}
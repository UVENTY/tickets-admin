import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button, Row, Table } from 'antd'
import { PlusCircleFilled } from '@ant-design/icons'
import { getColumnSearch } from '../../utils/components'
import { fetchData, getTournamentsList } from '../../redux/data'

const columns = [
  {
    title: 'Name',
    dataIndex: 'en',
    key: 'en',
    sorter: (a, b) => a.en.localeCompare(b.en),
    ...getColumnSearch('name', { getData: 'en' })
  }
]

export default function PageTournaments() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isLoading = useSelector(state => state.data.isLoading)
  const tournaments = useSelector(getTournamentsList)

  useEffect(() => {
    dispatch(fetchData())
  }, [])

  return (
    <>
      <Row
        style={{
          borderBottom: '1px solid #ccc',
          padding: '10px'
        }}
      >
        <Button
          icon={<PlusCircleFilled />}
          type='primary'
          onClick={() => navigate('/tournaments/create')}
        >
          Create tournament
        </Button>
      </Row>
      <Table
        columns={columns}
        dataSource={tournaments}
        loading={isLoading}
        rowKey={({ id }) => id}
        onRow={record => ({
            onClick: () => navigate(`/tournaments/${record.id}`)
        })}
      />
    </>
  )
}
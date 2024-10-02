import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button, Row, Table } from 'antd'
import { PlusCircleFilled, PlusOutlined } from '@ant-design/icons'
import { getColumnSearch } from '../../utils/components'
import { fetchData, getTournamentsList } from '../../redux/data'
import Sidebar from '../../components/layout/sidebar'

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
      <Sidebar buttons sticky>
        <Button icon={<PlusOutlined />} type='primary' onClick={() => navigate('/tournaments/create')} block>Create</Button>
      </Sidebar>
      <Table
        style={{ flex: '1 1 0'}}
        columns={columns}
        dataSource={tournaments}
        loading={isLoading}
        rowKey={({ id }) => id}
        onRow={record => ({
            onClick: () => navigate(`/tournaments/${record.id}`)
        })}
      />
      <Sidebar />
    </>
  )
}
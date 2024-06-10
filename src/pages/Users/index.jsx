import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Tag } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import axios from '../../utils/axios'
import { getColumnSearch } from '../../utils/components'
import { USER_ROLES, USER_ROLES_COLOR } from '../../consts'

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (name, { family }) => [name, family].filter(item => item).join(' ') || 'No name',
    ...getColumnSearch('name', { getData: record => ([record.name, record.family].join(' ')) })
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
    render: email => email || 'No email',
    ...getColumnSearch('email')
  },
  {
    title: 'Role',
    dataIndex: 'id_role',
    key: 'id_role',
    render: text => (<Tag color={USER_ROLES_COLOR[text]}>{USER_ROLES[text]}</Tag>),
    filters: Object.keys(USER_ROLES).map(id => ({
      text: USER_ROLES[id],
      value: id
    })),
    onFilter: (value, record) => record.id_role === value
  },
  {
    title: 'Checked seller',
    dataIndex: 'id_verification_status',
    key: 'id_verification_status',
    render: (state, record) => record.id_role === '2' && state === '2' ? <CheckOutlined style={{ color: '#09d934' }} /> : ''
  }
]

export default function PageUsers() {
  const navigate = useNavigate()

  const { isLoading, data } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.postWithAuth('/query/select', {
        sql: `SELECT id_user,id_role,phone,email,name,family,middle,id_verification_status FROM users WHERE active=1 AND deleted!=1`
      })
      return response.data?.data || []
    }
  })

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={isLoading}
      rowKey={({ id_user }) => id_user}
      onRow={record => ({
        onClick: () => navigate(`/users/${record.id_user}`)
      })}
    />
  )
}
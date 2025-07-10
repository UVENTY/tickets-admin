import { useEffect, useState } from 'react'
import { Table, message } from 'antd'
import CreateUser from './create'
import axios from '../../utils/axios'

export default function ControllersAccordion() {
  const [controllers, setControllers] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchControllers = async () => {
    setLoading(true)
    try {
      const sql = "SELECT id_user, name, family, email, phone FROM users WHERE id_role = 6 AND active = 1 AND deleted = 0"
      const res = await axios.postWithAuth('/query/select', { sql })
      setControllers(res.data?.data || [])
    } catch (e) {
      message.error('Ошибка загрузки списка контроллеров')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchControllers()
  }, [])

  const handleUserCreated = () => {
    fetchControllers()
  }

  return (
    <>
      <CreateUser onUserCreated={handleUserCreated} />
      <Table
        dataSource={controllers}
        loading={loading}
        rowKey="id_user"
        columns={[
          { title: 'Имя', dataIndex: 'name' },
          { title: 'Фамилия', dataIndex: 'family' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Телефон', dataIndex: 'phone' }
        ]}
        pagination={false}
        style={{ marginTop: 24 }}
      />
    </>
  )
} 
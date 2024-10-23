import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Flex, Form, Input, message, Select } from 'antd'
import { get } from 'lodash'
import { useNavigate, useParams, useSubmit } from 'react-router-dom'
import { EMPTY_ARRAY, NEW_ITEM_ID } from 'consts'
import { axios } from 'api/axios'
import { useAppState } from 'shared/contexts'
import Typography from 'antd/es/typography/Typography'
import { eventsQuery } from 'routes/events'
import dayjs from 'dayjs'
import Checkbox from 'antd/es/checkbox/Checkbox'
import { selectOrderedList } from 'routes/events/api'

function LoginInput({ value, onChange }) {
  const [login, ...etc] = String(value).split('@')
  const handleChange = e => onChange(`${e.target.value}@uventy.com`)
  return (
    <Input value={login} onChange={handleChange} />
  )
}

export default function TicketmanForm({ idProp = 'id_user', initialValues = {}, events = [], renderEvent, beforeSubmit, afterSubmit, labels = true, form, close, onSubmit }) {
  const [{ langCode }] = useAppState()
  const navigate = useNavigate()
  const { user_id } = useParams()
  const isNew = user_id === NEW_ITEM_ID
  const queryClient = useQueryClient()

  return (
    <Form
      action='/ticketmans'
      method='post'
      size='large'
      initialValues={initialValues}
      labelCol={{ flex: '0 0 130px' }}
      onFinish={async ({ sc_id, ...values }) => {
        if (values.data) {
          values.data = JSON.stringify(values.data)
        }
        values.u_role = '6'
        const response = await (isNew ? axios.post('/register', values) : axios.post(`/user/${user_id}`, { data: JSON.stringify({ sc_id, ...values }) }))
        const id = response.data?.data?.u_id
        if (id && isNew) {
          await axios.post(`/user/${id}`, { data: JSON.stringify({ sc_id }) })
        }
        navigate(`/ticketmans/${id}`, { replace: true })
        message.success('Saved')
      }}
    >
      {!!user_id && user_id !== NEW_ITEM_ID &&
        <Form.Item name={idProp} style={{ display: 'none' }}>
          <Input type='hidden' value={user_id} />
        </Form.Item>
      }
      <Form.Item
        label='Login'
        name='u_email'
      >
        <Input />
      </Form.Item>
      <Form.Item
        label='Password'
        name={['data', 'password']}
        tooltip={!!initialValues[idProp] && initialValues[idProp] !== NEW_ITEM_ID ?
          'Leave empty to not change password' :
          'After saving, it will be impossible to restore password, only change available'
        }
      >
        <Input  />
      </Form.Item>
      <Form.Item
        label='Name'
        name='u_name'
      >
        <Input />
      </Form.Item>
      <Form.Item
        label='Phone'
        name='u_phone'
      >
        <Input />
      </Form.Item>
      <Form.Item
        label='Event'
        name='id_schedule'
      >
        <Select className='cell-event' options={events} />
      </Form.Item>
      <Form.Item
        label=' '
        name={['data', 'u_details', 'fullAccess']}
        className='no-label'
      >
        <Checkbox>Can mark ticket as invalid</Checkbox>
      </Form.Item>
      <Flex gap={10} justify='flex-end'>
        <Button type='primary' htmlType='submit'>{isNew ? 'Create' : 'Save'}</Button>
        <Button htmlType='button' onClick={() => close && close()}>Cancel</Button>
      </Flex>
    </Form>
  )
}
import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, message, Select } from 'antd'
import { get } from 'lodash'
import { useNavigate, useParams, useSubmit } from 'react-router-dom'
import { EMPTY_ARRAY, NEW_ITEM_ID } from 'consts'
import { axios } from 'api/axios'
import { useAppState } from 'shared/contexts'
import Typography from 'antd/es/typography/Typography'
import { eventsQuery } from 'routes/events'
import dayjs from 'dayjs'
import Checkbox from 'antd/es/checkbox/Checkbox'

function LoginInput({ value, onChange }) {
  const [login, ...etc] = String(value).split('@')
  const handleChange = e => onChange(`${e.target.value}@uventy.com`)
  return (
    <Input value={login} onChange={handleChange} />
  )
}

export default function TicketmanForm({ idProp = 'id_user', initialValues = {}, renderEvent, beforeSubmit, afterSubmit, labels = true, form, close, onSubmit }) {
  const [{ langCode }] = useAppState()
  const navigate = useNavigate()
  const { user_id } = useParams()
  const isNew = user_id === NEW_ITEM_ID
  const queryClient = useQueryClient()
  const events = useQuery({
    ...eventsQuery,
    select: list => list.filter(item => dayjs(item.datetime).valueOf() < Date.now())
      .map(event => ({
        value: event.id,
        label: renderEvent(event)
      }))
  })
  
  return (
    <Form
      action='/ticketmans'
      method='post'
      size='large'
      initialValues={initialValues}
      labelCol={{ flex: '0 0 130px' }}
      onFinish={async (values) => {
        if (values.data) {
          values.data = JSON.stringify(values.data)
        }
        values.u_role = '6'
        await (isNew ? axios.post('/register', values) : axios.post(`/user/${user_id}`, values))
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
        name='sc_id'
      >
        <Select className='cell-event' options={events.data || EMPTY_ARRAY} />
      </Form.Item>
      <Form.Item
        label=' '
        name={['data', 'u_details', 'fullAccess']}
        className='no-label'
      >
        <Checkbox>Can mark ticket as invalid</Checkbox>
      </Form.Item>
      <Button type='primary' htmlType='submit'>Save</Button>
      <Button htmlType='button' onClick={() => close && close()}>Cancel</Button>
    </Form>
  )
}
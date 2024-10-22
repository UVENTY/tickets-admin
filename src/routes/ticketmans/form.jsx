import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Form, Input, Select } from 'antd'
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

export default function TicketmanForm({ idProp = 'id_user', initialValues = {}, renderEvent, beforeSubmit, afterSubmit, labels = true, form, onSubmit }) {
  const [{ langCode }] = useAppState()
  const navigate = useNavigate()
  const { id_user } = useParams()
  const queryClient = useQueryClient()
  const events = useQuery({
    ...eventsQuery,
    select: list => list.filter(item => dayjs(item.datetime).valueOf() < Date.now())
      .map(event => ({
        value: event.id,
        label: renderEvent(event)
      }))
  })

  /* useEffect(() => {
    form && form.setFieldsValue(initialValues)
  }, [initialValues]) */
  console.log(events.data);
  
  return (
    <Form
      action='/ticketmans'
      method='post'
      size='large'
      initialValues={initialValues}
      labelCol={{ flex: '0 0 130px' }}
      onFinish={async (values) => {
        /* beforeSubmit && beforeSubmit(values)
        const response = await axios.post('/data', {
          data: JSON.stringify({
            tournaments: [values]
          })
        })
        const createdId = get(response, ['data', 'data', 'created_id', 'tournaments', 0])
        queryClient.setQueryData(
          ['tours'],
          prev => initialValues[idProp] === NEW_ITEM_ID && createdId ? [{ ...values, id: createdId }, ...prev] :
            [...prev.map(item => item[idProp] === initialValues[idProp] ? { ...item, ...values } : item)]
        )
        afterSubmit && afterSubmit(response) */
      }}
    >
      {!!id_user && id_user !== NEW_ITEM_ID &&
        <Form.Item name={idProp} style={{ display: 'none' }}>
          <Input type='hidden' value={id_user} />
        </Form.Item>
      }
      <Form.Item
        label='Login'
        name='email'
      >
        <Input />
      </Form.Item>
      <Form.Item
        label='Password'
        name='password'
        tooltip={!!initialValues[idProp] && initialValues[idProp] !== NEW_ITEM_ID ?
          'Leave empty to not change password' :
          'After saving, it will be impossible to restore password, only change available'
        }
      >
        <Input  />
      </Form.Item>
      <Form.Item
        label='Name'
        name='name'
      >
        <Input />
      </Form.Item>
      <Form.Item
        label='Phone'
        name='phone'
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
        name='disable'
        className='no-label'
      >
        <Checkbox>Can mark ticket as invalid</Checkbox>
      </Form.Item>
    </Form>
  )
}
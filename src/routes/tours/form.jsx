import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Form, Input } from 'antd'
import { get } from 'lodash'
import { useNavigate, useSubmit } from 'react-router-dom'
import { NEW_ITEM_ID } from 'consts'
import { axios } from 'api/axios'
import { useAppState } from 'shared/contexts'

export default function TourForm({ idProp = 'id', initialValues = {}, beforeSubmit, afterSubmit, labels = true, form, onSubmit }) {
  const [{ langCode }] = useAppState()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  /* useEffect(() => {
    form && form.setFieldsValue(initialValues)
  }, [initialValues]) */
  
  return (
    <Form
      action='/tours'
      method='post'
      form={form}
      initialValues={initialValues}
      onFinish={async (values) => {
        beforeSubmit && beforeSubmit(values)
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
        afterSubmit && afterSubmit(response)
      }}
      layout='vertical'
    >
      {!!initialValues[idProp] && initialValues[idProp] !== NEW_ITEM_ID &&
        <Form.Item name={idProp} style={{ display: 'none' }}>
          <Input type='hidden' value={initialValues[idProp]} />
        </Form.Item>
      }
      <Form.Item
        label={labels && 'Title'}
        name={langCode}
      >
        <Input style={{ fontSize: 16, fontWeight: 700 }} />
      </Form.Item>
      <Form.Item
        label={labels && 'Description'}
        name={`about_${langCode}`}
      >
        <Input.TextArea
          className='description-textarea'
        />
      </Form.Item>
    </Form>
  )
}
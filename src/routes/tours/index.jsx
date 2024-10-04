import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Dropdown, Form, List, Typography } from 'antd'
import { Link, redirect, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CloseOutlined, DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import { axios } from 'api/axios'
import Sidebar from 'shared/layout/sidebar'
import { useAppState } from 'shared/contexts'
import { NEW_ITEM_ID } from 'consts'
import TourForm from './form'
import './tours.scss'

export const query = {
  queryKey: ['tours'],
  queryFn: () => axios.get('/data', { params: { fields: 8 } })
    .then(res =>
      Object.entries(res.data?.data?.data?.tournaments || {})
      .map(([id, item]) => ({ id, ...item }))
      .reverse()
    )
}

export default function Tours() {
  const [ appState ] = useAppState()
  const langCode = appState?.langCode
  const [ searchParams, setSearchParams ] = useSearchParams()
  const id = searchParams.get('inline')
  const tours = useQuery(query)
  const navigate = useNavigate()
  const [ form ] = Form.useForm()
  const [isSending, setIsSending] = useState(false)

  const data = useMemo(() => [
    id === NEW_ITEM_ID ? { id: NEW_ITEM_ID } : null,
    ...(tours.data || [])
  ].filter(Boolean), [id, tours.data])

  useEffect(() => {
    form && form.resetFields()
  }, [id])
  
  return (<>
    <Sidebar />
    <div className='tours'>
      <Typography.Title level={1}>
        <span style={{ verticalAlign: 'middle' }}>Tours</span>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          size='middle'
          style={{ verticalAlign: 'middle', marginLeft: 20 }}
          onClick={() => setSearchParams({ inline: NEW_ITEM_ID })}
        />
      </Typography.Title>
      <List
        className='list list_actions-pos_left'
        pagination={false}
        itemLayout='vertical'
        grid={{ gutter: 16, column: 2 }}
        dataSource={data}
        renderItem={item =>
          <List.Item
            className='list-item'
            actions={String(item.id) === id ? [
              <Button
                icon={<SaveOutlined />}
                type='primary'
                title='Save tour'
                onClick={() => form.submit()}
                loading={isSending}
              />,
              <Button
                icon={<UndoOutlined />}
                onClick={() => navigate(`/tours`)}
                title='Reset unsaved changes'
                type='text'
                disabled={isSending}
              />,
              <Button
                icon={<DeleteOutlined />}
                onClick={() => navigate(`/tours`)}
                title='Delete tour (in progress)'
                type='primary'
                disabled
                danger
              />
            ] : [
              <Button
                icon={<EditOutlined />}
                title='Edit tour'
                onClick={() => setSearchParams({ inline: item.id })}
              />,
              /* <Dropdown menu={{ items: [] }}>
                <Button
                  icon={<MoreOutlined />}
                />
              </Dropdown>, */
            ]}
          >
            {String(item.id) === id ?
              <TourForm
                form={form}
                initialValues={item}
                labels={false}
                beforeSubmit={() => setIsSending(true)}
                afterSubmit={() => {
                  setIsSending(false)
                  searchParams.delete('inline')
                }}
              /> :
              <List.Item.Meta
                style={{ padding: '5.5px 0 0 12px' }}
                title={item[langCode]}
                description={item[`about_${langCode}`]}
              />
            }
          </List.Item>
        }
      />
    </div>
    <Sidebar />
  </>
  )
}

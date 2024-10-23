import { Fragment, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Dropdown, Form, List, Skeleton, Typography } from 'antd'
import { Link, redirect, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CloseOutlined, DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import { axios } from 'api/axios'
import Sidebar from 'shared/layout/sidebar'
import { useAppState } from 'shared/contexts'
import { NEW_ITEM_ID } from 'consts'
import TourForm from './form'
import './tours.scss'

export const toursQuery = {
  queryKey: ['tours'],
  queryFn: () => axios.get('/data', { params: { fields: 8 } })
    .then(res =>
      Object.entries(res.data?.data?.data?.tournaments || {})
      .map(([id, item]) => ({ id, ...item }))
      .reverse()
    )
}

export default function Tours() {
  const [{ langCode }] = useAppState()
  const [ searchParams, setSearchParams ] = useSearchParams()
  const { tour_id } = useParams()
  const tours = useQuery(toursQuery)
  const navigate = useNavigate()
  const [ form ] = Form.useForm()
  const [isSending, setIsSending] = useState(false)

  const data = useMemo(() => [
    tour_id === NEW_ITEM_ID ? { id: NEW_ITEM_ID } : null,
    ...(tours.data || [])
  ].filter(Boolean), [tour_id, tours.data])

  useEffect(() => {
    form && form.resetFields()
  }, [tour_id])
  
  return (<>
    <Sidebar.Left
      buttons={!tour_id ? ['create'] : []/* ['save', 'back'] */}
      onCreate={() => navigate('/tours/create')}
    />
    <div className='tours'>
      <Typography.Title level={1} style={{ margin: '0px 0px 30px' }}>
        <span style={{ verticalAlign: 'middle' }}>tours</span>
        {/* <Button
          type='primary'
          icon={<PlusOutlined />}
          size='middle'
          style={{ verticalAlign: 'middle', marginLeft: 20 }}
          onClick={() => setSearchParams({ inline: NEW_ITEM_ID })}
        /> */}
      </Typography.Title>
      {tours.isLoading ? 
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 20 }}>
          {Array.from({ length: 8 }).map((_, i) =>
            <div style={{ flex: '0 0 calc(50% - 10px)' }} key={i}>
              <Skeleton.Input type='round' style={{ marginBottom: 15 }} active block />
              <Skeleton.Input type='round' style={{ marginBottom: 60 }} active block />
            </div>            
          )}
        </div> :
        <List
          className='list list_actions-pos_left'
          pagination={false}
          itemLayout='vertical'
          grid={{ gutter: 16, column: 2 }}
          dataSource={data}
          renderItem={item =>
            <List.Item
              className='list-item'
              actions={String(item.id) === tour_id ? [
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
                  onClick={() => navigate(`/tours/${item.id}`)}
                />,
                /* <Dropdown menu={{ items: [] }}>
                  <Button
                    icon={<MoreOutlined />}
                  />
                </Dropdown>, */
              ]}
            >
              {String(item.id) === tour_id ?
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
      }
    </div>
    <Sidebar />
  </>
  )
}

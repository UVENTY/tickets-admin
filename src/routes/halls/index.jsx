import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Col, Descriptions, Dropdown, Form, List, Row, Typography } from 'antd'
import { Link, Outlet, redirect, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CloseOutlined, DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import Sidebar from 'shared/layout/sidebar'
import { useAppState } from 'shared/contexts'
import HallForm from './form'
import { parseJson } from 'utils/utils'
import { EMPTY_HALL, NEW_ITEM_ID } from 'consts'
import { query } from './api'
import './halls.scss'
import { omit, pick } from 'lodash'
import { axios } from 'api/axios'

export default function Halls() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { hall_id } = useParams()
  const halls = useQuery(query)
  const navigate = useNavigate()
  const [{ langCode }] = useAppState()
  const [form] = Form.useForm()
  const [isSending, setIsSending] = useState(false)
  const [isValid, setIsValid] = useState(hall_id !== 'create')
  const title = 'concert hall'

  const activeHall = useMemo(() => {
    if (!hall_id) return null
    return hall_id === NEW_ITEM_ID ?
      EMPTY_HALL :
      halls.data.find(item => String(item.id) === hall_id)
  }, [hall_id])

  useEffect(() => {
    if (!activeHall) {
      if (hall_id) navigate('/halls', { replace: true })
      return
    }
    if (activeHall.scheme_blob) {
      axios.get(activeHall.scheme_blob).then(res => console.log(res))
    }
    form.setFieldsValue(activeHall)
  }, [activeHall])
  
  return (<>
    <Sidebar />
    <div className='halls'>
      <Typography.Title className='halls-header' level={1}>
        {!!hall_id && <div className='halls-action'>
          {hall_id === 'create' ? 'create' : 'edit'}
        </div>}
        {hall_id ? <Link className='crumbs-link crumb-root' to='/halls'>{title}</Link> : `${title}s`}
        {!hall_id && <Button
          type='primary'
          icon={<PlusOutlined />}
          size='middle'
          style={{ verticalAlign: 'middle', marginLeft: 10 }}
          onClick={() => navigate(`/halls/${NEW_ITEM_ID}`)}
        />}
      </Typography.Title>
      {!activeHall ? <Row gutter={[16, 16]}>
        {halls.data?.map(item => (
          <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate(`/halls/${item.id}`)}>
            <Card title={item.en}>
              Country <b>{item.country}</b><br />
              City <b>{item.city}</b><br />
              Address <b>{item.address_en}</b>
            </Card>
          </Col>
        ))}
      </Row> :
      <HallForm form={form} />
    }  
    </div>
    <Sidebar buttons sticky>
      {!!activeHall && <Button
        icon={<SaveOutlined />}
        type='primary'
        style={{ marginTop: 20 }}
        title={isValid ? 'Save' : 'Required fields: name, country, city, address, scheme'}
        onClick={() => form.submit()}
        loading={isSending}
        block
      >
        Save
      </Button>}
    </Sidebar>
  </>
  )
}

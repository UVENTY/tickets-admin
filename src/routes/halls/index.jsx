import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Dropdown, Form, List, Typography } from 'antd'
import { Link, Outlet, redirect, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CloseOutlined, DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import Sidebar from 'shared/layout/sidebar'
import { useAppState } from 'shared/contexts'
import HallForm from './form'
import { parseJson } from 'utils/utils'
import { NEW_ITEM_ID } from 'consts'
import { query } from './api'
import './halls.scss'

export default function Halls() {
  const [appState] = useAppState()
  const langCode = appState?.langCode
  const [searchParams, setSearchParams] = useSearchParams()
  const { id, dataType = 'location' } = useParams()
  const halls = useQuery(query)
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [isSending, setIsSending] = useState(false)
  const title = 'concert hall'

  return (<>
    <Sidebar />
    <div className='halls'>
      <Typography.Title className='halls-header' level={1}>
        {!!id && <div className='halls-action'>
          {id === 'create' ? 'create' : 'edit'}
        </div>}
        {id ? <Link className='crumbs-link crumb-root' to='/halls'>{title}</Link> : `${title}s`}
        {!id && <Button
          type='primary'
          icon={<PlusOutlined />}
          size='middle'
          style={{ verticalAlign: 'middle', marginLeft: 10 }}
          onClick={() => navigate(`./${NEW_ITEM_ID}`)}
        />}
      </Typography.Title>
      {!id ? <>
        <Typography.Paragraph>
          Базовые данные залов (включая схему), не привязанные к мероприятию.
          <br />
          При выборе зала для мероприятия создается копия шаблона,
          и все изменения происходят уже в ней, не влияя на основу.
        </Typography.Paragraph>
      </> :
      <HallForm />}
    </div>
    <Sidebar />
  </>
  )
}

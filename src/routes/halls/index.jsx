import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { omit, pick } from 'lodash'
import { Button, Card, Col, Descriptions, Dropdown, Form, List, Row, Skeleton, Space, Typography } from 'antd'
import { cn as bem } from '@bem-react/classname'
import { Link, Outlet, redirect, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeftOutlined, CloseOutlined, DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import Sidebar from 'shared/layout/sidebar'
import { useAppState } from 'shared/contexts'
import { jsonBase64, parseJson } from 'utils/utils'
import { EMPTY_HALL, NEW_ITEM_ID } from 'consts'
import { ViewCard as HallCard } from 'components/halls'
import HallForm from './form'
import { Skeleton as HallSkeleton } from 'components/halls'
import { query, selector } from './api'
import { updateStadium } from 'shared/api/data'
import './halls.scss'

export { query as hallsQuery } from './api'
export { default as HallForm } from './form'

const cn = bem('halls')

export default function Halls() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { hall_id } = useParams()
  const halls = useQuery({
    ...query,
    select: selector.list({
      filter: item => item.base,
      sorter: (a, b) => a.country.localeCompare(b.country)
    })
  })
  const navigate = useNavigate()
  const [{ langCode }] = useAppState()
  const [form] = Form.useForm()
  const [isSending, setIsSending] = useState(false)
  const [isValid, setIsValid] = useState(hall_id !== NEW_ITEM_ID)
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData(['config'])?.options || {}
  const title = 'concert hall'
  const activeHall = useMemo(() => {
    if (!hall_id) return null
    return hall_id === NEW_ITEM_ID ?
      EMPTY_HALL :
      halls.data?.find(item => String(item.id) === hall_id)
  }, [halls.data, hall_id])

  useEffect(() => {
    if (halls.isLoading) return
    if (!activeHall) {
      if (hall_id) navigate('/halls', { replace: true })
      return
    }
    form.setFieldsValue({ ...activeHall, scheme: activeHall.scheme_blob })
  }, [activeHall, halls.isLoading])

  const handleSubmit = useCallback(async ({ location, ...values }, scheme) => {
    setIsSending(true)
    if (hall_id !== NEW_ITEM_ID) values.id = hall_id
    const categories = scheme.categories.map(({ seats, rows, seatsCount, ...item }) => item)
    values.scheme_blob = await jsonBase64({ ...scheme, categories })
    values.scheme = JSON.stringify({ base: true })
    const response = await updateStadium(values)
    queryClient.invalidateQueries({
      queryKey: ['halls'],
      refetchType: 'all',
    })
    setIsSending(false)
  }, [hall_id])
  
  const saveBtn = <Button
    icon={hall_id ? <SaveOutlined /> : <PlusOutlined />}
    type='primary'
    size='large'
    onClick={() => !hall_id ? navigate(`/halls/create`) : form.submit()}
    loading={isSending}
    title='Save'
  />

  const sidebarButtons = useMemo(() => hall_id ? ['back', 'save'] : ['create'], [hall_id])

  return (<>
    <Sidebar.Left
      buttons={sidebarButtons}
      loading={isSending}
      onCreate={() => navigate(`/halls/create`)}
      onBack={() => navigate(`/halls`)}
      onSave={() => form.submit()}
    />
    <div className={cn()}>
      {!hall_id && <Typography.Title className={cn('header')} level={1} style={{ margin: '0 0 30px' }}>
        concert halls
      </Typography.Title>}
      {!activeHall ? <Row gutter={[16, 16]}>
        {halls.isLoading && (
          !hall_id ? Array.from({ length: 24 }).map((_, i) =>
            <Col span={6} key={i}>
              <Skeleton.Button style={{ width: '100%', height: 80 }} active block />
            </Col>
          ) : <Col span={24}>
            <HallSkeleton />
          </Col>
        )}
        {halls.data?.map(item => (
          <Col span={6} key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/halls/${item.id}`)}>
            <HallCard
              title={item.en}
              countryCode={item.country}
              city={config.cities?.[item.city]?.en}
              country={config.countries?.[item.country]?.en}
              address={item.address_en}
            />
          </Col>
        ))}
      </Row> : <HallForm
        form={form}
        schemeFile={activeHall.scheme_blob}
        onSubmit={handleSubmit}
      />
    }  
    </div>
    <Sidebar />
  </>
  )
}

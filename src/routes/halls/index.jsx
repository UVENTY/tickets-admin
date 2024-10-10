import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { omit, pick } from 'lodash'
import { Button, Card, Col, Descriptions, Dropdown, Form, List, Row, Typography } from 'antd'
import { cn as bem } from '@bem-react/classname'
import { Link, Outlet, redirect, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeftOutlined, CloseOutlined, DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import Sidebar from 'shared/layout/sidebar'
import { useAppState } from 'shared/contexts'
import { jsonBase64, parseJson } from 'utils/utils'
import { EMPTY_HALL, NEW_ITEM_ID } from 'consts'
import HallCard from 'components/hall-card'
import HallForm from './form'
import { query } from './api'
import './halls.scss'
import { updateStadium } from 'shared/api/data'

const cn = bem('halls')

export default function Halls() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { hall_id } = useParams()
  const halls = useQuery(query)
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
      halls.data.find(item => String(item.id) === hall_id)
  }, [hall_id])

  useEffect(() => {
    if (!activeHall) {
      if (hall_id) navigate('/halls', { replace: true })
      return
    }
    form.setFieldsValue({ ...activeHall, scheme: activeHall.scheme_blob })
  }, [activeHall])

  const handleSubmit = useCallback(async ({ location, ...values }, scheme) => {
    setIsSending(true)
    if (hall_id !== NEW_ITEM_ID) values.id = hall_id
    const categories = scheme.categories.map(({ seats, rows, seatsCount, ...item }) => item)
    values.scheme_blob = await jsonBase64({ ...scheme, categories })
    const response = await updateStadium(values)
    queryClient.invalidateQueries({
      queryKey: ['data', 'halls'],
      refetchType: 'all',
    })
    setIsSending(false)
  }, [hall_id])
  
  return (<>
    <Sidebar buttons sticky>
      {!!hall_id && <Button
        icon={<ArrowLeftOutlined />}
        size='large'
        onClick={() => navigate(`/halls`)}
        disabled={isSending}
      />}
      <Button
        icon={hall_id ? <SaveOutlined /> : <PlusOutlined />}
        type='primary'
        size='large'
        onClick={() => !hall_id ? navigate(`/halls/create`) : form.submit()}
        loading={isSending}
      />
    </Sidebar>
    <div className={cn()}>
      {!hall_id && <Typography.Title className={cn('header')} level={1} style={{ margin: '0 0 30px' }}>
        concert halls
      </Typography.Title>}
      {!activeHall ? <Row gutter={[16, 16]}>
        {halls.data?.map(item => (
          <Col span={6} style={{ cursor: 'pointer' }} onClick={() => navigate(`/halls/${item.id}`)}>
            <HallCard
              title={item.en}
              countryCode={item.country}
              city={config.cities?.[item.city]?.en}
              country={config.countries?.[item.country]?.en}
              address={item.address_en}
            />
          </Col>
        ))}
      </Row> :
      <HallForm
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

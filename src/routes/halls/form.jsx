import { useQueryClient } from '@tanstack/react-query'
import { axios } from 'api/axios'
import { useNavigate, useParams } from 'react-router-dom'
import Typography from 'antd/es/typography/Typography'
import { Button, Col, Divider, Form, Input, Row, Select, Space, Steps, Upload } from 'antd'
import { useAppState } from 'shared/contexts'
import { toText } from 'utils/utils'
import { getCategories, removeColorsAndSerialize, transformScheme } from 'utils/svg'
import { defaultCustomProps } from 'components/SvgSchemeEditor/consts'
import { useCallback, useState } from 'react'
import SvgScheme from 'components/SvgScheme'
import Categories from 'components/SvgSchemeEditor/categories'
import { NEW_ITEM_ID, NON_SEAT_ROW } from 'consts'
import { BorderBottomOutlined, BorderTopOutlined, ControlOutlined, EnvironmentOutlined } from '@ant-design/icons'
import InputCity from 'shared/ui/input-city'
import { useLocalStorage } from 'utils/hooks'
import { query, updateData } from './api'

const SEATS = [
  {
    title: 'located in',
    dataType: 'location',
    icon: <EnvironmentOutlined />,
  }, {
    title: 'scheme',
    dataType: 'scheme',
    icon: <BorderTopOutlined />
  }, {
    title: 'seats parameters',
    dataType: 'seats',
    icon: <ControlOutlined />
  }
]

export default function HallForm() {
  const [{ langCode }] = useAppState()
  const { id, dataType = 'location' } = useParams()
  const currentPageIndex = SEATS.findIndex(item => item.dataType === dataType)
  const [isSending, setIsSending] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const cache = queryClient.getQueryData(query.queryKey)
  const item = cache?.[id]
  const [scheme, setScheme] = useState({ categories: [], customProps: defaultCustomProps, scheme: '' })
  const [newHallForm, setNewHallForm] = useLocalStorage('new_hall_form', {})

  const handleChangeCategory = useCallback((index, key, value) => {
    setScheme(prev => ({ ...prev, categories: prev.categories.map((item, i) => i === index ? { ...item, [key]: value } : item) }))
  }, [])

  const deleteCategory = useCallback((value) => {
    setScheme(prev => ({ ...prev, categories: prev.categotries.filter((cat) => cat.value !== value) }))
  }, [])

  const reorderCategories = useCallback((index, targetIndex) => {
    const items = [...scheme.categories]
    const [removed] = items.splice(index, 1)
    items.splice(targetIndex, 0, removed)
    setScheme(prev => ({ ...prev, categories: items }))
  })

  if (currentPageIndex < 0) {
    return (
      <Typography.Title level={2}>Page not found</Typography.Title>
    )
  }

  if (id !== NEW_ITEM_ID && !item) {
    return (
      <Typography.Title level={2}>Hall not found</Typography.Title>
    )
  }
  
  return (
    <Form
      size='large'
      layout='vertical'
      className='hall-form'
      disabled={isSending}
      onFinish={async (values) => {
        const response = await updateData({ stadiums: [values]  })
        queryClient.setQueryData(query.queryKey, prev => {
          const map = { ...prev }
          map[response.data.data.created_id] = values
          return map
        })
      }}
    >
      {id !== NEW_ITEM_ID && <Form.Item name='id' style={{ display: 'none' }}><input type='hidden' value={id} /></Form.Item>}
      <Typography.Title level={2} className='hall-title'>
        <Form.Item name='name' style={{ marginBottom: 0 }}>
          <Input
            className='hall-name'
            placeholder='with the name'
            rules={[{ required: true }]}
            variant='borderless'
            autoFocus
          />
        </Form.Item>
      </Typography.Title>
      
      <Steps
        current={currentPageIndex}
        items={SEATS}
      />      

      <Row gutter={[16, 0]} style={{ marginTop: 40, display: currentPageIndex === 0 ? undefined : 'none' }}>
        <Col span={12}>
          <InputCity
            name={['country', 'city']}
            label={['Country', 'City']}
            required
          />
        </Col>
        <Col span={12}>
          <Form.Item
            name={`address_${langCode}`}
            label='Address'
            required
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ display: currentPageIndex === 1 ? 'block' : 'none' }}>
        {/* <Upload
          accept='.svg'
          itemRender={() => null}
          customRequest={e => toText(e.file)
            .then(transformScheme)
            .then(scheme => ({ categories: getCategories(scheme), scheme: clearFillAndStringify(scheme) }))
            .then(({ categories, scheme }) => {
              setScheme(scheme)
              setCategories(categories)
              setCustomProps(defaultCustomProps)
            })}
        >
          <Button size='large' type='primary' htmlType='button' icon={<UploadOutlined />}>Upload from svg</Button>
        </Upload> */}
      </div>

      <Row gutter={16} className='hall-actions'>
        <Col span={8}>
          <Button block>
            Cancel
          </Button>
        </Col>
        <Col span={8}>
          {currentPageIndex > 0 && <Button
            onClick={() => navigate(`/halls/${id}/${SEATS[currentPageIndex - 1].dataType}`)}
            block
          >
            ← Back
          </Button>}
        </Col>
        <Col span={8}>
          <Button
            type='primary'
            loading={isSending}
            onClick={() => navigate(`/halls/${id}/${SEATS[currentPageIndex + 1].dataType}`)}
            block
            outlined
          >
            Next →
          </Button>
        </Col>
      </Row>
    </Form>
  )
}
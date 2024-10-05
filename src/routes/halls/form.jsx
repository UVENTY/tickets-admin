import { useQueryClient } from '@tanstack/react-query'
import { axios } from 'api/axios'
import { useNavigate, useParams } from 'react-router-dom'
import Typography from 'antd/es/typography/Typography'
import { Button, Col, Divider, Form, Input, Row, Segmented, Select, Space, Steps, Upload } from 'antd'
import { useAppState } from 'shared/contexts'
import { toText } from 'utils/utils'
import { getCategories, removeColorsAndSerialize, transformScheme } from 'utils/svg'
import { defaultCustomProps } from 'components/SvgSchemeEditor/consts'
import { useCallback, useState } from 'react'
import SvgScheme from 'components/SvgScheme'
import Categories, { Category } from 'components/SvgSchemeEditor/categories'
import { clearFillAndStringify } from 'components/SvgSchemeEditor/utils'
import { SortableList } from 'components/sortable-list'
import { NEW_ITEM_ID, NON_SEAT_ROW } from 'consts'
import { BorderBottomOutlined, BorderTopOutlined, ControlOutlined, EnvironmentOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons'
import InputCity from 'shared/ui/input-city'
import { useLocalStorage } from 'utils/hooks'
import cache from 'shared/api/cache'
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
    title: 'seats options',
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
      
      {/* <Steps
        current={currentPageIndex}
        items={SEATS}
        style={{ marginBottom: 40 }}
      /> */}  
      <Divider orientation='left'>
        <EnvironmentOutlined style={{ color: 'var(--ant-color-primary)'}} /> Scheme
      </Divider>

      <Row gutter={[16, 0]}>
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
      
      <Divider orientation='left'>
        <EnvironmentOutlined style={{ color: 'var(--ant-color-primary)' }} /> Located in
      </Divider>
      <div>
        {scheme.scheme ?
          <Row gutter={16}>
            <Col span={16}>
              <Button type='primary' style={{ position: 'absolute', transform: 'translateX(-110%)' }} onClick={() => setScheme({ categories: [], customProps: defaultCustomProps, scheme: '' })} danger>Remove scheme</Button>
              <SvgScheme
                src={scheme.scheme}
                categories={scheme.categories}
              />
            </Col>
            <Col span={8}>
              <Typography.Title level={3} style={{ color: '#222', marginTop: 0 }}>Categories</Typography.Title>
              <SortableList
                items={scheme.categories}
                onChange={list => setScheme(prev => ({ ...prev, categories: list }))}
                renderItem={(item) => (
                  <SortableList.Item id={item.id}>
                    <Category {...item} onChange={handleChangeCategory} onDelete={deleteCategory} />
                    <SortableList.DragHandle />
                  </SortableList.Item>
                )}
              />
            </Col>
          </Row> :
          <Upload.Dragger
            accept='.svg'
            itemRender={() => null}
            customRequest={e => toText(e.file)
              .then(transformScheme)
              .then(scheme => setScheme({
                categories: getCategories(scheme),
                scheme: clearFillAndStringify(scheme),
                customProps: defaultCustomProps
              })
            )}
            block
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Нажмите на эту область или перетащите сюда svg-файл со схемой</p>
          </Upload.Dragger>
        }
      </div>

      <div style={currentPageIndex === 2 ? undefined : { display: 'none' }}>
        {scheme.categories.length === 0 ?
          'Separated seats on the scheme not found' :
          scheme.categories.map(cat => (
            <div>
              <Typography.Title level={3}>{cat.label}</Typography.Title>
              {cat.rows?.length > 0 &&
                <div className='hall-rows'>
                  {cat.rows.map(row => (
                    <div className='hall-row'>
                      <div className='hall-row-num'>{row}</div>
                      <div className='hall-seats'>
                        {cat.seats.filter(seat => seat.row === row).sort((a, b) => a.seat > b.seat ? 1 : -1).map(seat =>
                          <button className='hall-seat'>{seat.seat}</button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>}
            </div>
          ))
        }
      </div>
    </Form>
  )
}
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import classNames from 'classnames'
import { pick, keyBy } from 'lodash'
import { cn as bem } from '@bem-react/classname'
import {
  BarsOutlined,
  BorderBottomOutlined,
  BorderTopOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  EnvironmentOutlined,
  SettingOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { Typography, Col, Divider, Form, Input, Modal, Row, Segmented, Select, Space, Steps, Table, Upload, Skeleton } from 'antd'
import { useAwwwwwwwwwawwwd ppState } from 'shared/contexts'
import {
  countOccurrences,
  jsonBase64,
  random,
  toBase64,
  toText
} from 'utils/utils'
import { defaultSeatParams, findSeatElement, getCategories, isEqualSeats, transformScheme } from 'utils/svg'
import { activeSeatClassName, seatClassName } from 'components/SvgSchemeEditor/consts'
import SvgScheme from 'components/svg-scheme'
import Categories, { Category } from 'components/SvgSchemeEditor/categories'
import { clearFillAndStringify } from 'components/SvgSchemeEditor/utils'
import { SortableList } from 'components/sortable-list'
import { DATA_TYPES, NEW_ITEM_ID, NON_SEAT_ROW } from 'consts'
import InputCity from 'shared/ui/input-city'
import { useLocalStorage } from 'utils/hooks'
import cache from 'shared/api/cache'
import Fieldset, { FieldsetTitle } from 'shared/ui/fieldset'
import { axios } from 'api/axios'
import { query, updateData } from './api' 
import { useQuery } from '@tanstack/react-query'
import { SchemeFieldset, SeatParamsFieldset } from 'components/halls'
import { transformResponse } from 'shared/api/scheme'

const cn = bem('halls')

export default function HallForm({ form, schemeFile, onSubmit }) {
  const svgRef = useRef(null)
  const { hall_id } = useParams()
  const [{ langCode }] = useAppState()
  const [scheme, setScheme] = useState({ categories: [], seatParams: defaultSeatParams, scheme: '' })
  const schemeJson = useQuery({
    queryKey: ['scheme', hall_id],
    queryFn: () => axios.get(schemeFile).then(res => res.data),
    enabled: !!schemeFile && hall_id !== 'create'
  })

  useEffect(() => {
    const newScheme = transformResponse(schemeJson.data)
    setScheme(newScheme)
  }, [schemeJson.data])

  return (
    <Form
      size='large'
      layout='vertical'
      className={cn('form')}
      form={form}
      onFinish={values => onSubmit && onSubmit(values, scheme)}
    >
      {hall_id !== NEW_ITEM_ID && <Form.Item name='id' style={{ display: 'none' }}><input type='hidden' value={hall_id} /></Form.Item>}
      <Typography.Title
        className={cn('header')}
        level={1}
        style={{ display: 'flex', margin: '0 0 30px' }}
      >
        concert hall
        <Form.Item
          name={langCode}
          style={{ marginBottom: 0, flex: '1 1 auto', position: 'relative', top: -7, left: 10 }}
        >
          <Input
            className='input_huge'
            placeholder='name'
            rules={[{ required: true }]}
            variant='borderless'
            autoFocus
          />
        </Form.Item>
      </Typography.Title>
      
      <Fieldset
        title='located in'
        icon={<EnvironmentOutlined className='fs-icon' />}
      >
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <InputCity
              name={['country', 'city']}
              label={['Country', 'City']}
              form={form}
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
      </Fieldset>

      <SchemeFieldset
        {...scheme}
        onChange={setScheme}
        ref={svgRef}
        isLoading={schemeJson.isLoading}
      />
      
      <SeatParamsFieldset
        items={scheme?.seatParams}
        onChange={seatParams => setScheme(prev => ({ ...prev, seatParams }))}
      />
    </Form>
  )
}

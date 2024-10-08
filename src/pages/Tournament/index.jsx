import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { Col, Row, Form, Button } from 'antd'
import { ArrowLeftOutlined, CaretLeftFilled, SaveOutlined } from '@ant-design/icons'
import MultilangInput from '../../components/MultilangInput'
import { fetchData, getTournament, postData } from '../../redux/data'
import Sidebar from '../../components/Layout/sidebar'

export default function PageTournament() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = id === 'create'
  const isSubmitting = useSelector(state => state.data.isSubmitting)
  const isLoaded = useSelector(state => state.data.isLoaded)
  const isLoading = useSelector(state => state.data.isLoading)
  const tournament = useSelector(state => getTournament(state, id))
  const [ form ] = Form.useForm()
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      dispatch(fetchData())
    }
  }, [isLoaded, isLoading])

  if (!tournament && !isNew) {
    return null
  }

  const initialValues = !tournament ? {} : {
    name: {
      en: tournament.en,
      ru: tournament.ru,
      ar: tournament.ar,
      fr: tournament.fr,
      es: tournament.es
    },
    about: {
      en: tournament.about_en,
      ru: tournament.about_ru,
      ar: tournament.about_ar,
      fr: tournament.about_fr,
      es: tournament.about_es
    }
  }

  return (<>
    <Sidebar buttons sticky>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tournaments')} block>Back</Button>
      <Button icon={<SaveOutlined />} type='primary' onClick={() => form.submit()} loading={isSubmitting} block>Save</Button>
    </Sidebar>
    <Form
      style={{ flex: '1 1 0'}}
      form={form}
      layout='vertical'
      onFinish={values => {
        const { name, about } = values
        const tournament = {
          ...name,
          about_en: about.en,
          about_ru: about.ru,
          about_ar: about.ar,
          about_fr: about.fr,
          about_es: about.es
        }
        if (!isNew) tournament.id = id
        dispatch(postData({ tournaments: [tournament] })).then(() => navigate('/tournaments'))
      }}
      initialValues={initialValues}
    >
      <Row style={{ margin: '20px 20px 0 20px' }}>
        <Col
          span={12}
          style={{ padding: '0 10px 0 0' }}
        >
          <Form.Item
            label='Name'
            name='name'
          >
            <MultilangInput
              size='large'
            />
          </Form.Item>
        </Col>
        <Col
          span={12}
          style={{ padding: '0 0 0 10px' }}
        >
          <Form.Item
            label='About'
            name='about'
          >
            <MultilangInput
              size='large'
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
    <Sidebar />
    </> )
}
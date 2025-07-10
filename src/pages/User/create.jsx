import { useState } from 'react'
import { Form, Input, Select, Button, message, Row, Col, Card } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import axios from '../../utils/axios'
import { USER_ROLES } from '../../consts'
import md5 from 'md5'

const { Option } = Select

export default function CreateUser({ onUserCreated }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      if (!values.name || values.name.trim() === '') {
        message.error('Пожалуйста, введите имя!')
        setLoading(false)
        return
      }
      if (!values.email || values.email.trim() === '') {
        message.error('Пожалуйста, введите email!')
        setLoading(false)
        return
      }
      if (!values.phone || values.phone.trim() === '') {
        message.error('Пожалуйста, введите телефон!')
        setLoading(false)
        return
      }
      const checkSql = `SELECT id_user FROM users WHERE email = '${values.email}' AND active = 1 AND deleted != 1`;
      const checkResponse = await axios.postWithAuth('/query/select', { sql: checkSql })
      if (checkResponse.data?.data && checkResponse.data.data.length > 0) {
        message.error('Пользователь с таким email уже существует!')
        setLoading(false)
        return
      }
      const pwdHash = md5(md5(values.pwd));
      const referralCode = `uid${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const secretId = `s${Date.now()}${Math.floor(Math.random() * 100000)}`;
      const now = 'NOW()';
      const fields = [];
      const vals = [];
      fields.push('pwd'); vals.push(`'${pwdHash}'`);
      fields.push('id_role'); vals.push(`'${values.id_role}'`);
      fields.push('active'); vals.push('1');
      fields.push('deleted'); vals.push('0');
      fields.push('create_datetime'); vals.push(now);
      fields.push('referral_code'); vals.push(`'${referralCode}'`);
      fields.push('secret_id'); vals.push(`'${secretId}'`);
      if (values.name) { fields.push('name'); vals.push(`'${values.name}'`); }
      if (values.family) { fields.push('family'); vals.push(`'${values.family}'`); }
      if (values.middle) { fields.push('middle'); vals.push(`'${values.middle}'`); }
      if (values.email) { fields.push('email'); vals.push(`'${values.email}'`); }
      if (values.phone) { fields.push('phone'); vals.push(`'${values.phone}'`); }
      const sqlInsert = `INSERT INTO users (${fields.join(', ')}) VALUES (${vals.join(', ')})`;
      const response = await axios.postWithAuth('/query/insert', { sql: sqlInsert });
      if (response.data?.status === 'success') {
        const getIdSql = `SELECT id_user FROM users WHERE email = '${values.email}' ORDER BY id_user DESC LIMIT 1`;
        const idRes = await axios.postWithAuth('/query/select', { sql: getIdSql });
        const newId = idRes.data?.data?.[0]?.id_user;
        if (newId) {
          const updateSql = `UPDATE users SET last_edit_user = ${newId}, last_edit_datetime = NOW(), create_user = ${newId}, referral_code = 'uid${newId}' WHERE id_user = ${newId}`;
          await axios.postWithAuth('/query/insert', { sql: updateSql });
        }
        form.resetFields();
        if (onUserCreated) onUserCreated();
        message.success('Пользователь успешно создан!')
        message.info(`Пользователь может войти в tickets-control используя email: ${values.email} и созданный пароль`)
      } else {
        message.error('Ошибка при создании пользователя')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      message.error('Ошибка при создании пользователя')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    form.submit()
  }

  const handleButtonClick = () => {
    form.submit()
  }

  const roleOptions = Object.entries(USER_ROLES).map(([value, label]) => ({ value, label }))

  return (
    <div style={{ flex: '1 1 0', padding: '20px' }}>
      <Card title="Создание нового пользователя" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div onSubmit={handleFormSubmit}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ id_role: '6', active: true }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Имя"
                  rules={[{ required: true, message: 'Пожалуйста, введите имя!' }]}
                >
                  <Input placeholder="Введите имя" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="family"
                  label="Фамилия"
                >
                  <Input placeholder="Введите фамилию" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="middle"
                  label="Отчество"
                >
                  <Input placeholder="Введите отчество" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="id_role"
                  label="Роль"
                  rules={[{ required: true, message: 'Пожалуйста, выберите роль!' }]}
                >
                  <Select placeholder="Выберите роль">
                    {roleOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Пожалуйста, введите email!' },
                    { type: 'email', message: 'Пожалуйста, введите корректный email!' }
                  ]}
                >
                  <Input placeholder="Введите email" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Телефон"
                  rules={[{ required: true, message: 'Пожалуйста, введите телефон!' }]}
                >
                  <Input placeholder="Введите телефон" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="pwd"
                  label="Пароль"
                  rules={[
                    { required: true, message: 'Пожалуйста, введите пароль!' },
                    { min: 6, message: 'Пароль должен содержать минимум 6 символов!' }
                  ]}
                >
                  <Input.Password placeholder="Введите пароль" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Подтвердите пароль"
                  dependencies={['pwd']}
                  rules={[
                    { required: true, message: 'Пожалуйста, подтвердите пароль!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('pwd') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Пароли не совпадают!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Подтвердите пароль" />
                </Form.Item>
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Button 
                icon={<SaveOutlined />} 
                type='primary' 
                onClick={handleButtonClick}
                loading={loading}
                block
                style={{ maxWidth: 600, width: '100%', margin: '0 auto', display: 'block' }}
              >
                Создать пользователя
              </Button>
            </div>
          </Form>
        </div>
      </Card>
    </div>
  )
} 
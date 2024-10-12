import { Col, Form, Input, Row } from 'antd';

export default function FormTemplate() {
  return (
    <Row gutter={[16]}>
      <Col span={12}>
        <Form.Item
          label='E-mail subject'
          name='template_subject'
        >
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label='Body'
          name='template_body'
        >
          <Input.TextArea />
        </Form.Item>
      </Col>
    </Row>
  )
}
import cn from 'classnames'
import s from './layout.module.scss'
import { Button, Space } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'

export default function Sidebar({ buttons, sticky, children }) {
  return (
    <div
      className={cn(s.sidebar, {
        [s.sidebar__buttons]: buttons,
        [s.sidebar__sticky]: sticky
      })}
    >
      <div>
        {children}
      </div>
    </div>
  )
}

Sidebar.Left = ({ buttons = [], loading, onCreate, onSave, onBack }) => (
  <Sidebar buttons sticky>
    {buttons.includes('create') && <Button
      icon={<PlusOutlined />}
      type='primary'
      size='large'
      onClick={onCreate}
      loading={loading}
      title='Create'
    />}
    {buttons.includes('back') && !buttons.includes('save') && <Button
      icon={<ArrowLeftOutlined />}
      size='large'
      onClick={onBack}
      disabled={loading}
      title='Back to list'
    />}
    {buttons.includes('save') && !buttons.includes('back') && <Button
      icon={<SaveOutlined />}
      type='primary'
      size='large'
      onClick={onSave}
      loading={loading}
      title='Save'
    />}
    {buttons.includes('back') && buttons.includes('save') && <Space.Compact>
      <Button
        type='primary'
        size='large'
        icon={<ArrowLeftOutlined style={{ width: 12 }} />}
        style={{ width: 20 }}
        title='Save and back to list'
        disabled={loading}
        onClick={async () => {
          await Promise.resolve(onSave())
          onBack()
        }}
      />
      <Button
        icon={<SaveOutlined />}
        type='primary'
        size='large'
        onClick={onSave}
        loading={loading}
        title='Save'
      />
    </Space.Compact>}
  </Sidebar>
)
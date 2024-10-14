import { Button, Space, Input, Upload, ColorPicker, Flex } from 'antd'
import { DeleteOutlined, UploadOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { cn as bem } from '@bem-react/classname'
import { setCurrentColor, toText } from 'utils/utils'
import './category.scss'

const cn = bem('scheme-category')

export default function Category(props) {
  const { onCountClick, onChange = () => {}, onDelete, seatsCount, ...item } = props

  return (
    <Flex gap={8} key={item.value} className={cn()} align='center'>
      {!item.icon ?
        <Upload
          accept='.svg'
          itemRender={() => null}
          customRequest={e => toText(e.file).then(setCurrentColor).then(icon => onChange({ icon }))}
          style={{ height: '100%' }}
        >
          <Button
            className={cn('icon', { add: true })}
            type='dashed'
            shape='rounded'
            icon={<UploadOutlined />}
          >
            <br />icon
          </Button>
        </Upload> :
        <Flex
          className={cn('icon', { clear: true })}
          align='center'
          justify='center'
          title='Clear Icon'
          style={{ color: item.color }}
          onClick={() => onChange({ icon: null })}
          dangerouslySetInnerHTML={{ __html: item.icon }}
        />
      }
      <ColorPicker
        className={cn('color')}
        defaultValue={item.color}
        onChangeComplete={(color) => onChange({ color: color.toHexString() })}
      />
      <Input
        placeholder='Label'
        defaultValue={item.label}
        className={cn('field-label')}
        onChange={e => onChange({ label: e.currentTarget.value })}
      />
      <div className={cn('capacity')}>
        {seatsCount ?
          <span
            className={cn('filter')}
            title='Select category seats'
            onClick={onCountClick}
          >
            <span className={cn('capacity-val')}>{seatsCount}</span> x💺
          </span> : <>
          <input
            className={cn('capacity-field')}
            defaultValue={item.capacity}
            onChange={e => onChange({ capacity: e.currentTarget.value })}
          /> x🧍
        </>}
      </div>
      <Button
        size='small'
        className={cn('delete')}
        icon={<DeleteOutlined />}
        onClick={() => onDelete(item.value)}
        type='ghost'
      />
    </Flex>
  )
}
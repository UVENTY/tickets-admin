import { Button, Space, Input, Upload, ColorPicker, Flex } from 'antd'
import { DeleteOutlined, UploadOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import s from './svg-scheme-editor.module.scss'
import { Link } from 'react-router-dom'
import { useCallback } from 'react'
import { setCurrentColor, toText } from '../../utils/utils'

export function Category(props) {
  const { onChange = () => {}, onDelete, seatsCount, ...item } = props

  return (
    <Flex gap={8} key={item.value} className={s.catItem} align='center'>
      {!item.icon ?
        <Upload
          accept='.svg'
          itemRender={() => null}
          customRequest={e => toText(e.file).then(setCurrentColor).then(icon => onChange({ icon }))}
          style={{ height: '100%' }}
        >
          <Button
            className={s.addIcon}
            type='dashed'
            shape='rounded'
            icon={<UploadOutlined />}
          >
            <br />icon
          </Button>
        </Upload> :
        <Flex
          className={s.catIcon}
          align='center'
          justify='center'
          title='Clear Icon'
          style={{ color: item.color }}
          onClick={() => onChange({ icon: null })}
          dangerouslySetInnerHTML={{ __html: item.icon }}
        />
      }
      <ColorPicker
        defaultValue={item.color}
        onChangeComplete={(color) => onChange({ color: color.toHexString() })}
      />
      <Input
        placeholder='Label'
        defaultValue={item.label}
        className={s.catName}
        onChange={e => onChange({ label: e.currentTarget.value })}
      />
      <div style={{ width: 90, whiteSpace: 'nowrap', fontSize: '1.4em' }}>
        {seatsCount ?
        <><span className={s.capacityVal}>{seatsCount}</span> x💺</> : 
        <><input
          className={s.capacity}
          defaultValue={item.capacity}
          onChange={e => onChange({ capacity: e.currentTarget.value })}
        /> x🧍</>
      }
      </div>
      <Button
        size="small"
        className={s.deleteCat}
        icon={<DeleteOutlined />}
        onClick={() => onDelete(item.value)}
        type='ghost'
      />
      {/* <Space.Compact className={s.orderArrows} style={{ transform: 'rotate(90deg)' }}>
            <Button
              size='small'
              icon={<ArrowLeftOutlined />} style={i === 0 ? { opacity: 0, pointerEvents: 'none' } : undefined}
              onClick={() => reorder(i, i - 1)}
            />
            <Button
              size='small'
              icon={<ArrowRightOutlined />}
              style={i === items.length - 1 ? { opacity: 0, pointerEvents: 'none' } : undefined}
              onClick={() => reorder(i, i + 1)}
            />
          </Space.Compact> */}
    </Flex>
  )
}

export default function Categories(props) {
  const { items, onChange, onDelete } = props

  const handleChangeItems = useCallback((index, inject) => {
    // const newItems = [...items]
    // newItems[index] = {
    //   ...newItems[index],
    //   ...inject
    // }
    // onChange(items)
  }, [items])

  return (
    <Flex gap={16} className={s.categories} wrap>
      {items.map((item, i) => (
        <Category
          {...item}
          onChange={item => handleChangeItems(i, item)}
          onDelete={onDelete}
        />
      ))}
    </Flex>
  )
}
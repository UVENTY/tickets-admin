import { PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Modal, Table } from 'antd'
import SeatProperty from 'components/seat-property'
import { DATA_TYPES } from 'consts'
import { useCallback, useState } from 'react'
import Fieldset from 'shared/ui/fieldset'

export default function SeatParamsFieldset({ items = [], onChange }) {
  const [editSeatParams, setEditSeatParams] = useState(null)
  const [editSeatIndex, setEditSeatIndex] = useState(null)

  const showEditSeat = useCallback((index = null) => {
    if (index === null) {
      setEditSeatIndex(true)
      setEditSeatParams({ name: '', label: '', type: 'string' })
      return
    }
    if (items[index]) {
      setEditSeatIndex(index)
      setEditSeatParams({ ...items[index] })
    }
  }, [items])

  const hideEditSeat = useCallback(() => {
    setEditSeatIndex(null)
    setEditSeatParams(null)
  }, [])

  const handleDelete = useCallback(() => {
    const newItems = items.filter((item, i) => i !== editSeatIndex)
    onChange && onChange(newItems)
    hideEditSeat()
  }, [items, editSeatIndex])

  const saveSeatProp = useCallback(() => {
    const newParams = [...items]
    if (editSeatIndex === true) {
      newParams.push(editSeatParams)
    } else if (newParams[editSeatIndex]) {
      newParams[editSeatIndex] = { ...newParams[editSeatIndex], ...editSeatParams }
    }
    onChange && onChange(newParams)
    hideEditSeat()
  }, [items, editSeatParams, editSeatIndex, hideEditSeat])

  const isEditSeat = editSeatIndex === true || typeof editSeatIndex === 'number'

  return (
    <Fieldset
      title={<>
        seat properties
        <Button
          size='small'
          type='link'
          icon={<PlusOutlined />}
          onClick={() => showEditSeat(null)} 
        />
      </>}
      icon={<SettingOutlined className='fs-icon' />}
    >
      <Table
        className='hall-form-seat-props'
        size='small'
        onRow={(record, index) => ({
          onClick: () => showEditSeat(index)
        })}
        columns={[
          {
            dataIndex: 'label',
            title: 'Label',
            width: 200
          }, {
            dataIndex: 'type',
            title: 'Type',
            render: type => DATA_TYPES.find(t => t.value === type)?.label || 'String',
            width: 200
          }, {
            dataIndex: 'name',
            title: 'System name',
            width: 200
          }, {
            key: 'options',
            title: 'Options',
            render: (_, item) => {
              const output = [
                !!item.defaultValue && `Default value: ${item.defaultValue}`,
                !!item.placeholder && `Placeholder: ${item.placeholder}`,
                (!!item.minlength && !item.maxlength) && `Length not less than ${item.minlength}`,
                (!item.minlength && !!item.maxlength) && `Length not more than ${item.maxlength}`,
                (!!item.minlength && !!item.maxlength) && `Length from ${item.minlength} to ${item.maxlength}`,
                (!!item.min && !item.max) && `Value not less than ${item.minlength}`,
                (!item.min && !!item.max) && `Value not more than ${item.maxlength}`,
                (!!item.min && !!item.max) && `Value from range ${item.minlength} to ${item.maxlength}`,
                item.searchable && 'Searchable',
                item.type === 'file' && (item.multiple ? 'Multiple file' : 'Single file'),
                item.type === 'file' && `File formats: ${item.accept || 'any'}`
              ].filter(Boolean)
              return output.join('; ')
            }
          }
        ]}
        dataSource={items}
        pagination={false}
        bordered
      />
      {isEditSeat && <Modal
        width={450}
        open={isEditSeat}
        onCancel={hideEditSeat}
        footer={[
          editSeatIndex !== true && <Button key='delete' onClick={handleDelete} danger>
            Delete
          </Button>,
          <Button key='cancel' onClick={hideEditSeat}>
            Cancel
          </Button>,
          <Button
            key='Save'
            type="primary"
            // loading={loading}
            onClick={saveSeatProp}
          >
            Save
          </Button>,
        ].filter(Boolean)}
      >
        <SeatProperty
          title={`${editSeatIndex === true ? 'New' : 'Edit'} seat property`}
          {...editSeatParams}
          onChange={setEditSeatParams}
        />
      </Modal>}
    </Fieldset>
  )
}
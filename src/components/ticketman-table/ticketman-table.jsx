import React, { useContext, useEffect, useRef, useState } from 'react'
import { Button, Form, Input, InputNumber, Popconfirm, Select, Table } from 'antd'
import { EMPTY_FUNC } from 'consts'
import './ticketman-table.scss'
import { Link } from 'react-router-dom'
import { renderWithFlag } from 'shared/ui/input-city/input-city'

const EditableContext = React.createContext(null)

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm()
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  )
}

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  link,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)
  const form = useContext(EditableContext)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
    }
  }, [editing])

  const toggleEdit = () => {
    setEditing(!editing)
    form.setFieldsValue({ [dataIndex]: record[dataIndex] })
  }

  const save = async () => {
    try {
      const values = await form.validateFields()

      toggleEdit()
      handleSave({ ...record, ...values })
    } catch (errInfo) {
      console.log('Save failed:', errInfo)
    }
  }

  let childNode = children

  if (editable) {
    const config = typeof editable === 'object' ? editable : {}
    const { type, rules, options = [] } = config
    let control = null
    if (editing) {
      switch (type) {
        case 'number':
          control = <InputNumber ref={inputRef} onPressEnter={save} onBlur={save} />
          break;

        case 'select':
          control = <Select ref={inputRef} options={options} onChange={save} />
          break;
      
        default:
          control = <Input ref={inputRef} onPressEnter={save} onBlur={save} />
          break;
      }
      childNode = 
        <Form.Item
          style={{ margin: 0 }}
          name={dataIndex}
          rules={rules}
        >
          {control}
        </Form.Item>
    } else {
      childNode =
        <div
          className="editable-cell-value-wrap"
          style={{ paddingInlineEnd: 24 }}
          onClick={toggleEdit}
        >
          {children}
        </div>
    }
  }

  return <td {...restProps}>{childNode} </td>
}

export default function TicketmanTable(props) {
  const dataSource = props.data || []
  const handleChange = props.onChange || EMPTY_FUNC
  const handleDelete = props.onDelete || EMPTY_FUNC
  const handleAdd = props.onCreate || EMPTY_FUNC
  const handleSave = props.onSave || EMPTY_FUNC

  const [count, setCount] = useState(2)


  const defaultColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      width: '250px',
      render: (value, item) => <>{value}<Link to={`/ticketmans/${item.id_user}`} className='cell-link' /></>
      // editable: true,
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      width: '250px',
      render: (value, item) => <>{value?.split('@')[0]}<Link to={`/ticketmans/${item.id_user}`} className='cell-link' /></>
      // editable: true,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      width: '150px',
      render: (value, item) => <>{value}<Link to={`/ticketmans/${item.id_user}`} className='cell-link' /></>
      // editable: true,
    },
    {
      title: 'Event',
      dataIndex: 'event',
      render: (_, record) =>
        <Select
          options={props.events || []}
          style={{ margin: '-6px -11px' }}
          optionRender={renderWithFlag}
          labelRender={renderWithFlag}
          onChange={value => handleChange(record.id_user, 'event', value)}
          size='large'
        />
      ,
    },
  ]

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  }

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        link: col.getLink && col.getLink(record),
        title: col.title,
        handleSave,
      }),
    }
  })

  return (
    <Table
      components={components}
      className='ticketman-table'
      rowClassName={() => 'editable-row'}
      dataSource={dataSource}
      columns={columns}
      rowKey='id_user'
      tableLayout='fixed'
      loading={props.loading}
      bordered
    />
  )
}
import { cn as bem } from '@bem-react/classname'
import './seat-property.scss'
import FormField from 'components/form-field'
import { Input, Select } from 'antd'
import { DATA_TYPES } from 'consts'

const cn = bem('seat-property')

const getCommonOptions = type => ([
  {
    label: 'Placeholder',
    name: 'placeholder',
    type: 'string'
  },
  {
    label: 'Default value',
    name: 'defaltValue',
    type
  }
])

const optionsByType = {
  string: [...getCommonOptions('string'), {
    label: 'Min length',
    name: 'minlength',
    type: 'number'
  }, {
    label: 'Max length',
    name: 'maxlength',
    type: 'number'
  }],
  number: [...getCommonOptions('number'), {
    label: 'Min value',
    name: 'min',
    type: 'number'
  }, {
    label: 'Max value',
    name: 'max',
    type: 'number'
  }],
  select: [...getCommonOptions('select'), {
    label: 'Options',
    name: 'options',
    type: ['string']
  }, {
    label: 'Searchable',
    name: 'searchable',
    type: 'checkbox'
  }],
  file: [getCommonOptions('file')[0], {
    label: 'File types',
    name: 'accept',
    type: 'string'
  }, {
    label: 'Multiple file',
    name: 'multiple',
    type: 'checkbox'
  }/* , {
    label: 'Color',
    name: 'color',
    type: 'color'
  } */],
  checkbox: []
}

export default function SeatProperty(props) {
  const { title, name, label, type = 'string', options, onChange = () => {} } = props
  const optionsParams = optionsByType[type] || []
  
  return (
    <table className={cn()}>
      <tr>
        <th>{title}</th>
        <th></th>
      </tr>
      <tr>
        <td className={cn('label')}>Data type</td>
        <td className={cn('field')}>
          <Select
            options={DATA_TYPES}
            value={type}
            onChange={value => onChange({ ...props, type: value })}
            className={cn('value', { type: true })}
          />
        </td>
      </tr>
      <tr>
        <td className={cn('label')}>Label</td>
        <td className={cn('field')}>
          <Input
            value={label}
            onChange={e => onChange({ ...props, label: e.currentTarget.value })}
            className={cn('value', { label: true })}
          />
        </td>
      </tr>
      <tr>
        <td className={cn('label')}>System name</td>
        <td>
          <Input
            value={name}
            onChange={e => onChange({ ...props, name: e.currentTarget.value })}
            className={cn('value', { name })}
          />
        </td>
      </tr>
      {optionsParams.map((option, i) =>
        <tr key={i}>
          <td className={cn('label')}>{option.type !== 'checkbox' && option.label}</td>
          <td>
            <FormField
              {...option}
              className={cn('value', { [option.name]: true })}
              onChange={value => onChange({ ...props, [option.name]: value })}
            />
          </td>
        </tr>
      )}
    </table>
  )
}
import { cn as bem } from '@bem-react/classname'
import './seat-property.scss'
import FormField from 'components/form-field'
import { Input, Select } from 'antd'
import { DATA_TYPES } from 'consts'

const cn = bem('seat-property')

const getCommonOptions = type => ([
  { name: 'placeholder', type: 'string' },
  { name: 'defaltValue', type }
])

const optionsByType = {
  string: [...getCommonOptions('string'), {
    name: 'minlength',
    type: 'number'
  }, {
    name: 'maxlength',
    type: 'number'
  }],
  number: [...getCommonOptions('number'), {
    name: 'min',
    type: 'number'
  }, {
    name: 'max',
    type: 'number'
  }],
  select: [...getCommonOptions('select'), {
    name: 'options',
    type: [{ label: 'string', value: 'string' }]
  }, {
    name: 'searchable',
    type: 'checkbox'
  }],
  file: [getCommonOptions('file')[0], {
    name: 'accept',
    type: 'string'
  }, {
    name: 'multiple',
    type: 'checkbox'
  }

  ],
  checkbox: []
}

export default function SeatProperty(props) {
  const { edit, name, label, type = 'string', options, onChange = () => {} } = props
  const optionsParams = optionsByType[type] || []
  console.log(optionsParams, type);
  
  return (
    <div className={cn()}>
      {edit ? <>
        <Input
          value={label}
          onChange={e => onChange('label', e.currentTarget.value)}
          className={cn('label')}
        />
        <Input
          value={name}
          onChange={e => onChange('name', e.currentTarget.value)}
          className={cn('name')}
        />
        <Select
          options={DATA_TYPES}
          value={type}
          onChange={value => onChange('type', value)}
          className={cn('type')}
        />
      </> : <>
        <div className={cn('label')}>{label}</div>
        <div className={cn('name')}>{name}</div>
        <div className={cn('label')}>{DATA_TYPES[type]?.label}</div>
      </>}
      <div className={cn('options')}>
        {optionsParams.map(option => {
          return <FormField {...option} />
        })}
      </div>
    </div>
  )
}
import { ColorPicker, Input, InputNumber, Select } from 'antd'
import Checkbox from 'antd/es/checkbox/Checkbox'
import InputSvg from 'components/input-svg'
import { useCallback } from 'react'

export default function FormField(props) {
  const { type = 'string', onChange, ...rest } = props

  rest.onChange = useCallback((e) => {
    let value
    if (type === 'color') value = e.toHexString()
    else if (['string'].includes(type)) value = e.currentTarget.value
    else if (['select', 'file', 'number'].includes(type)) value = e
    else if (type === 'checkbox') value = e.target.checked
    onChange && onChange(value)
  }, [onChange, type, rest])
  
  return <>
    {type === 'string' && <Input {...rest} />}
    {type === 'select' && <Select {...rest} /> }
    {type === 'number' && <InputNumber {...rest} /> }
    {type === 'color' && <ColorPicker onChangeComplete={rest.onChange} showText /> }
    {type === 'checkbox' && <Checkbox onChange={rest.onChange}>{rest.label}</Checkbox>}
    {type === 'file' && (
      <InputSvg
        {...rest}
      />
    )}
  </>
}
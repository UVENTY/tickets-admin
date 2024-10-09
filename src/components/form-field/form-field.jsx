import { ColorPicker, Input, InputNumber, Select } from 'antd'
import InputSvg from 'components/input-svg'

export default function FormField(props) {
  const { type = 'string', ...rest } = props

  return <>
    {type === 'string' && <Input {...rest} />}
    {type === 'select' && <Select {...rest} /> }
    {type === 'number' && <InputNumber {...rest} /> }
    {type === 'color' && <ColorPicker {...rest} showText /> }
    {type === 'file' && (
      <InputSvg
        {...rest}
      />
    )}
  </>
}
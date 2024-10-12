export default function SeatFormItem({ type, seats, values, onChange }) {
  const isCheckbox = type === 'checkbox'
  const rest = isCheckbox ? {
    checked: values[field.value],
    onChange: checked => onChange({ [field.value]: checked })
  } : {
    value: values[field.value],
    onChange: e => onChange({ [field.value]: e.currentTarget?.value })
  }

  if (isCheckbox) {
    return (<label>
      <Switch
        {...rest}
        className='checkbox'
        style={{ marginRight: 10 }}
        onChange={checked => onChange({ [field.value]: checked })}
      />
      {field.label}
    </label>)
  }

  return (
    <Form.Item label={cn('label')} initialValue={rest.value}>
      {!isCheckbox && <label className={cn('label-checkbox')}>{field.label}</label>}
      {!type && <Input {...rest} />}
      {type === 'select' && <Select {...rest} options={field.options || []} />}
      {type === 'number' && <InputNumber {...rest} min={field.min} max={field.max} />}
      {type === 'color' && <ColorPicker {...rest} showText />}
      {type === 'file' && (
        <InputSvg
          {...rest}
          beforeChange={icon => field.originalColor ? icon : setCurrentColor(icon)}
        />
      )}
    </Form.Item>
  )
}
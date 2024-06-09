import { useState } from 'react'
import { Button, Flex, Space, Upload } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { getValidSvg, toText } from '../../utils/utils'

export default function InputSvg({ value, defaultValue, onChange, beforeChange, svgClassName, children, button }) {
  const [ ownValue, setOwnValue ] = useState(defaultValue)

  const isControlled = value !== undefined
  const val = isControlled ? value : ownValue
  const isSvg = val && typeof val === 'string' && getValidSvg(val)
  return (
    <Flex gap={8} align='center'>
      {isSvg && <div className={svgClassName} style={{ flex: '0 0 24px', height: 24 }} dangerouslySetInnerHTML={{ __html: val }} />}
      <Space.Compact>
        {isSvg && <Button
          htmlType='button'
          onClick={() => {
            onChange && onChange(null)
            if (!isControlled) setOwnValue(null)
          }}
          icon={<DeleteOutlined />}
          danger
        />}
        <Upload
          accept='.svg'
          itemRender={() => null}
          customRequest={e => toText(e.file).then(res => beforeChange ? beforeChange(res) : res).then(res => {
            onChange && onChange(res)
            if (!isControlled) setOwnValue(res)
          })}
        >
          {children || <Button htmlType='button' icon={<UploadOutlined />} {...button} />}
        </Upload>
      </Space.Compact>
    </Flex>
  )
}
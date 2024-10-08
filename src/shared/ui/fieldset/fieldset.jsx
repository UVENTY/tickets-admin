import { Divider } from 'antd'
import './fieldset.scss'

export default function Fieldset({ title, icon, children, ...rest }) {
  return (
    <div {...rest}>
      <Divider orientation='left' orientationMargin='0' className='fieldset-title'>
        {icon} {title}
      </Divider>
      <div className='fieldset-content'>
        {children}
      </div>
    </div>
  )
}
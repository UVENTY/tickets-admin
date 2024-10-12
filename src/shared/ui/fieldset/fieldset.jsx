import { Divider } from 'antd'
import React from 'react'
import cn from 'classnames'
import './fieldset.scss'

export default function Fieldset({ title, icon, children, ...rest }) {
  return (
    <div {...rest}>
      {!!title && <Divider orientation='left' orientationMargin='0' className='fieldset-title'>
        {icon} {title}
      </Divider>}
      <div className='fieldset-content'>
        {children}
      </div>
    </div>
  )
}

export const FieldsetTitle = ({ title, active, disabled, onClick, icon, children, postfix }) => (<>
  <span
    className={cn('fst', { fst_active: active, fst_disabled: disabled })}
    onClick={onClick}
    title={title}
  >
    {icon && React.cloneElement(icon, { className: 'fst-icon' })} <span>{children}</span>
  </span>
  {postfix}
</>)
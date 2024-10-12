import { cn as bem } from '@bem-react/classname'
import { Card } from 'antd'
import './view-card.scss'

const cn = bem('view-card')

export default function ViewCard(props) {
  return (
    <Card title={props.title} size='small'>
      <span className={`fi fi-${props.countryCode}`} /> 
      {props.city}
      {!!props.address && <>, <span style={{ lineHeight: '2em' }}>{props.address}</span></>}
    </Card>
  )
}
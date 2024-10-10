import { cn as bem } from '@bem-react/classname'
import './hall-card.scss'
import { Card } from 'antd'

const cn = bem('hall-card')

export default function HallCard(props) {
  return (
    <Card title={props.title} size='small'>
      <span class={`fi fi-${props.countryCode}`} /> 
      {props.city}
      {!!props.address && <>, <span style={{ lineHeight: '2em' }}>{props.address}</span></>}
    </Card>
  )
}
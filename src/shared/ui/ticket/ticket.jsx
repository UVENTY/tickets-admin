import { cn as bem } from '@bem-react/classname'
import './ticket.scss'

const cn = bem('ticket')

export default function Ticket(props) {
  return (
    <div className={cn()}>
      <div className={cn('cutline')}></div>
      <div className={cn('body')}>
        Ticket<br />
        row 10, seat15<br />
        100 $  
      </div>
    </div>
  )
}
import { cn as bem } from '@bem-react/classname'
import './scheme-tooltip.scss'

const cn = bem('scheme-tooltip')

export default function SchemeTooltip({ category, ...props }) {
  return (
    <div className={cn()} style={{ borderColor: category.color }}>
      <b style={{ color: category.color }}>{category.label}</b>
      {!!props.row && <div>
        <small>row</small> <b>{props.row}</b>, <small>seat</small> <b>{props.seat}</b>
      </div>}
    </div>
  )
}
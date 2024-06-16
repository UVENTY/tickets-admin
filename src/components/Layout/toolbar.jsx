import s from './styles.module.scss'

export default function Toolbar({children}) {
  return (
    <div className={s.toolbar}>{children}</div>
  )
}
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import s from './svg-scheme.module.scss'
import SvgSchemeTooltop from './tooltip'
import { useClickPrevention } from '../../utils/hooks'

const SvgScheme = forwardRef(({
  categories = [],
  seatSelector = '.svg-seat',
  src,
  renderTooltip,
  seat: {
    onClick,
    onDoubleClick,
    onMouseOver,
    onMouseOut,
    onMouseDown
  } = {}
}, ref) => {

  const initial = useRef(src)
  useEffect(() => {
    if (!initial.current) initial.current = src
    else if (!src) {
      ref.current.innerHTML = null
      initial.current = null
    }
  }, [src])

  const [tooltipSeat, setTooltipSeat] = useState()
  const [handleClick, handleDblClick] = useClickPrevention({
    onClick: e => handleMouseEvent(e, onClick),
    onDoubleClick: e => handleMouseEvent(e, onDoubleClick),
    delay: 200
  })

  const handleMouseEvent = useCallback((e, cb) => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return
    cb && cb(e)
  })
  
  const handleMouseOver = useCallback(e => {
    const { target: el } = e
    if (renderTooltip) setTooltipSeat(el)
    onMouseOver && onMouseOver(e)
  }, [renderTooltip])

  const handleMouseOut = useCallback(e => {
    const { target: el } = e
    if (renderTooltip) setTooltipSeat(null)
    onMouseOut && onMouseOut(e)
  }, [])

  const styles = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc += `
        .svg-seat[data-category="${cat.value}"] { fill: ${cat.color}; }
        .svg-seat[data-category="${cat.value}"]:not([data-disabled]):hover { stroke: ${cat.color}; stroke-width: 3px; }
        .svg-scheme-icon-cat-${cat.value} { color: ${cat.color}; }
        .svg-scheme-bg-cat-${cat.value} { background-color: ${cat.color}; }
      `
      return acc
    }, `
      .svg-seat:not([data-disabled]) { cursor: pointer; }
      .svg-seat[data-disabled] { fill: #666 !important; }
      .svg-seat.active { stroke: #ffffff !important; stroke-width: 2px; }
    `)
  }, [categories])

  return (
    <div className={s.scheme}>
      {!!renderTooltip && <SvgSchemeTooltop for={tooltipSeat}>
        {!!tooltipSeat && renderTooltip(Object.assign({}, tooltipSeat.dataset, { category: categories.find(cat => cat.value === tooltipSeat.dataset.category) }))}  
      </SvgSchemeTooltop>}
      <style>{styles}</style>
      <div
        ref={ref}
        className={s.svgContainer}
        dangerouslySetInnerHTML={{ __html: initial.current || '' }}
        onClick={handleClick}
        onDoubleClick={handleDblClick}
        onMouseOver={e => handleMouseEvent(e, handleMouseOver)}
        onMouseOut={e => handleMouseEvent(e, handleMouseOut)} 
        onMouseDown={e => handleMouseEvent(e, onMouseDown)}
      />
    </div>
  )
})

export default SvgScheme

export { default as SeatPreview } from './preview'
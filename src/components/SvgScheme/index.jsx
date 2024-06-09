import { forwardRef, useCallback, useMemo, useState } from 'react'
import s from './svg-scheme.module.scss'
import SvgSchemeTooltop from './tooltip'

const SvgScheme = forwardRef(({
  categories = [],
  seatSelector = '.svg-seat',
  src,
  tooltip,
  onSeatClick,
  onSeatOver,
  onSeatOut,
}, ref) => {
  const [ tooltipSeat, setTooltipSeat ] = useState()
  const handleClick = useCallback(e => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return;
    onSeatClick && onSeatClick(e)
  }, [])

  const handleMouseOver = useCallback(e => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return;
    if (tooltip) setTooltipSeat(el)
    onSeatOver && onSeatOver(e)
  }, [tooltip])

  const handleMouseOut = useCallback(e => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return;
    if (tooltip) setTooltipSeat(null)
    onSeatOut && onSeatOut(e)
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
    `)
  }, [categories])

  return (
    <div className={s.scheme}>
      {!!tooltip && <SvgSchemeTooltop for={tooltipSeat}>
        {!!tooltipSeat && tooltip(Object.assign({}, tooltipSeat.dataset))}  
      </SvgSchemeTooltop>}
      <style>{styles}</style>
      <div
        ref={ref}
        className={s.svgContainer}
        dangerouslySetInnerHTML={{ __html: src }}
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      />
    </div>
  )
})

export default SvgScheme
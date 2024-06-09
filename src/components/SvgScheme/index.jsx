import { forwardRef, useCallback, useMemo } from 'react'
import s from './svg-scheme.module.scss'

const SvgScheme = forwardRef(({ src, onSeatClick, onSeatOver, onSeatOut, categories = [], seatSelector = '.svg-seat' }, ref) => {
  const handleClick = useCallback(e => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return;
    onSeatClick && onSeatClick(e)
  }, [])

  const handleMouseOver = useCallback(e => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return;
    onSeatOver && onSeatOver(e)
  }, [])

  const handleMouseOut = useCallback(e => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return;
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
    <>
      <style>{styles}</style>
      <div
        ref={ref}
        className={s.svgContainer}
        dangerouslySetInnerHTML={{ __html: src }}
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      />
    </>
  )
})

export default SvgScheme
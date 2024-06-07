import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { Button, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import axios from 'axios'
import TicketsSvgScheme from './utils'
import { isValidSvg, toBase64 } from '../../utils/utils'
import s from './svg-scheme.module.scss'

const addStyles = (el, styles) => Object.assign(el.style, styles)

const SvgScheme = forwardRef(({ src, onSeatClick, onSeatOver, onSeatOut, seatSelector = '.svg-seat' }, ref) => {
  const tooltipRef = useRef()

  const showTooltip = useCallback(({ left, top }, text) => {
    const tooltip = tooltipRef.current
    addStyles(tooltip, {
      left: left + 'px',
      top: top + 'px',
      opacity: 1
    })
    tooltip.innerHTML = text
  }, [tooltipRef.current])

  const hideTooltip = useCallback(() => {
    const tooltip = tooltipRef.current
    addStyles(tooltip, {
      left: -500 + 'px',
      top: -500 + 'px',
      opacity: 0
    })
    tooltip.innerHTML = ''
  }, [tooltipRef.current])

  const handleClick = useCallback(e => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return;
    onSeatClick && onSeatClick(e)
  }, [])

  const handleMouseOver = useCallback(e => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return;
    addStyles(el, { stroke: el.getAttribute('fill'), strokeWidth: 3 })
    const rect = el.getBoundingClientRect()
    let text = '<b>' + el.getAttribute('data-c') + '</b>'
    const row = el.getAttribute('data-r')
    const seat = el.getAttribute('data-p')
    text += row ? `<br>Row <b>${row}</b>` : ''
    text += seat ? `<br>Seat <b>${seat}</b>` : ''
    showTooltip(rect, text)
    onSeatOver && onSeatOver(e)
  }, [showTooltip])

  const handleMouseOut = useCallback(e => {
    const { target: el } = e
    if (!el.matches(seatSelector)) return;
    el.style.stroke = 'none'
    hideTooltip()
    onSeatOut && onSeatOut(e)
  }, [hideTooltip])

  return (
    <>
      <div className={s.tooltip} ref={tooltipRef} />
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
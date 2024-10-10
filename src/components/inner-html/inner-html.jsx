import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

function InnerHTML({
  html,
  tagName = 'div',
  dangerouslySetInnerHTML,
  allowRerender,
  ...rest
}, ref) {
  // We remove 'dangerouslySetInnerHTML' from props passed to the div
  const divRef = useRef(null)
  const isFirstRender = useRef(true)
  useImperativeHandle(ref, () => divRef.current)

  useEffect(() => {
    if (!html || !divRef.current) throw new Error("html prop can't be null")
    if (!isFirstRender.current) return
    isFirstRender.current = Boolean(allowRerender)

    const slotHtml = document.createRange().createContextualFragment(html) // Create a 'tiny' document and parse the html string
    divRef.current.innerHTML = '' // Clear the container
    divRef.current.appendChild(slotHtml) // Append the new content
  }, [html, divRef])

  return createElement(tagName, { ...rest, ref: divRef })
}

export default forwardRef(InnerHTML)
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Button, Divider, Flex, Skeleton, Upload } from 'antd'
import { BarsOutlined, CheckCircleOutlined, ClearOutlined, InboxOutlined, InsertRowAboveOutlined, PlusOutlined } from '@ant-design/icons'
import { activeSeatClassName, defaultSeatParams, getCategories, seatClassName, transformScheme } from 'utils/svg'
import SvgScheme from 'components/svg-scheme'
import { toText } from 'utils/utils'
import Fieldset, { FieldsetTitle } from 'shared/ui/fieldset'
import { SortableList } from 'components/sortable-list'
import { EMPTY_CATEGORY } from 'consts'
import { clearFillAndStringify } from 'components/SvgSchemeEditor/utils'
import SchemeTooltip from '../scheme-tooltip/scheme-tooltip'
import { Category, SeatForm, Skeleton as FormSkeleton } from '../'

export const getEmptyCategory = (categories) => {
  const id = `cat${categories.length + 1}`
  return { id, value: id, ...EMPTY_CATEGORY }
}

function SchemeFieldset(props, ref) {
  const { isLoading, scheme, categories, title, seatParams, onChange, currency } = props
  const [selectedSeats, setSelectedSeats] = useState([])
  const [showSeatsEdit, setShowSeatsEdit] = useState(false)
  
  const isSelected = selectedSeats.length > 0

  const svgRef = useRef(null)
  useImperativeHandle(ref, () => svgRef.current)

  const handleChangeSeat = useCallback((values) => {
    selectedSeats.forEach(el => {
      Object.entries(values).forEach(([key, value]) => {
        if (!value) {
          el.removeAttribute(`data-${key}`)
        } else {
          el.setAttribute(`data-${key}`, value)
        }
      })
    })
  }, [selectedSeats])


  const handleClickSeat = ({ detail, target: el, ctrlKey, metaKey }) => {
    const isDoubleClick = detail > 1
    if (selectedSeats.length === 0) {
      setShowSeatsEdit(true)
    }
    setSelectedSeats(prev => {
      if (isDoubleClick) {
        const cat = el.getAttribute('data-category')
        const group = Array.from(svgRef.current.querySelectorAll(`.${seatClassName}[data-category="${cat}"]`))
        const isFullIncludes = group.every(el => prev.includes(el))
        return ctrlKey || metaKey ?
          (isFullIncludes ? prev.filter(el => !group.includes(el)) : prev.filter(el => !group.includes(el)).concat(group)) :
          group
      }
      if (ctrlKey || metaKey) {
        return prev.includes(el) ? prev.filter(item => item !== el) : [...prev, el]
      }
      const next = prev.length === 1 ? (prev[0] === el ? [] : [el]) : [el]
      return prev.length === 1 ? (prev[0] === el ? [] : [el]) : [el]
    })
  }

  const seatHandlers = useMemo(() => ({
    onClick: handleClickSeat,
    onDoubleClick: handleClickSeat
  }), [handleClickSeat])

  useEffect(() => {
    if (!svgRef.current) return
    svgRef.current.querySelectorAll(`.${seatClassName}.${activeSeatClassName}`).forEach(el => el.classList.remove(activeSeatClassName))
    selectedSeats.forEach(el => el.classList.add(activeSeatClassName))
  }, [selectedSeats])

  if (isLoading) {
    return (
      <>
        <FormSkeleton.FieldsetTitle />
        <Skeleton.Button style={{ height: 190 }} active block />
      </>
    )
  }

  return (
    <Flex gap={20}>
      <Fieldset
        title={title !== undefined ? title : <>scheme {!!scheme &&
          <Button
            type='link'
            size='small'
            icon={<ClearOutlined />}
            onClick={() => onChange({ categories: [], seatParams: defaultSeatParams, scheme: '' })}
            danger
          />}
        </>}
        style={{ flex: `0 0 ${scheme ? 65 : 100}%` }}
        icon={<InsertRowAboveOutlined className='fs-icon' />}
      >
        {scheme ?
          <SvgScheme
            ref={svgRef}
            src={scheme}
            categories={categories}
            seat={seatHandlers}
            renderTooltip={SchemeTooltip}
          /> :
          <Upload.Dragger
            accept='.svg'
            itemRender={() => null}
            customRequest={e => toText(e.file)
              .then(transformScheme)
              .then(scheme => onChange({
                categories: getCategories(scheme),
                scheme: clearFillAndStringify(scheme),
                seatParams: defaultSeatParams
              })
            )}
            block
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Support for a single svg-file
            </p>
          </Upload.Dragger>
        }
      </Fieldset>

      {!!scheme && <Fieldset
        title={<>
          <FieldsetTitle
            active={!showSeatsEdit}
            onClick={() => setShowSeatsEdit(false)}
            icon={<BarsOutlined />}
          >
            categories
          </FieldsetTitle>
          <Divider type='vertical' />
          <FieldsetTitle
            active={showSeatsEdit && isSelected}
            disabled={!isSelected}
            onClick={isSelected ? () => setShowSeatsEdit(true) : undefined}
            icon={<CheckCircleOutlined />}
          >
            selected seats{selectedSeats.length > 0 && ` (${selectedSeats.length})`}
          </FieldsetTitle>
        </>}
        style={{ flex: '1 1 auto' }}
        className='right-sidebar'
      >
        {showSeatsEdit && isSelected ?
          <SeatForm
            categories={categories}
            params={seatParams}
            seats={selectedSeats}
            onChange={handleChangeSeat}
            currency={currency}
          /> :
          <>
            {categories?.length > 0 && <SortableList
              items={categories}
              onChange={list => onChange(prev => ({ ...prev, categories: list }))}
              renderItem={(item, i) => (
                <SortableList.Item id={item.id}>
                  <Category
                    {...item}
                    onCountClick={() => {
                      console.log('click');
                      
                      const elems = svgRef.current?.querySelectorAll(`*[data-category="${item.value}"]`)
                      setSelectedSeats(Array.from(elems))
                      setShowSeatsEdit(true)
                    }}
                    onChange={inject => onChange(prev => {
                      const categories = [...prev.categories]
                      categories[i] = { ...categories[i], ...inject }
                      return {
                        ...prev,
                        categories
                      }
                    })}
                    onDelete={value => onChange(prev => ({ ...prev, categories: prev.categories.filter((cat) => cat.value !== value) }))}
                  />
                  <SortableList.DragHandle />
                </SortableList.Item>
              )}
            />}
            <Button
              type='dashed'
              size='large'
              icon={<PlusOutlined />}
              onClick={() => onChange(prev => ({ ...prev, categories: [...prev.categories, getEmptyCategory(prev.categories)] }))}
              block
            >
              Add category
            </Button>
          </>
        }
      </Fieldset>}
    </Flex>
  )
}

export default forwardRef(SchemeFieldset)

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Card, Upload, Col, Row, Input, Typography, ColorPicker, Space, Flex, Divider } from 'antd'
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { getCategories, transformScheme } from './utils'
import { EMPTY_ARRAY } from '../../consts'
import SvgScheme from '../SvgSheme'
import s from './svg-scheme-editor.module.scss'
import axios from 'axios'

const { Title, Paragraph } = Typography

const defaultCustomProps = [
  {
    value: "p",
    label: "Row"
  },
  {
    value: "p",
    label: "Seat"
  },
  {
    value: 'text',
    label: 'Text',
  }, {
    value: 'icon',
    label: 'Place Icon',
    type: 'file',
    accept: '.svg'
  }
]

export default function SvgSchemeEditor({ value, onChange }) {
  const [ categories, setCategories ] = useState(value.categorioes || EMPTY_ARRAY)
  const [ customProps, setCustomProps ] = useState(value.customProps || defaultCustomProps)
  const [ scheme, setScheme ] = useState(value.scheme || '')
  const [ editingSeat, setEditingSeat ] = useState(null)
  const svgRef = useRef()

  useEffect(() => {
    if (typeof value === 'string' && value.startsWith('http')) {
      axios.get(value).then(({ data }) => {
        setScheme(data.scheme)
        setCategories(data.categories)
        setCustomProps(data.customProps)
        onChange(data)
      })
    }
  }, [])

  useEffect(() => onChange({
    categories,
    customProps,
    scheme
  }), [scheme, categories, customProps])
  
  const handleUploadSvg = useCallback((file) => 
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => resolve(reader.result), false)
      reader.addEventListener('error', reject, false)
      reader.readAsText(file)
    })
  , [])

  const handleChangeCategory = useCallback((index, key, value, caregoryVal) => {
    if (key === 'color' && svgRef.current) {
      const elem = svgRef.current
      Array.from(elem.querySelectorAll(`*[data-c="${caregoryVal}"]`))
        .forEach(el => el.setAttribute('fill', value))
      setScheme(elem.innerHTML)
    }
    setCategories(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))
  }, [setCategories, svgRef.current])

  const deleteCategory = useCallback((value) => {
    if (svgRef.current) {
      Array.from(svgRef.current.querySelectorAll(`*[data-c="${value}"]`))
        .forEach(el => {
          el.setAttribute('fill', '#000')
          el.removeAttribute('data-c')
      })
    }
    setCategories(prev => prev.filter((cat) => cat.value !== value))
  }, [setCategories, svgRef.current])

  const editSeat = useCallback((e) => {
    const { target: el } = e
    console.log(el)
    el.style.outline = '2px solid #f00';
    setEditingSeat(el)
  }, [setEditingSeat])

  return (
    <>
      <div>
        <Upload
          accept='.svg'
          itemRender={() => null}
          customRequest={e => handleUploadSvg(e.file).then(transformScheme).then((doc) => {
            const s = new XMLSerializer()
            setScheme(s.serializeToString(doc))
            setCategories(getCategories(doc))
          })}
        >
          <Button size='large' type='primary' icon={<UploadOutlined />}>Upload scheme</Button>
        </Upload>
        <Flex className={s.form}>
          <div className={s.scheme}>
            <SvgScheme
              src={scheme}
              ref={svgRef}
              onSeatClick={editSeat}
            />
          </div>
          <div className={s.params}>
            {!!scheme && <>
              <Card
                title={<Title level={4} style={{ margin: 0 }}>Categories</Title>}
              >
                <Flex gap={16} wrap>
                  {categories.map((item, i) => (
                    <Flex gap={8} key={item.value} align='center' className={s.catItem}>
                      {!item.icon ?
                        <Upload
                          accept='.svg'
                          itemRender={() => null}
                          customRequest={e => handleUploadSvg(e.file).then(icon => handleChangeCategory(i, 'icon', icon))}
                        >
                          <Button className={s.addIcon} type='dashed' shape='circle'><UploadOutlined /><div>Icon</div></Button>
                        </Upload> :
                        <Flex
                          className={s.catIcon}
                          align='center'
                          justify='center'
                          title='Clear Icon'
                          onClick={() => handleChangeCategory(i, 'icon', null)}
                          dangerouslySetInnerHTML={{ __html: item.icon }}
                        />
                      }
                      <Input
                        placeholder='Label'
                        defaultValue={item.label}
                        className={s.catName}
                        onBlur={e => handleChangeCategory(i, 'label', e.target.value)}
                      />
                      <ColorPicker
                        defaultValue={item.color}
                        onChangeComplete={(color) => handleChangeCategory(i, 'color', `#${color.toHex()}`, item.value)}
                        showText
                      />
                      <Button className={s.deleteCat} icon={<DeleteOutlined />} onClick={() => deleteCategory(item.value)} danger />
                    </Flex>
                  ))}
                </Flex>
                <Button type='dashed' className={s.addCat} onClick={() => setCategories([...categories, { value: `cat${categories.length + 1}`, label: '', icon: null, color: '#000' }])} block>
                  <PlusOutlined /> Add category
                </Button>
              </Card>
            </>}
          </div>
        </Flex>
      </div>
    </>
  );
}

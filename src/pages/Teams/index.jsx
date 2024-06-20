import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button, Row, Table } from 'antd'
import { PlusCircleFilled, PlusOutlined } from '@ant-design/icons'
import { fetchData, getTeams } from '../../redux/data'
import { getCities, getCountries } from '../../redux/config'
import { getColumnSearch } from '../../utils/components'
import { getOptions } from '../../utils/utils'
import Sidebar from '../../components/Layout/sidebar'

export default function PageTeams() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isLoading = useSelector(state => state.data.isLoading)
  const teams = useSelector(getTeams)
  const cities = useSelector(getCities)
  const countries = useSelector(getCountries)

  const citiesOptions = useMemo(() => getOptions(Object.values(cities), 'en'), [cities])
  const countriesOptions = useMemo(() => getOptions(Object.values(countries), 'en'), [countries])

  const columns = [
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 180,
      sorter: (a, b) => a.country.localeCompare(b.country),
      render: id => countries[id].en,
      ...getColumnSearch('country', { getData: record => countries[record.country].en, options: countriesOptions }),
    },
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      width: 40,
      render: src => (<img src={src} width={32} />)
    },
    {
      title: 'Name',
      dataIndex: 'en',
      key: 'en',
      sorter: (a, b) => a.country.localeCompare(b.country),
      ...getColumnSearch('name', { getData: 'en' }),
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      render: cityId => cities[cityId]?.en,
      ...getColumnSearch('city', { getData: record => cities[record.city]?.en, options: citiesOptions }),
    }
  ]

  useEffect(() => {
    dispatch(fetchData())
  }, [])

  return (
    <>
      <Sidebar buttons sticky>
        <Button icon={<PlusOutlined />} type='primary' onClick={() => navigate('/teams/create')} block>Create</Button>
      </Sidebar>
      <Table
        style={{ flex: '1 1 0'}}
        columns={columns}
        dataSource={teams}
        loading={isLoading}
        rowKey={({ id }) => id}
        onRow={record => ({
            onClick: () => navigate(`/teams/${record.id}`)
        })}
      />
      <Sidebar />
    </>
  )
}
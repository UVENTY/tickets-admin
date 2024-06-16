import { useState } from 'react'
import {
  CalendarOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import {
  Menu,
  Layout,
} from 'antd'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import s from './styles.module.scss'
import Logo from '../../instance/components/logo'

const { Header, Content, Footer } = Layout

const NAVBAR_TOP = [
  {
    key: 'dashboard',
    label: <Link to='/dashboard'><DashboardOutlined />&nbsp;&nbsp;Dashboard</Link>,
  },
  {
    key: 'events',
    label: <Link to='/events'><CalendarOutlined />&nbsp;&nbsp;Events</Link>,
  }
]

export default function PageLayout() {
  const location = useLocation()

   const path = location.pathname.split('/').filter(Boolean)
   const rootPage = path[0]

  return (
    <Layout>
      <Header className={s.header}>
        <Logo />
        <Menu
          className={s.topNavbar}
          mode='horizontal'
          items={NAVBAR_TOP}
          style={{ flex: 1, minWidth: 0 }}
          triggerSubMenuAction='click'
          selectedKeys={NAVBAR_TOP.filter(item => rootPage === item.key).map(item => item.key)}
        />
      </Header>
      <Content className={s.content}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        
      </Footer>
    </Layout>
  )
}
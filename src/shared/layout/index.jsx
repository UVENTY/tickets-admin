import { useEffect, useState } from 'react'
import {
  CalendarOutlined,
  CompassFilled,
  CompassOutlined,
  DashboardOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HomeOutlined,
  MailOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Menu,
  Layout as AntLayout,
  Divider,
} from 'antd'
import { Outlet, Link, useNavigate, useLocation, useLoaderData } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { pick } from 'lodash'
import { useQuery } from '@tanstack/react-query'
import Logo from '../ui/logo'
import { axios } from 'api/axios'
import { fetchConfig } from 'redux/config'
import { authorizeByTokens } from 'redux/user'
import { useAppState } from 'shared/contexts'
import s from './layout.module.scss'

export const query = {
  queryKey: ['config'],
  queryFn: () => axios.get('/data').then(res => ({
    values: ['country', 'currency', 'lang'].reduce((acc, key) => ({
      ...acc,
      [key]: res.data?.data[`default_${key}`]
    }), {}),
    options: pick(res.data?.data?.data, ['cities', 'countries', 'currencies', 'langs', 'ticket_statuses', 'user_roles', 'lang_vls'])
  })),
  staleTime: 5 * 60 * 1000
}

const { Header, Content, Footer } = AntLayout

const NAVBAR_TOP = [
  {
    key: 'tours',
    label: <Link to='/tours'><GlobalOutlined />&nbsp;&nbsp;Tours</Link>,
  }, {
    key: 'halls',
    label: <Link to='/halls'><HomeOutlined />&nbsp;&nbsp;Concert halls</Link>,
  }, {
    key: 'events',
    label: <Link to='/events'><CalendarOutlined />&nbsp;&nbsp;Events</Link>,
  }, {
    key: 'ticketmans',
    label: <Link to='/ticketmans'><TeamOutlined />&nbsp;&nbsp;Ticketmans</Link>,
  }, {
    key: 'd1',
    label: <Divider type='vertical' />
  }
]

const NAVBAR_RIGHT = [
  {
    key: 'templates',
    icon: <MailOutlined />,
    label: 'E-mail templates',
    children: [{
        key: 'signup',
        label: <Link to='/templates/signup'>Signup</Link>
      },
      { label: <Link to='/templates/email-verification'>Email verification</Link>, key: 'email-verification' },
      { label: <Link to='/templates/booking-in-cart'>Booking tickets in cart</Link>, key: 'booking-in-cart' },
      { label: <Link to='/templates/successful-payment'>Successful payment</Link>, key: 'successful-payment' },
      { label: <Link to='/templates/checking-ticket'>Checking ticket</Link>, key: 'checking-ticket' },
      { label: <Link to='/templates/checking-ticket-available'>Tickets are in stock</Link>, key: 'checking-ticket-available' },
      { label: <Link to='/templates/feedback'>Feedback</Link>,key:  'feedback' },
      { label: <Link to='/templates/restore-password'>Restore password</Link>, key: 'restore-password' },
      { label: <Link to='/templates/html_pdf_ticket_paid_body'>PDF Ticket Body</Link>, key: 'html_pdf_ticket_paid_body' },
    ],
  }, {
    label: 'Content',
    key: 'content',
    icon: <FileTextOutlined />,
    children: [
      { label: <Link to='/content/about-us'>About us</Link>, key: 'about-us' },
      { label: <Link to='/content/faq'>FAQ</Link>,key:  'faq' },
      { label: <Link to='/content/news'>News</Link>,key:  'news' },
      { label: <Link to='/content/corporate'>Corporate</Link>,key:  'corporate' },
      { label: <Link to='/content/privacy-policy'>Privacy policy</Link>, key: 'privacy-policy' },
      { label: <Link to='/content/become-a-partner'>Become a partner</Link>, key: 'become-a-partner' },
  ]},
  { key: 'users', label:<Link to='/users'>Users</Link>, icon: <UserOutlined /> }
]

export default function Layout() {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { data: config } = useQuery(query)
  const [, setAppState] = useAppState()
  
  const path = location.pathname.split('/').filter(Boolean)
  const rootPage = path[0]
  const isLoginPage = location.pathname === '/login'

  useEffect(() => {
    if (!config) return
    const [langId, lang] = Object.entries(config.options.langs).find(([id, lang]) => Number(id) === config.values.lang)
    setAppState({ ...config.values, langId, langCode: lang?.iso, lang })
  }, [config])
  
  useEffect(() => {
    dispatch(authorizeByTokens).then(role => {
      if (!role) {
        navigate('/login', { replace: true })
      } else if (isLoginPage) {
        navigate(role === '4' ? '/users' : '/tickets', { replace: true })
      }
    })
  }, [isLoginPage])
  
  return (
    <AntLayout>
      <Header className={s.header}>
        <Logo />
        <Menu
          className={s.topNavbar}
          mode='horizontal'
          items={NAVBAR_TOP}
          style={{ flex: 1, minWidth: 0 }}
          triggerSubMenuAction='click'
          selectedKeys={[rootPage]}
        />
        <Menu style={{ flex: '1 1 0'}} mode='horizontal' items={NAVBAR_RIGHT} />
      </Header>
      <Content className={s.content}>
        <Outlet config={config} />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        
      </Footer>
    </AntLayout>
  )
}
import { useEffect } from 'react'
import { LoadingOutlined } from '@ant-design/icons'
import { Row } from 'antd'
import { Route, Routes, useNavigate, useLocation, Navigate, RouterProvider } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { LoadingProvider, useLoading, AppStateProvider } from 'shared/contexts'
import Layout from './shared/layout'
import Router from './routes'
import cache from './shared/api/cache'
import './App.scss'

function App() {
  return (
    <Router />
  )
}

export default App

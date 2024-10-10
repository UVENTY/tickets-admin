import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, useQueryClient } from '@tanstack/react-query'
import Layout, { query as layoutQuery } from 'shared/layout'
import Tours, { query as toursQuery } from './tours'
import PageLogin from 'pages/Login'
import { useMemo } from 'react'
import { getAction, getLoader } from './utils'
import Events from './events'
import EventForm from './events/form'
import Halls from './halls'
import { query as hallsQuery } from './halls/api'
import HallForm from './halls/form'

const getRouter = queryClient => createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    loader: getLoader(queryClient, layoutQuery),
    exact: true,
    children: [
      {
        path: '/',
        element: <>Test</>
      }, {
        path: '/tours',
        element: <Tours />,
        loader: getLoader(queryClient, toursQuery),
      }, {
        path: '/halls/:hall_id?',
        element: <Halls />,
        loader: getLoader(queryClient, hallsQuery),
      }, {
        path: '/events/:event_id?',
        element: <Events />
      }
    ]
  }, {
    path: '/login',
    element: <PageLogin />
  }
])

export default function Router() {
  const queryClient = useQueryClient()
  const router = useMemo(() => getRouter(queryClient), [queryClient])
  return <RouterProvider router={router} />
}
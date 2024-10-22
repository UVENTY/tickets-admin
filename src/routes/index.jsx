import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, useQueryClient } from '@tanstack/react-query'
import Layout, { query as layoutQuery } from 'shared/layout'
import Tours, { query as toursQuery } from './tours'
import PageLogin from 'pages/Login'
import { useMemo } from 'react'
import { getAction, getDeferred, getLoader, getLoaders } from './utils'
import Events, { EventForm, eventsQuery } from './events'
import Halls, { HallForm, hallsQuery } from './halls'
import TicketmansPage, { ticketmansQuery } from './ticketmans'

const getRouter = queryClient => createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    loader: getDeferred(queryClient, { layout: layoutQuery }),
    exact: true,
    children: [
      {
        path: '/',
        element: <>Test</>
      }, {
        path: '/tours/:tour_id?',
        element: <Tours />,
        loader: getDeferred(queryClient, { halls: toursQuery }),
      }, {
        path: '/halls/:hall_id?',
        element: <Halls />,
        loader: getDeferred(queryClient, { halls: hallsQuery }),
      }, {
        path: '/events/:event_id?',
        element: <Events />,
        loader: getDeferred(queryClient, {
          halls: hallsQuery,
          events: eventsQuery
        }),
      }, {
        path: '/events/:event_id/edit',
      }, {
        path: '/ticketmans/:user_id?',
        element: <TicketmansPage />,
        loader: getDeferred(queryClient, { ticketmans: ticketmansQuery }),
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
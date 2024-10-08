import React from 'react'
import { ConfigProvider, theme } from 'antd'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { LoadingProvider, useLoading, AppStateProvider, useAppState } from 'shared/contexts'
import store from './redux'
import cache from 'shared/api/cache'
import reportWebVitals from './reportWebVitals'
import './index.css'
import App from './App'
import '/node_modules/flag-icons/css/flag-icons.min.css'

dayjs.extend(utc)
export const queryClient = new QueryClient()
cache(queryClient)

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        cssVar: true,
        token: {
          colorPrimary: "#0476D0",
          colorInfo: "#0476D0",
          colorSuccess: "#007600",
          colorError: "#FF4500",
          colorWarning: "#F5F749",
        },
      }}
    >
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <LoadingProvider>
            <AppStateProvider>
              <App />
            </AppStateProvider>
          </LoadingProvider>
        </QueryClientProvider>
      </Provider>
    </ConfigProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

import React from 'react'
import ReactDOM from 'react-dom/client'
import "./apiSetup"
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./AuthContext"
import { BrandingProvider } from "./BrandingContext"


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <BrandingProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrandingProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
import React from 'react'
import { ThemeProvider } from './src/context/ThemeContext'
import './src/styles/theme.css'

export const wrapRootElement = ({ element }) => {
  return <ThemeProvider>{element}</ThemeProvider>
}

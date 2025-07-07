import React, { useContext, useState } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'

const ThemeToggler = ({ setIsOpen }) => {
  const { theme, setTheme } = useContext(ThemeContext)
  const [hoveredButton, setHoveredButton] = useState(null)

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    setIsOpen(false)
  }

  const buttonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-color)',
    padding: '0.5rem',
    borderRadius: '5px',
  }

  const hoverStyle = {
    background: 'var(--button-background-color)',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: '2.5rem',
        right: '0',
        background: 'var(--background-color)',
        border: '1px solid var(--text-color)',
        borderRadius: '5px',
        padding: '0.5rem',
        zIndex: 1,
      }}
    >
      <button
        onClick={() => handleThemeChange('light')}
        style={
          hoveredButton === 'light'
            ? { ...buttonStyle, ...hoverStyle }
            : buttonStyle
        }
        onMouseEnter={() => setHoveredButton('light')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        <FiSun /> Light
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        style={
          hoveredButton === 'dark'
            ? { ...buttonStyle, ...hoverStyle }
            : buttonStyle
        }
        onMouseEnter={() => setHoveredButton('dark')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        <FiMoon /> Dark
      </button>
      <button
        onClick={() => handleThemeChange('system')}
        style={
          hoveredButton === 'system'
            ? { ...buttonStyle, ...hoverStyle }
            : buttonStyle
        }
        onMouseEnter={() => setHoveredButton('system')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        <FiMonitor /> System
      </button>
    </div>
  )
}

export default ThemeToggler

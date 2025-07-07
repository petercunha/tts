import React, { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'

const ThemeToggler = () => {
  const { theme, setTheme } = useContext(ThemeContext)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: '2.5rem',
        left: '0',
        background: 'var(--background-color)',
        border: '1px solid var(--text-color)',
        borderRadius: '5px',
        padding: '0.5rem',
        zIndex: 1,
      }}
    >
      <button
        onClick={() => setTheme('light')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-color)',
        }}
      >
        <FiSun /> Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-color)',
        }}
      >
        <FiMoon /> Dark
      </button>
      <button
        onClick={() => setTheme('system')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-color)',
        }}
      >
        <FiMonitor /> System
      </button>
    </div>
  )
}

export default ThemeToggler

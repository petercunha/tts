import React, { useState } from 'react'
import { FiSettings } from 'react-icons/fi'
import ThemeToggler from './ThemeToggler'

const Settings = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <FiSettings style={{ color: 'var(--text-color)' }} />
      </button>
      {isOpen && <ThemeToggler />}
    </div>
  )
}

export default Settings

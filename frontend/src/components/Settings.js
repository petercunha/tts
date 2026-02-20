import React, { useState, useRef, useEffect } from 'react'
import { FiSettings } from 'react-icons/fi'
import ThemeToggler from './ThemeToggler'

const Settings = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [iconHovered, setIconHovered] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref])

  return (
    <div
      ref={ref}
      style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIconHovered(true)}
        onMouseLeave={() => setIconHovered(false)}
        style={{
          background: iconHovered ? 'rgba(128,128,128,0.2)' : 'none',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '0.3em',
          padding: '4px 5px 2px',
          transition: 'background-color 0.15s ease',
        }}
      >
        <FiSettings style={{ color: 'var(--text-color)' }} />
      </button>
      {isOpen && <ThemeToggler setIsOpen={setIsOpen} />}
    </div>
  )
}

export default Settings

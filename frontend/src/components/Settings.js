import React, { useState, useRef, useEffect } from 'react'
import { FiSettings } from 'react-icons/fi'
import ThemeToggler from './ThemeToggler'

const Settings = () => {
  const [isOpen, setIsOpen] = useState(false)
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
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <FiSettings style={{ color: 'var(--text-color)' }} />
      </button>
      {isOpen && <ThemeToggler setIsOpen={setIsOpen} />}
    </div>
  )
}

export default Settings

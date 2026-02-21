import React, { useState, useRef, useEffect } from 'react'
import { FiBox } from 'react-icons/fi'

const tools = [
  {
    name: '🎙️ VoiceBox Voice Cloning',
    url: 'https://voicebox.sh',
    credits: 'Jamie Pine and Qwen',
  },
  {
    name: '📚 Twitch Chat Logs',
    url: 'https://tv.supa.sh/logs',
    credits: 'Supa and Zonian',
  },
  {
    name: '🏅 Badge Alerts',
    url: 'https://x.com/StreamDatabase',
    credits: 'Ravenbtw',
  },
]

const ToolItem = ({ tool }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <li style={{ marginBottom: '0.3rem' }}>
      <a
        href={tool.url}
        // target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'block',
          padding: '0.4rem 0.5rem',
          borderRadius: '0.3em',
          backgroundColor: hovered ? 'rgba(128,128,128,0.2)' : 'transparent',
          transition: 'background-color 0.15s ease',
          color: 'var(--text-color)',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
          cursor: 'pointer',
        }}
      >
        {tool.name}
        <div
          style={{
            fontSize: '0.7rem',
            opacity: 0.6,
            marginLeft: 22,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
          }}
        >
          by {tool.credits}
        </div>
      </a>
    </li>
  )
}

const ToolsMenu = () => {
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
      style={{ position: 'absolute', top: '1.5rem', right: '3.5rem' }}
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
        <FiBox style={{ color: 'var(--text-color)' }} />
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '2rem',
            right: 0,
            backgroundColor: 'var(--background-color)',
            border: '1px solid var(--text-color)',
            borderRadius: '0.4em',
            padding: '0.8em',
            minWidth: '240px',
            zIndex: 100,
          }}
        >
          <h4
            style={{
              margin: '0.6rem 0 0.6rem 0.5rem',
              color: 'var(--text-color)',
              textAlign: 'left',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
              fontSize: '0.9rem',
            }}
          >
            Handy Tools
          </h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tools.map((tool) => (
              <ToolItem key={tool.name} tool={tool} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ToolsMenu

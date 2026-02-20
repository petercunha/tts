import React, { useState, useRef, useEffect } from 'react'
import { FiTool } from 'react-icons/fi'

const tools = [
  {
    name: '🏅 Badge Alerts',
    url: 'https://x.com/StreamDatabase',
    credits: 'Ravenbtw',
  },
  {
    name: '📚 Twitch Chat Logs',
    url: 'https://tv.supa.sh/logs',
    credits: 'Supa and Zonian',
  },
  {
    name: '🎙️ VoiceBox Voice Cloning',
    url: 'https://voicebox.sh',
    credits: 'Jamie Pine and Qwen',
  },
]

const ToolsMenu = () => {
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
      style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <FiTool style={{ color: 'var(--text-color)' }} />
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '2rem',
            left: 0,
            backgroundColor: 'var(--background-color)',
            border: '1px solid var(--text-color)',
            borderRadius: '0.4em',
            padding: '1em',
            minWidth: '300px',
            zIndex: 100,
          }}
        >
          <h4
            style={{
              margin: '0 0 1rem 0',
              color: 'var(--text-color)',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
              fontSize: '0.9rem',
            }}
          >
            Handy Tools
          </h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tools.map((tool) => (
              <li key={tool.name} style={{ marginBottom: '0.6rem' }}>
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--text-color)',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
                  }}
                >
                  {tool.name}
                </a>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-color)',
                    opacity: 0.6,
                    marginLeft: 22,
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
                  }}
                >
                  by {tool.credits}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ToolsMenu

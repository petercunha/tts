import React from 'react'

class Footer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showNotice: true,
    }
  }

  componentDidMount() {
    if (!isBannerDismissed()) {
      this.setState({
        showNotice: false,
      })
    }
  }

  render() {
    return (
      <p
        className="footer"
        style={{
          display: this.state.showNotice ? 'block' : 'none',
          color: 'var(--text-color)',
          backgroundColor: 'var(--footer-background-color)',
        }}
      >
        {/* <img
            style={{
              height: '25px',
              verticalAlign: 'middle',
              marginRight: '5px',
            }}
            alt="xqcL"
            src="https://cdn.frankerfacez.com/emoticon/425196/4"
          ></img> */}
        Made with <span className="emoji">💙</span> by Telepathy. This website
        is{' '}
        <a
          href="https://github.com/petercunha/tts"
          style={{ color: 'var(--text-color)' }}
        >
          open source
        </a>
        .
        <button
          style={{
            marginLeft: '10px',
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
            color: 'var(--text-color)',
            cursor: 'pointer',
            textDecoration: 'none',
            alignContent: 'right',
          }}
          onClick={(e) => {
            // Prevent notice from showing again
            localStorage.setItem('dismissed', true)
            this.setState({ showNotice: false })
          }}
        >
          [X]
        </button>
      </p>
    )
  }
}

const isBannerDismissed = () => {
  if (typeof window !== 'undefined') {
    return !JSON.parse(localStorage.getItem('dismissed'))
  } else {
    return false
  }
}

export default Footer

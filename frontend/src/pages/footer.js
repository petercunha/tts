import React from 'react'
import xqcL from '../images/xqcL.png'

class Footer extends React.Component {
  constructor(props) {
    // Banner shows only once
    const bannerDismissed = isBannerDismissed()

    super(props)
    this.state = {
      showNotice: !bannerDismissed,
    }
  }

  render() {
    return (
      <p
        className="footer"
        style={{ display: this.state.showNotice ? 'block' : 'none' }}
      >
        <b>
          <img
            style={{
              height: '25px',
              verticalAlign: 'middle',
              marginRight: '5px',
            }}
            alt="xqcL"
            src={xqcL}
          ></img>
          Please don't use this tool to harass streamers{' '}
        </b>
        <button
          style={{
            marginLeft: '5px',
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
            color: 'blue',
            cursor: 'pointer',
          }}
          onClick={e => {
            // Prevent notice from showing again
            localStorage.setItem('dismissed', true)

            this.setState({ showNotice: false })
          }}
        >
          [Okay, I won't]
        </button>
      </p>
    )
  }
}

const isBannerDismissed = () => {
  if (typeof window !== 'undefined')
    return JSON.parse(localStorage.getItem('dismissed'))
  return false
}

export default Footer

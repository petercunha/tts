import React from 'react'
import xqcL from '../images/xqcL.png'

class Footer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showNotice: false
    }
  }

  componentDidMount() {
    if (!isBannerDismissed()) {
      this.setState({
        
        showNotice: false
        
      })
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
          Wanna support the site?{' '}
        </b> Plant a tree <a href="https://megaseeds.us">by clicking here!</a>
        <button
          style={{
            marginLeft: '10px',
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
            color: 'gray',
            cursor: 'pointer',
            textDecoration: 'underline',
            alignContent: 'right'
          }}
          onClick={e => {
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
    return JSON.parse(localStorage.getItem('dismissed'))
  } else {
    return false
  }
}

export default Footer

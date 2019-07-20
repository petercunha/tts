import React from 'react'
import axios from 'axios'

import ReactAudioPlayer from 'react-audio-player'
import Layout from '../components/layout'
import xqcL from '../images/xqcL.png'

// Lambda Cloud Function API
const API =
  'https://us-central1-sunlit-context-217400.cloudfunctions.net/streamlabs-tts'

// How many seconds a user must wait after using TTS
const COOLDOWN = 3

class Index extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      cooldown: COOLDOWN,
      text: '',
      voice: 'Brian',
      buttonText: 'Play',
      buttonLoading: false,
      warningText: '',
      audioUrl: '',
    }

    this.handleTextChange = this.handleTextChange.bind(this)
    this.handleVoiceChange = this.handleVoiceChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleTextChange(event) {
    this.setState({ text: event.target.value })
  }

  handleVoiceChange(event) {
    this.setState({ voice: event.target.value })
  }

  handleSubmit(event) {
    // Rate limit the button
    this.setState({ buttonLoading: true })

    let count = 0
    let timer = setInterval(() => {
      this.setState({
        buttonText: `Please wait ${this.state.cooldown -
          Math.floor(count * 0.1)}s`,
      })
      count++

      if (count >= this.state.cooldown * 10) {
        this.setState({ buttonText: 'Play', buttonLoading: false })
        clearInterval(timer)
      }
    }, 100)

    const payload = {
      text: this.state.text,
      voice: this.state.voice,
    }

    axios
      .post(API, payload)
      .then(res => {
        let response = res.data
        if (response.success) {
          this.setState({
            audioUrl: response.speak_url,
            cooldown: COOLDOWN,
            warningText: '',
          })
        }
      })
      .catch(err => {
        console.log('We got an error:', err)
        this.setState(prev => ({
          warningText: `Streamlabs is rate limiting you. Cooldown adjusted to ${prev.cooldown *
            2} seconds.`,
          cooldown: prev.cooldown * 2,
        }))
      })

    event.preventDefault()
  }

  render() {
    return (
      <Layout>
        <h3>Streamlabs Text-to-Speech Emulator</h3>
        <p>
          This is a simple web application that emulates the Streamlabs TTS
          feature used by many <a href="https://twitch.tv">Twitch.tv</a>{' '}
          streamers. You can use this to hear how your donation's text-to-speech
          will sound. Check out{' '}
          <a href="https://github.com/petercunha/streamlabs-tts">
            the source code
          </a>{' '}
          for this website on my GitHub, it's poggy woggy.
        </p>
        <br />
        <form
          onSubmit={this.handleSubmit}
          style={{
            backgroundColor: '#d3d3d370',
            padding: '1em',
            borderRadius: '0.4em',
          }}
        >
          <p
            style={{
              margin: '0',
              color: 'gray',
              fontFamily: 'italic',
              textAlign: 'center',
              marginTop: '5px',
              marginBottom: '15px',
              display: this.state.warningText !== '' ? 'block' : 'none',
            }}
          >
            {this.state.warningText}
          </p>

          <div>
            <span>Text: </span>
            <input
              type="text"
              value={this.state.text}
              maxlength="300"
              onChange={this.handleTextChange}
              style={{ width: '90%' }}
            />
          </div>
          <div style={{ marginTop: '5px' }}>
            <span>Voice: </span>
            <select value={this.state.voice} onChange={this.handleVoiceChange}>
              <option value="Brian">Brian</option>
              <option value="Ivy">Ivy</option>
              <option value="Justin">Justin</option>
              <option value="Russell">Russell</option>
              <option value="Nicole">Nicole</option>
              <option value="Emma">Emma</option>
              <option value="Amy">Amy</option>
              <option value="Joanna">Joanna</option>
              <option value="Salli">Salli</option>
              <option value="Kimberly">Kimberly</option>
              <option value="Kendra">Kendra</option>
              <option value="Joey">Joey</option>
              <option value="Mizuki">Mizuki (Japanese)</option>
              <option value="Chantal">Chantal (French)</option>
              <option value="Mathieu">Mathieu (French)</option>
              <option value="Maxim">Maxim (Russian)</option>
              <option value="Raveena">Raveena (Indian)</option>
            </select>
          </div>

          <div style={{ marginTop: '15px' }}>
            <input
              type="submit"
              value={this.state.buttonText}
              disabled={this.state.buttonLoading}
            />
          </div>
        </form>

        <br />

        <ReactAudioPlayer
          src={this.state.audioUrl}
          style={{
            visibility: this.state.audioUrl !== '' ? 'visible' : 'hidden',
          }}
          autoPlay
          controls
        />

        <p className="footer">
          <b>
            <img
              style={{
                height: '30px',
                verticalAlign: 'middle',
                marginRight: '5px',
              }}
              alt="xqcL"
              src={xqcL}
            ></img>
            Please don't use this tool to harass streamers{' '}
          </b>
        </p>
      </Layout>
    )
  }
}

export default Index

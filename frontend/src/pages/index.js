import React from 'react'
import ReactAudioPlayer from 'react-audio-player'
import Layout from '../components/layout'
import Footer from './footer'
import greet from '../lib/greeting'
import solveChallenge from '../lib/pow'

const API = 'https://api.textreader.pro/tts'
const CHALLENGE_API = 'https://api.textreader.pro/challenge'

// How many seconds a user must wait if API is rate limiting us
const COOLDOWN = 5

class Index extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      cooldown: 0,
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

    // Connect to Socket.io
    // this.setupSockets()

    // Print message in console
    greet()
  }

  handleTextChange(event) {
    this.setState({ text: event.target.value })
  }

  handleVoiceChange(event) {
    this.setState({ voice: event.target.value })
  }

  handleSubmit(event) {
    this.setState({ buttonLoading: true })

    let challengeToken = null

    fetch(CHALLENGE_API)
      .then((res) => res.json())
      .then(({ token, difficulty }) => {
        challengeToken = token
        return solveChallenge(token, difficulty)
      })
      .then((solution) => {
        return fetch(
          `${API}?voice=${this.state.voice}&text=${encodeURIComponent(this.state.text)}&token=${challengeToken}&solution=${solution}`
        )
      })
      .catch((err) => {
        console.error('Challenge failed:', err)
        this.setState((prev) => ({
          warningText: 'Bot protection challenge failed. Please try again.',
          cooldown: prev.cooldown + COOLDOWN,
        }))
        this.setState({ buttonText: 'Play', buttonLoading: false })
        return null
      })
      .then((data) => {
        if (!data) return
        data.blob().then((bytes) => {
          if (data.status === 200) {
            this.setState((prev) => ({
              audioUrl: URL.createObjectURL(bytes),
              cooldown: prev.cooldown < COOLDOWN ? prev.cooldown : COOLDOWN,
              warningText: '',
            }))

            this.log(this.state.voice, this.state.text)
          }
        })
      })
      .catch((err) => {
        console.log('We got an error:', err)
        this.setState((prev) => ({
          warningText: `We're getting some upstream API errors. Cooldown adjusted to ${
            prev.cooldown + COOLDOWN
          } seconds.`,
          cooldown: prev.cooldown + COOLDOWN,
        }))
      })
      .finally(() => {
        let count = 0
        let timer = setInterval(() => {
          this.setState({
            buttonText: `Please wait ${
              this.state.cooldown - Math.floor(count * 0.1)
            }s`,
          })
          count++

          if (count >= this.state.cooldown * 10) {
            this.setState({ buttonText: 'Play', buttonLoading: false })
            clearInterval(timer)
          }
        }, 100)
      })
    event.preventDefault()
  }

  // Log request in DB
  async log(voice, text) {
    await fetch('https://logs.textreader.pro/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voice,
        text,
      }),
    })
  }

  render() {
    return (
      <Layout>
        <h3 style={{ color: 'var(--text-color)' }}>Textreader Pro</h3>
        <p style={{ color: 'var(--text-color)' }}>
          This tool converts text-to-speech with any common donation voices. You
          can use this to hear how your donation will sound on Twitch. 
        </p>
        {/* <p  style={{ color: 'var(--text-color)', textAlign: 'center' }}><b style={{ marginBottom: 3}}>NOTE: We are currently experiencing a server outage</b>!!<br />Please use <a style={{ color: 'var(--text-color)' }} href="https://lazypy.ro/tts/?voice=Brian&service=Streamlabs">LazyPyro TTS</a> until the situation is resolved. Thanks, and have a nice day.</p> */}
        <br />
        <form
          onSubmit={this.handleSubmit}
          style={{
            backgroundColor: 'var(--button-background-color)',
            padding: '1em',
            borderRadius: '0.4em',
          }}
        >
          <p
            style={{
              margin: '0',
              fontFamily: 'italic',
              textAlign: 'center',
              marginTop: '5px',
              marginBottom: '15px',
              display: this.state.warningText !== '' ? 'block' : 'none',
              color: 'var(--text-color)',
            }}
          >
            {this.state.warningText}
          </p>

          <div>
            <span style={{ color: 'var(--text-color)' }}>Text: </span>
            <input
              type="text"
              value={this.state.text}
              maxLength="300"
              onChange={this.handleTextChange}
              style={{
                width: '90%',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-color)',
              }}
            />
          </div>
          <div style={{ marginTop: '5px' }}>
            <span style={{ color: 'var(--text-color)' }}>Voice: </span>
            <select
              value={this.state.voice}
              onChange={this.handleVoiceChange}
              style={{
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="Brian">Brian</option>
              <option value="en-GB-Wavenet-A">Bella</option>
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
              <option value="Hans">Hans (German)</option>
              <option value="Raveena">Raveena (Indian)</option>
            </select>
          </div>

          <div style={{ marginTop: '15px' }}>
            <input
              type="submit"
              value={this.state.buttonText}
              disabled={this.state.buttonLoading}
              style={{
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-color)',
              }}
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

        <Footer />
      </Layout>
    )
  }
}

export default Index

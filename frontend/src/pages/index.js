import React from 'react'
import ReactAudioPlayer from 'react-audio-player'
import Layout from '../components/layout'
import Footer from './footer'
import greet from '../lib/greeting'
import axios from 'axios'

// TTS API
const API = 'https://us-central1-sunlit-context-217400.cloudfunctions.net/streamlabs-tts'

// How many seconds a user must wait if Streamlabs is rate limiting us
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
    // Rate limit the button
    this.setState({ buttonLoading: true })

    const payload = {
      text: this.state.text,
      voice: this.state.voice,
    }

    axios
      .post(API, payload)
      .then(res => {
        let response = res.data
        if (response.success) {
          this.setState(prev => ({
            audioUrl: response.speak_url,
            cooldown: prev.cooldown < COOLDOWN ? prev.cooldown : COOLDOWN,
            warningText: '',
          }))
        }
      })
      .catch(err => {
        console.log('We got an error:', err)
        this.setState(prev => ({
          warningText: `Streamlabs is rate limiting our website. Cooldown adjusted to ${prev.cooldown +
            COOLDOWN} seconds.`,
          cooldown: prev.cooldown + COOLDOWN,
        }))
      })
      .finally(() => {
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
      })

    event.preventDefault()
  }

  render() {
    return (
      <Layout>
        <h3>Textreader Pro</h3>
        <p>
          This tool converts text-to-speech with any of Streamlabs' voices. You can use this to hear how
          your donation will sound on Twitch.
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
              maxLength="300"
              onChange={this.handleTextChange}
              style={{ width: '90%' }}
            />
          </div>
          <div style={{ marginTop: '5px' }}>
            <span>Voice: </span>
            <select value={this.state.voice} onChange={this.handleVoiceChange}>
              <option value="Aditi">Aditi</option>
              <option value="Amy">Amy</option>
              <option value="Astrid">Astrid</option>
              <option value="Bianca">Bianca</option>
              <option value="Brian">Brian</option>
              <option value="Camila">Camila</option>
              <option value="Carla">Carla</option>
              <option value="Carmen">Carmen</option>
              <option value="Celine">Celine</option>
              <option value="Chantal">Chantal</option>
              <option value="Conchita">Conchita</option>
              <option value="Cristiano">Cristiano</option>
              <option value="Dora">Dora</option>
              <option value="Emma">Emma</option>
              <option value="Enrique">Enrique</option>
              <option value="Ewa">Ewa</option>
              <option value="Filiz">Filiz</option>
              <option value="Geraint">Geraint</option>
              <option value="Giorgio">Giorgio</option>
              <option value="Gwyneth">Gwyneth</option>
              <option value="Hans">Hans</option>
              <option value="Ines">Ines</option>
              <option value="Ivy">Ivy</option>
              <option value="Jacek">Jacek</option>
              <option value="Jan">Jan</option>
              <option value="Joanna">Joanna</option>
              <option value="Joey">Joey</option>
              <option value="Justin">Justin</option>
              <option value="Karl">Karl</option>
              <option value="Kendra">Kendra</option>
              <option value="Kimberly">Kimberly</option>
              <option value="Lea">Lea</option>
              <option value="Liv">Liv</option>
              <option value="Lotte">Lotte</option>
              <option value="Lucia">Lucia</option>
              <option value="Lupe">Lupe</option>
              <option value="Mads">Mads</option>
              <option value="Maja">Maja</option>
              <option value="Marlene">Marlene</option>
              <option value="Mathieu">Mathieu</option>
              <option value="Matthew">Matthew</option>
              <option value="Maxim">Maxim</option>
              <option value="Mia">Mia</option>
              <option value="Miguel">Miguel</option>
              <option value="Mizuki">Mizuki</option>
              <option value="Naja">Naja</option>
              <option value="Nicole">Nicole</option>
              <option value="Penelope">Penelope</option>
              <option value="Raveena">Raveena</option>
              <option value="Ricardo">Ricardo</option>
              <option value="Ruben">Ruben</option>
              <option value="Russell">Russell</option>
              <option value="Salli">Salli</option>
              <option value="Seoyeon">Seoyeon</option>
              <option value="Takumi">Takumi</option>
              <option value="Tatyana">Tatyana</option>
              <option value="Vicki">Vicki</option>
              <option value="Vitoria">Vitoria</option>
              <option value="Zeina">Zeina</option>
              <option value="Zhiyu">Zhiyu</option>
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

        {/* Anti-twitch spam banner */}
        <Footer />
      </Layout>
    )
  }
}

export default Index

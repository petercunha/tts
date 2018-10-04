import React from 'react'
import axios from 'axios'

import ReactAudioPlayer from 'react-audio-player'
import Layout from '../components/layout'
import PogChamp from '../images/pogchamp.png'
// Lambda Cloud Function API
const API =
  'https://us-central1-sunlit-context-217400.cloudfunctions.net/streamlabs-tts'
class Index extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      text: '',
      voice: 'Brian',
      loading: null,
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
    this.setState({ loading: true })

    const payload = {
      text: this.state.text,
      voice: this.state.voice,
    }

    axios
      .post(API, payload)
      .then(res => {
        let response = res.data
        if (response.success) {
          this.setState({ audioUrl: response.speak_url, loading: null })
        }
      })
      .catch(err => {
        console.log('We got an error:', err)
        this.setState({ loading: null })
      })

    event.preventDefault()
  }

  render() {
    return (
      <Layout>
        <h3>Streamlabs Text-to-Speech Emulator</h3>
        <p>
          This is a simple web application that emulates Streamlabs' TTS feature
          used by many <a href="https://twitch.tv">Twitch.tv</a> streamers. You
          can use this to see how your donation's text-to-speech reading will
          sound. Check out{' '}
          <a href="https://github.com/petercunha/streamlabs-tts">
            the source code for this website
          </a>{' '}
          on my GitHub, it is{' '}
          <img align="center" src={PogChamp} alt="PogChamp" />
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
          <div>
            <span>Text: </span>
            <input
              type="text"
              value={this.state.text}
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
              <option value="Raveena">Raveena</option>
              <option value="Joanna">Joanna</option>
              <option value="Salli">Salli</option>
              <option value="Kimberly">Kimberly</option>
              <option value="Kendra">Kendra</option>
              <option value="Joey">Joey</option>
            </select>
          </div>

          <div style={{ marginTop: '15px' }}>
            <input type="submit" value="Play" disabled={this.state.loading} />
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
      </Layout>
    )
  }
}

export default Index

import React, { useEffect } from 'react'
import { VideoProvider } from './VideoProvider'
import { VideoBroadcastItem } from './VideoBroadcastItem'
import { BroadcastStartButton } from './BroadcastStartButton'

const log = (text) => console.log('App ' + text)
// const serverUrl = (process.env.LOCAL_ENV === 'true' && 'http://localhost:8000') || 'https://haja-fgabriel.freemyip.com:8000'
const serverUrl = 'http://localhost:8000'

function App () {
  useEffect(() => {
    log('useEffect')
  })

  log('render')

  return (
    <div className="App">
      <header className="App-header">
      </header>
      <VideoProvider connectionProps={{ serverUrl }}>
        <VideoBroadcastItem />
        <BroadcastStartButton />
      </VideoProvider>
    </div>
  )
}

export default App

import React, { useEffect } from 'react'
import { VideoProvider } from './VideoProvider'
import { VideoBroadcastItem } from './VideoBroadcastItem'
import { RoomControlPanel } from './RoomControlPanel'

const log = (text) => console.log('App ' + text)
// const serverUrl = (process.env.LOCAL_ENV === 'true' && 'http://localhost:8000') || 'https://haja-fgabriel.freemyip.com:8000'
const serverUrl = process.env.SERVER_URL || 'http://localhost:8000'

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
        <RoomControlPanel />
      </VideoProvider>
    </div>
  )
}

export default App

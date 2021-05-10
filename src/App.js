import React, { useEffect } from 'react'
import { VideoProvider } from './VideoProvider'
import { VideoBroadcastItem } from './VideoBroadcastItem'
import { BroadcastStartButton } from './BroadcastStartButton'

const log = (text) => console.log('App ' + text)

function App () {
  useEffect(() => {
    log('useEffect')
  })

  log('render')

  return (
    <div className="App">
      <header className="App-header">
        <VideoProvider connectionProps={{ serverUrl: 'http://localhost:8000' }}>
          <VideoBroadcastItem />
          <BroadcastStartButton />
        </VideoProvider>
      </header>
    </div>
  )
}

export default App

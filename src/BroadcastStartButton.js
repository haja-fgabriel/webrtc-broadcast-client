import React, { useState, useContext } from 'react'
import { VideoContext } from './VideoProvider'

export const BroadcastStartButton = () => {
  const { fetchVideo, broadcaster, hasVideo } = useContext(VideoContext)
  const [roomName, setRoomName] = useState('')

  return (
    <div>
      {hasVideo && ((broadcaster && <p>You are a broadcaster.</p>) ||
        <p>You are a viewer.</p>)
      }
      <input type="text" onChange={(e) => setRoomName(e.target.value)}></input>
      <button onClick={() => fetchVideo(roomName)}>Push me</button>
    </div>
  )
}

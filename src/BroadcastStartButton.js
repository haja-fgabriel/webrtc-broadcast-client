import React, { useContext } from 'react'
import { VideoContext } from './VideoProvider'

export const BroadcastStartButton = () => {
  const { fetchVideo } = useContext(VideoContext)

  return (
    <button onClick={fetchVideo}>Push me</button>
  )
}

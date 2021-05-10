import React, { useContext, useEffect, createRef } from 'react'
import { VideoContext } from './VideoProvider'

const log = (text) => console.log('VideoItem ' + text)

export const VideoBroadcastItem = () => {
  const context = useContext(VideoContext)
  const { hasVideo, videoStream } = context

  const videoRef = createRef()

  useEffect(gotVideo, [hasVideo])

  return (
    <video ref={videoRef} />
  )

  function gotVideo () {
    log('gotVideo')
    if (hasVideo) {
      const video = videoRef.current
      console.log(videoStream)
      video.srcObject = videoStream
      video.onloadedmetadata = (e) => {
        log('onloadedmetadata')
        video.play()
      }
    }
  }
}

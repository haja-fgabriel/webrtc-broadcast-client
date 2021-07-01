import React, { useContext, useEffect, createRef } from 'react'
import { VideoContext } from './VideoProvider'

const log = (text) => console.log('VideoBroadcastItem ' + text)

export const VideoBroadcastItem = () => {
  const { hasVideo, videoStream, pendingSet, broadcaster } = useContext(VideoContext)

  const videoRef = createRef()

  useEffect(videoEffect, [pendingSet, hasVideo])

  return (
    <video autoPlay muted ref={videoRef} />
  )

  function videoEffect () {
    const video = videoRef.current
    log('videoEffect')
    if (pendingSet) {
      video.srcObject = undefined
    }
    video.onerror = (e) => {
      log('cannot open stream')
    }
    if (hasVideo) {
      log('setting video stream')
      video.srcObject = videoStream
      video.onloadedmetadata = (e) => {
        log('onloadedmetadata')
        video.muted = broadcaster
      }
    }
  }
}

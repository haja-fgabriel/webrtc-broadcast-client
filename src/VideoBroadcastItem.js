import React, { useContext, useEffect, createRef } from 'react'
import { VideoContext } from './VideoProvider'

const log = (text) => console.log('VideoBroadcastItem ' + text)

export const VideoBroadcastItem = () => {
  const { hasVideo, videoStream, inRoom, pendingSet, broadcaster } = useContext(VideoContext)

  const videoRef = createRef()

  useEffect(videoEffect, [pendingSet, hasVideo])

  return (
    <video ref={videoRef} />
  )

  function videoEffect () {
    const video = videoRef.current
    log('videoEffect')
    if (pendingSet) {
      video.srcObject = undefined
    }
    if (hasVideo) {
      log('setting video stream')
      console.log(videoStream.getTracks())
      video.srcObject = videoStream
      video.onloadedmetadata = (e) => {
        log('onloadedmetadata')
        video.play()
        if (broadcaster) {
          video.muted = true
        }
      }
    }
  }
}

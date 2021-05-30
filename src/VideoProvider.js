import React, { useCallback, useEffect, useReducer } from 'react'
import { useWebRTC } from './rtc/useWebRTC'

const MediaDevices = navigator.mediaDevices

const initialVideoState = {
  pendingFetch: false,
  hasVideo: false,
  videoStream: undefined,
  broadcaster: false,
  fetchVideo: undefined,
  room: undefined
}

const constraints = {
  audio: true,
  video: true
}

const log = (text) => console.log('VideoProvider ' + text)

export const VideoContext = React.createContext(initialVideoState)

const reducer = (state, { type, room, stream }) => {
  switch (type) {
    case 'fetchingVideo':
      return { ...state, pendingFetch: true, room }
    case 'fetchingError':
      return { ...state, pendingFetch: false, hasVideo: false, videoStream: undefined }
    case 'joinedAsViewer':
      return { ...state, pendingFetch: false, hasVideo: true, videoStream: stream, broadcaster: false }
    case 'joinedAsBroadcaster':
      return { ...state, pendingFetch: false, hasVideo: true, videoStream: stream, broadcaster: true }
    default:
      return state
  }
}

// eslint-disable-next-line react/prop-types
export const VideoProvider = ({ connectionProps, children }) => {
  const [state, dispatch] = useReducer(reducer, initialVideoState)
  const { pendingFetch, hasVideo, videoStream, broadcaster, room } = state
  const { connectionState, as, inRoom, joinRoom } = useWebRTC(connectionProps)

  const fetchVideo = useCallback(fetchVideoCallback, [])
  const value = { connectionState, inRoom, pendingFetch, hasVideo, videoStream, fetchVideo, broadcaster, room }

  useEffect(fetchVideoEffect, [pendingFetch])
  useEffect(joinedEffect, [as])

  log('render')

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  )

  function fetchVideoCallback (room) {
    log('fetchVideo')
    dispatch({ type: 'fetchingVideo', room })
  }

  function joinedEffect () {
    log('joinedEffect ' + as)
    if (as === 'broadcaster') {
      MediaDevices.getUserMedia(constraints)
        .then((stream) => {
          dispatch({ type: 'joinedAsBroadcaster', stream: stream })
          // TODO add stream tracks to the useWebRTC hook
          // setStream(stream)
        })
        .catch((err) => {
          log(err)
          dispatch({ type: 'fetchingError' })
        })
    } else if (as === 'viewer') {
      // dispatch({ type: 'joinedAsViewer', stream: stream })
    }
  }

  function fetchVideoEffect () {
    log('fetchVideoEffect')
    if (pendingFetch) {
      // TODO initiate WebRTC streaming
      joinRoom(room)
    }
  }
}

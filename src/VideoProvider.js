import React, { useCallback, useEffect, useReducer } from 'react'
import { useWebRTC } from './rtc/useWebRTC'

const MediaDevices = navigator.mediaDevices

const initialVideoState = {
  pendingFetch: false,
  pendingSet: false,
  pendingGetCameras: false,
  hasVideo: false,
  inRoom: false,
  videoStream: undefined,
  broadcaster: false,
  fetchVideo: undefined,
  setCurrentCameraAndMicrophone: undefined,
  cameras: undefined,
  microphones: undefined,
  currentCamera: undefined,
  currentMicrophone: undefined,
  room: undefined
}

const log = (text) => console.log('VideoProvider ' + text)

export const VideoContext = React.createContext(initialVideoState)

const reducer = (state, { type, room, stream, cameras, microphones, currentCamera, currentMicrophone }) => {
  switch (type) {
    case 'fetchingCameras':
      return { ...state, pendingGetCameras: true }
    case 'fetchedCameras':
      return { ...state, cameras, microphones, pendingGetCameras: false }
    case 'settingCamera':
      return { ...state, pendingSet: true, currentCamera, currentMicrophone }
    case 'settedCamera':
      return { ...state, pendingSet: false, videoStream: stream, hasVideo: true }
    case 'fetchingVideo':
      return { ...state, pendingFetch: true, room }
    case 'fetchingError':
      return { ...state, pendingFetch: false, hasVideo: false, videoStream: undefined }
    case 'joinedAsViewer':
      return { ...state, pendingFetch: false, hasVideo: true, videoStream: stream, broadcaster: false }
    case 'joinedAsBroadcaster':
      return { ...state, pendingFetch: false, hasVideo: false, broadcaster: true, pendingSet: true }
    default:
      return state
  }
}

// eslint-disable-next-line react/prop-types
export const VideoProvider = ({ connectionProps, children }) => {
  const [state, dispatch] = useReducer(reducer, initialVideoState)
  const { pendingFetch, pendingSet, pendingGetCameras, hasVideo, videoStream, broadcaster, room, cameras, microphones, currentCamera, currentMicrophone } = state
  const { connectionState, as, inRoom, joinRoom } = useWebRTC(connectionProps)

  const fetchVideo = useCallback(joinRoomCallback, [])
  const setCurrentCameraAndMicrophone = useCallback(setCurrentCameraAndMicrophoneCallback, [])
  const value = { connectionState, inRoom, pendingFetch, pendingSet, pendingGetCameras, hasVideo, videoStream, fetchVideo, broadcaster, room, cameras, microphones, setCurrentCameraAndMicrophone }

  useEffect(getCamerasEffect, [])
  useEffect(setCameraEffect, [pendingSet])
  useEffect(joinRoomEffect, [pendingFetch])
  useEffect(joinedEffect, [as])

  log('render')

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  )

  function joinRoomCallback (room) {
    log('fetchVideo')
    dispatch({ type: 'fetchingVideo', room })
  }

  function setCurrentCameraAndMicrophoneCallback (currentCamera, currentMicrophone) {
    dispatch({ type: 'settingCamera', currentCamera, currentMicrophone })
  }

  function joinedEffect () {
    log('joinedEffect ' + as)
    if (as === 'broadcaster') {
      dispatch({ type: 'joinedAsBroadcaster' })
    } else if (as === 'viewer') {
      // dispatch({ type: 'joinedAsViewer', stream: stream })
    }
  }

  function joinRoomEffect () {
    log('joinRoomEffect')
    if (pendingFetch) {
      // TODO initiate WebRTC streaming
      joinRoom(room)
    }
  }

  function getCamerasEffect () {
    log('getCamerasEffect')
    dispatch({ type: 'fetchingCameras' })
    MediaDevices.enumerateDevices()
      .then(devices => {
        dispatch({
          type: 'fetchedCameras',
          cameras: devices.filter(device => device.kind === 'videoinput'),
          microphones: devices.filter(device => device.kind === 'audioinput')
        })
      })
  }

  function setCameraEffect () {
    log('setCameraEffect')
    if (pendingSet) {
      videoStream && videoStream.getTracks().forEach(track => track.stop())
      const constraints = {
        audio: (currentMicrophone && { deviceId: currentMicrophone.deviceId }) || true,
        video: (currentCamera && { deviceId: currentCamera.deviceId }) || true
      }
      MediaDevices.getUserMedia(constraints)
        .then((stream) => {
          dispatch({ type: 'settedCamera', stream })
        })
    }
  }
}

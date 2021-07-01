import React, { useCallback, useEffect, useReducer } from 'react'
import { useWebRTC } from './rtc/useWebRTC'
import { getAverageDownloadSpeed } from './utils/test-connection'

const MediaDevices = navigator.mediaDevices

const initialVideoState = {
  pendingJoin: false,
  pendingSet: false,
  pendingGetCameras: false,
  hasVideo: false,
  inRoom: false,
  videoStream: undefined,
  broadcaster: false,
  fetchVideo: undefined,
  setCurrentCameraAndMicrophone: undefined,
  settingCameraError: undefined,
  cameras: undefined,
  microphones: undefined,
  connectionPerformanceProps: undefined,
  currentCamera: undefined,
  currentMicrophone: undefined,
  room: undefined
}

const log = (text) => console.log('VideoProvider ' + text)

export const VideoContext = React.createContext(initialVideoState)

const reducer = (state, { type, room, stream, cameras, microphones, currentCamera, connectionPerformanceProps, currentMicrophone, error }) => {
  switch (type) {
    case 'disconnected':
      return { ...state, hasVideo: false, broadcaster: false, videoStream: undefined, pendingSet: false, inRoom: undefined }
    case 'fetchingCameras':
      return { ...state, pendingGetCameras: true }
    case 'fetchedCameras':
      return { ...state, cameras, microphones, pendingGetCameras: false }
    case 'settingCamera':
      return { ...state, pendingSet: true, currentCamera, currentMicrophone, settingCameraError: undefined }
    case 'settedCamera':
      return { ...state, pendingSet: false, videoStream: stream, hasVideo: true }
    case 'settingCameraError':
      return { ...state, pendingSet: false, videoStream: undefined, settingCameraError: error }
    case 'joiningRoom':
      return { ...state, pendingJoin: true, room, connectionPerformanceProps }
    case 'newParentOffer':
      console.log('changing state to newParentOffer')
      return { ...state, hasVideo: false }
    case 'onTrack':
      return { ...state, hasVideo: true, videoStream: stream }
    case 'fetchingError':
      return { ...state, pendingJoin: false, hasVideo: false, videoStream: undefined, settingCameraError: error }
    case 'joinedAsViewer':
      return { ...state, pendingJoin: false, hasVideo: true, videoStream: stream, broadcaster: false }
    case 'joinedAsBroadcaster':
      return { ...state, pendingJoin: false, hasVideo: false, broadcaster: true, pendingSet: true }
    default:
      return state
  }
}

// eslint-disable-next-line react/prop-types
export const VideoProvider = ({ connectionProps, children }) => {
  const [state, dispatch] = useReducer(reducer, initialVideoState)
  const { pendingJoin, pendingSet, settingCameraError, pendingGetCameras, hasVideo, videoStream, broadcaster, room, cameras, microphones, currentCamera, currentMicrophone, connectionPerformanceProps } = state
  const { connectionState, as, inRoom, joinRoom, addStream, stream: peerStream, setOnParentOffer, setOnTrack } = useWebRTC(connectionProps)

  const fetchVideo = useCallback(joinRoomCallback, [])
  const setCurrentCameraAndMicrophone = useCallback(setCurrentCameraAndMicrophoneCallback, [])
  const value = { connectionState, connectionPerformanceProps, inRoom, pendingJoin, pendingSet, pendingGetCameras, hasVideo, videoStream, fetchVideo, broadcaster, room, cameras, microphones, setCurrentCameraAndMicrophone, settingCameraError }

  useEffect(getCamerasEffect, [])
  useEffect(setCameraEffect, [pendingSet])
  useEffect(joinRoomEffect, [pendingJoin])
  useEffect(joinedEffect, [as])
  useEffect(hasVideoEffect, [hasVideo])
  useEffect(isConnectedEffect, [connectionState])

  log('render')

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  )

  function joinRoomCallback (room) {
    log('joinRoomCallback')
    getAverageDownloadSpeed().then(downloadSpeed => {
      log('download speed: ' + downloadSpeed + (downloadSpeed > 4 ? '(FAST)' : '(tortoise)'))
      dispatch({ type: 'joiningRoom', room, connectionPerformanceProps: { downloadSpeed } })
    })
      .catch(e => dispatch({ type: 'joiningRoom', room, connectionPerformanceProps: { downloadSpeed: 1 } }))
  }

  function setCurrentCameraAndMicrophoneCallback (currentCamera, currentMicrophone) {
    dispatch({ type: 'settingCamera', currentCamera, currentMicrophone })
  }

  function joinedEffect () {
    log('joinedEffect ' + as)
    if (as === 'broadcaster') {
      log('joined as broadcaster')
      dispatch({ type: 'joinedAsBroadcaster' })
    } else if (as === 'viewer') {
      log('joined as viewer')
      console.log(peerStream.getTracks())
      dispatch({ type: 'joinedAsViewer', stream: peerStream })

      setOnParentOffer(() => {
        log('joinedEffect setOnParentOffer')
        dispatch({ type: 'newParentOffer' })
      })
      setOnTrack(() => {
        log('joinedEffect setOnTrack')
        dispatch({ type: 'onTrack', stream: peerStream })
      })
    }
  }

  function joinRoomEffect () {
    log('joinRoomEffect')
    pendingJoin && joinRoom(room, connectionPerformanceProps)
  }

  function isConnectedEffect () {
    if (connectionState === 'disconnected') {
      dispatch({ type: 'disconnected' })
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
      .catch(error => {
        dispatch({ type: 'settingCameraError', error })
        log('Cannot fetch image from the camera. Make sure the camera is not used by another process.')
      })
  }

  function hasVideoEffect () {
    log('hasVideoEffect - hasVideo ' + hasVideo)
    if (!hasVideo) {
      videoStream && videoStream.getTracks().forEach(track => track.stop())
    }
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
          addStream(stream)
          dispatch({ type: 'settedCamera', stream })
        })
        .catch(_ => {
          const error = 'Cannot fetch image from the camera. Make sure it is not used by another process.'
          dispatch({ type: 'settingCameraError', error })
          log(error)
        })
    }
  }
}

import React, { useState, useContext, useEffect } from 'react'
import { VideoContext } from './VideoProvider'

const log = text => console.log('RoomControlPanel ' + text)

export const RoomControlPanel = () => {
  const { connectionPerformanceProps, fetchVideo, broadcaster, hasVideo, cameras, microphones, setCurrentCameraAndMicrophone, settingCameraError, inRoom } = useContext(VideoContext)
  const [roomName, setRoomName] = useState('')
  const [currentCamera, setCurrentCamera] = useState(undefined)
  const [currentMicrophone, setCurrentMicrophone] = useState(undefined)

  useEffect(setCurrentCameraAndMicrophoneEffect, [currentCamera, currentMicrophone])

  log('render')

  return (
    <div>
      {inRoom && hasVideo && ((broadcaster && <p>You are a broadcaster.</p>) ||
        <p>You are a viewer.</p>)
      }
      {inRoom && hasVideo && broadcaster &&
      <div>
        {settingCameraError &&
          <div className="error">
            <p> {settingCameraError} </p>
          </div>}
        <p>Choose a camera:</p>
        <select onChange={e => setCurrentCamera(e.target.value)}>
          {cameras.map(
            (cam, index) =>
              <option key={cam.deviceId} value={index}> {cam.label} </option>)}
        </select>

        <p>Choose an audio input source:</p>
        <select onChange={e => setCurrentMicrophone(e.target.value)}>
          {microphones.map(
            (mic, index) =>
              <option key={mic.deviceId} value={index}> {mic.label} </option>)}
        </select>
      </div>}
      {connectionPerformanceProps &&
          <div>
            <p>Download speed: { Math.trunc(connectionPerformanceProps.downloadSpeed * 1000) / 1000 } KB/s</p>
          </div>}
      {!inRoom &&
      <div>
        <input type="text" placeholder="Type a room to join in" onChange={(e) => setRoomName(e.target.value)}></input>
        <button onClick={() => fetchVideo(roomName)}>Join room</button>
      </div>}
    </div>
  )

  function setCurrentCameraAndMicrophoneEffect () {
    log('setCurrentCameraAndMicrophoneEffect')
    inRoom && broadcaster && setCurrentCameraAndMicrophone(cameras[currentCamera], microphones[currentMicrophone])
  }
}

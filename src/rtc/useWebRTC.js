import { useCallback, useEffect, useState } from 'react'
import { RTCForwardingPeer, RTCForwardingPeerConfiguration } from './core/RTCForwardingPeer'

const log = (text) => console.log('useWebRTC ' + text)

/**
 * A hook that wraps a RTCForwardingPeer instance into an easy to use interface.
 *
 * @param {RTCForwardingPeerConfiguration} props
 * @returns {}
 */
export function useWebRTC (props) {
  const [peer] = useState(new RTCForwardingPeer(props))
  const joinRoom = useCallback(joinRoomCallback, [peer])
  const addStream = useCallback(addStreamCallback, [peer])
  const [connectionState, setConnectionState] = useState(peer.connectionState)
  const [as, setAs] = useState()
  const [inRoom, setInRoom] = useState()
  const setOnParentOffer = useCallback(f => { peer.onParentOffer = f }, [])
  const setOnTrack = useCallback(f => { peer.onTrack = f }, [])

  useEffect(() => {
    log('useEffect')
    peer.onConnectionStateChange = () => {
      setConnectionState(peer.connectionState)
      log('onConnectionStateChange ' + peer.connectionState)
    }
    peer.connectToServer()

    return function cleanup () {
      log('cleanup')
      peer.removeAllListeners()
      peer.close()
      // TODO cleanup when uninstantiating WebRTC hook
    }
  }, [])

  useEffect(() => {
    if (connectionState === 'disconnected') {
      setAs(undefined)
    }
  }, [connectionState])

  log('render')
  return {
    connectionState,
    as,
    inRoom,
    stream: peer.stream,
    joinRoom,
    addStream,
    setOnParentOffer,
    setOnTrack
  }

  async function joinRoomCallback (room) {
    log('joinRoomCallback')
    peer.joinRoom(room).then(_as => {
      setAs(_as)
      setInRoom(room)
    })
  }

  function addStreamCallback (stream) {
    peer.addStream(stream)
  }
}

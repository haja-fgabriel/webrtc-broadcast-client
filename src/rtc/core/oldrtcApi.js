import openSocket from 'socket.io-client'

const url = 'http://localhost:8001'

// TODO refactor as RTCForwardingPeer
export class RTCForwardingPeer {
}

const connectionProps = {
  socket: undefined,
  receiverPeer: undefined,
  senderPeers: new Map(),
  stream: undefined
}

const peerConnectionProps = {
  iceServers: [
    {
      urls: [
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302'
      ]
    },
    { urls: ['stun:stunserver.org:3478'] }
  ]
}

const log = (text) => console.log('rtcApi ' + text)

const addViewer = (uuid) => {
  log('newViewer with uuid ' + uuid)
  const { socket, stream, senderPeers } = connectionProps
  const peerConnection = new RTCPeerConnection(peerConnectionProps)

  // adding stream's tracks to the RTCPeerConnection
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream)
  })

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('iceCandidate', { uuid, candidate: event.candidate })
    }
  }

  // creating offer that will be sent to the signaling server
  peerConnection.createOffer()
    .then((sdp) => peerConnection.setLocalDescription(sdp))
    .then(() => {
      // local description was set successfully
      log('localDescription successfully set: ' + peerConnection.localDescription)
      socket.emit('createOffer', {
        uuid: uuid,
        sdp: peerConnection.localDescription
      })
      senderPeers.set(uuid, peerConnection)
    })
    .catch((ans) => {})
}

const answerOffer = ({ uuid, sdp }) => {
  log('answerOffer')
  console.log(sdp)
  connectionProps.senderPeers.get(uuid).setRemoteDescription(new RTCSessionDescription(sdp))
}

const receiveOffer = (uuid, sdp, callback) => {
  log('offer received from broadcaster')
  connectionProps.receiverPeer = new RTCPeerConnection(peerConnectionProps)
  connectionProps.stream = new MediaStream()

  const { receiverPeer, stream, socket } = connectionProps
  let countTracks = 0
  receiverPeer.ontrack = (event) => {
    log('ontrack')
    countTracks++
    console.log(event.track)
    stream.addTrack(event.track)
    countTracks >= 2 && callback(stream)
  }

  receiverPeer.setRemoteDescription(new RTCSessionDescription(sdp))
    .then(() => {
      receiverPeer.createAnswer()
        .then((answer) => receiverPeer.setLocalDescription(answer))
        .then(() => socket.emit('answerOffer', { uuid, sdp: receiverPeer.localDescription }))
    })
}

const receiveIceCandidate = (candidate) => {
  log('received ice candidate')
  connectionProps.receiverPeer.addIceCandidate(candidate)
}

export const connectToServer = (room, callbackBroadcaster, callbackViewer) => {
  log('connectToServer')
  if (!connectionProps.socket) {
    connectionProps.socket =
        openSocket(url)
          .on('connect_error', function (err) {
            console.log(`out of luck! error! ${err.message}`)
          })
  }
  const { socket } = connectionProps
  log('emitting joinRoom')
  socket.emit('joinRoom', room)

  socket.on('joinedAsBroadcaster', (data) => {
    callbackBroadcaster(data)
    // TODO add event handler
    // when having a new viewer to the broadcast, we should estabilish a connection with him
    socket.on('answerOffer', answerOffer)
    socket.on('newViewer', addViewer)

    // TODO handle leaving clients
    socket.on('viewerLeft', () => {})
  })

  socket.on('joinedAsViewer', (data) => {
    socket.on('receiveOffer', ({ uuid, sdp }) => receiveOffer(uuid, sdp, callbackViewer))
    socket.on('receiveIceCandidate', receiveIceCandidate)

    socket.on('newViewer', addViewer)
    socket.on('answerOffer', answerOffer)
  })
}

/*
 *  Only called by the broadcaster after fetching the webcam stream
 */
export const setStream = (stream) => {
  log('setStream')
  connectionProps.stream = stream
}

export const getStream = () => connectionProps.stream

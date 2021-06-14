import openSocket from 'socket.io-client'
import assert from 'assert'
import { getAverageDownloadSpeed } from '../../utils/test-connection'

/**
 * Copy constructor for the RTCForwardingPeerConfiguration instance
 * @param {RTCForwardingPeerConfiguration} props
 */
export function RTCForwardingPeerConfiguration (props) {
  this.serverUrl = props.serverUrl
  // TODO add more props if needed
}

/**
 * Default parameters for instantiating new RTCPeerConnection objects
 */
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

const log = text => console.log('RTCForwardingPeer ' + text)

/**
 * Class that represents a peer that can forward a stream from a broadcaster.
 * @param {RTCForwardingPeerConfiguration} props
 */
export function RTCForwardingPeer (configuration) {
  this._configuration = configuration
  this.isBroadcaster = false
  this.stream = new MediaStream()

  this.serverSocket = null
  this.parentPeer = new RTCPeerConnection(peerConnectionProps)
  this.parentId = null
  this.childPeers = new Map()

  this.inRoom = undefined
  this.connectionState = 'disconnected'

  // TODO must implement default event handlers
  // Event handlers
  this.onConnectionStateChange = undefined

  this.onParentStateChange = undefined

  this.onParentOffer = undefined

  this.onChildStateChange = undefined
  this.onOfferForChild = undefined

  // Event handler for reception of new tracks from the parent peer
  this.onTrack = undefined
}

/**
 * Connects the peer to the server.
 */
RTCForwardingPeer.prototype.connectToServer = async function () {
  this.serverSocket = openSocket(this._configuration.serverUrl, { secure: true })
  assert(this.serverSocket !== null)
  this.connectionState = 'pendingConnection'
  if (this.onConnectionStateChange) {
    this.onConnectionStateChange()
  }

  this.initializeEventHandlers()
}

RTCForwardingPeer.prototype.sendOffer = function (to, peer) {
  log('sendOffer')
  const self = this
  peer.createOffer().then(offer => peer.setLocalDescription(offer))
    .then(() => {
      self.serverSocket.emit(
        '[webrtc]send-offer', to, peer.localDescription)
      peer.onicecandidate = function (e) {
        if (e.candidate) {
          self.serverSocket.emit('[webrtc]ice-candidate', to, e.candidate)
        }
      }

      self.serverSocket.on('[webrtc]answer-offer', function (from, sdp) {
        log('joinRoom broadcaster answerOffer')
        peer.setRemoteDescription(new RTCSessionDescription(sdp))
          .then(() => self.childPeers.set(from, peer))
      })
    })
}

const onMakeOffer = function (to, self) {
  console.log('receives')
  self.onOfferForChild && self.onOfferForChild(to)
  const peer = new RTCPeerConnection(peerConnectionProps)
  self.stream.getTracks().forEach(track => {
    log('joinRoom broadcaster makeOffer stream addTrack')
    peer.addTrack(track)
  })
  self.sendOffer(to, peer)
}

const onSendOffer = async function (from, offer, self) {
  const parentPeer = self.parentPeer
  const stream = self.stream

  parentPeer.getSenders().forEach(sender => parentPeer.removeTrack(sender))
  stream.getTracks().forEach(track => stream.removeTrack(track))

  console.log(self.onParentOffer)
  self.onParentOffer && self.onParentOffer()
  log('onSendOffer')

  self.parentId = from
  parentPeer.ontrack = function (e) {
    log('joinRoom viewer parentPeer ontrack')
    self.onTrack && self.onTrack(e)
    self.stream.addTrack(e.track)
    self.childPeers.forEach(childPeer => childPeer.addTrack(e.track))
    if (self.stream.getTracks().length === 2) {
      self.childPeers.forEach((peer, uuid) => self.sendOffer(uuid, peer))
    }
  }

  await parentPeer.setRemoteDescription(offer)
  console.log(parentPeer.getReceivers())

  const answer = await parentPeer.createAnswer()
  await parentPeer.setLocalDescription(new RTCSessionDescription(answer))
  console.log(parentPeer.localDescription)
  self.serverSocket.emit('[webrtc]answer-offer', from, parentPeer.localDescription)
  parentPeer.onicecandidate = function (e) {
    if (e.candidate) {
      self.serverSocket.emit('[webrtc]ice-candidate', from, e.candidate)
    }
  }
}

/**
 * Initializes the socket.io event handlers for the s
 */
RTCForwardingPeer.prototype.initializeEventHandlers = function () {
  // 'this' is going to be changed in the callback
  const self = this
  this.serverSocket.on('connect', function () {
    self.connectionState = 'connected'

    self.serverSocket.on('[webrtc]make-offer', to => onMakeOffer(to, self))
    self.serverSocket.on(
      '[webrtc]ice-candidate', function (from, iceCandidate) {
        if (self.childPeers.get(from)) {
          self.childPeers.get(from).addIceCandidate(iceCandidate)
        } else if (self.parentId) {
          self.parentPeer.addIceCandidate(iceCandidate)
        }
      })
    self.onConnectionStateChange && self.onConnectionStateChange()
  })
}

/**
 * Connects the peer to a room
 * @param {string} room
 * // TODO maybe change to a more complex type
 * @returns {Promise<string | Error>}
 */
RTCForwardingPeer.prototype.joinRoom = async function (room) {
  // TODO separate event handlers in a different function
  const self = this
  return new Promise(function (resolve, reject) {
    getAverageDownloadSpeed().then(speed => {
      log('download speed: ' + speed + (speed > 4 ? '(FAST)' : '(tortoise)'))
      self.serverSocket.emit('[request]rtc:room:join', room)
    })

    self.serverSocket.on('[response]rtc:joining-as-broadcaster', function () {
      self.isBroadcaster = true
      resolve('broadcaster')
    })

    self.serverSocket.on('[response]rtc:joining-as-viewer', function () {
      // FIXME refactor code
      self.serverSocket.on(
        '[webrtc]send-offer', (from, offer) => onSendOffer(from, offer, self))

      self.isBroadcaster = false
      self.inRoom = room
      resolve('viewer')
    })

    self.serverSocket.on('[error]rtc:room:already-connected', function (room) {
      reject(new Error('Already connected to room ' + room))
    })
  })
}

RTCForwardingPeer.prototype.removeAllTracks = function () {
  this.childPeers.forEach(peer => {
    peer.getSenders().forEach(sender => peer.removeTrack(sender))
  })
}

RTCForwardingPeer.prototype.close = function () {
  this.serverSocket.close()
  if (this.onConnectionStateChange) {
    this.onConnectionStateChange()
  }
  this.serverSocket.on('disconnect', function () {
    this.connectionState = 'disconnected'
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange()
    }
  })
}

RTCForwardingPeer.prototype.removeAllListeners = function () {
  // TODO add more event handlers if needed
  this.onConnectionStateChange = undefined
  this.onParentStateChange = undefined
  this.onChildStateChange = undefined
  this.onTrack = undefined
}

/**
 * Adds a stream to the peer connection if it is connected as a broadcaster
 * @param {MediaStream} stream
 */
RTCForwardingPeer.prototype.addStream = function (stream) {
  console.log(this.isBroadcaster)
  if (!this.isBroadcaster) {
    throw new Error('Streams can only be added for broadcasters.')
  }
  if (this.stream) {
    this.removeAllTracks()
  }
  this.stream = stream
  this.childPeers.forEach((peer, uuid) => {
    stream.getTracks().forEach(track => peer.addTrack(track))
    // 'onnegotiationneeded' event does not fit our needs to replace
    // the whole stream
    this.sendOffer(uuid, peer)
  })
}

RTCForwardingPeer.prototype.getConfiguration = function () {
  return { ...this._configuration }
}

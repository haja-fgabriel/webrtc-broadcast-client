import openSocket from 'socket.io-client'
import assert from 'assert'

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

/**
 * Class that represents a peer that can forward a stream from a broadcaster.
 */
export class RTCForwardingPeer {
  /**
   * @param {RTCForwardingPeerConfiguration} props
   */
  constructor (configuration) {
    this._configuration = configuration
    this.isBroadcaster = false
    this.stream = new MediaStream()

    this.serverSocket = null
    this.parentPeer = null
    this.childPeers = new Map()

    this.inRoom = undefined
    this.connectionState = 'disconnected'

    // TODO must implement default event handlers
    // Event handlers
    this.onConnectionStateChange = undefined

    this.onParentStateChange = undefined

    this.onChildStateChange = undefined
    this.onOfferForChild = undefined

    // Event handler for reception of new tracks from the parent peer
    this.onTrack = undefined
  }

  /**
   * Connects the peer to the server.
   */
  async connectToServer () {
    this.serverSocket = openSocket(this._configuration.serverUrl)
    assert(this.serverSocket !== null)
    this.connectionState = 'pendingConnection'
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange()
    }

    this.initializeEventHandlers()
  }

  /**
   * Initializes the socket.io event handlers for the s
   */
  initializeEventHandlers () {
    // 'this' is going to be changed in the callback
    const self = this
    this.serverSocket.on('connect', function () {
      self.connectionState = 'connected'

      self.serverSocket.on('[webrtc]make-offer', function (to) {
        console.log('receives')
        if (self.onOfferForChild) {
          self.onOfferForChild(to)
        }
        const peer = new RTCPeerConnection(peerConnectionProps)
        peer.createOffer().then(offer => peer.setLocalDescription(offer))
          .then(() => {
            self.serverSocket.emit(
              '[webrtc]send-offer', to, peer.localDescription)

            self.serverSocket.on('[webrtc]answer-offer', function (from, sdp) {
              peer.setRemoteDescription(new RTCSessionDescription(sdp))
                .then(() => self.childPeers.set(from, peer))
            })
          })
      })
      if (self.onConnectionStateChange) {
        self.onConnectionStateChange()
      }
    })
  }

  /**
   * Connects the peer to a room
   * @param {string} room
   * // TODO maybe change to a more complex type
   * @returns {Promise<string | Error>}
   */
  async joinRoom (room) {
    // TODO separate event handlers in a different function
    const serverSocket = this.serverSocket
    return new Promise(function (resolve, reject) {
      serverSocket.emit('[request]rtc:room:join', room)
      serverSocket.on('[response]rtc:joining-as-broadcaster', function () {
        this.isBroadcaster = true
        resolve('broadcaster')
      })

      serverSocket.on('[response]rtc:joining-as-viewer', function () {
        // FIXME nested event handlers? That is not clean code
        // Please do a better organization of the code
        //
        // INFO I left it like so because the event handler should be enabled
        // only when the peer joins a room as a viewer
        serverSocket.on('[webrtc]send-offer', async function (from, offer) {
          const parentPeer = new RTCPeerConnection(peerConnectionProps)
          parentPeer.ontrack = function (e) {
            this.onTrack && this.onTrack(e)
            this.stream.addTrack(e.track)
            // TODO forward tracks to child peer connections
          }
          parentPeer.setRemoteDescription(offer)

          const answer = await parentPeer.createAnswer()
          await parentPeer.setLocalDescription(new RTCSessionDescription(answer))
          console.log(parentPeer.localDescription)
          serverSocket.emit('[webrtc]answer-offer', from, parentPeer.localDescription)
        })

        this.isBroadcaster = false
        this.inRoom = room
        resolve('viewer')
      })

      serverSocket.on('[error]rtc:room:already-connected', function (realRoom) {
        reject(new Error('Already connected to room ' + realRoom))
      })
    })
  }

  close () {
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

  initializeListeners () {

  }

  removeAllListeners () {
    // TODO add more event handlers if needed
    this.onConnectionStateChange = undefined
    this.onParentStateChange = undefined
    this.onChildStateChange = undefined
    this.onTrack = undefined
  }

  initializeConnection () {
    ;
  }

  /**
   * Adds a stream to the peer connection if it is connected as a broadcaster
   * @param {MediaStream} stream
   */
  addStream (stream) {
    if (!this.isBroadcaster) {
      throw new Error('Streams can only be added for broadcasters.')
    }
    this.stream = stream
  }

  getConfiguration () {
    return { ...this._configuration }
  }
}

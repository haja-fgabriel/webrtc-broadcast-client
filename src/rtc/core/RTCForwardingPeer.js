import openSocket from 'socket.io-client'

/**
 * Copy constructor for the RTCForwardingPeerConfiguration instance
 * @param {RTCForwardingPeerConfiguration} props
 */
export function RTCForwardingPeerConfiguration (props) {
  this.serverUrl = props.serverUrl
  // TODO add more props if needed
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
    // this.stream = new MediaStream()

    this.serverSocket = null
    this.parentPeer = null
    this.childPeers = []

    this.inRoom = undefined
    this.connectionState = 'disconnected'

    // TODO must implement default event handlers
    // Event handlers
    this.onConnectionStateChange = undefined

    this.onParentStateChange = undefined

    this.onChildStateChange = undefined

    // Event handler for reception of new tracks from the parent peer
    this.onTrack = undefined
  }

  /**
   * Connects the peer to the server.
   */
  async connectToServer () {
    this.serverSocket = openSocket(this._configuration.serverUrl)
    this.connectionState = 'pendingConnection'
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange()
    }

    // 'this' is going to be changed in the callback
    const self = this
    this.serverSocket.on('connect', function () {
      self.connectionState = 'connected'
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
    const serverSocket = this.serverSocket
    return new Promise(function (resolve, reject) {
      serverSocket.emit('[request]rtc:room:join', room)
      serverSocket.on('[response]rtc:joining-as-broadcaster', function () {
        this.isBroadcaster = true
        resolve('broadcaster')
      })
      serverSocket.on('[response]rtc:joining-as-viewer', function () {
        this.isBroadcaster = true
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

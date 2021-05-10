import { RTCForwardingPeer } from '../../../src/rtc/core/RTCForwardingPeer'

let peer

beforeAll(function () {
  peer = new RTCForwardingPeer({
    serverUrl: 'http://localhost:8000'
  })
})

// eslint-disable-next-line jest/no-done-callback
test('Connect', () => {
  return new Promise(function (resolve, reject) {
    peer.onConnectionStateChange = function () {
      console.log(peer.connectionState)
      expect(peer.serverSocket).not.toBe(null)
      if (peer.connectionState === 'connected') {
        resolve()
      }
    }
    peer.connectToServer()
  })
})

test('Join room', () => {
  return expect(peer.joinRoom('default-room-test')).resolves.toBe('viewer')
})

afterAll(function () {
  peer.removeAllListeners()
  peer.close()
})

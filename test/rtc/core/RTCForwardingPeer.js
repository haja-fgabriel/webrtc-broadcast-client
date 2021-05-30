import { RTCForwardingPeer } from '../../../src/rtc/core/RTCForwardingPeer'

let peer
let otherPeer
let roomName

beforeAll(function () {
  peer = new RTCForwardingPeer({
    serverUrl: 'http://localhost:8000'
  })
  otherPeer = new RTCForwardingPeer({
    serverUrl: 'http://localhost:8000'
  })
  roomName = 'default-room-test-' + Math.round(Math.random() * 1000)
})

async function testConnect (peer) {
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
}

test('Connect', () => {
  return expect(testConnect(peer)).resolves.toBe(undefined)
})

test('Connect the other', () => {
  return expect(testConnect(otherPeer)).resolves.toBe(undefined)
})

test('Join room', () => {
  return expect(peer.joinRoom(roomName)).resolves.toBe('broadcaster')
})

test('The other joins the room', () => {
  return new Promise((resolve, reject) => {
    otherPeer.joinRoom(roomName).then((as) => {
      expect(as).toBe('viewer')
      resolve()
    })
  })
})

afterAll(function () {
  otherPeer.removeAllListeners()
  otherPeer.close()
  peer.removeAllListeners()
  peer.close()
})

const openSocket = require('socket.io-client')

const socket = openSocket('http://localhost:8000')
socket.on('connect', function () {
  console.log('connected')
})

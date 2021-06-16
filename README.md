# webrtc-smart-signaling-client
React client for WebRTC smart broadcasting. Part of my B.Sc. thesis

The project is ejected, so it takes advantage of customizing the Jest and ESLint configurations.

## Preparation
1. Clone (or download) the repo wherever you want on your computer
2. ``npm install`` from the root folder of the cloned repo
3. Provide the SSL certificate for making HTTPS work properly, as following:
-- ``cert.pem`` - the certificate
-- ``chain.pem`` - the intermediate signing authority
-- ``privkey.pem`` - the private key
## Usage
- ``npm build`` - compiles the server to old-school JS
- ``npm start`` - starts the server normally (on port 8000). The port can be modified using the PORT environment variable
- ``npm run start-local`` - starts the server as an HTTP server (for local testing of the app)
- ``npm test`` - runs all the tests

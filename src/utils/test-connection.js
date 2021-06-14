/**
 * Does a download speed test to provide performance metrics of the network.
 * It makes use of fakefilegenerator.com's API to download a random 10 MB
 * MP3 file. Because modern browsers are our enemies, we must use a CORS proxy
 * to accomplish this.
 * @returns{Promise<number|Error>}
 */

export const getAverageDownloadSpeed = async () => new Promise((resolve, reject) => {
  const formData = new FormData()
  formData.append('filetype', 'mp3')
  formData.append('filename', 'test')
  formData.append('filesize', 10485760)

  let count = 0
  let sum = 0
  let previousDownloadedAmount = 0
  let previousTime = Date.now()
  const request = new XMLHttpRequest()
  request.onprogress = e => {
    const time = Date.now()
    count++
    sum += (e.loaded - previousDownloadedAmount) / (time - previousTime)
    previousDownloadedAmount = e.loaded
    previousTime = time
  }
  const ultimate = setTimeout(() => {
    request.abort()
    resolve(sum / count)
  }, 4000)

  request.open('POST', 'https://cors-anywhere.herokuapp.com/https://www.fakefilegenerator.com/download.php')
  request.send(formData)
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status && request.status !== 200) {
        reject(new Error('Request to https://www.fakefilegenerator.com/download.php returned ' + request.status))
      }
      clearTimeout(ultimate)
      resolve(sum / count)
    }
  }
})

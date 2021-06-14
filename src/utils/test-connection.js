/**
 * Does a download speed test to provide performance metrics of the network.
 * It makes use of fakefilegenerator.com's API to download a random 10 MB
 * MP3 file.
 * @returns{*}
 */

export async function getAverageDownloadSpeed () {
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
  request.open('POST', 'https://www.fakefilegenerator.com/download.php')
  request.send(formData)
  return Promise.resolve(sum / count)
}

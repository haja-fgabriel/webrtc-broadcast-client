import { act, renderHook } from '@testing-library/react-hooks'
import { useWebRTC } from '../../src/rtc/useWebRTC'

async function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let result, rerender, unmount

beforeAll(() => {
  const props = {
    serverUrl: 'http://localhost:8000'
  };
  ({ result, rerender, unmount } = renderHook(
    (props) => useWebRTC(props), {
      initialProps: props
    }
  ))
})

test('should do something', async function () {
  await act(() => sleep(500))
  return expect(result.current.connectionState).toBe('connected')
})

afterAll(() => {
  unmount()
})

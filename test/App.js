import React from 'react'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

test('renders learn react link', () => {
  render(<App />)
  const button = screen.getByText('Push me')
  expect(button).toBeInTheDocument()
})

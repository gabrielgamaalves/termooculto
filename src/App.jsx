// import { useState } from 'react'
import { Router, BrowserRouter, Route } from 'react-router'

import './App.css'

function App() {
  return (
    <BrowserRouter >
      <Router>
        <Route path='/' />
      </Router>
    </BrowserRouter>
  )
}

export default App

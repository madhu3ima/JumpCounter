import React, { useState }  from 'react';
import { BrowserRouter as Router, Route, Routes  } from 'react-router-dom';
import InitialForm from './InitialForm';
import SubjectSelection from './SubjectSelection';

  function App() {
  return (
    <Router>
      <Routes>
        <Route path='/select-subject' element={<SubjectSelection/>} />
        <Route path="/" element={<InitialForm/>} />
      </Routes>
    </Router>
  );
}

export default App;
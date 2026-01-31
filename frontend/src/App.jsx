import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Landing/LandingNav.jsx";
import LandingPage from './pages/LandingPage.jsx';
import Signup from './pages/Signup.jsx';
import SignIn from './pages/SignIn.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
      </Routes>
    </Router>
  );
}

export default App;

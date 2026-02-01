import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Landing/LandingNav.jsx";
import LandingPage from './pages/LandingPage.jsx';
import Signup from './pages/Signup.jsx';
import SignIn from './pages/SignIn.jsx';

// imports for Customers
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<CustomerDashboard />} />
        {/* catch-all route for unmatched URLs */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router } from "react-router-dom"
import { AuthProvider, WishlistProvider, SessionProvider, TutorProvider } from "./context"
import AppRoutes, { router } from "./app/AppRoutes"
import Footer from "./components/common/Footer"
import Navbar from './components/common/Navbar';  // Updated import path

function App() {
  return (
    <Router {...router}>
      <AuthProvider>
        <TutorProvider>
          <WishlistProvider>
            <SessionProvider>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="flex-grow bg-gray-50">
                  <AppRoutes />
                </main>
                <Footer />
              </div>
            </SessionProvider>
          </WishlistProvider>
        </TutorProvider>
      </AuthProvider>
    </Router>
  )
}

export default App;
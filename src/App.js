import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Summary from "./components/Summary";
import Bin from "./components/Bin";
import RecentActivity from "./components/RecentActivity";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="App">
      <Container fluid className="bg-light min-vh-100 p-0">
        <Container fluid className="w-100">
          <header className="bg-primary text-white p-4 rounded">
            <h1 className="h4">
              Car Assembly Plant - Bolt Inventory Dashboard
            </h1>
            <p className="small">Real-time Monitoring System</p>
          </header>

          {/* Summary section */}
          <div className="mt-4">
            <Summary />
          </div>

          {/* Bin Section */}
          <div className="mt-5 px-2">
            <Bin />
          </div>

          {/* Activity Section */}
          <div className="mt-4 px-2">
            <RecentActivity />
          </div>

          {/* Footer Section */}
          <div>
            <Footer />
          </div>
        </Container>
      </Container>
    </div>
  );
}

export default App;

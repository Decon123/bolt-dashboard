import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, ProgressBar, Container, Row, Col } from "react-bootstrap";
import "./binCount.css";

const socket = io("http://localhost:3000"); // Update if using deployed server

function getStatus(count) {
  if (count < 15) return { label: "Critical", variant: "danger" };
  if (count < 30) return { label: "Warning", variant: "warning" };
  return { label: "Optimal", variant: "success" };
}

const Bin = () => {
  const [bins, setBins] = useState({});

  useEffect(() => {
    // Listener for full initial bin data (in case multiple bins already stored)
    socket.on("initialBinData", (data) => {
      setBins(data);
    });

    // Listener for individual updates
    socket.on("updateBinData", ({ binId, data }) => {
      setBins((prev) => ({
        ...prev,
        [binId]: data,
      }));
    });

    return () => {
      socket.off("initialBinData");
      socket.off("updateBinData");
    };
  }, []);

  return (
    <Container className="mt-4">
      <Row xs={1} md={3} className="g-4">
        {Object.entries(bins).map(([loc, bin], idx) => {
          const { label, variant } = getStatus(bin.boltCount);
          return (
            <Col key={loc}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>
                    Bin #{idx + 1}
                    <span className={`badge bg-${variant} float-end`}>
                      {label}
                    </span>
                  </Card.Title>
                  <Card.Text>
                    <strong>Location:</strong> {bin.locationCode || loc}
                    <br />
                    <strong>Part Number:</strong> {bin.partNumber}
                    <br />
                    <div className="boltCountParent">
                      <strong></strong>{" "}
                      <span className="boltCount">{bin.boltCount}</span>
                    </div>
                    <br />
                    <small className="text-muted">
                      Last update: {new Date(bin.lastUpdate).toLocaleString()}
                    </small>
                  </Card.Text>
                  <ProgressBar
                    now={Math.min((bin.boltCount / 100) * 100, 100)}
                    variant={variant}
                  />
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default Bin;

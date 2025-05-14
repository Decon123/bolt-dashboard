import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io();

const Summary = () => {
  const [bins, setBins] = useState({});

  useEffect(() => {
    socket.on("initialBinData", (data) => setBins(data));
    socket.on("updateBinData", ({ binId, data }) => {
      setBins((prev) => ({ ...prev, [binId]: data }));
    });
  }, []);

  const summary = [
    { description: "Total bins", count: Object.keys(bins).length },
    {
      description: "Low Stock Alerts",
      count: Object.values(bins).filter((b) => b.currentCount < 100).length,
    },
    {
      description: "Refills in Progress",
      count: Object.values(bins).filter(
        (b) => b.currentCount < b.totalCount && b.currentCount >= 100
      ).length,
    },
  ];

  return (
    <Row xs={1} sm={2} md={3} className="g-3">
      {summary.map((item, idx) => (
        <Col key={idx}>
          <Card className="h-100 text-center">
            <Card.Body>
              <Card.Title>{item.description}</Card.Title>
              <h2>{item.count}</h2>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default Summary;

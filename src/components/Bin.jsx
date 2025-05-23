import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Card,
  ProgressBar,
  Container,
  Row,
  Col,
  Form,
  Button,
} from "react-bootstrap";
import axios from "axios";
import "./binCount.css";

const socket = io("http://localhost:3000");

function getStatus(count) {
  if (count < 15) return { label: "Critical", variant: "danger" };
  if (count < 30) return { label: "Warning", variant: "warning" };
  return { label: "Optimal", variant: "success" };
}

const Bin = () => {
  const [bins, setBins] = useState({});
  const [editInputs, setEditInputs] = useState({});

  useEffect(() => {
    socket.on("initialBinData", (data) => {
      setBins(data);
      const initialEdits = {};
      Object.entries(data).forEach(([chipID, bin]) => {
        initialEdits[chipID] = {
          locationCode: bin.locationCode || "",
          partNumber: bin.partNumber || "",
          boltWeight: bin.boltWeight || "",
        };
      });
      setEditInputs(initialEdits);
    });

    socket.on("updateBinData", ({ chipId, data }) => {
      setBins((prev) => ({
        ...prev,
        [chipId]: data,
      }));

      setEditInputs((prev) => ({
        ...prev,
        [chipId]: {
          locationCode: data.locationCode || "",
          partNumber: data.partNumber || "",
          boltWeight: data.boltWeight || "",
        },
      }));
    });

    return () => {
      socket.off("initialBinData");
      socket.off("updateBinData");
    };
  }, []);

  const handleEditChange = (chipID, field, value) => {
    setEditInputs((prev) => ({
      ...prev,
      [chipID]: {
        ...prev[chipID],
        [field]: value,
      },
    }));
  };

  const handleEditSubmit = async (chipID) => {
    const updatedData = editInputs[chipID];

    if (!updatedData.locationCode) {
      alert("Location Code cannot be empty.");
      return;
    }

    try {
      await axios.patch("http://localhost:3000/config", {
        chipID,
        locationCode: updatedData.locationCode,
        partNumber: updatedData.partNumber,
        boltWeight: updatedData.boltWeight,
      });
    } catch (err) {
      console.error("Error updating bin config:", err);
      alert("Failed to update config.");
    }
  };

  return (
    <Container className="mt-4">
      <Row xs={1} md={2} className="g-4">
        {Object.entries(bins).map(([chipID, bin], idx) => {
          const { label, variant } = getStatus(bin.boltCount || 0);
          const inputs = editInputs[chipID] || {
            locationCode: bin.locationCode || "",
            partNumber: bin.partNumber || "",
            boltWeight: bin.boltWeight || "",
          };

          return (
            <Col key={chipID}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>
                    Bin #{idx + 1} ({chipID})
                    <span className={`badge bg-${variant} float-end`}>
                      {label}
                    </span>
                  </Card.Title>
                  <Card.Text>
                    <strong>Location:</strong>{" "}
                    {bin.locationCode || "Unassigned"}
                    <br />
                    <strong>Part Number:</strong> {bin.partNumber || "N/A"}
                    <br />
                    <div className="boltCountParent">
                      <span className="boltCount">{bin.boltCount || 0}</span>
                    </div>
                    <br />
                    <small className="text-muted">
                      Last update:{" "}
                      {bin.lastUpdate
                        ? new Date(bin.lastUpdate).toLocaleString()
                        : "Never"}
                    </small>
                  </Card.Text>
                  <Form>
                    <Form.Group className="mb-2">
                      <Form.Label>Edit Location Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={inputs.locationCode}
                        onChange={(e) =>
                          handleEditChange(
                            chipID,
                            "locationCode",
                            e.target.value
                          )
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Edit Part Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={inputs.partNumber}
                        onChange={(e) =>
                          handleEditChange(chipID, "partNumber", e.target.value)
                        }
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Edit Bolt Weight (g)</Form.Label>
                      <Form.Control
                        type="number"
                        value={inputs.boltWeight}
                        onChange={(e) =>
                          handleEditChange(chipID, "boltWeight", e.target.value)
                        }
                      />
                    </Form.Group>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEditSubmit(chipID)}
                    >
                      Update Config
                    </Button>
                  </Form>
                  <ProgressBar
                    className="mt-3"
                    now={Math.min(((bin.boltCount || 0) / 100) * 100, 100)}
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

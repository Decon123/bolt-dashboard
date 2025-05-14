import { ListGroup, Card } from "react-bootstrap";

const activities = [
  {
    id: 1,
    title: "Bin #1 Critical Alert",
    description: "Stock below threshold",
    time: "2 minutes ago",
  },
  {
    id: 2,
    title: "Bin #2 Refill Completed",
    description: "Restocked by Warehouse Team",
    time: "15 minutes ago",
  },
  {
    id: 3,
    title: "Bin #3 Status Update",
    description: "Count updated automatically",
    time: "30 minutes ago",
  },
];

function RecentActivity() {
  return (
    <Card className="mt-5 shadow-sm">
      <Card.Header className="fw-bold bg-white">Recent Activity</Card.Header>
      <ListGroup variant="flush">
        {activities.map((activity) => (
          <ListGroup.Item
            key={activity.id}
            className="d-flex justify-content-between"
          >
            <div>
              <div className="fw-semibold">{activity.title}</div>
              <small className="text-muted">{activity.description}</small>
            </div>
            <small className="text-muted text-end">{activity.time}</small>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}

export default RecentActivity;

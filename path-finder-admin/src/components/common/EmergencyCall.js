// src/components/common/EmergencyCall.js
import React from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import { 
  FaPhoneAlt, 
  FaMapMarkerAlt, 
  FaUser, 
  FaCalendarAlt, 
  FaClock 
} from 'react-icons/fa';

const EmergencyCall = ({ call, onStatusChange, onAssign }) => {
  const handleStatusChange = (e) => {
    const status = e.target.value;
    onStatusChange(call.id, status);
  };

  const handleAssign = () => {
    onAssign(call.id);
  };

  return (
    <Card className="emergency-call">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <div className="call-type">
            <FaPhoneAlt className="me-2" />
            <span className={`type ${call.type.toLowerCase()}`}>
              {call.type}
            </span>
          </div>
          <div className="status-badge">
            <span className={`badge ${call.status.toLowerCase()}`}>
              {call.status}
            </span>
          </div>
        </div>

        <div className="call-details">
          <div className="detail-item">
            <FaMapMarkerAlt className="me-2" />
            <span>{call.location}</span>
          </div>
          <div className="detail-item">
            <FaUser className="me-2" />
            <span>{call.contactName}</span>
          </div>
          <div className="detail-item">
            <FaCalendarAlt className="me-2" />
            <span>{new Date(call.timestamp).toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <FaClock className="me-2" />
            <span>{Math.floor((Date.now() - call.timestamp) / 60000)} minutes ago</span>
          </div>
        </div>

        <div className="call-description mt-3">
          <p>{call.description}</p>
        </div>

        <div className="call-actions mt-3">
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select value={call.status} onChange={handleStatusChange}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </Form.Group>

          {call.status === 'pending' && (
            <Button variant="primary" onClick={handleAssign}>
              Assign to Me
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default EmergencyCall;
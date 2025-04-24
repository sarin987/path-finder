// src/components/common/Profile.js
import React from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import { 
  FaUserEdit, 
  FaImage, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEnvelope 
} from 'react-icons/fa';

const Profile = ({ user, onUpdate, onUpload }) => {
  const handleUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());
    onUpdate(userData);
  };

  return (
    <Card className="profile-card">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <div className="profile-image-container">
            <img 
              src={user?.profileImage || '/default-avatar.png'} 
              alt="Profile"
              className="profile-image"
            />
            <Button 
              variant="outline-primary" 
              className="upload-button"
              onClick={onUpload}
            >
              <FaImage />
            </Button>
          </div>
          <div className="ms-3">
            <h5>{user?.name || 'User'}</h5>
            <p className="text-muted">{user?.role || 'Role'}</p>
          </div>
        </div>

        <Form onSubmit={handleUpdate}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FaUserEdit className="me-2" />
              Full Name
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
              defaultValue={user?.name}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FaPhone className="me-2" />
              Contact Number
            </Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              defaultValue={user?.phone}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FaMapMarkerAlt className="me-2" />
              Station Location
            </Form.Label>
            <Form.Control
              type="text"
              name="location"
              defaultValue={user?.location}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FaEnvelope className="me-2" />
              Email
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              defaultValue={user?.email}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit">
            Update Profile
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default Profile;
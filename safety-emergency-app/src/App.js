import React, { useEffect, useState } from 'react';
import { requestNotificationPermission, onMessageListener } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

function App() {
  const [notification, setNotification] = useState({ title: '', body: '' });

  useEffect(() => {
    // Request notification permission when component mounts
    const setupNotifications = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          console.log('FCM Token:', token);
          // Send this token to your backend for future use
          await saveFCMToken(token);
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    // Listen for incoming messages
    const unsubscribe = onMessageListener().then(payload => {
      console.log('Message received:', payload);
      
      // Show notification
      if (payload.notification) {
        setNotification({
          title: payload.notification.title,
          body: payload.notification.body
        });
        
        // Show toast notification
        toast.info(payload.notification.body, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    });

    return () => {
      // Clean up
      unsubscribe.then(fn => fn && fn());
    };
  }, []);

  const saveFCMToken = async (token) => {
    try {
      const response = await axios.post('/api/notifications/fcm-token', { token });
      console.log('FCM token saved:', response.data);
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await axios.post('/api/notifications/test', {
        title: 'Test Notification',
        body: 'This is a test notification from the app!'
      });
      console.log('Test notification sent:', response.data);
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  // File upload function
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/uploads/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('File uploaded successfully!');
      console.log('File uploaded:', response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Safety Emergency App</h1>
        
        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={sendTestNotification}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Send Test Notification
          </button>
          
          <label 
            htmlFor="file-upload"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Upload File
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        
        {notification.title && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            maxWidth: '500px',
            textAlign: 'left',
            color: 'black'
          }}>
            <h3>Latest Notification:</h3>
            <p><strong>{notification.title}</strong></p>
            <p>{notification.body}</p>
          </div>
        )}
      </header>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;

import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { FaMapMarkerAlt, FaClock, FaUserShield } from 'react-icons/fa';

const ActiveCases = ({ cases = [] }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Active Cases
        </Typography>
        <div className="space-y-4">
          {cases.map((caseItem, index) => (
            <Box key={caseItem.id} className="flex items-center p-2 mb-2 border-b">
              <Box className="flex-1">
                <Typography variant="body1">
                  <FaUserShield className="inline mr-1" />
                  {caseItem.type}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <FaMapMarkerAlt className="inline mr-1" />
                  {caseItem.location.address}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  <FaClock className="inline mr-1" />
                  {new Date(caseItem.timestamp).toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Status: {caseItem.status}
              </Typography>
            </Box>
          ))}
          {cases.length === 0 && (
            <Box className="flex items-center justify-center py-4">
              <CircularProgress size={20} className="mr-2" />
              <Typography variant="body2" color="textSecondary">
                No active cases at the moment
              </Typography>
            </Box>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveCases;
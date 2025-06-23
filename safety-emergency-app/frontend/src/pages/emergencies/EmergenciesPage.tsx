import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  LocalHospital as HospitalIcon,
  LocalFireDepartment as FireIcon,
  LocalPolice as PoliceIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Report as EmergencyIcon
} from '@mui/icons-material'; 

import { useAuth } from '@/contexts/AuthContext';
import type { SelectChangeEvent } from '@mui/material/Select';

interface Emergency {
  id: string;
  type: 'medical' | 'fire' | 'police' | 'other';
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  location: string;
  reportedAt: string;
  description: string;
  reporter: {
    id: string;
    name: string;
    role: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  };
}

const statusColors = {
  pending: 'warning',
  in_progress: 'info',
  resolved: 'success',
  cancelled: 'error',
} as const;

const typeIcons = {
  medical: <HospitalIcon color="error" />,
  fire: <FireIcon color="error" />,
  police: <PoliceIcon color="primary" />,
  other: <WarningIcon color="action" />,
} as const;

export default function EmergenciesPage(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Mock data - replace with API call
  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockEmergencies: Emergency[] = [
          {
            id: '1',
            type: 'medical',
            status: 'pending',
            location: 'Building A, Floor 3',
            reportedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            description: 'Person collapsed in the hallway',
            reporter: {
              id: 'u1',
              name: 'John Doe',
              role: 'user'
            },
            assignedTo: user && user.role === 'responder' ? {
              id: user.id,
              name: user.name,
              role: user.role
            } : undefined
          },
          {
            id: '2',
            type: 'fire',
            status: 'in_progress',
            location: 'Kitchen, Building B',
            reportedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            description: 'Small fire in the kitchen',
            reporter: {
              id: 'u2',
              name: 'Jane Smith',
              role: 'staff'
            },
            assignedTo: {
              id: 'r1',
              name: 'Fire Dept. Team',
              role: 'fire'
            }
          },
          {
            id: '3',
            type: 'police',
            status: 'resolved',
            location: 'Main Entrance',
            reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            description: 'Suspicious person reported',
            reporter: {
              id: 'u3',
              name: 'Security Guard',
              role: 'staff'
            },
            assignedTo: {
              id: 'r2',
              name: 'Officer Johnson',
              role: 'police'
            }
          },
        ];
        
        setEmergencies(mockEmergencies);
      } catch (err) {
        setError('Failed to load emergencies. Please try again later.');
        console.error('Error fetching emergencies:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmergencies();
  }, [user]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as string);
    setPage(0);
  };

  const handleTypeFilterChange = (event: SelectChangeEvent) => {
    setTypeFilter(event.target.value as string);
    setPage(0);
  };

  const handleViewEmergency = (id: string) => {
    navigate(`/emergencies/${id}`);
  };

  const handleNewEmergency = () => {
    navigate('/emergencies/new');
  };

  const handleAssignToMe = (emergency: Emergency) => {
    // Implement assign to me logic
    console.log('Assign to me:', emergency.id);
    // Update the emergency's assignedTo with current user
    const updatedEmergencies = emergencies.map(e => 
      e.id === emergency.id 
        ? { ...e, assignedTo: { id: user!.id, name: user!.name, role: user!.role } } 
        : e
    );
    setEmergencies(updatedEmergencies);
  };

  const handleUpdateStatus = (emergency: Emergency, newStatus: Emergency['status']) => {
    // Implement status update logic
    console.log(`Update status of ${emergency.id} to ${newStatus}`);
    const updatedEmergencies = emergencies.map(e => 
      e.id === emergency.id ? { ...e, status: newStatus } : e
    );
    setEmergencies(updatedEmergencies);
  };

  // Filter emergencies based on search and filters
  const filteredEmergencies = emergencies.filter(emergency => {
    const matchesSearch = 
      emergency.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emergency.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emergency.reporter.name.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || emergency.status === statusFilter;
    const matchesType = typeFilter === 'all' || emergency.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination
  const paginatedEmergencies = filteredEmergencies.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Emergency Incidents
          </Typography>
        </Box>
        
        {user && (user.role === 'user' || user.role === 'admin') && (
          <Button
            variant="contained"
            color="error"
            startIcon={<AddIcon />}
            onClick={handleNewEmergency}
          >
            Report Emergency
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            placeholder="Search emergencies..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250, flexGrow: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilterChange}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="type-filter-label">Type</InputLabel>
            <Select
              labelId="type-filter-label"
              value={typeFilter}
              label="Type"
              onChange={handleTypeFilterChange}
              startAdornment={
                <InputAdornment position="start">
                  <EmergencyIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="medical">Medical</MenuItem>
              <MenuItem value="fire">Fire</MenuItem>
              <MenuItem value="police">Police</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Reported</TableCell>
                  <TableCell>Reporter</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedEmergencies.length > 0 ? (
                  paginatedEmergencies.map((emergency) => (
                    <TableRow key={emergency.id} hover>
                      <TableCell>
                        <Tooltip title={emergency.type.charAt(0).toUpperCase() + emergency.type.slice(1)}>
                          <Box>{typeIcons[emergency.type]}</Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {emergency.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{emergency.location}</TableCell>
                      <TableCell>{formatTimeAgo(emergency.reportedAt)}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {emergency.reporter.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={emergency.status.replace('_', ' ')}
                          color={statusColors[emergency.status] as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {emergency.assignedTo ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            {emergency.assignedTo.role === 'police' && <PoliceIcon fontSize="small" color="primary" />}
                            {emergency.assignedTo.role === 'ambulance' && <HospitalIcon fontSize="small" color="error" />}
                            {emergency.assignedTo.role === 'fire' && <FireIcon fontSize="small" color="error" />}
                            <Typography variant="body2">
                              {emergency.assignedTo.name}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewEmergency(emergency.id)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {(!emergency.assignedTo || emergency.assignedTo.id === user?.id) && (
                            <Tooltip title="Update Status">
                              <Select
                                value=""
                                size="small"
                                sx={{ minWidth: 120, height: 32 }}
                                displayEmpty
                                onChange={(e) => handleUpdateStatus(emergency, e.target.value as Emergency['status'])}
                                renderValue={() => 'Update Status'}
                              >
                                <MenuItem value="in_progress">Mark as In Progress</MenuItem>
                                <MenuItem value="resolved">Mark as Resolved</MenuItem>
                                <MenuItem value="cancelled">Cancel Incident</MenuItem>
                              </Select>
                            </Tooltip>
                          )}
                          
                          {!emergency.assignedTo && user?.role !== 'user' && (
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={() => handleAssignToMe(emergency)}
                            >
                              Assign to Me
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <EmergencyIcon color="disabled" fontSize="large" />
                        <Typography variant="body1" color="textSecondary">
                          No emergencies found
                        </Typography>
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
                          <Button 
                            variant="text" 
                            size="small" 
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('all');
                              setTypeFilter('all');
                            }}
                          >
                            Clear filters
                          </Button>
                        ) : null}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredEmergencies.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ mt: 2 }}
          />
        </>
      )}
    </Container>
  );
}

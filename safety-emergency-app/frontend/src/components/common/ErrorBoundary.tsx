import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Box, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetOnError?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.resetOnError) {
      window.location.reload();
    }
  };

  private renderErrorDetails() {
    const { error, errorInfo } = this.state;
    
    // Handle common errors with user-friendly messages
    if (error?.message?.includes('Map container is already initialized')) {
      return (
        <Box p={2}>
          <Typography variant="h6" color="error" gutterBottom>
            Map Initialization Error
          </Typography>
          <Typography variant="body1" paragraph>
            The map could not be initialized because it's already been initialized.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={this.handleReset}
          >
            Reload Map
          </Button>
        </Box>
      );
    }

    // Default error display
    return (
      <Box p={2}>
        <Typography variant="h6" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          {error?.message || 'An unknown error occurred'}
        </Typography>
        {errorInfo?.componentStack && (
          <pre style={{ fontSize: '0.8em', overflowX: 'auto' }}>
            {errorInfo.componentStack}
          </pre>
        )}
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={this.handleReset}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || this.renderErrorDetails();
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

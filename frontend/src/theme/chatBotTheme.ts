import { createTheme } from '@mui/material';

export const chatBotTheme = createTheme({
  palette: {
    primary: {
      main: '#007bff',
    },
    secondary: {
      main: '#6c757d',
    },
    background: {
      default: '#f8f9fa',
      paper: '#fff',
    },
    text: {
      primary: '#212529',
      secondary: '#6c757d',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica", Arial, sans-serif',
    h6: {
      fontWeight: 500,
      fontSize: '1.1rem',
    },
    body2: {
      fontSize: '0.9rem',
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.75rem',
      color: '#868e96',
    },
  },
  components: { // Ensure 'components' is always an object
    MuiAppBar: {
      styleOverrides: { // Ensure 'styleOverrides' is always an object
        root: { // Ensure 'root' is always an object
          elevation: 0,
          borderBottom: '1px solid #dee2e6',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,.075)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#495057',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: '#dc3545',
          color: '#fff',
          fontWeight: 500,
          fontSize: '0.8rem',
          padding: '0.3rem 0.5rem',
          borderRadius: '0.5rem',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.9rem',
          fontWeight: 500,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          marginRight: theme.spacing(1),
          marginBottom: theme.spacing(1),
        }),
      },
    },
    // Add default empty styleOverrides for Tooltip, Menu, MenuItem if they are not present
    // in the base theme, but are referenced in ChatLateral.tsx
    MuiTooltip: {
        styleOverrides: {
            tooltip: {}, // Ensure this exists
        }
    },
    MuiMenu: {
        styleOverrides: {
            paper: {}, // Ensure this exists
        }
    },
    MuiMenuItem: {
        styleOverrides: {
            root: {}, // Ensure this exists
        }
    }
  },
});
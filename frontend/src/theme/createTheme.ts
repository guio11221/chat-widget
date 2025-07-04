import { createTheme } from "@mui/material";
import chatBotTheme from "./chatBotTheme";


export default  createTheme({
    palette: {
      ...chatBotTheme.palette,
    },
    typography: {
      ...chatBotTheme.typography,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            ...chatBotTheme.components?.MuiAppBar?.styleOverrides?.root,
            backgroundColor:  chatBotTheme.palette.primary.main,
            color: '#fff',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            ...chatBotTheme.components?.MuiPaper?.styleOverrides?.root,
            backgroundColor:  chatBotTheme.palette.background.paper,
            color: chatBotTheme.palette.text.primary,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            ...chatBotTheme.components?.MuiIconButton?.styleOverrides?.root,
            color: chatBotTheme.palette.text.primary,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: chatBotTheme.palette.text.primary,
            minWidth: 0, // Added this line
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: chatBotTheme.palette.background.paper,
            color: chatBotTheme.palette.text.primary,
            borderRadius: chatBotTheme.components?.MuiPaper?.styleOverrides?.root.borderRadius,
            boxShadow: chatBotTheme.components?.MuiPaper?.styleOverrides?.root.boxShadow,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor:  chatBotTheme.palette.background.paper,
            color: chatBotTheme.palette.text.primary,
            borderRadius: chatBotTheme.components?.MuiPaper?.styleOverrides?.root.borderRadius,
            boxShadow:  chatBotTheme.components?.MuiPaper?.styleOverrides?.root.boxShadow,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
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
    },
  });

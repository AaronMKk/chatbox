import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import AdbIcon from '@mui/icons-material/Adb';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
const pages = ['Products', 'Pricing', 'Blog'];
import StopCircleIcon from '@mui/icons-material/StopCircle';

function ResponsiveAppBar() {
  const [logoText, setLogoText] = React.useState('LOGO');
  React.useEffect(() => {
    const handleActionMessage = (message: string) => {
      setLogoText(message);
    };

    window.electronAPI?.onActionMessage(handleActionMessage);
    return () => {
      window.electronAPI?.onActionMessage(() => { });
    };
  }, []);
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }}}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"

              color="inherit"
            >
              <PauseCircleIcon />
            </IconButton>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"

              color="inherit"
            >
              <StopCircleIcon />
            </IconButton>
          </Box>

          <Typography
            variant="h5"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              fontSize: '0.7rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal', // Allow text to wrap
              wordWrap: 'break-word', // Ensure long words break and wrap to the next line
            }}
          >
            {logoText}
          </Typography>

          <Box sx={{ flexGrow: 0 }}>
            <IconButton sx={{ p: 0 }}>
              <img style={{ width: '65px', height: '65px', objectFit: 'contain' }} src={require('../static/avatar.gif')} />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
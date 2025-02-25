import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { styled } from '@mui/system';

const StyledTypography = styled(Typography)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'monospace',
  fontWeight: 700,
  color: 'inherit',
  textDecoration: 'none',
  fontSize: '0.6rem',
  whiteSpace: 'normal',  // Allow text wrapping
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  flexGrow: 5,
  wordWrap: 'break-word',
  paddingLeft: theme.spacing(-1),
  paddingRight: theme.spacing(0),
  maxHeight: '45px', // Ensure the height does not expand
  lineHeight: '1rem', // Ensure line height is manageable within 45px
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem',
  },
}));

const ThumbnailBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: theme.spacing(0),
  marginRight: theme.spacing(0),
}));

function ResponsiveAppBar() {
  const [logoText, setLogoText] = React.useState('LOGO');
  const [thumbnail, setThumbnailContent] = React.useState('');

  React.useEffect(() => {
    const handleActionMessage = (message: string) => {
      setLogoText(message);
    };

    window.electronAPI?.onActionMessage(handleActionMessage);
    return () => {
      window.electronAPI?.onActionMessage(() => { });
    };
  }, []);

  React.useEffect(() => {
    const handleThumbnailMessage = (message: string) => {
      setThumbnailContent(message);
    };

    window.electronAPI?.onThumbnailMessage(handleThumbnailMessage);
    return () => {
      window.electronAPI?.onThumbnailMessage(() => { });
    };
  }, []);

  return (
    <AppBar position="sticky" sx={{ boxShadow: 2, backgroundColor: 'primary.main' }}>
        <Toolbar disableGutters>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-start' }}>
            <IconButton size="large" color="inherit">
              <StopCircleIcon />
            </IconButton>
          </Box>

          <StyledTypography variant="h6" noWrap component="a" href="#app-bar-with-responsive-menu">
            {logoText}
          </StyledTypography>

          {thumbnail && (
            <ThumbnailBox>
              <img
                src={thumbnail}
                alt="Thumbnail"
                style={{ width: '75px', height: '45px', borderRadius: '5%' }}
              />
            </ThumbnailBox>
          )}

          <Box sx={{ flexGrow: 0 }}>
            <IconButton sx={{ p: 0 }}>
              <img style={{ width: '45px', height: '45px', objectFit: 'contain' }} src={require('../static/avatar.gif')} />
            </IconButton>
          </Box>
        </Toolbar>
    </AppBar>
  );
}

export default ResponsiveAppBar;

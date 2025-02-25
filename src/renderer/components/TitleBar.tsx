import React, { useEffect, useState } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MaximizeIcon from '@mui/icons-material/Maximize';
import MinimizeIcon from '@mui/icons-material/Minimize';
import RestoreIcon from '@mui/icons-material/OpenInNew';
import { cn } from '@/lib/utils';
import icon from '../static/icon.png';

export default function TitleBar() {
    const theme = useTheme();
    const [isMaximized, setIsMaximized] = useState(false);
    
    useEffect(() => {
        const checkMaximized = async () => {
            const maximized = await window.electronAPI.windowControls.isMaximized();
            setIsMaximized(maximized);
        };
        
        checkMaximized();
        
        // Set up a listener for window state changes
        const interval = setInterval(checkMaximized, 1000);
        return () => clearInterval(interval);
    }, []);
    
    const handleMinimize = () => {
        window.electronAPI.windowControls.minimize();
    };
    
    const handleMaximize = () => {
        window.electronAPI.windowControls.maximize();
        setIsMaximized(!isMaximized);
    };
    
    const handleClose = () => {
        window.electronAPI.windowControls.close();
    };
    
    return (
        <Box
            className="app-titlebar"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '32px',
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${theme.palette.divider}`,
                WebkitAppRegion: 'drag', // This makes the title bar draggable
                userSelect: 'none',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                <img src={icon} alt="Chatbox" style={{ height: '20px', width: '20px', marginRight: '8px' }} />
                <span>Chatbox</span>
            </Box>
            
            <Box sx={{ WebkitAppRegion: 'no-drag' }}> {/* Controls shouldn't be draggable */}
                <IconButton onClick={handleMinimize} size="small" sx={{ borderRadius: '0' }}>
                    <MinimizeIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={handleMaximize} size="small" sx={{ borderRadius: '0' }}>
                    {isMaximized ? <RestoreIcon fontSize="small" /> : <MaximizeIcon fontSize="small" />}
                </IconButton>
                <IconButton 
                    onClick={handleClose} 
                    size="small" 
                    sx={{ 
                        borderRadius: '0',
                        '&:hover': {
                            backgroundColor: 'error.main',
                            color: 'white'
                        }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
        </Box>
    );
} 
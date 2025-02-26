import { useRef, useState } from 'react'
import {
    Box,
    Stack,
    Divider,
    useTheme,
    TextField,
    IconButton,
    InputAdornment,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import useVersion from './hooks/useVersion'
import SessionList from './components/SessionList'
import * as sessionActions from './stores/sessionActions'
import { trackingEvent } from './packages/event'
import { naviWidth } from './NaviBar'
import { SearchIcon } from 'lucide-react'
import AddIcon from '@mui/icons-material/Add';
export const drawerWidth = 250
import { VscSearch } from "react-icons/vsc";
interface Props {
    setOpenSettingWindow(name: 'ai' | 'display' | null): void
}

export default function Sidebar(props: Props) {
    const { t } = useTranslation()
    const versionHook = useVersion()
    const [searchQuery, setSearchQuery] = useState('')
    const sessionListRef = useRef<HTMLDivElement>(null)
    const theme = useTheme()

    return (
        <div
            className="fixed top-0 left-0 h-full z-50"
            style={{
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRightWidth: '1px',
                borderRightStyle: 'solid',
                borderRightColor: theme.palette.divider,
                marginLeft: naviWidth,
            }}
        >
            <div className="ToolBar h-full">
                <Stack
                    className=""
                    sx={{
                        height: '100%',
                        backgroundColor: '#E2E2E2',
                    }}
                >
                    <Box className="flex justify-between items-center px-2" sx={{
                        height: "9%",
                        backgroundColor: '#F7F7F7',
                    }}>
                        <TextField
                            sx={{
                                backgroundColor: '#E2E2E2',
                                borderRadius: '4px',
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        border: 'none',
                                    },
                                    '&:hover fieldset': {
                                        border: 'none',
                                    },
                                    '&.Mui-focused fieldset': {
                                        border: 'none',
                                    },
                                },
                                fontSize: '0.875rem',
                                marginRight: '10px',
                                height: '26px',
                                '& .MuiInputBase-root': {
                                    height: '26px',
                                },
                            }}
                            fullWidth
                            variant="outlined"
                            value={searchQuery}
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ paddingLeft: '0px', paddingRight: 'px' }}>
                                        <VscSearch fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <IconButton sx={{
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                            padding: '2.5px',
                        }}>
                            <AddIcon />
                        </IconButton>
                    </Box>

                    <SessionList sessionListRef={sessionListRef} />

                    <Divider variant="fullWidth" />
                </Stack>
            </div>
        </div>
    )
}

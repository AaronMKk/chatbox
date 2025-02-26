import {
    useTheme,
    Avatar,
} from '@mui/material'
import { Message, Settings, AccountCircle } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import MenuIcon from '@mui/icons-material/Menu';
import { useRef } from 'react'
import * as sessionActions from './stores/sessionActions'
import { trackingEvent } from './packages/event'

export const naviWidth = 53

interface Props {
    setOpenSettingWindow(name: 'ai' | 'display' | null): void
}

export default function NaviBar(props: Props) {
    const { t } = useTranslation()
    const theme = useTheme()
    const sessionListRef = useRef<HTMLDivElement>(null)
    const handleCreateNewSession = () => {
            sessionActions.createEmpty('chat')
            if (sessionListRef.current) {
                sessionListRef.current.scrollTo(0, 0)
            }
            trackingEvent('create_new_conversation', { event_category: 'user' })
        }
    return (
        <div
            className="fixed top-0 left-0 h-full z-50"
            style={{
                boxSizing: 'border-box',
                width: naviWidth,
                borderRightWidth: '1px',
                borderRightStyle: 'solid',
                borderRightColor: theme.palette.divider,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: 35,
                backgroundColor: '#2E2E2E'
            }}
        >
            {/* User Avatar */}
            <Avatar alt="User"  />

            {/* Message Icon */}
            <Message onClick={handleCreateNewSession} style={{ marginTop: '15' , color: '979797' }}>

            </Message>

            {/* Settings Button */}
            <MenuIcon onClick={() => props.setOpenSettingWindow('display')} style={{ marginTop: 'auto' , marginBottom: 15, color: '979797' }}>
                
            </MenuIcon>
        </div>
    )
}

import { Box } from '@mui/material'
import * as atoms from './stores/atoms'
import { useAtomValue } from 'jotai'
import InputBox from './components/InputBox'
import MessageList from './components/MessageList'
import { drawerWidth } from './Sidebar'
import Header from './components/Header'
import TitleBar from './components/TitleBar'

interface Props {}

export default function MainPane(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)

    return (
        <Box
            className="h-full w-full"
            sx={{
                flexGrow: 1,
                marginLeft: `${drawerWidth}px`,
            }}
        >
            <div className="flex flex-col h-full">
                <TitleBar />
                <Header />
                <MessageList />
                <InputBox currentSessionId={currentSession.id} currentSessionType={currentSession.type || 'chat'} />
            </div>
        </Box>
    )
}

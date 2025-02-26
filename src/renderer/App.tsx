import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Box, Grid } from '@mui/material'
import SettingDialog from './pages/SettingDialog'
import ChatConfigWindow from './pages/ChatConfigWindow'
import CleanWidnow from './pages/CleanWindow'
import useAppTheme from './hooks/useAppTheme'
import { useI18nEffect } from './hooks/useI18nEffect'
import Toasts from './components/Toasts'
import RemoteDialogWindow from './pages/RemoteDialogWindow'
import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import MainPane from './MainPane'
import { useAtom, useAtomValue } from 'jotai'
import * as atoms from './stores/atoms'
import Sidebar from './Sidebar'
import * as premiumActions from './stores/premiumActions'
import NaviBar from './NaviBar'

function Main() {
    const spellCheck = useAtomValue(atoms.spellCheckAtom)

    const [openSettingWindow, setOpenSettingWindow] = useAtom(atoms.openSettingDialogAtom)

    return (
        <Box className="box-border App" spellCheck={spellCheck}>
            <Grid container className="h-full">
                <NaviBar
                    setOpenSettingWindow={setOpenSettingWindow}
                />
                <Sidebar
                    setOpenSettingWindow={setOpenSettingWindow}
                />
                <MainPane />
            </Grid>
            <SettingDialog
                open={!!openSettingWindow}
                targetTab={openSettingWindow || undefined}
                close={() => setOpenSettingWindow(null)}
            />
        </Box>
    )
}

export default function App() {
    useI18nEffect()
    premiumActions.useAutoValidate()
    useSystemLanguageWhenInit()
    const theme = useAppTheme()
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Main />
        </ThemeProvider>
    )
}

import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import useAppTheme from './hooks/useAppTheme'
import { useI18nEffect } from './hooks/useI18nEffect'
import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import * as premiumActions from './stores/premiumActions'
import ResponsiveAppBar from './pages/taskBarWindow'

function Main() {
    return (
        <ResponsiveAppBar />
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

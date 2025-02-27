import { useEffect, useState, useRef } from 'react'
import { Typography, useTheme } from '@mui/material'
import * as atoms from '../stores/atoms'
import { useAtomValue } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import Toolbar from './Toolbar'
import { cn } from '@/lib/utils'
import platform from '@/packages/platform'
import ClearIcon from '@mui/icons-material/Clear';
import MinimizeIcon from '@mui/icons-material/Minimize';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { VscChromeMinimize } from "react-icons/vsc";
import { VscChromeMaximize } from "react-icons/vsc";
import { VscChromeClose } from "react-icons/vsc";
interface Props {}

export default function Header(props: Props) {
    const theme = useTheme()
    const currentSession = useAtomValue(atoms.currentSessionAtom)

    const [dragging, setDragging] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })
    const [initialWindowPos, setInitialWindowPos] = useState({ x: 0, y: 0 })
    const headerRef = useRef<HTMLDivElement>(null)

    // Minimize window
    const minimizeWindow = () => {
        platform.closeFirstWindow()
    }
    const maxmizeWindow = () => {
        platform.maxmizeFirstWindow()
    }
    const handleMouseDown = (event: React.MouseEvent) => {
        setDragging(true)
        setStartPos({ x: event.clientX, y: event.clientY })
    }

    const handleMouseMove = (event: MouseEvent) => {
        if (!dragging || !headerRef.current) return

        const deltaX = event.clientX - startPos.x
        const deltaY = event.clientY - startPos.y

        platform.sentPos(deltaX, deltaY)
    }
    const handleMouseUp = () => {
        // End dragging
        setDragging(false)
    }
    useEffect(() => {
        const headerElement = headerRef.current

        if (headerElement) {
            headerElement.addEventListener('mousedown', handleMouseDown)
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            if (headerElement) {
                headerElement.removeEventListener('mousedown', handleMouseDown)
            }
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragging, startPos, initialWindowPos])
    return (
        <div
            className="pt-3 pb-2 px-4"
            style={{
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
                borderBottomColor: theme.palette.divider,
                cursor: dragging ? 'grabbing' : 'grab',
                height: "12%"
            }}
            id="draggable-header"
            ref={headerRef}
        >
            <div className={cn('w-full mx-auto flex flex-row')}>
                <Typography
                    variant="h6"
                    color="inherit"
                    component="div"
                    noWrap
                    sx={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                    onMouseDown={handleMouseDown}
                    className="flex items-center cursor-pointer"
                >
                    <Typography variant="h6" noWrap className={cn('max-w-56', 'ml-3')}>
                        {currentSession.name}
                    </Typography>
                </Typography>
                <div className="flex items-center">
                    <button onClick={minimizeWindow} className="mr-5 p-0 bg-transparent border-none text-lg">
                        <VscChromeMinimize  />
                    </button>
                    <button onClick={maxmizeWindow} className="mr-5 p-0 bg-transparent border-none text-lg">
                        <VscChromeMaximize  />
                    </button>
                    <button onClick={minimizeWindow} className="mr-2 p-0 bg-transparent border-none text-lg">
                        <VscChromeClose  />
                    </button>
                </div>
            </div>
        </div>
    )
}

import { useEffect, useRef, useState } from 'react'
import Message from './Message'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { cn } from '@/lib/utils'
import platform from '@/packages/platform'

interface Props { }

export default function MessageList(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const currentMessageList = useAtomValue(atoms.currentMessageListAtom)
    const ref = useRef<HTMLDivElement | null>(null)
    const [, setMessageListRef] = useAtom(atoms.messageListRefAtom)
    const [thumbnails, setThumbnailContent] = useState<{ [key: string]: string }>({});
    const [showThumbnails, setShowThumbnails] = useState(true);

    useEffect(() => {
        setMessageListRef(ref)
    }, [ref])

    useEffect(() => {
        const handleThumbnailMessage = (message: { [key: string]: string }) => {
            setThumbnailContent(message);
        };

        window.electronAPI?.onThumbnailsMessage(handleThumbnailMessage);
        return () => {
            window.electronAPI?.onThumbnailsMessage(() => { });
        };
    }, []);

    const handleThumbnailClick = (displayId: string) => {
        platform.finishedOptionalWindows(displayId)
        setShowThumbnails(false)
    };

    return (
        <div className='relative overflow-y-auto w-full h-full pr-0 pl-0' ref={ref}>

            {showThumbnails && Object.keys(thumbnails).length > 0 && (
                <div className="absolute inset-0 bg-[#2E2E2E] z-10"></div>
            )}

            <div className='z-20'>
                {currentMessageList.map((msg, index) => (
                    <Message
                        id={msg.id}
                        key={'msg-' + msg.id}
                        msg={msg}
                        sessionId={currentSession.id}
                        sessionType={currentSession.type || 'chat'}
                        className={index === 0 ? 'pt-4' : ''}
                        collapseThreshold={msg.role === 'system' ? 150 : undefined}
                    />
                ))}
            </div>

            {showThumbnails && Object.keys(thumbnails).length > 0 && (
                <div className="absolute inset-0 column items-center justify-center z-20">
                    <div className="">
                    <h3 className="text-center text-lg font-medium mb-2 text-[#C1B5AA]">Select Working Display:</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 flex">
                        {Object.entries(thumbnails).map(([displayId, base64Image]) => (
                            <div
                                key={displayId}
                                className="thumbnail-item border p-2 cursor-pointer transform transition-all "
                                onClick={() => handleThumbnailClick(displayId)}
                            >
                                <img
                                    src={`data:image/png;base64,${base64Image}`}
                                    alt={`Display ${displayId}`}
                                    className="w-full h-auto rounded-lg transition-all duration-300 hover:border-[#FFB622A] hover:ring-1 hover:ring-yellow-300 border-transparent rounded"
                                />
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
}

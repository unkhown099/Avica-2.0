import React from "react";
import { useChat } from "../context/ChatContext.jsx";
import MessengerPopup from "./MessengerPopup.jsx";

export default function ChatContainer() {
    const { activeChats, closeChat } = useChat();

    if (!activeChats || activeChats.length === 0) return null;

    return (
        <>
            {activeChats.map((id, index) => (
                <MessengerPopup
                    key={id}
                    queueId={id}
                    index={index}
                    onClose={() => closeChat(id)}
                />
            ))}
        </>
    );
}

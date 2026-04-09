import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {
    const [activeChats, setActiveChats] = useState([]); // Array of queueIds

    const [minimizedChats, setMinimizedChats] = useState([]);

    const openChat = useCallback((queueId) => {
        setActiveChats((prev) => {
            if (prev.includes(queueId)) {
                // If opening an already active chat, make sure it's not minimized
                setMinimizedChats(m => m.filter(id => id !== queueId));
                return prev;
            }
            // Limit to 3 active chats at once, like Facebook
            const newChats = [...prev, queueId];
            if (newChats.length > 3) return newChats.slice(1);
            return newChats;
        });
    }, []);

    const closeChat = useCallback((queueId) => {
        setActiveChats((prev) => prev.filter((id) => id !== queueId));
        setMinimizedChats((prev) => prev.filter((id) => id !== queueId));
    }, []);

    const toggleMinimize = useCallback((queueId) => {
        setMinimizedChats((prev) =>
            prev.includes(queueId)
                ? prev.filter((id) => id !== queueId)
                : [...prev, queueId]
        );
    }, []);

    const minimizeAll = useCallback(() => {
        setMinimizedChats([...activeChats]);
    }, [activeChats]);

    return (
        <ChatContext.Provider value={{
            activeChats,
            minimizedChats,
            openChat,
            closeChat,
            toggleMinimize,
            minimizeAll
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => useContext(ChatContext);

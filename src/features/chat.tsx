"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect } from "react";

function Chat() {
  const { messages, sendMessage } = useChat();

  useEffect(() => {
    sendMessage({
      text: "Hello World",
    });
  }, []);

  console.log(messages);

  return <h1>Hello World</h1>;
}

export default Chat;

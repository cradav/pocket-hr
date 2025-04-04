import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface MessageFormatterProps {
  content: string;
}

export const MessageFormatter: React.FC<MessageFormatterProps> = ({
  content,
}) => {
  // Convert markdown to HTML and sanitize
  const createMarkup = () => {
    const sanitizedHtml = DOMPurify.sanitize(marked.parse(content));
    return { __html: sanitizedHtml };
  };

  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={createMarkup()}
    />
  );
};

export default MessageFormatter;

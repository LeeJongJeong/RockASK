export const appRoutes = {
  home: "/",
  newChat: "/chat/new",
  chats: "/chats",
  chatDetail(chatId: string) {
    return `/chats/${encodeURIComponent(chatId)}`;
  },
  knowledgeSpaces: "/knowledge-spaces",
  knowledgeSpaceDetail(knowledgeSpaceId: string) {
    return `/knowledge-spaces/${encodeURIComponent(knowledgeSpaceId)}`;
  },
  documentUpload: "/documents/upload",
  documentDetail(documentId: string) {
    return `/documents/${encodeURIComponent(documentId)}`;
  },
  feedback: "/feedback",
  assistants: "/assistants",
  ingestion: "/ingestion",
} as const;

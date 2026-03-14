export const appRoutes = {
  dashboard: "/",
  chatNew: "/chat/new",
  chats: "/chats",
  knowledgeSpaces: "/knowledge-spaces",
  assistants: "/assistants",
  ingestion: "/ingestion",
  documentsUpload: "/documents/upload",
  feedback: "/feedback",
} as const;

export function chatDetailRoute(chatId: string) {
  return `${appRoutes.chats}/${chatId}`;
}

export function knowledgeSpaceDetailRoute(knowledgeSpaceId: string) {
  return `${appRoutes.knowledgeSpaces}/${knowledgeSpaceId}`;
}

export function documentDetailRoute(documentId: string) {
  return `/documents/${documentId}`;
}

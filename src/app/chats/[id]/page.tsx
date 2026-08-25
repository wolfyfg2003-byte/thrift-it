import { counterpart, getChat, getChatListing } from "@/lib/chats";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChatScreen from "./ChatScreen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const chat = await getChat(id);
  if (!chat) return { title: "Chat" };
  return { title: `${counterpart(chat).handle} · Chat` };
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  const chat = await getChat(id);
  const listing = await getChatListing(id);
  if (!chat || !listing) notFound();

  return <ChatScreen chat={chat} listing={listing} />;
}

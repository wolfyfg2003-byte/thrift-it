import { listChats, type InboxRow } from "@/lib/chats";
import { getListing } from "@/lib/listings";
import type { Metadata } from "next";
import ChatsInbox from "./ChatsInbox";

export const metadata: Metadata = {
  title: "Inbox",
};

export default async function ChatsPage() {
  const threads = await listChats();
  const rows: InboxRow[] = await Promise.all(
    threads.map(async (thread) => ({
      ...thread,
      listing: await getListing(thread.listingId),
    })),
  );

  return <ChatsInbox rows={rows} />;
}

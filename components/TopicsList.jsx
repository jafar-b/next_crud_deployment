import Link from "next/link";
import RemoveBtn from "./RemoveBtn";
import { HiPencilAlt } from "react-icons/hi";
import { buildApiUrl } from "@/libs/apiUrl";

const getTopics = async () => {
  try {
    // Use helper to build correct URL for both server and client contexts
    const url = buildApiUrl('api/topics');
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch topics");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.log("Error loading topics: ", error);
    return { topics: [] }; // Return empty array as fallback
  }
};

export default async function TopicsList() {
  const data = await getTopics();
  const topics = data?.topics || [];

  return (
    <>
      {topics.map((t) => (
        <div
          key={t._id}
          className="p-4 border border-slate-300 my-3 flex justify-between gap-5 items-start"
        >
          <div>
            <h2 className="font-bold text-2xl">{t.title}</h2>
            <div>{t.description}</div>
          </div>

          <div className="flex gap-2">
            <RemoveBtn id={t._id} />
            <Link href={`/editTopic/${t._id}`}>
              <HiPencilAlt size={24} />
            </Link>
          </div>
        </div>
      ))}
    </>
  );
}

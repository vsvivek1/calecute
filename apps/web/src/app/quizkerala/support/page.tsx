import { redirect } from "next/navigation";

/** Stores ask for a "support URL"; keep /support working as an alias of Contact. */
export default function Support() {
  redirect("/quizkerala/contact");
}

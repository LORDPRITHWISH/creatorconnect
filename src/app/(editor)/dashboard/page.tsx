import { auth } from "../../../auth";

export default async function Dashboard() {
  const session = await auth();
  console.log(session);

  if (session?.user?.role === "editor") {
    return <p>You are an admin, welcome!</p>;
  }

  return <p>You are not authorized to view this page!</p>;
}

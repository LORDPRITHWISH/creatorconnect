import { DatePicker } from "antd";
import { signIn } from "../../auth";

export default function Web() {
  return (
    <>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <DatePicker />
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button type="submit">Signin with Google</button>
      </form>
    </>
  );
}

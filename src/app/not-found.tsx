import Link from "next/link";
import { Heading } from "@/components/atoms/Heading";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { Button } from "@/components/atoms/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4.5rem)] md:min-h-[calc(100vh-5rem)] items-center justify-center px-4">
      <section className="max-w-xl text-left space-y-4">
        <Eyebrow text="Not found" />
        <Heading 
          text="404" 
          variant="display" 
          level={1}
        />
        <div className="flex items-center gap-3 pt-4">
          <Link href="/">
            <Button variant="primary">Back to home</Button>
          </Link>
          <Link href="/work">
            <Button variant="outline">View work</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}


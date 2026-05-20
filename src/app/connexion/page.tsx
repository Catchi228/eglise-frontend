import { Suspense } from "react";
import ConnexionClient from "./ConnexionClient";

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <div className="relative -mx-4 -mt-10 -mb-10 w-[calc(100%+2rem)] sm:-mx-6 sm:-mb-12 sm:-mt-12 sm:w-[calc(100%+3rem)]">
        <ConnexionClient />
      </div>
    </Suspense>
  );
}


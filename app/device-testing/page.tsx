import { Suspense } from "react";
import DeviceTestingPage from "@/components/DeviceTestingPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DeviceTestingPage />
    </Suspense>
  );
}

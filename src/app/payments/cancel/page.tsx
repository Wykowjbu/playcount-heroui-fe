import { Suspense } from "react";
import { PaymentCancelPage } from "@/components/payment/payment-cancel-page";

export default function Page() {
  return (
    <Suspense>
      <PaymentCancelPage />
    </Suspense>
  );
}

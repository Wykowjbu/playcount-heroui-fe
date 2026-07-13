import { Suspense } from "react";
import { PaymentReturnPage } from "@/components/payment/payment-return-page";

export default function Page() {
  return (
    <Suspense>
      <PaymentReturnPage />
    </Suspense>
  );
}

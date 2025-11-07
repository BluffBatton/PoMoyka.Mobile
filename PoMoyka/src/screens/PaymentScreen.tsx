// src/screens/PaymentScreen.tsx
import React from "react";
import { WebView } from "react-native-webview";

export default function PaymentScreen({ route, navigation }: any) {
  const { data, signature } = route.params;

  const htmlForm = `
    <html>
      <body onload="document.forms[0].submit()">
        <form method="post" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
          <input type="hidden" name="data" value="${data}" />
          <input type="hidden" name="signature" value="${signature}" />
        </form>
      </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: htmlForm }}
      onNavigationStateChange={(event) => {
        if (event.url.includes("payment-success")) {
          navigation.replace("OrderConfirmed");
        }
      }}
    />
  );
}

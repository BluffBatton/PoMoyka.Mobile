import React from "react";
import { View, ActivityIndicator, Alert, Linking, Platform } from "react-native";
import { WebView } from "react-native-webview";

export default function LiqPayScreen({ route, navigation }: any) {
  const { data, signature } = route.params;
  const [isHandled, setIsHandled] = React.useState(false);

  const handleNavigationChange = (navState: any) => {
    if (isHandled) return;

    const url = navState.url.toLowerCase();
    console.log("Nav:", url);

    if (url.includes("checkout/success") || url.includes("result/success") || url.includes("sandbox")) {
      setIsHandled(true);
      console.log("Payment is succesful");

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "OrderConfirmed" }],
        });
      }, 500);
    } else if (url.includes("checkout/fail") || url.includes("result/fail") || url.includes("error")) {
      setIsHandled(true);
      console.log("Payment is failed");
      Alert.alert("Error", "Payment doesn't passed.");
      navigation.goBack();
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log("Attempt to open:", url);

    if (
      url.startsWith("https://www.liqpay.ua") ||
      url.startsWith("https://liqpay.ua") ||
      url.startsWith("about:blank")
    ) {
      return true; 
    }

    if (Platform.OS !== "web") {
      Linking.openURL(url).catch((err) => console.warn("Unable to open link:", err));
    }
    return false;
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={["*"]}
        source={{
          html: `
            <form id="liqpay" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
              <input type="hidden" name="data" value="${data}" />
              <input type="hidden" name="signature" value="${signature}" />
              <script type="text/javascript">
                console.log('Sending form on LiqPay');
                document.getElementById("liqpay").submit();
              </script>
            </form>
          `,
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState
        javaScriptCanOpenWindowsAutomatically={true}
        onNavigationStateChange={handleNavigationChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        renderLoading={() => (
          <ActivityIndicator size="large" color="#9E6A52" style={{ marginTop: 40 }} />
        )}
      />
    </View>
  );
}

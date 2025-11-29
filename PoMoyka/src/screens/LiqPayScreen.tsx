import React from "react";
import { View, Text, ActivityIndicator, Linking, Platform } from "react-native";
import { WebView } from "react-native-webview";

export default function LiqPayScreen({ route, navigation }: any) {
  const { data, signature, center } = route.params;
  const [isHandled, setIsHandled] = React.useState(false);
  const [hideWebView, setHideWebView] = React.useState(false); // Скрываем WebView после успеха
  const isMountedRef = React.useRef(true);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = React.useRef(false); // Флаг что навигация уже произошла

  // Cleanup при размонтировании
  React.useEffect(() => {
    return () => {
      console.log('[LiqPay] Component unmounting, cleaning up...');
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        console.log('[LiqPay] Timeout cleared');
      }
    };
  }, []);

  const handleNavigationChange = (navState: any) => {
    // Жесткая блокировка если уже обработано или навигация началась
    if (hasNavigatedRef.current || isHandled) {
      console.log("[LiqPay] Already handled/navigated, BLOCKING all WebView events");
      return;
    }

    const url = navState.url.toLowerCase();
    console.log("[LiqPay] Navigation change:", url);
    console.log("[LiqPay] Loading:", navState.loading);

    // Ждем пока страница загрузится полностью
    if (navState.loading) {
      console.log("[LiqPay] Page is still loading, waiting...");
      return;
    }

    if (url.includes("checkout/success") || url.includes("result/success") || url.includes("sandbox")) {
      console.log("[LiqPay] SUCCESS URL detected!");
      
      // Проверяем что навигация еще не произошла
      if (hasNavigatedRef.current || isHandled) {
        console.log("[LiqPay] Already handled/navigated, returning");
        return;
      }
      
      // Сразу помечаем что навигация началась
      hasNavigatedRef.current = true;
      setIsHandled(true);
      console.log("[LiqPay] Handler flag set");
      console.log("[LiqPay] Payment is successful!");
      
      // Очищаем предыдущий timeout если есть
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Скрываем WebView немедленно
      setHideWebView(true);
      console.log("[LiqPay] WebView hidden");
      
      // НЕМЕДЛЕННАЯ навигация без задержки
      console.log("[LiqPay] Navigating IMMEDIATELY to close WebView...");
      try {
        // Используем replace чтобы убрать LiqPay из стека и закрыть WebView
        navigation.replace("OrderConfirmed", { center });
        console.log("[LiqPay] Navigation to OrderConfirmed successful");
      } catch (error: any) {
        console.error("[LiqPay] Navigation error:", error?.message || error);
        hasNavigatedRef.current = false; // Сбрасываем при ошибке
        setHideWebView(false);
      }
    } else if (url.includes("checkout/fail") || url.includes("result/fail") || url.includes("error")) {
      setIsHandled(true);
      console.log("[LiqPay] Payment failed");
      
      // Очищаем предыдущий timeout если есть
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Возврат назад с задержкой
      timeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) {
          console.log("[LiqPay] Component unmounted, skipping back navigation");
          return;
        }
        console.log("[LiqPay] Navigating back after payment failure");
        navigation.goBack();
      }, 500);
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log("[LiqPay] Should start load:", url);

    // Блокируем ВСЁ если уже начали навигацию
    if (hasNavigatedRef.current) {
      console.log("[LiqPay] Navigation already started, BLOCKING load");
      return false;
    }

    // Проверяем что компонент еще смонтирован
    if (!isMountedRef.current) {
      console.log("[LiqPay] Component unmounted, blocking load");
      return false;
    }

    // Разрешаем только LiqPay домены
    if (
      url.startsWith("https://www.liqpay.ua") ||
      url.startsWith("https://liqpay.ua") ||
      url.startsWith("about:blank") ||
      url.startsWith("blob:")
    ) {
      console.log("[LiqPay] Allowing LiqPay URL");
      return true; 
    }

    // Блокируем все остальное (внешние приложения, банковские приложения)
    console.warn("[LiqPay] Blocking external URL:", url);
    return false;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {hideWebView ? (
        // Показываем спиннер после успешной оплаты вместо WebView
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#9E6A52" />
          <Text style={{ color: '#fff', marginTop: 20 }}>Payment successful! Redirecting...</Text>
        </View>
      ) : (
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
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("[LiqPay] WebView error:", nativeEvent);
            
            // Очищаем timeout если есть
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            // Возврат назад при ошибке WebView
            timeoutRef.current = setTimeout(() => {
              if (isMountedRef.current && !hasNavigatedRef.current) {
                navigation.goBack();
              }
            }, 500);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("[LiqPay] HTTP error:", nativeEvent.statusCode, nativeEvent.url);
          }}
          renderLoading={() => (
            <ActivityIndicator size="large" color="#9E6A52" style={{ marginTop: 40 }} />
          )}
        />
      )}
    </View>
  );
}

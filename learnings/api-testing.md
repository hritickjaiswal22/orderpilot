### Note - While testing in VS Code via REST client the cookies are set and cached

- The cookie needs to be cleared via
  `rm ~/.rest-client/cookie.json`
- And checked via
  `cat ~/.rest-client/cookie.json | jq`

Tip: If you never want the extension to save cookies for subsequent requests, open your VS Code settings (Ctrl + , or Cmd + ,), search for rest-client.rememberCookiesForSubsequentRequests, and set it to false.

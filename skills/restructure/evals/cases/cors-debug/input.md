So what's happening here is actually pretty subtle. Your fetch call from `http://localhost:5173` to `http://localhost:8080/api/upload` includes `credentials: 'include'` and a `Content-Type: application/json` header, which means the browser classifies it as a non-simple request and sends an OPTIONS preflight first. Your Express server does have `app.use(cors())`, but the default `cors()` config responds with `Access-Control-Allow-Origin: *`, and the CORS spec forbids the wildcard when credentials are included — so the browser rejects the preflight response and you see "Response to preflight request doesn't pass access control check" in the console even though the server logs show a 204. The fix is to configure cors explicitly:

```js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
```

Note that `origin` must be the exact origin including the port, and must not have a trailing slash. Also, the cors middleware has to be registered before your routes and before any auth middleware that might reject the OPTIONS request with a 401, because preflight requests never carry cookies. If you later deploy behind Nginx, double-check that Nginx isn't also adding its own `Access-Control-Allow-Origin` header, since two values in that header is also treated as a failure. In production you'll probably want to read the allowed origin from an env var like `CORS_ORIGIN` rather than hardcoding it. Let me know if you're still seeing the error after this change!

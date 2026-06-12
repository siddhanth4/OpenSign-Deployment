const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
      pathRewrite: {
        "^/api": "" // strips /api prefix → /api/app/users becomes /app/users
      },
      onError: (err, req, res) => {
        console.error("Proxy error:", err.message);
        res.status(502).json({ error: "Backend proxy error" });
      }
    })
  );
};
# Proxy Worker README

This README provides instructions on how to use the provided JavaScript code to create a proxy server using Cloudflare Workers. The code intercepts HTTP requests, modifies them to target a specified domain, and processes the responses to ensure seamless proxying.

## Prerequisites

- A Cloudflare account
- Access to Cloudflare Workers
- Basic understanding of JavaScript and HTTP requests

## Setup Instructions

1. **Create a Cloudflare Worker:**
   - Log in to your Cloudflare account.
   - Navigate to the "Workers" section.
   - Create a new Worker and replace the default code with the provided script.

2. **Configure the Target Domain:**
   - Locate the line in the code where `targetHost` is defined:
     ```javascript
     const targetHost = 'example.com'
     ```
   - Replace `'example.com'` with the domain you wish to proxy.

3. **Deploy the Worker:**
   - Save and deploy the Worker in the Cloudflare dashboard.
   - Assign a route to the Worker to specify which requests it should handle.

## How the Code Works

1. **Event Listener:**
   - The code listens for `fetch` events, which are triggered by incoming HTTP requests.

2. **Request Modification:**
   - The original request URL is modified to target the specified domain (`targetHost`).
   - Request headers are cloned and the `Host` header is updated to match the target domain.

3. **Request Forwarding:**
   - A new request is constructed and sent to the target server.
   - For `GET` and `HEAD` requests, the body is not included.

4. **Response Handling:**
   - The response from the target server is processed.
   - If the response is a redirect (3xx status), the `Location` header is modified to ensure the redirect points to the proxy domain.
   - `Set-Cookie` headers are adjusted to remove the `Domain` attribute.

5. **HTML Content Rewriting:**
   - If the response content type is HTML, the code uses `HTMLRewriter` to modify links and image sources to ensure they point to the proxy domain.

6. **Error Handling:**
   - Errors during processing are caught and logged, and a 500 Internal Error response is returned.

## Customization

- **Link and Image Rewriting:**
  - The code currently rewrites `<a>` and `<img>` tags. You can extend this functionality by adding more handlers for different HTML elements as needed.

- **Additional Headers:**
  - You can modify or add additional headers to the request or response as required by your use case.

## Troubleshooting

- **Worker Errors:**
  - Check the Cloudflare dashboard logs for any errors logged by the Worker.
  - Ensure that the target domain is correct and accessible.

- **Content Not Displaying Correctly:**
  - Verify that the HTML rewriting logic correctly handles all necessary elements and attributes.

## Conclusion

This code provides a basic framework for creating a proxy server using Cloudflare Workers. By following the setup instructions and understanding the code's functionality, you can customize and deploy a proxy tailored to your specific needs.

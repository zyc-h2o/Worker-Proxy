addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    // 1. 设置你的目标域（被代理网站的域名）
    const targetHost = 'example.com'

    // 2. 修改请求 URL，将 hostname 替换为目标域
    const originalUrl = new URL(request.url)
    const targetUrl = new URL(request.url)
    targetUrl.hostname = targetHost

    // 3. 克隆请求头并更改 Host 字段
    const modifiedHeaders = new Headers(request.headers)
    modifiedHeaders.set('Host', targetHost)

    // 4. 构造发送到目标域的新请求（对于 GET/HEAD，不传 body）
    const modifiedRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: modifiedHeaders,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? null
          : request.body,
      redirect: 'manual' // 手动处理重定向
    })

    // 5. 发出请求到目标服务器
    const response = await fetch(modifiedRequest)

    // 6. 克隆响应头，以便修改
    const newHeaders = new Headers(response.headers)

    // 7. 如果目标返回重定向（3xx），将 Location 头里的目标域替换为代理域
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location')
      if (location) {
        const redirectUrl = new URL(location, targetUrl)
        redirectUrl.hostname = originalUrl.hostname
        newHeaders.set('Location', redirectUrl.toString())
      }
    }

    // 8. 处理 Set-Cookie 头——移除 Domain 属性，防止 Cookie 存储异常
    const setCookie = response.headers.get('Set-Cookie')
    if (setCookie) {
      const newCookie = setCookie.replace(/;?\s*Domain=[^;]+/i, '')
      newHeaders.set('Set-Cookie', newCookie)
    }

    // 9. 获取响应体（如果有流则直接使用流）
    const resBody = response.body

    // 10. 如果内容类型为 HTML，则使用 HTMLRewriter 重写部分链接（此处处理 <a> 与 <img> 标签为示例，可根据需要扩展）
    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('text/html')) {
      const rewriter = new HTMLRewriter()
        .on('a[href]', {
          element(element) {
            const href = element.getAttribute('href')
            if (href) {
              try {
                // 将相对链接先转换为绝对链接
                const urlObj = new URL(href, originalUrl)
                // 如果链接的目标为被代理的域名，则改为当前域名
                if (urlObj.hostname === targetHost) {
                  urlObj.hostname = originalUrl.hostname
                  element.setAttribute('href', urlObj.toString())
                }
              } catch (e) {
                // 无效的 URL，忽略
              }
            }
          }
        })
        .on('img[src]', {
          element(element) {
            const src = element.getAttribute('src')
            if (src) {
              try {
                const urlObj = new URL(src, originalUrl)
                if (urlObj.hostname === targetHost) {
                  urlObj.hostname = originalUrl.hostname
                  element.setAttribute('src', urlObj.toString())
                }
              } catch (e) {
                // 忽略错误
              }
            }
          }
        })
      return rewriter.transform(
        new Response(resBody, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        })
      )
    }

    // 11. 如果不是 HTML，则直接返回原始（流式）响应
    return new Response(resBody, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    })
  } catch (error) {
    console.error('Worker Error:', error)
    return new Response('Internal Error: ' + error.message, { status: 500 })
  }
}
